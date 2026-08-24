import { useEffect, useMemo, useState, type FormEvent } from 'react';
import { addMonths, format, isSameMonth, parseISO, subMonths } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import {
  ArrowDownLeft,
  ArrowLeft,
  ArrowRight,
  ArrowUpRight,
  BadgeCheck,
  CalendarClock,
  Check,
  ChevronRight,
  CircleDollarSign,
  Eye,
  EyeOff,
  Flag,
  Gauge,
  LayoutDashboard,
  ListFilter,
  Pencil,
  PiggyBank,
  Plus,
  Search,
  Settings,
  Target,
  Trash2,
  X,
} from 'lucide-react';
import { EXPENSE_CATEGORIES } from '../constants/categories';
import {
  calculateSummary,
  createTransactionSeries,
  formatCurrency,
  getCategorySpending,
  isTransactionInMonth,
  parseMoneyInput,
} from '../lib/finance';
import { useStore } from '../store/useStore';
import type { Goal, Transaction, TransactionDraft } from '../types';
import { SettingsPanel } from './SettingsPanel';
import { TransactionForm } from './TransactionForm';

type View = 'overview' | 'transactions' | 'budgets' | 'goals';
type TransactionFilter = 'all' | 'income' | 'expense';
type StatusFilter = 'all' | 'paid' | 'pending';

const formatDate = (date: string) => {
  try {
    return format(parseISO(date), "dd 'de' MMM", { locale: ptBR });
  } catch {
    return 'Data inválida';
  }
};

function SummaryCard({ label, value, helper, tone, icon }: { label: string; value: string; helper: string; tone: string; icon: React.ReactNode }) {
  return (
    <article className={`summary-card summary-card--${tone}`}>
      <div className="summary-card__icon">{icon}</div>
      <span>{label}</span>
      <strong>{value}</strong>
      <small>{helper}</small>
    </article>
  );
}

function EmptyState({ title, text, action }: { title: string; text: string; action?: React.ReactNode }) {
  return (
    <div className="empty-state">
      <span className="empty-state__icon" aria-hidden="true">✦</span>
      <h3>{title}</h3>
      <p>{text}</p>
      {action}
    </div>
  );
}

function TransactionItem({ transaction, cardName, hidden, onEdit, onDelete, onToggleStatus }: {
  transaction: Transaction;
  cardName?: string;
  hidden: boolean;
  onEdit: () => void;
  onDelete: () => void;
  onToggleStatus: () => void;
}) {
  const isIncome = transaction.type === 'income';
  return (
    <article className="transaction-row">
      <div className="transaction-row__category" aria-hidden="true">{transaction.categoryIcon || '•'}</div>
      <div className="transaction-row__main">
        <strong>{transaction.description || transaction.categoryLabel}</strong>
        <span>{formatDate(transaction.date)} · {transaction.categoryLabel}{cardName ? ` · ${cardName}` : ''}{transaction.installment ? ` · ${transaction.installment}` : ''}</span>
      </div>
      <button className={`status-pill ${transaction.status === 'paid' ? 'is-paid' : 'is-pending'}`} onClick={onToggleStatus} title="Alterar status">
        {transaction.status === 'paid' ? <Check size={13} /> : <CalendarClock size={13} />}
        {transaction.status === 'paid' ? (isIncome ? 'Recebido' : 'Pago') : 'Pendente'}
      </button>
      <strong className={`transaction-row__amount ${isIncome ? 'is-income' : 'is-expense'}`}>
        {isIncome ? '+' : '−'} {formatCurrency(transaction.amount, hidden)}
      </strong>
      <div className="transaction-row__actions">
        <button className="icon-button" onClick={onEdit} aria-label={`Editar ${transaction.description}`}><Pencil size={16} /></button>
        <button className="icon-button icon-button--danger" onClick={onDelete} aria-label={`Excluir ${transaction.description}`}><Trash2 size={16} /></button>
      </div>
    </article>
  );
}

