import { Modal } from './Modal';
import { useMemo, useState, type FormEvent } from 'react';
import { addMonths } from 'date-fns';
import { BadgeCheck, Banknote, Check, Landmark, LineChart, Plus, RefreshCw, ShieldCheck, Trash2, TrendingDown, TrendingUp, X } from 'lucide-react';
import { calculateFixedInstallment, createLoanPlan, formatCurrency, parseMoneyInput, toDateInput } from '../lib/finance';
import { useStore } from '../store/useStore';
import type { Investment, InvestmentType, LoanDraft, LoanType } from '../types';

const INVESTMENT_TYPES: { value: InvestmentType; label: string }[] = [
  { value: 'fixed-income', label: 'CDB / RDB / LCI' },
  { value: 'treasury', label: 'Tesouro Direto' },
  { value: 'fund', label: 'Fundo' },
  { value: 'stock', label: 'Ação' },
  { value: 'etf', label: 'ETF' },
  { value: 'fii', label: 'FII' },
  { value: 'crypto', label: 'Cripto' },
  { value: 'savings', label: 'Poupança' },
  { value: 'other', label: 'Outro' },
];

const LOAN_TYPES: { value: LoanType; label: string }[] = [
  { value: 'personal', label: 'Empréstimo pessoal' },
  { value: 'financing', label: 'Financiamento' },
  { value: 'credit-line', label: 'Linha de crédito' },
  { value: 'invoice-installment', label: 'Fatura parcelada' },
  { value: 'consortium', label: 'Consórcio' },
  { value: 'other', label: 'Outra dívida' },
];

const createId = () => globalThis.crypto?.randomUUID?.() ?? `${Date.now()}-${Math.random()}`;

function InvestmentCard({ investment, hidden }: { investment: Investment; hidden: boolean }) {
  const store = useStore();
  const [currentValue, setCurrentValue] = useState(String(investment.currentValue).replace('.', ','));
  const gain = investment.currentValue - investment.investedAmount;
  const profitability = investment.investedAmount > 0 ? (gain / investment.investedAmount) * 100 : 0;
  const type = INVESTMENT_TYPES.find((item) => item.value === investment.type);
  const updateValue = () => {
    const value = parseMoneyInput(currentValue);
    if (value < 0) return;
    store.updateInvestment(investment.id, { currentValue: value, updatedAt: new Date().toISOString() });
  };
  return (
    <article className="asset-card">
      <header><span className="asset-card__icon"><Landmark size={20} /></span><div><strong>{investment.name}</strong><small>{type?.label} · {investment.institution || 'Sem instituição'}</small></div><button className="icon-button icon-button--danger" onClick={() => window.confirm(`Excluir ${investment.name}?`) && store.deleteInvestment(investment.id)} aria-label={`Excluir ${investment.name}`}><Trash2 size={16} /></button></header>
      <div className="asset-card__numbers"><span><small>Aplicado</small><strong>{formatCurrency(investment.investedAmount, hidden)}</strong></span><span><small>Valor atual</small><strong>{formatCurrency(investment.currentValue, hidden)}</strong></span></div>
      <div className={`asset-result ${gain >= 0 ? 'is-positive' : 'is-negative'}`}>{gain >= 0 ? <TrendingUp size={17} /> : <TrendingDown size={17} />}<strong>{gain >= 0 ? '+' : ''}{formatCurrency(gain, hidden)}</strong><span>{profitability.toFixed(1).replace('.', ',')}%</span></div>
      <div className="asset-update"><span>R$</span><input inputMode="decimal" value={currentValue} onChange={(event) => setCurrentValue(event.target.value)} aria-label={`Valor atual de ${investment.name}`} /><button className="button button--small" onClick={updateValue}><RefreshCw size={14} /> Atualizar</button></div>
    </article>
  );
}

