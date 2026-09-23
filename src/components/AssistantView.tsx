import { useMemo, useRef, useState, type FormEvent } from 'react';
import { ArrowUp, Bot, Check, ChevronRight, CircleAlert, LockKeyhole, RefreshCcw, ShieldCheck, Sparkles, UserRound, X } from 'lucide-react';
import { CATEGORIES } from '../constants/categories';
import {
  actionFromToolCall,
  buildFinancialSnapshot,
  deriveFinancialInsights,
  transactionFromAssistantAction,
  type AssistantAction,
  type FinancialAssistantInput,
} from '../lib/financialAssistant';
import { useStore } from '../store/useStore';

type ChatMessage = { id: string; role: 'assistant' | 'user'; content: string };

const CONSENT_KEY = 'surreal-iq-consent';
const newId = () => globalThis.crypto?.randomUUID?.() ?? `${Date.now()}-${Math.random().toString(16).slice(2)}`;

let puterLoadPromise: Promise<void> | null = null;

function ensurePuter(): Promise<void> {
  if (window.puter?.ai?.chat) return Promise.resolve();
  if (puterLoadPromise) return puterLoadPromise;

  puterLoadPromise = new Promise((resolve, reject) => {
    const script = document.createElement('script');
    const timeout = window.setTimeout(() => {
      script.remove();
      puterLoadPromise = null;
      reject(new Error('puter-timeout'));
    }, 15_000);

    script.src = 'https://js.puter.com/v2/';
    script.async = true;
    script.dataset.surrealIq = 'puter';
    script.onload = () => {
      window.clearTimeout(timeout);
      if (window.puter?.ai?.chat) resolve();
      else {
        puterLoadPromise = null;
        reject(new Error('puter-unavailable'));
      }
    };
    script.onerror = () => {
      window.clearTimeout(timeout);
      script.remove();
      puterLoadPromise = null;
      reject(new Error('puter-network'));
    };
    document.head.appendChild(script);
  });

  return puterLoadPromise;
}

const tools = [
  {
    type: 'function',
    function: {
      name: 'add_transaction',
      description: 'Prepare a new income or expense transaction. Use only when the user explicitly asks to register or add a transaction.',
      parameters: {
        type: 'object', additionalProperties: false,
        properties: {
          amount: { type: 'number' }, type: { type: 'string', enum: ['income', 'expense'] },
          status: { type: 'string', enum: ['paid', 'pending'] }, description: { type: 'string' },
          categoryLabel: { type: 'string', enum: CATEGORIES.map((item) => item.label) },
          date: { type: 'string', description: 'Date formatted as YYYY-MM-DD' },
        },
        required: ['amount', 'type', 'status', 'description', 'categoryLabel', 'date'],
      },
    },
  },
  {
    type: 'function',
    function: {
      name: 'set_budget', description: 'Prepare a monthly spending limit for one expense category.',
      parameters: { type: 'object', additionalProperties: false, properties: { categoryLabel: { type: 'string', enum: CATEGORIES.filter((item) => item.type === 'expense').map((item) => item.label) }, amount: { type: 'number' } }, required: ['categoryLabel', 'amount'] },
    },
  },
  {
    type: 'function',
    function: {
      name: 'create_goal', description: 'Prepare a new savings goal.',
      parameters: { type: 'object', additionalProperties: false, properties: { name: { type: 'string' }, target: { type: 'number' } }, required: ['name', 'target'] },
    },
  },
  {
    type: 'function',
    function: {
      name: 'add_goal_progress', description: 'Prepare an amount to add to an existing goal. Always use an exact goal id from the supplied data.',
      parameters: { type: 'object', additionalProperties: false, properties: { goalId: { type: 'string' }, amount: { type: 'number' } }, required: ['goalId', 'amount'] },
    },
  },
  {
    type: 'function',
    function: {
      name: 'mark_transaction', description: 'Prepare changing an existing transaction between paid and pending. Always use an exact transaction id from the supplied data.',
      parameters: { type: 'object', additionalProperties: false, properties: { transactionId: { type: 'string' }, status: { type: 'string', enum: ['paid', 'pending'] } }, required: ['transactionId', 'status'] },
    },
  },
];

function extractText(response: PuterChatResponse): string {
  if (typeof response.text === 'string') return response.text.trim();
  const content = response.message?.content;
  if (typeof content === 'string') return content.trim();
  if (Array.isArray(content)) return content.map((part) => part.text ?? '').join('\n').trim();
  const fallback = String(response);
  return fallback === '[object Object]' ? '' : fallback.trim();
}

