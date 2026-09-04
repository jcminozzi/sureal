import { format, parseISO, startOfDay } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { ArrowDownLeft, ArrowRight, ArrowUpRight, CalendarClock, ChevronRight, CreditCard, EyeOff, FileUp, Gauge, Plus, Wallet } from 'lucide-react';
import { calculateSummary, formatCurrency, getCategorySpending } from '../lib/finance';
import { getDailyCashFlow, getUpcomingTransactions } from '../lib/dashboard';
import { useStore } from '../store/useStore';
import type { Transaction, TransactionType } from '../types';
import { CategoryIcon } from './CategoryIcon';

function Empty({ title, text }: { title: string; text: string }) {
  return <div className="empty-state"><span className="empty-state__icon"><Wallet size={24} strokeWidth={1.5} /></span><h3>{title}</h3><p>{text}</p></div>;
}

function CashFlowChart({ transactions, month, hidden }: { transactions: Transaction[]; month: Date; hidden: boolean }) {
  const values = getDailyCashFlow(transactions, month);
  const max = Math.max(1, ...values); const min = Math.min(0, ...values); const span = max - min;
  const points = values.map((value, index) => `${index / (values.length - 1) * 600},${105 - (value - min) / span * 85}`).join(' ');
  if (hidden) return <div className="chart-placeholder"><EyeOff size={19} /> Evolução oculta no modo privacidade</div>;
  if (!transactions.some((item) => item.status === 'paid')) return <div className="chart-placeholder"><Wallet size={23} /><span>A evolução aparece com seus primeiros registros.</span></div>;
  return <div className="cash-chart"><svg viewBox="0 0 600 120" preserveAspectRatio="none" role="img" aria-label="Evolução acumulada de entradas menos saídas pagas no mês, começando em zero.">
    <defs><linearGradient id="cash-fill" x1="0" x2="0" y1="0" y2="1"><stop offset="0%" stopColor="#6ee7c2" stopOpacity=".22" /><stop offset="100%" stopColor="#6ee7c2" stopOpacity="0" /></linearGradient></defs>
    {[25, 65, 105].map((y) => <line key={y} x1="0" x2="600" y1={y} y2={y} stroke="currentColor" strokeOpacity=".08" />)}
    <polygon points={`0,120 ${points} 600,120`} fill="url(#cash-fill)" />
    <polyline points={points} fill="none" stroke="#6ee7c2" strokeWidth="2.5" vectorEffect="non-scaling-stroke" strokeLinejoin="round" strokeLinecap="round" pathLength="1" />
  </svg><div className="cash-chart__axis"><span>01 {format(month, 'MMM', { locale: ptBR })}</span><span>15 {format(month, 'MMM', { locale: ptBR })}</span><span>{values.length - 1} {format(month, 'MMM', { locale: ptBR })}</span></div></div>;
}