function InvestmentForm({ onClose }: { onClose: () => void }) {
  const store = useStore();
  const [name, setName] = useState('');
  const [institution, setInstitution] = useState('');
  const [type, setType] = useState<InvestmentType>('fixed-income');
  const [invested, setInvested] = useState('');
  const [current, setCurrent] = useState('');
  const submit = (event: FormEvent) => {
    event.preventDefault();
    const investedAmount = parseMoneyInput(invested);
    const currentValue = parseMoneyInput(current || invested);
    if (!name.trim() || investedAmount <= 0) return;
    store.addInvestment({ id: createId(), name: name.trim(), institution: institution.trim(), type, investedAmount, currentValue, updatedAt: new Date().toISOString() });
    onClose();
  };
  return (
    <Modal className="compact-modal" labelledBy="investment-form-title" onClose={onClose}><header className="modal__header"><div><span className="eyebrow">Novo ativo</span><h2 id="investment-form-title">Adicionar investimento</h2></div><button className="icon-button" onClick={onClose} aria-label="Fechar"><X size={20} /></button></header><form className="compact-form" onSubmit={submit}><div className="form-grid"><label className="field"><span>Nome</span><input autoFocus data-autofocus value={name} onChange={(event) => setName(event.target.value)} placeholder="Ex.: Reserva em CDB" /></label><label className="field"><span>Instituição</span><input value={institution} onChange={(event) => setInstitution(event.target.value)} placeholder="Ex.: XP, Inter, Nubank" /></label><label className="field"><span>Tipo</span><select value={type} onChange={(event) => setType(event.target.value as InvestmentType)}>{INVESTMENT_TYPES.map((item) => <option key={item.value} value={item.value}>{item.label}</option>)}</select></label><label className="field"><span>Quanto foi aplicado</span><div className="money-input"><span>R$</span><input inputMode="decimal" value={invested} onChange={(event) => setInvested(event.target.value)} placeholder="0,00" /></div></label><label className="field field--wide"><span>Valor atual</span><div className="money-input"><span>R$</span><input inputMode="decimal" value={current} onChange={(event) => setCurrent(event.target.value)} placeholder={invested || '0,00'} /></div></label></div><p className="form-hint form-hint--notice">Os valores são atualizados manualmente. O aplicativo não consulta cotações nem recomenda investimentos.</p><footer className="modal__footer"><button type="button" className="button button--ghost" onClick={onClose}>Cancelar</button><button className="button button--primary" type="submit" disabled={!name.trim() || parseMoneyInput(invested) <= 0}><Plus size={17} /> Adicionar ativo</button></footer></form></Modal>
  );
}