function BudgetRow({ category, amount, spent, hidden, onSave }: {
  category: (typeof EXPENSE_CATEGORIES)[number];
  amount: number;
  spent: number;
  hidden: boolean;
  onSave: (amount: number) => void;
}) {
  const [value, setValue] = useState(amount ? String(amount).replace('.', ',') : '');
  const percentage = amount > 0 ? Math.round((spent / amount) * 100) : 0;
  const isOver = amount > 0 && spent > amount;
  return (
    <article className={`budget-row ${isOver ? 'is-over' : ''}`}>
      <div className="budget-row__title"><span aria-hidden="true">{category.icon}</span><div><strong>{category.label}</strong><small>{amount > 0 ? `${formatCurrency(spent, hidden)} de ${formatCurrency(amount, hidden)}` : `${formatCurrency(spent, hidden)} gastos neste mês`}</small></div></div>
      <div className="budget-row__meter" aria-label={amount > 0 ? `${percentage}% do limite usado` : 'Sem limite definido'}><span style={{ width: `${Math.min(100, percentage)}%`, background: category.color }} /></div>
      <div className="budget-row__editor"><span>R$</span><input inputMode="decimal" value={value} onChange={(event) => setValue(event.target.value)} placeholder="Sem limite" aria-label={`Limite para ${category.label}`} /><button className="button button--small" onClick={() => onSave(parseMoneyInput(value))}>Salvar</button></div>
      {isOver && <small className="budget-row__warning">Limite ultrapassado em {formatCurrency(spent - amount, hidden)}</small>}
    </article>
  );
}

function GoalCard({ goal, hidden, onUpdate, onDelete }: {
  goal: Goal;
  hidden: boolean;
  onUpdate: (changes: Partial<Goal>) => void;
  onDelete: () => void;
}) {
  const [deposit, setDeposit] = useState('');
  const progress = goal.target > 0 ? Math.min(100, Math.round((goal.current / goal.target) * 100)) : 0;
  const addDeposit = () => {
    const amount = parseMoneyInput(deposit);
    if (amount <= 0) return;
    onUpdate({ current: Math.min(goal.target, goal.current + amount) });
    setDeposit('');
  };
  return (
    <article className="goal-card">
      <header><span>{goal.emoji || '🎯'}</span><div><strong>{goal.name}</strong><small>{progress}% concluído</small></div><button className="icon-button icon-button--danger" onClick={onDelete} aria-label={`Excluir meta ${goal.name}`}><Trash2 size={16} /></button></header>
      <div className="goal-card__values"><strong>{formatCurrency(goal.current, hidden)}</strong><span>de {formatCurrency(goal.target, hidden)}</span></div>
      <div className="progress-track"><span style={{ width: `${progress}%` }} /></div>
      {progress < 100 ? <div className="goal-card__deposit"><span>R$</span><input inputMode="decimal" value={deposit} onChange={(event) => setDeposit(event.target.value)} placeholder="Quanto guardou?" /><button className="button button--small" onClick={addDeposit}>Somar</button></div> : <div className="goal-card__complete"><BadgeCheck size={18} /> Meta alcançada!</div>}
    </article>
  );
}