function ActionCard({ action, onApprove, onDismiss }: { action: AssistantAction; onApprove: () => void; onDismiss: () => void }) {
  return (
    <article className="iq-action-card">
      <span className="iq-action-card__icon"><Sparkles size={17} /></span>
      <div><small>Ação preparada</small><strong>{action.title}</strong><p>{action.description}</p></div>
      <div className="iq-action-card__buttons">
        <button className="button button--primary button--small" onClick={onApprove}><Check size={15} /> Confirmar</button>
        <button className="icon-button" onClick={onDismiss} aria-label="Descartar ação"><X size={16} /></button>
      </div>
    </article>
  );
}

export function AssistantView({ onNotice }: { onNotice: (message: string) => void }) {
  const store = useStore();
  const [enabled, setEnabled] = useState(() => window.localStorage.getItem(CONSENT_KEY) === 'accepted');
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [pendingActions, setPendingActions] = useState<AssistantAction[]>([]);
  const [messages, setMessages] = useState<ChatMessage[]>([
    { id: newId(), role: 'assistant', content: 'Eu sou o surReal IQ. Posso explicar seus números, encontrar riscos e preparar ações para você confirmar.' },
  ]);
  const formRef = useRef<HTMLFormElement>(null);

  const assistantInput: FinancialAssistantInput = useMemo(() => ({
    transactions: store.transactions, budgets: store.budgets, goals: store.goals,
    currentDate: store.currentDate, userName: store.userName,
  }), [store.transactions, store.budgets, store.goals, store.currentDate, store.userName]);
  const insights = useMemo(() => deriveFinancialInsights(assistantInput), [assistantInput]);

  const activate = () => {
    window.localStorage.setItem(CONSENT_KEY, 'accepted');
    setEnabled(true);
  };

  const send = async (event?: FormEvent, suggestedQuestion?: string) => {
    event?.preventDefault();
    const question = (suggestedQuestion ?? input).trim();
    if (!question || loading) return;
    const userMessage: ChatMessage = { id: newId(), role: 'user', content: question };
    const nextMessages = [...messages, userMessage];
    setMessages(nextMessages); setInput(''); setError(''); setLoading(true);
    try {
      await ensurePuter();
      const puter = window.puter;
      if (!puter) throw new Error('puter-unavailable');
      const snapshot = buildFinancialSnapshot(assistantInput);
      const system = `Você é o surReal IQ, um copiloto financeiro pessoal brasileiro. Responda em português do Brasil, com clareza, objetividade e sem julgamento. Analise somente os dados fornecidos. Não invente saldos, taxas, transações ou certezas. Diferencie fatos, estimativas e sugestões. Você não substitui aconselhamento profissional e não promete retornos. Quando o usuário pedir uma alteração no aplicativo, use a ferramenta apropriada; a interface exigirá confirmação. Nunca diga que uma ação já foi executada. Para perguntas analíticas, responda diretamente sem chamar ferramenta. Datas atuais: ${new Date().toISOString()}. Dados financeiros locais compartilhados nesta solicitação: ${JSON.stringify(snapshot)}`;
      const response = await puter.ai.chat([
        { role: 'system', content: system },
        ...nextMessages.slice(-10).map((message) => ({ role: message.role, content: message.content })),
      ], { tools, temperature: 0.2, max_tokens: 900, normalize: true });

      const calls = response.message?.tool_calls ?? [];
      const actions = calls.flatMap((call) => {
        try {
          const action = actionFromToolCall(call.function.name, JSON.parse(call.function.arguments), assistantInput);
          return action ? [action] : [];
        } catch { return []; }
      });
      if (actions.length > 0) {
        setPendingActions((current) => [...current, ...actions]);
        setMessages((current) => [...current, { id: newId(), role: 'assistant', content: actions.length === 1 ? 'Preparei a ação abaixo. Confira os dados e confirme para aplicar.' : `Preparei ${actions.length} ações. Confira cada uma antes de aplicar.` }]);
      } else {
        const answer = extractText(response) || 'Não consegui formular uma resposta segura com esses dados. Tente pedir de outra forma.';
        setMessages((current) => [...current, { id: newId(), role: 'assistant', content: answer }]);
      }
    } catch (caught) {
      const message = caught instanceof Error ? caught.message : '';
      setError(message.includes('auth') ? 'Entre na conta solicitada pela IA para continuar.' : 'A IA não respondeu agora. Tente novamente em alguns instantes.');
    } finally { setLoading(false); }
  };

  const applyAction = (action: AssistantAction) => {
    if (action.type === 'add_transaction') store.addTransactions([transactionFromAssistantAction(action)]);
    if (action.type === 'set_budget') store.setBudget(action.args.categoryLabel, action.args.amount);
    if (action.type === 'create_goal') store.addGoal({ id: newId(), name: action.args.name, target: action.args.target, current: 0, emoji: '🎯' });
    if (action.type === 'add_goal_progress') {
      const goal = store.goals.find((item) => item.id === action.args.goalId);
      if (goal) store.updateGoal(goal.id, { current: Math.min(goal.target, goal.current + action.args.amount) });
    }
    if (action.type === 'mark_transaction') store.updateTransaction(action.args.transactionId, { status: action.args.status });
    setPendingActions((current) => current.filter((item) => item.id !== action.id));
    setMessages((current) => [...current, { id: newId(), role: 'assistant', content: `Pronto: ${action.description}.` }]);
    onNotice('Ação do surReal IQ aplicada.');
  };

  if (!enabled) return (
    <section className="iq-onboarding">
      <div className="iq-orb"><Sparkles size={34} /></div>
      <span className="eyebrow">surReal IQ</span>
      <h2>Seu dinheiro começa a responder.</h2>
      <p>Converse com seus próprios dados, peça análises e prepare mudanças no aplicativo em linguagem natural.</p>
      <div className="iq-onboarding__grid">
        <article><Bot size={20} /><strong>Entende seu contexto</strong><span>Resumo, categorias, pendências, limites e metas entram na análise.</span></article>
        <article><ShieldCheck size={20} /><strong>Você continua no controle</strong><span>Toda alteração preparada pela IA precisa da sua confirmação.</span></article>
        <article><LockKeyhole size={20} /><strong>Envio sob demanda</strong><span>Seus dados só são enviados ao provedor de IA quando você fizer uma pergunta.</span></article>
      </div>
      <div className="iq-consent-note"><CircleAlert size={18} /><span>Ao ativar e conversar, um recorte dos seus dados financeiros será processado pela Puter e pelo modelo de IA escolhido por ela. O restante do surReal continua funcionando localmente.</span></div>
      <button className="button button--primary iq-activate" onClick={activate}><Sparkles size={18} /> Ativar o surReal IQ</button>
    </section>
  );

  return (
    <div className="iq-layout">
      <section className="iq-chat panel">
        <header className="iq-chat__header"><div><span className="iq-avatar"><Sparkles size={19} /></span><span><strong>surReal IQ</strong><small>Copiloto financeiro</small></span></div><button className="icon-button" onClick={() => { setMessages([{ id: newId(), role: 'assistant', content: 'Conversa limpa. O que você quer entender agora?' }]); setPendingActions([]); }} aria-label="Limpar conversa" title="Limpar conversa"><RefreshCcw size={17} /></button></header>
        <div className="iq-messages" aria-live="polite">
          {messages.map((message) => <article className={`iq-message is-${message.role}`} key={message.id}><span>{message.role === 'assistant' ? <Sparkles size={15} /> : <UserRound size={15} />}</span><p>{message.content}</p></article>)}
          {pendingActions.map((action) => <ActionCard key={action.id} action={action} onApprove={() => applyAction(action)} onDismiss={() => setPendingActions((current) => current.filter((item) => item.id !== action.id))} />)}
          {loading && <article className="iq-message is-assistant is-thinking"><span><Sparkles size={15} /></span><p><i /><i /><i /></p></article>}
          {error && <div className="iq-error"><CircleAlert size={16} />{error}</div>}
        </div>
        <div className="iq-suggestions">
          {['Onde estou gastando demais?', 'Monte um orçamento para Alimentação', 'O que vence nos próximos 30 dias?'].map((question) => <button key={question} onClick={() => void send(undefined, question)} disabled={loading}>{question}<ChevronRight size={14} /></button>)}
        </div>
        <form className="iq-composer" ref={formRef} onSubmit={send}>
          <textarea value={input} onChange={(event) => setInput(event.target.value)} onKeyDown={(event) => { if (event.key === 'Enter' && !event.shiftKey) { event.preventDefault(); formRef.current?.requestSubmit(); } }} rows={1} placeholder="Pergunte sobre seu dinheiro ou peça uma ação…" aria-label="Mensagem para o surReal IQ" />
          <button type="submit" disabled={!input.trim() || loading} aria-label="Enviar mensagem"><ArrowUp size={18} /></button>
        </form>
        <small className="iq-disclaimer">A IA pode errar. Confirme valores e decisões importantes.</small>
      </section>

      <aside className="iq-side">
        <div className="iq-side__heading"><span className="eyebrow">Leitura instantânea</span><h2>O que merece atenção</h2></div>
        {insights.map((insight) => <article className={`iq-insight is-${insight.tone}`} key={insight.title}><span>{insight.tone === 'positive' ? <Check size={17} /> : insight.tone === 'attention' ? <CircleAlert size={17} /> : <Sparkles size={17} />}</span><div><strong>{insight.title}</strong><p>{insight.detail}</p></div></article>)}
        <article className="iq-privacy-card"><LockKeyhole size={18} /><div><strong>Controle de privacidade</strong><p>Você pode desligar o compartilhamento e apagar esta conversa local quando quiser.</p><button onClick={() => { window.localStorage.removeItem(CONSENT_KEY); setEnabled(false); setMessages([]); setPendingActions([]); }}>Desativar IA</button></div></article>
      </aside>
    </div>
  );
}