function LoanForm({ onClose }: { onClose: () => void }) {
  const store = useStore();
  const nextMonth = addMonths(new Date(), 1);
  const [name, setName] = useState('');
  const [lender, setLender] = useState('');
  const [type, setType] = useState<LoanType>('personal');
  const [principal, setPrincipal] = useState('');
  const [rate, setRate] = useState('');
  const [installments, setInstallments] = useState(12);
  const [firstPaymentDate, setFirstPaymentDate] = useState(toDateInput(nextMonth));
  const [receivedDate, setReceivedDate] = useState(toDateInput(new Date()));
  const [includeProceeds, setIncludeProceeds] = useState(false);
  const principalValue = parseMoneyInput(principal);
  const rateValue = parseMoneyInput(rate);
  const calculation = calculateFixedInstallment(principalValue, rateValue, installments);
  const submit = (event: FormEvent) => {
    event.preventDefault();
    if (!name.trim() || !lender.trim() || principalValue <= 0 || installments < 1) return;
    const draft: LoanDraft = { name, lender, type, principal: principalValue, monthlyRate: rateValue, installments, firstPaymentDate, receivedDate, includeProceeds };
    const plan = createLoanPlan(draft);
    store.addLoanPlan(plan.loan, plan.transactions);
    onClose();
  };
  return (
    <Modal className="loan-modal" labelledBy="loan-form-title" onClose={onClose}><header className="modal__header"><div><span className="eyebrow">Nova dívida</span><h2 id="loan-form-title">Registrar empréstimo ou financiamento</h2></div><button className="icon-button" onClick={onClose} aria-label="Fechar"><X size={20} /></button></header><form className="compact-form" onSubmit={submit}><div className="form-grid"><label className="field"><span>Nome</span><input autoFocus data-autofocus value={name} onChange={(event) => setName(event.target.value)} placeholder="Ex.: empréstimo para reforma" /></label><label className="field"><span>Banco ou credor</span><input value={lender} onChange={(event) => setLender(event.target.value)} placeholder="Ex.: Mercado Pago" /></label><label className="field"><span>Tipo</span><select value={type} onChange={(event) => setType(event.target.value as LoanType)}>{LOAN_TYPES.map((item) => <option key={item.value} value={item.value}>{item.label}</option>)}</select></label><label className="field"><span>Valor financiado</span><div className="money-input"><span>R$</span><input inputMode="decimal" value={principal} onChange={(event) => setPrincipal(event.target.value)} placeholder="0,00" /></div></label><label className="field"><span>Quantidade de parcelas</span><input type="number" min="1" max="360" value={installments} onChange={(event) => setInstallments(Math.max(1, Math.min(360, Number(event.target.value))))} /></label><label className="field"><span>Juros ao mês</span><div className="percent-input"><input inputMode="decimal" value={rate} onChange={(event) => setRate(event.target.value)} placeholder="0,00" /><span>%</span></div></label><label className="field"><span>Primeiro vencimento</span><input type="date" value={firstPaymentDate} onChange={(event) => setFirstPaymentDate(event.target.value)} /></label><label className="field"><span>Data de recebimento</span><input type="date" value={receivedDate} onChange={(event) => setReceivedDate(event.target.value)} /></label></div><label className="check-row"><input type="checkbox" checked={includeProceeds} onChange={(event) => setIncludeProceeds(event.target.checked)} /><span><Banknote size={18} /><strong>Registrar o dinheiro recebido como entrada</strong><small>Use quando o valor entrou no seu saldo e não apenas para controlar uma dívida antiga.</small></span></label>{principalValue > 0 && <div className="loan-preview"><span><small>Parcela estimada</small><strong>{formatCurrency(calculation.installmentValue)}</strong></span><span><small>Total a pagar</small><strong>{formatCurrency(calculation.totalPayable)}</strong></span><span><small>Juros estimados</small><strong>{formatCurrency(calculation.totalInterest)}</strong></span></div>}<p className="financial-disclaimer"><ShieldCheck size={17} /><span>Estimativa por prestações fixas com capitalização mensal. IOF, seguros, tarifas e o CET do contrato podem alterar o valor real.</span></p><footer className="modal__footer"><button type="button" className="button button--ghost" onClick={onClose}>Cancelar</button><button className="button button--primary" type="submit" disabled={!name.trim() || !lender.trim() || principalValue <= 0}><Plus size={17} /> Criar cronograma</button></footer></form></Modal>
  );
}

