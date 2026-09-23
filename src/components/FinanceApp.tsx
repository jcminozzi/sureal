import { lazy, Suspense, useEffect, useMemo, useState, type FormEvent } from 'react';
import { addMonths, format, isSameMonth, parseISO, subMonths } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { ArrowLeft, ArrowRight, BadgeCheck, CalendarClock, Check, CreditCard, Eye, EyeOff, FileUp, Flag, Gauge, LayoutDashboard, Landmark, ListFilter, LockKeyhole, Moon, Plus, Search, Settings, Sparkles, Sun, Target, Trash2, Wallet, X } from 'lucide-react';
import { EXPENSE_CATEGORIES } from '../constants/categories';
import {
  createTransactionSeries,
  formatCurrency,
  getCategorySpending,
  isTransactionInMonth,
  parseMoneyInput,
} from '../lib/finance';
import { useStore } from '../store/useStore';
import type { Goal, Transaction, TransactionDraft, TransactionType } from '../types';
import { SettingsPanel, type SettingsSection } from './SettingsPanel';
import { CategoryIcon } from './CategoryIcon';
import { Dashboard } from './Dashboard';
import { AssistantView } from './AssistantView';
import { TransactionForm } from './TransactionForm';
import { WealthView } from './WealthView';

const ImportPanel = lazy(() => import('./ImportPanel').then((module) => ({ default: module.ImportPanel })));

type View = 'assistant' | 'overview' | 'transactions' | 'budgets' | 'goals' | 'wealth';
type TransactionFilter = 'all' | 'income' | 'expense';
type StatusFilter = 'all' | 'paid' | 'pending';

const formatDate = (date: string) => {
  try {
    return format(parseISO(date), "dd 'de' MMM", { locale: ptBR });
  } catch {
    return 'Data inválida';
  }
};

function EmptyState({ title, text, action }: { title: string; text: string; action?: React.ReactNode }) {
  return (
    <div className="empty-state">
      <span className="empty-state__icon" aria-hidden="true"><Wallet size={24} /></span>
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
      <div className="transaction-row__category" aria-hidden="true"><CategoryIcon label={transaction.categoryLabel} /></div>
      <button className="transaction-row__main" onClick={onEdit} aria-label={`Editar ${transaction.description}`}>
        <strong>{transaction.description || transaction.categoryLabel}</strong>
        <span>{formatDate(transaction.date)} · {transaction.categoryLabel}{cardName ? ` · ${cardName}` : ''}{transaction.installment ? ` · ${transaction.installment}` : ''}{transaction.splitPart ? ` · parte ${transaction.splitPart}` : ''}{transaction.interestRateMonthly ? ` · ${transaction.interestRateMonthly}% a.m.` : ''}</span>
      </button>
      <button className={`status-pill ${transaction.status === 'paid' ? 'is-paid' : 'is-pending'}`} onClick={onToggleStatus} aria-label={`${transaction.description}: ${transaction.status === 'paid' ? 'marcar como pendente' : transaction.type === 'income' ? 'marcar como recebido' : 'marcar como pago'}`}>
        {transaction.status === 'paid' ? <Check size={13} /> : <CalendarClock size={13} />}
        {transaction.status === 'paid' ? (isIncome ? 'Recebido' : 'Pago') : 'Pendente'}
      </button>
      <strong className={`transaction-row__amount ${isIncome ? 'is-income' : 'is-expense'}`}>
        {isIncome ? '+' : '−'} {formatCurrency(transaction.amount, hidden)}
      </strong>
      <div className="transaction-row__actions">
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
      <div className="budget-row__title"><span aria-hidden="true"><CategoryIcon label={category.label} size={21} /></span><div><strong>{category.label}</strong><small>{amount > 0 ? `${formatCurrency(spent, hidden)} de ${formatCurrency(amount, hidden)}` : `${formatCurrency(spent, hidden)} gastos neste mês`}</small></div></div>
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
      <header><span><Target size={22} /></span><div><strong>{goal.name}</strong><small>{progress}% concluído</small></div><button className="icon-button icon-button--danger" onClick={onDelete} aria-label={`Excluir meta ${goal.name}`}><Trash2 size={16} /></button></header>
      <div className="goal-card__values"><strong>{formatCurrency(goal.current, hidden)}</strong><span>de {formatCurrency(goal.target, hidden)}</span></div>
      <div className="progress-track"><span style={{ width: `${progress}%` }} /></div>
      {progress < 100 ? <div className="goal-card__deposit"><span>R$</span><input inputMode="decimal" aria-label={`Valor para guardar em ${goal.name}`} value={deposit} onChange={(event) => setDeposit(event.target.value)} placeholder="Quanto guardou?" /><button className="button button--small" onClick={addDeposit}>Somar</button></div> : <div className="goal-card__complete"><BadgeCheck size={18} /> Meta alcançada!</div>}
    </article>
  );
}