export function FinanceApp() {
  const store = useStore();
  const [view, setView] = useState<View>('overview');
  const [transactionModal, setTransactionModal] = useState(false);
  const [editingTransaction, setEditingTransaction] = useState<Transaction | null>(null);
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [search, setSearch] = useState('');
  const [typeFilter, setTypeFilter] = useState<TransactionFilter>('all');
  const [statusFilter, setStatusFilter] = useState<StatusFilter>('all');
  const [goalName, setGoalName] = useState('');
  const [goalTarget, setGoalTarget] = useState('');

  useEffect(() => {
    document.documentElement.dataset.theme = store.theme;
  }, [store.theme]);

  const monthlyTransactions = useMemo(
    () => store.transactions.filter((transaction) => isTransactionInMonth(transaction, store.currentDate)),
    [store.transactions, store.currentDate],
  );
  const summary = useMemo(() => calculateSummary(monthlyTransactions), [monthlyTransactions]);
  const categorySpending = useMemo(() => getCategorySpending(monthlyTransactions), [monthlyTransactions]);
  const sortedCategories = useMemo(
    () => EXPENSE_CATEGORIES.map((category) => ({ ...category, value: categorySpending[category.label] ?? 0 })).filter((category) => category.value > 0).sort((a, b) => b.value - a.value),
    [categorySpending],
  );
  const cardsById = useMemo(() => Object.fromEntries(store.cards.map((card) => [card.id, card.bankName])), [store.cards]);
  const filteredTransactions = useMemo(() => {
    const query = search.trim().toLocaleLowerCase('pt-BR');
    return [...monthlyTransactions]
      .filter((transaction) => typeFilter === 'all' || transaction.type === typeFilter)
      .filter((transaction) => statusFilter === 'all' || transaction.status === statusFilter)
      .filter((transaction) => !query || `${transaction.description} ${transaction.categoryLabel}`.toLocaleLowerCase('pt-BR').includes(query))
      .sort((a, b) => b.date.localeCompare(a.date));
  }, [monthlyTransactions, search, statusFilter, typeFilter]);
  const pendingTransactions = useMemo(
    () => monthlyTransactions.filter((transaction) => transaction.status === 'pending').sort((a, b) => a.date.localeCompare(b.date)),
    [monthlyTransactions],
  );
  const totalBudget = Object.values(store.budgets).reduce((total, amount) => total + Number(amount || 0), 0);
  const budgetedSpent = Object.entries(store.budgets).reduce((total, [category]) => total + (categorySpending[category] ?? 0), 0);
  const savingsRate = summary.income > 0 ? Math.round((summary.balance / summary.income) * 100) : 0;
  const firstName = store.userName && store.userName !== 'Usuário' ? store.userName.split(' ')[0] : '';
  const currentMonthLabel = format(store.currentDate, 'MMMM yyyy', { locale: ptBR });

  const openNewTransaction = () => {
    setEditingTransaction(null);
    setTransactionModal(true);
  };
  const createTransaction = (draft: TransactionDraft) => store.addTransactions(createTransactionSeries(draft));
  const deleteTransaction = (transaction: Transaction) => {
    const detail = transaction.installment ? ' esta parcela' : ' este lançamento';
    if (window.confirm(`Excluir${detail}?`)) store.deleteTransaction(transaction.id);
  };
  const addGoal = (event: FormEvent) => {
    event.preventDefault();
    const target = parseMoneyInput(goalTarget);
    if (!goalName.trim() || target <= 0) return;
    store.addGoal({ id: globalThis.crypto?.randomUUID?.() ?? `${Date.now()}`, name: goalName.trim(), target, current: 0, emoji: '🎯' });
    setGoalName('');
    setGoalTarget('');
  };

  if (!store.hasHydrated) {
    return <main className="app-loading"><span className="brand-mark">mg</span><p>Organizando seus gastinhos…</p></main>;
  }

  const navItems: { id: View; label: string; icon: React.ReactNode }[] = [
    { id: 'overview', label: 'Visão geral', icon: <LayoutDashboard size={19} /> },
    { id: 'transactions', label: 'Lançamentos', icon: <ListFilter size={19} /> },
    { id: 'budgets', label: 'Limites', icon: <Gauge size={19} /> },
    { id: 'goals', label: 'Metas', icon: <Target size={19} /> },
  ];

  return (
    <div className="app-shell">
      <aside className="sidebar">
        <div className="brand"><span className="brand-mark">mg</span><span><strong>meus gastinhos</strong><small>dinheiro sem complicação</small></span></div>
        <nav aria-label="Navegação principal">{navItems.map((item) => <button key={item.id} className={view === item.id ? 'is-active' : ''} onClick={() => setView(item.id)}>{item.icon}<span>{item.label}</span></button>)}</nav>
        <div className="sidebar__privacy"><ShieldMessage /><p><strong>Privado por padrão</strong><span>Dados somente neste dispositivo.</span></p></div>
      </aside>

      <div className="app-main">
        <header className="topbar">
          <div><p>{firstName ? `Olá, ${firstName}` : 'Seu dinheiro, com clareza'}</p><h1>{navItems.find((item) => item.id === view)?.label}</h1></div>
          <div className="topbar__actions">
            <button className="icon-button" onClick={() => store.setIsPrivacyMode(!store.isPrivacyMode)} aria-label={store.isPrivacyMode ? 'Mostrar valores' : 'Ocultar valores'} title={store.isPrivacyMode ? 'Mostrar valores' : 'Ocultar valores'}>{store.isPrivacyMode ? <EyeOff size={20} /> : <Eye size={20} />}</button>
            <button className="icon-button" onClick={() => setSettingsOpen(true)} aria-label="Abrir configurações"><Settings size={20} /></button>
            <button className="button button--primary topbar__add" onClick={openNewTransaction}><Plus size={18} /> Novo lançamento</button>
          </div>
        </header>

        <main className="content">
          <section className="month-toolbar" aria-label="Escolher mês">
            <button className="icon-button" onClick={() => store.setCurrentDate((date) => subMonths(date, 1))} aria-label="Mês anterior"><ArrowLeft size={18} /></button>
            <div><strong>{currentMonthLabel}</strong>{!isSameMonth(store.currentDate, new Date()) && <button onClick={() => store.setCurrentDate(new Date())}>Voltar para hoje</button>}</div>
            <button className="icon-button" onClick={() => store.setCurrentDate((date) => addMonths(date, 1))} aria-label="Próximo mês"><ArrowRight size={18} /></button>
          </section>

          {view === 'overview' && (
            <div className="view-stack">
              {monthlyTransactions.length === 0 && (
                <section className="welcome-card">
                  <div><span className="eyebrow">Comece pelo básico</span><h2>Registre o que entrou e o que saiu.</h2><p>Em menos de um minuto você já enxerga o resultado do mês. Nenhum cadastro ou conexão bancária.</p></div>
                  <button className="button button--on-accent" onClick={openNewTransaction}><Plus size={18} /> Fazer primeiro lançamento</button>
                </section>
              )}
              <section className="summary-grid" aria-label="Resumo financeiro">
                <SummaryCard label="Resultado do mês" value={formatCurrency(summary.balance, store.isPrivacyMode)} helper={summary.balance >= 0 ? 'Entradas menos saídas pagas' : 'O mês está no vermelho'} tone={summary.balance >= 0 ? 'balance' : 'negative'} icon={<CircleDollarSign size={22} />} />
                <SummaryCard label="Entradas" value={formatCurrency(summary.income, store.isPrivacyMode)} helper={summary.receivable > 0 ? `${formatCurrency(summary.receivable, store.isPrivacyMode)} a receber` : 'Valores recebidos'} tone="income" icon={<ArrowDownLeft size={22} />} />
                <SummaryCard label="Saídas" value={formatCurrency(summary.expenses, store.isPrivacyMode)} helper="Valores já pagos" tone="expense" icon={<ArrowUpRight size={22} />} />
                <SummaryCard label="A pagar" value={formatCurrency(summary.payable, store.isPrivacyMode)} helper={`Projeção: ${formatCurrency(summary.projectedBalance, store.isPrivacyMode)}`} tone="pending" icon={<CalendarClock size={22} />} />
              </section>

              <section className="dashboard-grid">
                <article className="panel panel--wide">
                  <header className="panel__header"><div><span className="eyebrow">Para onde foi</span><h2>Gastos por categoria</h2></div>{sortedCategories.length > 0 && <button className="text-button" onClick={() => setView('transactions')}>Ver lançamentos <ChevronRight size={16} /></button>}</header>
                  {sortedCategories.length === 0 ? <EmptyState title="Nenhum gasto neste mês" text="Os gastos aparecerão aqui assim que você fizer um lançamento." /> : <div className="category-chart">{sortedCategories.slice(0, 6).map((category) => { const percentage = (category.value / (summary.expenses + summary.payable || 1)) * 100; return <div key={category.id}><div className="category-chart__label"><span><i style={{ background: category.color }} />{category.icon} {category.label}</span><strong>{formatCurrency(category.value, store.isPrivacyMode)}</strong></div><div className="progress-track"><span style={{ width: `${Math.min(100, percentage)}%`, background: category.color }} /></div></div>; })}</div>}
                </article>

                <article className="panel pulse-panel">
                  <header className="panel__header"><div><span className="eyebrow">Pulso do mês</span><h2>Como você está</h2></div><PiggyBank size={23} /></header>
                  <div className={`pulse-score ${savingsRate < 0 ? 'is-negative' : ''}`}><strong>{savingsRate}%</strong><span>da renda preservada</span></div>
                  <ul className="insight-list">
                    <li><span className="insight-dot insight-dot--green" /><div><strong>{summary.balance >= 0 ? 'Resultado positivo' : 'Atenção ao saldo'}</strong><small>{summary.balance >= 0 ? `${formatCurrency(summary.balance, store.isPrivacyMode)} livres até agora.` : `Faltam ${formatCurrency(Math.abs(summary.balance), store.isPrivacyMode)} para equilibrar o mês.`}</small></div></li>
                    <li><span className="insight-dot insight-dot--orange" /><div><strong>{pendingTransactions.length} {pendingTransactions.length === 1 ? 'pendência' : 'pendências'}</strong><small>{summary.payable > 0 ? `${formatCurrency(summary.payable, store.isPrivacyMode)} ainda serão pagos.` : 'Nada aguardando pagamento.'}</small></div></li>
                    <li><span className="insight-dot insight-dot--blue" /><div><strong>{totalBudget > 0 ? 'Limites acompanhados' : 'Defina seus limites'}</strong><small>{totalBudget > 0 ? `${formatCurrency(budgetedSpent, store.isPrivacyMode)} de ${formatCurrency(totalBudget, store.isPrivacyMode)} comprometidos.` : 'Planeje quanto pode gastar por categoria.'}</small></div></li>
                  </ul>
                </article>
              </section>

              <section className="dashboard-grid">
                <article className="panel panel--wide">
                  <header className="panel__header"><div><span className="eyebrow">Mais recentes</span><h2>Últimos lançamentos</h2></div><button className="text-button" onClick={() => setView('transactions')}>Ver todos <ChevronRight size={16} /></button></header>
                  {monthlyTransactions.length === 0 ? <EmptyState title="Sua lista está vazia" text="Adicione uma entrada ou uma saída para começar." /> : <div className="transaction-list transaction-list--compact">{[...monthlyTransactions].sort((a, b) => b.date.localeCompare(a.date)).slice(0, 5).map((transaction) => <TransactionItem key={transaction.id} transaction={transaction} cardName={transaction.cardId ? cardsById[transaction.cardId] : undefined} hidden={store.isPrivacyMode} onEdit={() => { setEditingTransaction(transaction); setTransactionModal(true); }} onDelete={() => deleteTransaction(transaction)} onToggleStatus={() => store.updateTransaction(transaction.id, { status: transaction.status === 'paid' ? 'pending' : 'paid' })} />)}</div>}
                </article>
                <article className="panel pending-panel">
                  <header className="panel__header"><div><span className="eyebrow">Próximos compromissos</span><h2>Pendências</h2></div><CalendarClock size={22} /></header>
                  {pendingTransactions.length === 0 ? <EmptyState title="Tudo em dia" text="Não há valores pendentes neste mês." /> : <div className="pending-list">{pendingTransactions.slice(0, 4).map((transaction) => <button key={transaction.id} onClick={() => { setEditingTransaction(transaction); setTransactionModal(true); }}><span>{transaction.categoryIcon}</span><div><strong>{transaction.description}</strong><small>{formatDate(transaction.date)}</small></div><b>{formatCurrency(transaction.amount, store.isPrivacyMode)}</b></button>)}</div>}
                </article>
              </section>
            </div>
          )}

          {view === 'transactions' && (
            <section className="panel transactions-panel">
              <header className="panel__header panel__header--wrap"><div><span className="eyebrow">{monthlyTransactions.length} no período</span><h2>Seus lançamentos</h2></div><button className="button button--primary" onClick={openNewTransaction}><Plus size={17} /> Adicionar</button></header>
              <div className="filters">
                <label className="search-field"><Search size={18} /><input value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Buscar por descrição ou categoria" />{search && <button onClick={() => setSearch('')} aria-label="Limpar busca"><X size={16} /></button>}</label>
                <select value={typeFilter} onChange={(event) => setTypeFilter(event.target.value as TransactionFilter)} aria-label="Filtrar por tipo"><option value="all">Entradas e saídas</option><option value="expense">Somente saídas</option><option value="income">Somente entradas</option></select>
                <select value={statusFilter} onChange={(event) => setStatusFilter(event.target.value as StatusFilter)} aria-label="Filtrar por status"><option value="all">Todos os status</option><option value="paid">Pagos/recebidos</option><option value="pending">Pendentes</option></select>
              </div>
              {filteredTransactions.length === 0 ? <EmptyState title="Nada encontrado" text={monthlyTransactions.length === 0 ? 'Este mês ainda não tem lançamentos.' : 'Tente mudar os filtros ou a busca.'} action={monthlyTransactions.length === 0 ? <button className="button button--primary" onClick={openNewTransaction}><Plus size={17} /> Adicionar lançamento</button> : undefined} /> : <div className="transaction-list">{filteredTransactions.map((transaction) => <TransactionItem key={transaction.id} transaction={transaction} cardName={transaction.cardId ? cardsById[transaction.cardId] : undefined} hidden={store.isPrivacyMode} onEdit={() => { setEditingTransaction(transaction); setTransactionModal(true); }} onDelete={() => deleteTransaction(transaction)} onToggleStatus={() => store.updateTransaction(transaction.id, { status: transaction.status === 'paid' ? 'pending' : 'paid' })} />)}</div>}
            </section>
          )}

          {view === 'budgets' && (
            <div className="view-stack">
              <section className="budget-hero"><div><span className="eyebrow">Planejamento mensal</span><h2>Limites que avisam antes de apertar.</h2><p>Defina quanto pretende gastar em cada categoria. Saídas pagas e pendentes entram na conta.</p></div><div className="budget-hero__numbers"><span><small>Planejado</small><strong>{formatCurrency(totalBudget, store.isPrivacyMode)}</strong></span><span><small>Comprometido</small><strong>{formatCurrency(budgetedSpent, store.isPrivacyMode)}</strong></span></div></section>
              <section className="budget-grid">{EXPENSE_CATEGORIES.map((category) => <BudgetRow key={`${category.id}-${store.budgets[category.label] ?? 0}`} category={category} amount={store.budgets[category.label] ?? 0} spent={categorySpending[category.label] ?? 0} hidden={store.isPrivacyMode} onSave={(amount) => store.setBudget(category.label, amount)} />)}</section>
            </div>
          )}

          {view === 'goals' && (
            <div className="view-stack">
              <section className="goal-hero"><div><span className="eyebrow">Planos com propósito</span><h2>Dê um destino ao dinheiro que sobra.</h2><p>Crie metas e atualize o progresso sempre que guardar um valor.</p></div><Flag size={48} /></section>
              <form className="goal-form panel" onSubmit={addGoal}><label className="field"><span>Nome da meta</span><input value={goalName} onChange={(event) => setGoalName(event.target.value)} placeholder="Ex.: viagem, reserva, notebook" /></label><label className="field"><span>Valor desejado</span><div className="money-input"><span>R$</span><input inputMode="decimal" value={goalTarget} onChange={(event) => setGoalTarget(event.target.value)} placeholder="0,00" /></div></label><button className="button button--primary" type="submit" disabled={!goalName.trim() || parseMoneyInput(goalTarget) <= 0}><Plus size={17} /> Criar meta</button></form>
              {store.goals.length === 0 ? <div className="panel"><EmptyState title="Nenhuma meta ainda" text="Escolha algo importante para você e acompanhe cada passo." /></div> : <section className="goals-grid">{store.goals.map((goal) => <GoalCard key={goal.id} goal={goal} hidden={store.isPrivacyMode} onUpdate={(changes) => store.updateGoal(goal.id, changes)} onDelete={() => window.confirm(`Excluir a meta “${goal.name}”?`) && store.deleteGoal(goal.id)} />)}</section>}
            </div>
          )}
        </main>
      </div>

      <nav className="mobile-nav" aria-label="Navegação principal">{navItems.map((item) => <button key={item.id} className={view === item.id ? 'is-active' : ''} onClick={() => setView(item.id)}>{item.icon}<span>{item.label === 'Lançamentos' ? 'Extrato' : item.label}</span></button>)}</nav>
      <button className="mobile-fab" onClick={openNewTransaction} aria-label="Novo lançamento"><Plus size={25} /></button>

      {transactionModal && <TransactionForm cards={store.cards} transaction={editingTransaction} onClose={() => { setTransactionModal(false); setEditingTransaction(null); }} onCreate={createTransaction} onUpdate={store.updateTransaction} />}
      {settingsOpen && <SettingsPanel onClose={() => setSettingsOpen(false)} />}
    </div>
  );
}

function ShieldMessage() {
  return <span className="sidebar__privacy-icon" aria-hidden="true">✓</span>;
}