export function WealthView({ hidden }: { hidden: boolean }) {
  const store = useStore();
  const [section, setSection] = useState<'investments' | 'debts'>('investments');
  const [investmentForm, setInvestmentForm] = useState(false);
  const [loanForm, setLoanForm] = useState(false);
  const invested = store.investments.reduce((total, item) => total + item.investedAmount, 0);
  const currentValue = store.investments.reduce((total, item) => total + item.currentValue, 0);
  const gain = currentValue - invested;
  const loanSummaries = useMemo(() => store.loans.map((loan) => {
    const payments = loan.paymentTransactionIds.map((id) => store.transactions.find((transaction) => transaction.id === id)).filter(Boolean);
    const paid = payments.filter((payment) => payment?.status === 'paid');
    const pending = payments.filter((payment) => payment?.status !== 'paid');
    return { loan, paidCount: paid.length, pending, outstanding: pending.reduce((total, payment) => total + Number(payment?.amount ?? 0), 0) };
  }), [store.loans, store.transactions]);
  const outstandingDebt = loanSummaries.reduce((total, item) => total + item.outstanding, 0);
  const netWorth = currentValue - outstandingDebt;

  return (
    <div className="view-stack wealth-view">
      <section className="wealth-hero"><div><span className="eyebrow">Seu mapa financeiro</span><h2>Patrimônio e dívidas no mesmo lugar.</h2><p>Acompanhe investimentos, empréstimos e o impacto real dos juros sem misturar tudo com os gastos do dia a dia.</p></div><div className="wealth-net"><small>Posição monitorada</small><strong>{formatCurrency(netWorth, hidden)}</strong><span>Investimentos menos parcelas a vencer</span></div></section>
      <section className="wealth-summary"><article><span className="wealth-summary__icon is-green"><LineChart size={20} /></span><small>Valor dos investimentos</small><strong>{formatCurrency(currentValue, hidden)}</strong><em className={gain >= 0 ? 'is-positive' : 'is-negative'}>{gain >= 0 ? '+' : ''}{formatCurrency(gain, hidden)} desde os aportes</em></article><article><span className="wealth-summary__icon is-orange"><Landmark size={20} /></span><small>Parcelas a vencer</small><strong>{formatCurrency(outstandingDebt, hidden)}</strong><em>{store.loans.length} {store.loans.length === 1 ? 'contrato acompanhado' : 'contratos acompanhados'}</em></article></section>
      <div className="wealth-tabs"><button className={section === 'investments' ? 'is-active' : ''} onClick={() => setSection('investments')}><TrendingUp size={18} /> Investimentos</button><button className={section === 'debts' ? 'is-active' : ''} onClick={() => setSection('debts')}><Landmark size={18} /> Empréstimos e dívidas</button></div>
      {section === 'investments' && <section className="panel wealth-panel"><header className="panel__header panel__header--wrap"><div><span className="eyebrow">Carteira manual</span><h2>Seus investimentos</h2></div><button className="button button--primary" onClick={() => setInvestmentForm(true)}><Plus size={17} /> Adicionar investimento</button></header>{store.investments.length === 0 ? <div className="empty-state"><span className="empty-state__icon"><TrendingUp size={24} /></span><h3>Nenhum investimento acompanhado</h3><p>Cadastre seus ativos e atualize o valor quando quiser.</p><button className="button button--secondary" onClick={() => setInvestmentForm(true)}>Adicionar primeiro ativo</button></div> : <div className="assets-grid">{store.investments.map((investment) => <InvestmentCard key={investment.id} investment={investment} hidden={hidden} />)}</div>}</section>}
      {section === 'debts' && <section className="panel wealth-panel"><header className="panel__header panel__header--wrap"><div><span className="eyebrow">Cronogramas claros</span><h2>Empréstimos e financiamentos</h2></div><button className="button button--primary" onClick={() => setLoanForm(true)}><Plus size={17} /> Registrar dívida</button></header>{loanSummaries.length === 0 ? <div className="empty-state"><span className="empty-state__icon"><Landmark size={24} /></span><h3>Nenhuma dívida registrada</h3><p>Simule as parcelas, veja o custo dos juros e acompanhe cada pagamento.</p><button className="button button--secondary" onClick={() => setLoanForm(true)}>Registrar primeira dívida</button></div> : <div className="loan-list">{loanSummaries.map(({ loan, paidCount, pending, outstanding }) => { const progress = Math.round((paidCount / loan.installments) * 100); const nextPayment = pending[0]; return <article className="loan-card" key={loan.id}><header><span className="loan-card__icon"><Landmark size={20} /></span><div><strong>{loan.name}</strong><small>{loan.lender} · {loan.installments} parcelas · {loan.monthlyRate.toFixed(2).replace('.', ',')}% a.m.</small></div><button className="icon-button icon-button--danger" onClick={() => window.confirm(`Excluir ${loan.name} e suas parcelas?`) && store.deleteLoan(loan.id)} aria-label={`Excluir ${loan.name}`}><Trash2 size={16} /></button></header><div className="loan-card__numbers"><span><small>Parcela</small><strong>{formatCurrency(loan.installmentValue, hidden)}</strong></span><span><small>A vencer</small><strong>{formatCurrency(outstanding, hidden)}</strong></span><span><small>Custo dos juros</small><strong>{formatCurrency(loan.totalPayable - loan.principal, hidden)}</strong></span></div><div className="loan-progress"><div><span>{paidCount} de {loan.installments} pagas</span><strong>{progress}%</strong></div><div className="progress-track"><span style={{ width: `${progress}%` }} /></div></div>{nextPayment ? <button className="button button--secondary loan-card__pay" onClick={() => store.updateTransaction(nextPayment.id, { status: 'paid' })}><Check size={16} /> Marcar próxima parcela como paga</button> : <div className="loan-complete"><BadgeCheck size={18} /> Dívida concluída</div>}</article>; })}</div>}</section>}
      {investmentForm && <InvestmentForm onClose={() => setInvestmentForm(false)} />}
      {loanForm && <LoanForm onClose={() => setLoanForm(false)} />}
    </div>
  );
}