export function FinanceApp() {
  const store = useStore();
  const [view, setView] = useState<View>('assistant');
  const [transactionModal, setTransactionModal] = useState(false);
  const [editingTransaction, setEditingTransaction] = useState<Transaction | null>(null);
  const [settingsSection, setSettingsSection] = useState<SettingsSection | null>(null);
  const [initialType, setInitialType] = useState<TransactionType>('expense');
  const [allMonths, setAllMonths] = useState(false);
  const [cardFilter, setCardFilter] = useState('');
  const [notice, setNotice] = useState<{ message: string; undo?: () => void } | null>(null);
  useEffect(() => { if (!notice) return; const timer = window.setTimeout(() => setNotice(null), 8000); return () => window.clearTimeout(timer); }, [notice]);
  const [importOpen, setImportOpen] = useState(false);
  const [search, setSearch] = useState('');
  const [typeFilter, setTypeFilter] = useState<TransactionFilter>('all');
  const [statusFilter, setStatusFilter] = useState<StatusFilter>('all');
  const [goalName, setGoalName] = useState('');
  const [goalTarget, setGoalTarget] = useState('');

  useEffect(() => {
    document.documentElement.dataset.theme = store.theme;
  }, [store.theme]);

  useEffect(() => {
    window.scrollTo({ top: 0, behavior: 'auto' });
  }, [view]);

  const monthlyTransactions = useMemo(
    () => store.transactions.filter((transaction) => isTransactionInMonth(transaction, store.currentDate)),
    [store.transactions, store.currentDate],
  );
  const categorySpending = useMemo(() => getCategorySpending(monthlyTransactions), [monthlyTransactions]);

  const cardsById = useMemo(() => Object.fromEntries(store.cards.map((card) => [card.id, card.bankName])), [store.cards]);
  const filteredTransactions = useMemo(() => {
    const query = search.trim().toLocaleLowerCase('pt-BR');
    return [...(allMonths ? store.transactions : monthlyTransactions)]
      .filter((transaction) => !cardFilter || transaction.cardId === cardFilter)
      .filter((transaction) => typeFilter === 'all' || transaction.type === typeFilter)
      .filter((transaction) => statusFilter === 'all' || transaction.status === statusFilter)
      .filter((transaction) => !query || `${transaction.description} ${transaction.categoryLabel}`.toLocaleLowerCase('pt-BR').includes(query))
      .sort((a, b) => b.date.localeCompare(a.date));
  }, [allMonths, cardFilter, store.transactions, monthlyTransactions, search, statusFilter, typeFilter]);

  const totalBudget = Object.values(store.budgets).reduce((total, amount) => total + Number(amount || 0), 0);
  const budgetedSpent = Object.entries(store.budgets).reduce((total, [category]) => total + (categorySpending[category] ?? 0), 0);
  const currentMonthLabel = format(store.currentDate, 'MMMM yyyy', { locale: ptBR });

  const openNewTransaction = (type: TransactionType = 'expense') => {
    setInitialType(type);
    setEditingTransaction(null);
    setTransactionModal(true);
  };
  const createTransaction = (draft: TransactionDraft) => {
    const items = createTransactionSeries(draft); store.addTransactions(items);
    store.setCurrentDate(parseISO(items[0].date));
    setNotice({ message: items.length > 1 ? `${items.length} lançamentos adicionados.` : 'Lançamento adicionado.' });
  };
  const deleteTransaction = (transaction: Transaction) => {
    store.deleteTransaction(transaction.id);
    setNotice({ message: 'Lançamento excluído.', undo: () => { if (!useStore.getState().transactions.some((item) => item.id === transaction.id)) store.addTransactions([transaction]); } });
  };
  const addGoal = (event: FormEvent) => {
    event.preventDefault();
    const target = parseMoneyInput(goalTarget);
    if (!goalName.trim() || target <= 0) return;
    store.addGoal({ id: globalThis.crypto?.randomUUID?.() ?? `${Date.now()}`, name: goalName.trim(), target, current: 0, emoji: '🎯' });
    setGoalName('');
    setGoalTarget('');
    setNotice({ message: 'Meta criada.' });
  };

  if (!store.hasHydrated) {
    return <main className="app-loading"><span className="brand-mark">sR</span><p>Organizando sua vida financeira…</p></main>;
  }

  const navItems: { id: View; label: string; icon: React.ReactNode }[] = [
    { id: 'assistant', label: 'surReal IQ', icon: <Sparkles size={19} /> },
    { id: 'overview', label: 'Visão geral', icon: <LayoutDashboard size={19} /> },
    { id: 'transactions', label: 'Lançamentos', icon: <ListFilter size={19} /> },
    { id: 'budgets', label: 'Orçamento', icon: <Gauge size={19} /> },
    { id: 'goals', label: 'Metas', icon: <Target size={19} /> },
    { id: 'wealth', label: 'Patrimônio', icon: <Landmark size={19} /> },
  ];

  return (
    <div className="app-shell">
      <a className="skip-link" href="#main-content">Pular para o conteúdo</a>
      <aside className="sidebar">
        <div className="brand"><span className="brand-mark">sR</span><span><strong className="brand-wordmark">sur<span className="brand-real">Real</span></strong><small>Inteligência financeira</small></span></div>
        <span className="nav-caption">Seu dinheiro</span>
        <nav aria-label="Navegação principal">{navItems.map((item) => <button key={item.id} aria-current={view === item.id ? 'page' : undefined} className={view === item.id ? 'is-active' : ''} onClick={() => setView(item.id)}>{item.icon}<span>{item.label}</span>{view === item.id && <span className="nav-active-dot" />}</button>)}</nav>
        <span className="nav-caption nav-caption--tools">Organizar</span>
        <nav aria-label="Ferramentas"><button onClick={() => setSettingsSection('cards')}><CreditCard size={19} /><span>Meus cartões</span><span className="nav-count">{store.cards.length}</span></button><button onClick={() => setImportOpen(true)}><FileUp size={19} /><span>Importar extrato</span></button><button onClick={() => setSettingsSection('data')}><LockKeyhole size={19} /><span>Backup e dados</span></button></nav>
        <div className="sidebar-bottom"><div className="local-status"><span /> Dados neste dispositivo</div><button className="profile-button" onClick={() => setSettingsSection('profile')}><span className="profile-avatar">{store.userName ? store.userName[0].toUpperCase() : 'sR'}</span><span><strong>{store.userName || 'Seu espaço'}</strong><small>Preferências</small></span><Settings size={17} /></button></div>
      </aside>

      <div className="app-main">
        <header className="topbar">
          <div><p>Finanças pessoais <span>/</span> {navItems.find((item) => item.id === view)?.label}</p><h1>{navItems.find((item) => item.id === view)?.label}</h1></div>
          <div className="topbar__actions">
            <button className="icon-button" onClick={() => store.setIsPrivacyMode(!store.isPrivacyMode)} aria-label={store.isPrivacyMode ? 'Mostrar valores' : 'Ocultar valores'} title={store.isPrivacyMode ? 'Mostrar valores' : 'Ocultar valores'}>{store.isPrivacyMode ? <EyeOff size={20} /> : <Eye size={20} />}</button>
            <button className="icon-button theme-toggle" onClick={() => store.setTheme(store.theme === 'light' ? 'dark' : 'light')} aria-label={store.theme === 'light' ? 'Usar tema escuro' : 'Usar tema claro'}>{store.theme === 'light' ? <Moon size={18} /> : <Sun size={18} />}</button>
            <button className="icon-button settings-mobile" onClick={() => setSettingsSection('profile')} aria-label="Abrir configurações"><Settings size={20} /></button>
            <button className="button button--primary topbar__add" onClick={() => openNewTransaction()}><Plus size={18} /> Novo lançamento</button>
          </div>
        </header>

        <main className="content" id="main-content" tabIndex={-1}>
          <div className="page-toolbar"><p>{view === 'assistant' ? 'Converse, entenda e aja com confirmação.' : view === 'overview' ? 'Seu mês, em perspectiva.' : view === 'transactions' ? 'Encontre e organize suas entradas e saídas.' : 'Organize hoje. Planeje o próximo passo.'}</p>
          {view !== 'assistant' && view !== 'goals' && view !== 'wealth' &&
          <section className="month-toolbar" aria-label="Escolher mês">
            <button className="icon-button" onClick={() => store.setCurrentDate((date) => subMonths(date, 1))} aria-label="Mês anterior"><ArrowLeft size={18} /></button>
            <div><label className="month-picker"><span>{currentMonthLabel}</span><input type="month" aria-label="Mês de referência" value={format(store.currentDate, 'yyyy-MM')} onChange={(event) => { if (/^\d{4}-\d{2}$/.test(event.target.value)) store.setCurrentDate(parseISO(`${event.target.value}-01`)); }} /></label>{!isSameMonth(store.currentDate, new Date()) && <button onClick={() => store.setCurrentDate(new Date())}>Voltar para hoje</button>}</div>
            <button className="icon-button" onClick={() => store.setCurrentDate((date) => addMonths(date, 1))} aria-label="Próximo mês"><ArrowRight size={18} /></button>
          </section>}
          </div>
          <div key={view} className="view-transition">
          {view === 'assistant' && <AssistantView onNotice={(message) => setNotice({ message })} />}
          {view === 'overview' && <Dashboard transactions={monthlyTransactions} onNew={openNewTransaction} onImport={() => setImportOpen(true)} onCards={() => setSettingsSection('cards')} onBudget={() => setView('budgets')}
            onTransactions={(filter = 'all', history = false, category = '') => { setTypeFilter(filter === 'pending' ? 'all' : filter); setStatusFilter(filter === 'pending' ? 'pending' : 'all'); setAllMonths(history); setSearch(category); setCardFilter(''); setView('transactions'); }}
            onEdit={(transaction) => { setEditingTransaction(transaction); setTransactionModal(true); }}
            renderTransaction={(transaction) => <TransactionItem key={transaction.id} transaction={transaction} cardName={cardsById[transaction.cardId ?? '']} hidden={store.isPrivacyMode} onEdit={() => { setEditingTransaction(transaction); setTransactionModal(true); }} onDelete={() => deleteTransaction(transaction)} onToggleStatus={() => { store.updateTransaction(transaction.id, { status: transaction.status === 'paid' ? 'pending' : 'paid' }); setNotice({ message: 'Status atualizado.' }); }} />} />}

          {view === 'transactions' && (
            <section className="panel transactions-panel">
              <header className="panel__header panel__header--wrap"><div><span className="eyebrow">{filteredTransactions.length} lançamentos · {allMonths ? 'Todo o histórico' : currentMonthLabel}</span><h2>Seus lançamentos</h2></div><div className="panel-actions"><button className="button button--secondary" onClick={() => setImportOpen(true)}><FileUp size={17} /> Importar extrato</button><button className="button button--primary" onClick={() => openNewTransaction()}><Plus size={17} /> Adicionar</button></div></header>
              <div className="history-tools"><label className="history-toggle"><input type="checkbox" checked={allMonths} onChange={(event) => setAllMonths(event.target.checked)} /> Buscar em todo o histórico</label>{store.cards.length > 0 && <select aria-label="Filtrar por cartão" value={cardFilter} onChange={(event) => setCardFilter(event.target.value)}><option value="">Todos os cartões</option>{store.cards.map((card) => <option key={card.id} value={card.id}>{card.bankName}</option>)}</select>}</div>
              <div className="filters">
                <label className="search-field"><Search size={18} /><input value={search} onChange={(event) => setSearch(event.target.value)} aria-label="Buscar lançamento ou categoria" placeholder="Buscar lançamento ou categoria" />{search && <button onClick={() => setSearch('')} aria-label="Limpar busca"><X size={16} /></button>}</label>
                <select value={typeFilter} onChange={(event) => setTypeFilter(event.target.value as TransactionFilter)} aria-label="Filtrar por tipo"><option value="all">Entradas e saídas</option><option value="expense">Somente saídas</option><option value="income">Somente entradas</option></select>
                <select value={statusFilter} onChange={(event) => setStatusFilter(event.target.value as StatusFilter)} aria-label="Filtrar por status"><option value="all">Todos os status</option><option value="paid">Pagos/recebidos</option><option value="pending">Pendentes</option></select>
              </div>
              {filteredTransactions.length === 0 ? <EmptyState title="Nada encontrado" text={allMonths ? 'Tente mudar os filtros ou a busca no histórico.' : monthlyTransactions.length === 0 ? 'Este mês ainda não tem lançamentos.' : 'Tente mudar os filtros ou a busca.'} action={monthlyTransactions.length === 0 ? <button className="button button--primary" onClick={() => openNewTransaction()}><Plus size={17} /> Adicionar lançamento</button> : undefined} /> : <div className="transaction-list">{filteredTransactions.map((transaction) => <TransactionItem key={transaction.id} transaction={transaction} cardName={transaction.cardId ? cardsById[transaction.cardId] : undefined} hidden={store.isPrivacyMode} onEdit={() => { setEditingTransaction(transaction); setTransactionModal(true); }} onDelete={() => deleteTransaction(transaction)} onToggleStatus={() => { store.updateTransaction(transaction.id, { status: transaction.status === 'paid' ? 'pending' : 'paid' }); setNotice({ message: 'Status atualizado.' }); }} />)}</div>}
            </section>
          )}

          {view === 'budgets' && (
            <div className="view-stack">
              <section className="budget-hero"><div><span className="eyebrow">Planejamento mensal</span><h2>Planeje antes de gastar.</h2><p>Os limites se repetem todo mês. Despesas pagas e pendentes entram na conta.</p></div><div className="budget-hero__numbers"><span><small>Planejado</small><strong>{formatCurrency(totalBudget, store.isPrivacyMode)}</strong></span><span><small>Comprometido</small><strong>{formatCurrency(budgetedSpent, store.isPrivacyMode)}</strong></span></div></section>
              <section className="budget-grid">{EXPENSE_CATEGORIES.map((category) => <BudgetRow key={`${category.id}-${store.budgets[category.label] ?? 0}`} category={category} amount={store.budgets[category.label] ?? 0} spent={categorySpending[category.label] ?? 0} hidden={store.isPrivacyMode} onSave={(amount) => { store.setBudget(category.label, amount); setNotice({ message: 'Limite atualizado.' }); }} />)}</section>
            </div>
          )}

          {view === 'goals' && (
            <div className="view-stack">
              <section className="goal-hero"><div><span className="eyebrow">Planos com propósito</span><h2>Planos que saem do papel.</h2><p>Crie metas e atualize o progresso sempre que guardar um valor.</p></div><Flag size={48} /></section>
              <form className="goal-form panel" onSubmit={addGoal}><label className="field"><span>Nome da meta</span><input value={goalName} onChange={(event) => setGoalName(event.target.value)} placeholder="Ex.: viagem, reserva, notebook" /></label><label className="field"><span>Valor desejado</span><div className="money-input"><span>R$</span><input inputMode="decimal" value={goalTarget} onChange={(event) => setGoalTarget(event.target.value)} placeholder="0,00" /></div></label><button className="button button--primary" type="submit" disabled={!goalName.trim() || parseMoneyInput(goalTarget) <= 0}><Plus size={17} /> Criar meta</button></form>
              {store.goals.length === 0 ? <div className="panel"><EmptyState title="Nenhuma meta ainda" text="Escolha algo importante para você e acompanhe cada passo." /></div> : <section className="goals-grid">{store.goals.map((goal) => <GoalCard key={goal.id} goal={goal} hidden={store.isPrivacyMode} onUpdate={(changes) => { store.updateGoal(goal.id, changes); setNotice({ message: 'Valor adicionado à meta.' }); }} onDelete={() => window.confirm(`Excluir a meta “${goal.name}”?`) && store.deleteGoal(goal.id)} />)}</section>}
            </div>
          )}

          {view === 'wealth' && <WealthView hidden={store.isPrivacyMode} />}
          </div>
        </main>
      </div>

      <nav className="mobile-nav" aria-label="Navegação no celular">{navItems.map((item) => <button key={item.id} aria-current={view === item.id ? 'page' : undefined} className={view === item.id ? 'is-active' : ''} onClick={() => setView(item.id)}>{item.icon}<span>{item.id === 'assistant' ? 'IQ' : item.id === 'overview' ? 'Início' : item.id === 'transactions' ? 'Extrato' : item.id === 'budgets' ? 'Limites' : item.label}</span></button>)}</nav>
      <button className="mobile-fab" onClick={() => openNewTransaction()} aria-label="Novo lançamento"><Plus size={22} /><span>Novo</span></button>

      {transactionModal && <TransactionForm initialType={initialType} initialDate={format(isSameMonth(store.currentDate, new Date()) ? new Date() : store.currentDate, 'yyyy-MM-dd')} onOpenCards={() => setSettingsSection('cards')} cards={store.cards} transaction={editingTransaction} onClose={() => { setTransactionModal(false); setEditingTransaction(null); }} onCreate={createTransaction} onUpdate={(id, changes) => { store.updateTransaction(id, changes); setNotice({ message: 'Lançamento atualizado.' }); }} />}
      {importOpen && <Suspense fallback={<div className="toast" role="status">Abrindo importação…</div>}><ImportPanel onClose={() => setImportOpen(false)} onImported={() => { setImportOpen(false); setView('transactions'); setSearch(''); setTypeFilter('all'); setStatusFilter('all'); setCardFilter(''); setAllMonths(false); }} /></Suspense>}
      {settingsSection && <SettingsPanel initialSection={settingsSection} onClose={() => setSettingsSection(null)} onOpenImporter={() => { setSettingsSection(null); setImportOpen(true); }} />}
      {notice && <div className="toast" role="status"><span className="toast-icon"><Check size={17} /></span><span>{notice.message}</span>{notice.undo && <button onClick={() => { notice.undo?.(); setNotice({ message: 'Ação desfeita.' }); }}>Desfazer</button>}<button className="toast-close" aria-label="Fechar aviso" onClick={() => setNotice(null)}><X size={17} /></button></div>}
    </div>
  );
}