export function Dashboard({ transactions, onNew, onImport, onCards, onBudget, onTransactions, onEdit, renderTransaction }: {
  transactions: Transaction[]; onNew: (type?: TransactionType) => void; onImport: () => void;
  onCards: () => void; onBudget: () => void; onTransactions: (filter?: 'all' | 'income' | 'expense' | 'pending', allMonths?: boolean, category?: string) => void;
  onEdit: (transaction: Transaction) => void; renderTransaction: (transaction: Transaction) => React.ReactNode;
}) {
  const store = useStore(); const hidden = store.isPrivacyMode;
  const summary = calculateSummary(transactions); const spending = getCategorySpending(transactions);
  const categories = Object.entries(spending).sort((a, b) => b[1] - a[1]);
  const today = startOfDay(new Date()); const upcoming = getUpcomingTransactions(store.transactions, today);
  const overdue = upcoming.filter((item) => parseISO(item.date) < today).length;
  const budget = Object.values(store.budgets).reduce((sum, value) => sum + value, 0);
  const spent = Object.keys(store.budgets).reduce((sum, category) => sum + (spending[category] ?? 0), 0);
  const money = (value: number) => formatCurrency(value, hidden);
  return <div className="view-stack">
    {store.transactions.length === 0 && <section className="start-banner"><span className="start-banner__icon"><Wallet size={22} /></span><div><h2>Seu primeiro passo começa aqui.</h2><p>Importe um extrato ou registre uma entrada ou saída.</p></div><button className="button button--secondary" onClick={onImport}><FileUp size={17} /> Importar extrato</button></section>}
    <section className="overview-top" aria-label="Resumo financeiro"><article className="balance-card"><div className="balance-card__heading"><span>Resultado do mês</span><span className="balance-period">{format(store.currentDate, 'MMM yyyy', { locale: ptBR })}</span></div><strong className="balance-value" key={`${summary.balance}-${hidden}`}>{money(summary.balance)}</strong><p>Entradas recebidas menos saídas pagas</p><CashFlowChart transactions={transactions} month={store.currentDate} hidden={hidden} /><footer><span>Resultado previsto <strong>{money(summary.projectedBalance)}</strong></span><span>Inclui valores pendentes</span></footer></article>
      <article className="month-activity panel"><header className="panel__header"><h2>Movimentações do mês</h2></header>{[
        { label: 'Entradas recebidas', amount: summary.income, helper: summary.receivable ? `${money(summary.receivable)} a receber` : 'Recebimentos confirmados', icon: <ArrowDownLeft size={20} />, tone: 'income', filter: 'income' as const },
        { label: 'Saídas pagas', amount: summary.expenses, helper: 'Pagamentos confirmados', icon: <ArrowUpRight size={20} />, tone: 'expense', filter: 'expense' as const },
        { label: 'Ainda a pagar', amount: summary.payable, helper: 'Despesas pendentes no mês', icon: <CalendarClock size={20} />, tone: 'pending', filter: 'pending' as const },
      ].map((item) => <button className="activity-row" key={item.label} onClick={() => onTransactions(item.filter)}><span className={`activity-icon is-${item.tone}`}>{item.icon}</span><span><small>{item.label}</small><strong>{money(item.amount)}</strong><em>{item.helper}</em></span><ChevronRight size={16} /></button>)}</article>
    </section>
    <div className="quick-actions" aria-label="Ações rápidas"><button onClick={() => onNew('expense')}><span><Plus size={19} /></span><strong>Registrar despesa</strong><ChevronRight size={15} /></button><button onClick={() => onNew('income')}><span><ArrowDownLeft size={19} /></span><strong>Registrar receita</strong><ChevronRight size={15} /></button><button onClick={onImport}><span><FileUp size={19} /></span><strong>Importar extrato</strong><ChevronRight size={15} /></button><button onClick={onCards}><span><CreditCard size={19} /></span><strong>Meus cartões</strong><ChevronRight size={15} /></button></div>
    <section className="dashboard-grid"><article className="panel panel--wide"><header className="panel__header"><div><h2>Últimos lançamentos</h2><p>Atividade do mês selecionado</p></div><button className="text-button" onClick={() => onTransactions()}>Ver todos <ArrowRight size={15} /></button></header>{transactions.length ? <div className="transaction-list transaction-list--compact">{[...transactions].sort((a, b) => b.date.localeCompare(a.date)).slice(0, 5).map(renderTransaction)}</div> : <><Empty title="Tudo começa com um registro" text="Adicione seu salário, uma compra ou uma conta a pagar." /><button className="button button--secondary empty-action" onClick={() => onNew()}><Plus size={17} /> Criar lançamento</button></>}</article>
      <article className="panel pending-panel"><header className="panel__header"><div><h2>Próximos compromissos</h2><p>Atrasados e próximos 30 dias, a partir de hoje</p></div><CalendarClock size={20} /></header>{overdue > 0 && <div className="overdue-banner">{overdue} {overdue === 1 ? 'lançamento atrasado' : 'lançamentos atrasados'}</div>}{upcoming.length ? <div className="pending-list">{upcoming.slice(0, 4).map((item) => <button key={item.id} onClick={() => onEdit(item)}><span className="due-date"><strong>{format(parseISO(item.date), 'dd')}</strong><small>{format(parseISO(item.date), 'MMM', { locale: ptBR })}</small></span><div><strong>{item.description}</strong><small className={parseISO(item.date) < today ? 'overdue-text' : ''}>{parseISO(item.date) < today ? 'Atrasado' : format(parseISO(item.date), 'dd MMM', { locale: ptBR })} · {item.type === 'income' ? 'A receber' : 'A pagar'}</small></div><b>{money(item.amount)}</b></button>)}<button className="text-button upcoming-all" onClick={() => onTransactions('pending', true)}>Ver todas as pendências <ArrowRight size={15} /></button></div> : <Empty title="Nenhum compromisso por aqui" text="Contas pendentes aparecem aqui, mesmo quando são de outro mês." />}</article></section>
    <section className="dashboard-grid"><article className="panel"><header className="panel__header"><div><h2>Gastos por categoria</h2><p>Despesas pagas e pendentes</p></div><span className="panel-total">{money(summary.expenses + summary.payable)}</span></header>{categories.length ? <div className="category-chart">{categories.slice(0, 5).map(([label, value]) => <button className="category-line" key={label} onClick={() => onTransactions('expense', false, label)}><span className="category-chart__label"><span><CategoryIcon label={label} />{label}</span><strong>{money(value)}</strong></span><span className="progress-track"><span style={{ width: `${Math.min(100, value / (summary.expenses + summary.payable || 1) * 100)}%` }} /></span></button>)}</div> : <Empty title="Veja para onde vai seu dinheiro" text="Seus gastos serão agrupados automaticamente por categoria." />}</article>
      <article className="panel plan-card"><span className="plan-icon"><Gauge size={24} /></span><h2>{budget > 0 ? 'Acompanhe seu orçamento' : 'Dê um limite aos seus gastos'}</h2><p>{budget > 0 ? `${money(spent)} de ${money(budget)} comprometidos nas categorias com limite.` : 'Escolha quanto gastar por categoria e acompanhe o mês com mais clareza.'}</p>{budget > 0 && <div className="progress-track"><span style={{ width: `${Math.min(100, spent / budget * 100)}%` }} /></div>}<button className="button button--secondary" onClick={onBudget}>{budget > 0 ? 'Ver orçamento' : 'Definir orçamento'}<ArrowRight size={16} /></button></article></section>
  </div>;
}
