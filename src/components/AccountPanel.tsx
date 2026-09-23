import { useEffect, useState, type FormEvent } from 'react';
import { CloudDownload, CloudUpload, CreditCard, LogOut, Mail, ShieldCheck, X } from 'lucide-react';
import { Modal } from './Modal';
import { useStore } from '../store/useStore';
import { parseBackup } from '../lib/finance';
import type { BackupData } from '../types';

interface Configuration { accounts: boolean; billing: boolean; price: null | { amount: number; currency: string; interval: string; intervalCount: number } }
interface Session { email: string; active: boolean; hasBillingAccount: boolean; cancelAtPeriodEnd: boolean }
async function api<T>(action: string, body?: unknown): Promise<T> {
  const response = await fetch(`/.netlify/functions/account?action=${action}`, { credentials: 'same-origin', cache: 'no-store', ...(body !== undefined ? { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) } : {}) });
  const result = await response.json().catch(() => ({ error: 'Contas online ainda não estão disponíveis neste ambiente.' }));
  if (!response.ok || result.error) throw new Error(result.error || 'Não foi possível concluir. Tente novamente.');
  return result as T;
}

export function AccountPanel({ onClose }: { onClose: () => void }) {
  const store = useStore();
  const [configuration, setConfiguration] = useState<Configuration | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [email, setEmail] = useState('');
  const [code, setCode] = useState('');
  const [sent, setSent] = useState(false);
  const [busy, setBusy] = useState(true);
  const [message, setMessage] = useState('');
  useEffect(() => {
    let ignore = false;
    async function load() {
      try {
        const config = await api<Configuration>('config');
        if (!ignore) setConfiguration(config);
        if (config.accounts) {
          const account = await api<Session>('session').catch(() => null);
          if (!ignore) setSession(account);
        }
      } catch (error) { if (!ignore) setMessage((error as Error).message); }
      finally { if (!ignore) setBusy(false); }
    }
    void load();
    return () => { ignore = true; };
  }, []);

  const run = async (action: () => Promise<void>) => {
    setBusy(true); setMessage('');
    try { await action(); } catch (error) { setMessage((error as Error).message); }
    finally { setBusy(false); }
  };
  const login = (event: FormEvent) => {
    event.preventDefault();
    void run(async () => {
      if (!sent) { await api('send-code', { email }); setSent(true); setMessage('Confira seu e-mail e digite o código recebido.'); }
      else { await api('verify-code', { email, code }); setSession(await api<Session>('session')); setCode(''); }
    });
  };
  const upload = () => void run(async () => {
    if (!window.confirm(`Salvar os dados deste dispositivo na conta ${session?.email}? O backup anterior dessa conta será substituído.`)) return;
    const backup: BackupData = { app: 'meus-gastinhos', version: 5, exportedAt: new Date().toISOString(), transactions: store.transactions, cards: store.cards, goals: store.goals, budgets: store.budgets, investments: store.investments, loans: store.loans, importRules: store.importRules, userName: store.userName, theme: store.theme };
    await api('cloud', backup); setMessage('Cópia salva na nuvem. Você pode restaurá-la em outro dispositivo.');
  });
  const restore = () => void run(async () => {
    const result = await api<{ backup: null | { payload: unknown; updated_at: string } }>('cloud');
    if (!result.backup) { setMessage('Sua conta ainda não tem um backup na nuvem.'); return; }
    const backup = parseBackup(result.backup.payload);
    if (!backup) throw new Error('O backup não pôde ser validado. Seus dados locais foram preservados.');
    if (!window.confirm(`Restaurar a cópia de ${new Date(result.backup.updated_at).toLocaleString('pt-BR')} com ${backup.transactions.length} lançamentos? Os dados locais serão substituídos. Exporte um backup local antes, se necessário.`)) return;
    store.replaceFromBackup(backup); setMessage('Dados restaurados neste dispositivo.');
  });
  const billing = (action: string) => void run(async () => {
    const result = await api<{ url: string }>(action, {});
    const url = new URL(result.url);
    if (url.protocol !== 'https:' || !['checkout.stripe.com', 'billing.stripe.com'].includes(url.hostname)) throw new Error('Endereço de pagamento inválido.');
    window.location.assign(url.href);
  });
  const price = configuration?.price;
  const interval = price ? ({ month: 'mês', year: 'ano', week: 'semana', day: 'dia' }[price.interval] ?? price.interval) : '';

  return <Modal labelledBy="account-title" onClose={onClose} className="settings-modal"><header className="modal__header"><div><span className="eyebrow">Seu espaço</span><h2 id="account-title">Conta e assinatura</h2></div><button className="icon-button" onClick={onClose} aria-label="Fechar conta"><X size={20} /></button></header><div className="account-content">
    {busy && <p role="status">Aguarde um instante…</p>}
    {!configuration?.accounts && !busy && <div className="account-info"><ShieldCheck size={26} /><h3>Seu controle financeiro já está disponível</h3><p>Use os gráficos, orçamentos e importações neste dispositivo. Contas online e assinaturas ainda não estão abertas.</p><p>Para guardar uma cópia dos seus registros, use Configurações → Seus dados → Exportar backup.</p></div>}
    {configuration?.accounts && !session && <form className="account-form" onSubmit={login}><Mail size={28} /><h3>Seu dinheiro, no seu espaço</h3><p>Entre ou crie sua conta usando um código por e-mail. Os dados locais só vão para a nuvem quando você escolher salvar uma cópia.</p><label className="field"><span>E-mail</span><input data-autofocus type="email" autoComplete="email" maxLength={254} value={email} onChange={(event) => setEmail(event.target.value)} required disabled={sent || busy} /></label>{sent && <label className="field"><span>Código recebido</span><input inputMode="numeric" autoComplete="one-time-code" pattern="[0-9]{6,8}" minLength={6} maxLength={8} value={code} onChange={(event) => setCode(event.target.value)} required disabled={busy} /></label>}<button className="button button--primary" disabled={busy}>{sent ? 'Entrar na conta' : 'Receber código'}</button>{sent && <button className="text-button" type="button" disabled={busy} onClick={() => { setSent(false); setCode(''); }}>Usar outro e-mail ou reenviar código</button>}</form>}
    {session && <><div className="account-identity"><span><strong>{session.email}</strong><small>{session.active ? 'Plano Pro ativo' : 'Conta gratuita'}{session.cancelAtPeriodEnd ? ' · cancelamento agendado' : ''}</small></span><button className="icon-button" disabled={busy} title="Sair" aria-label="Sair da conta" onClick={() => void run(async () => { await api('logout', {}); setSession(null); setSent(false); setMessage('Sessão encerrada. Os dados locais continuam neste dispositivo.'); })}><LogOut size={19} /></button></div>
      <section className="account-plan"><span className="eyebrow">surReal Pro</span><h3>Uma cópia segura para levar com você</h3><p>Salve seu backup na nuvem e restaure em outro dispositivo. Você escolhe quando enviar e restaurar os dados.</p>{price && <strong className="account-price">{new Intl.NumberFormat('pt-BR', { style: 'currency', currency: price.currency }).format(price.amount)}<small> / {price.intervalCount > 1 ? `${price.intervalCount} ` : ''}{interval}</small></strong>}{configuration?.billing ? <button className="button button--primary" disabled={busy} onClick={() => billing(session.active ? 'portal' : 'checkout')}><CreditCard size={17} />{session.active ? 'Gerenciar assinatura' : 'Ver checkout seguro'}</button> : <p>Assinaturas ainda não disponíveis.</p>}<small>A IA pela Puter usa a franquia da sua conta Puter e não está incluída neste plano. O plano não sincroniza alterações automaticamente.</small></section>
      {session.hasBillingAccount && <button className="text-button" disabled={busy} onClick={() => billing('portal')}>Pagamentos, faturas e cancelamento</button>}
      <div className="account-cloud"><button className="button button--secondary" disabled={busy || !session.active} onClick={upload}><CloudUpload size={17} />Salvar cópia na nuvem</button><button className="button button--secondary" disabled={busy} onClick={restore}><CloudDownload size={17} />Restaurar cópia</button></div><p className="account-note">Mesmo após cancelar, você pode recuperar a cópia já salva. O backup local e a exportação continuam gratuitos.</p>
      <details className="account-danger"><summary>Excluir dados e conta</summary><p>Exporte seus dados antes de continuar. A exclusão da conta remove o backup na nuvem; os dados neste dispositivo permanecem até serem apagados em Configurações.</p><button className="text-button" disabled={busy} onClick={() => void run(async () => { if (!window.confirm('Excluir permanentemente a cópia na nuvem? Os dados deste dispositivo serão preservados.')) return; await api('delete-cloud', {}); setMessage('Cópia na nuvem excluída.'); })}>Excluir cópia na nuvem</button><button className="text-button" disabled={busy || session.active} onClick={() => void run(async () => { if (!window.confirm(`Excluir definitivamente a conta ${session.email} e seu backup na nuvem?`)) return; await api('delete-account', {}); setSession(null); setSent(false); setMessage('Conta excluída.'); })}>Excluir conta</button>{session.active && <p>Para excluir a conta, primeiro encerre a assinatura no portal de cobrança.</p>}</details>
    </>}
    {message && <p role="status" className="account-message">{message}</p>}
  </div></Modal>;
}
