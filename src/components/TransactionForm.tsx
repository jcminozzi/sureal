import { useEffect, useMemo, useState, type FormEvent } from 'react';
import { CalendarDays, Check, CreditCard, Plus, Repeat2, Trash2, WalletCards, X } from 'lucide-react';
import { EXPENSE_CATEGORIES, INCOME_CATEGORIES } from '../constants/categories';
import { calculateFixedInstallment, formatCurrency, parseMoneyInput, toDateInput, toLocalIso } from '../lib/finance';
import type { Card, PaymentSplit, Transaction, TransactionDraft, TransactionStatus, TransactionType } from '../types';

interface TransactionFormProps {
  cards: Card[];
  transaction?: Transaction | null;
  onClose: () => void;
  onCreate: (draft: TransactionDraft) => void;
  onUpdate: (id: string, changes: Partial<Transaction>) => void;
}

interface SplitInput {
  id: string;
  cardId: string;
  amount: string;
  installments: number;
  hasInterest: boolean;
  interestRate: string;
}

const makeSplit = (cardId = '', amount = ''): SplitInput => ({
  id: globalThis.crypto?.randomUUID?.() ?? `${Date.now()}-${Math.random()}`,
  cardId,
  amount,
  installments: 1,
  hasInterest: false,
  interestRate: '',
});

export function TransactionForm({ cards, transaction, onClose, onCreate, onUpdate }: TransactionFormProps) {
  const [type, setType] = useState<TransactionType>(transaction?.type ?? 'expense');
  const [amount, setAmount] = useState(transaction ? String(transaction.amount).replace('.', ',') : '');
  const [description, setDescription] = useState(transaction?.description ?? '');
  const [date, setDate] = useState(transaction ? toDateInput(transaction.date) : toDateInput(new Date()));
  const [status, setStatus] = useState<TransactionStatus>(transaction?.status ?? 'paid');
  const [categoryLabel, setCategoryLabel] = useState(transaction?.categoryLabel ?? '');
  const [paymentMode, setPaymentMode] = useState<'cash' | 'card'>(transaction?.cardId ? 'card' : 'cash');
  const [splits, setSplits] = useState<SplitInput[]>([
    makeSplit(transaction?.cardId ?? '', transaction ? String(transaction.amount).replace('.', ',') : ''),
  ]);
  const [repeatMonthly, setRepeatMonthly] = useState(false);
  const [error, setError] = useState('');
  const categories = type === 'expense' ? EXPENSE_CATEGORIES : INCOME_CATEGORIES;
  const parsedAmount = parseMoneyInput(amount);
  const selectedCategory = useMemo(
    () => categories.find((category) => category.label === categoryLabel),
    [categories, categoryLabel],
  );
  const isSplitPurchase = splits.length > 1;
  const splitTotal = splits.reduce((total, split) => total + parseMoneyInput(split.amount), 0);
  const splitDifference = Math.round((parsedAmount - splitTotal) * 100) / 100;
  const projectedCardTotal = splits.reduce((total, split) => {
    const principal = isSplitPurchase ? parseMoneyInput(split.amount) : parsedAmount;
    const rate = split.hasInterest ? parseMoneyInput(split.interestRate) : 0;
    return total + calculateFixedInstallment(principal, rate, split.installments).totalPayable;
  }, 0);

  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => event.key === 'Escape' && onClose();
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [onClose]);

  const updateSplit = (id: string, changes: Partial<SplitInput>) => {
    setSplits((current) => current.map((split) => split.id === id ? { ...split, ...changes } : split));
    setError('');
  };

  const addSplit = () => {
    if (splits.length >= 4) return;
    if (splits.length === 1 && parsedAmount > 0) {
      const first = Math.round((parsedAmount / 2) * 100) / 100;
      const second = Math.round((parsedAmount - first) * 100) / 100;
      setSplits((current) => [{ ...current[0], amount: String(first).replace('.', ',') }, makeSplit('', String(second).replace('.', ','))]);
    } else {
      setSplits((current) => [...current, makeSplit()]);
    }
  };

  const changeType = (nextType: TransactionType) => {
    setType(nextType);
    setCategoryLabel('');
    if (nextType === 'income') {
      setPaymentMode('cash');
      setSplits([makeSplit()]);
    }
  };

  const normalizedSplits = (): PaymentSplit[] => splits.map((split) => ({
    cardId: split.cardId,
    amount: isSplitPurchase ? parseMoneyInput(split.amount) : parsedAmount,
    installments: split.installments,
    interestRateMonthly: split.hasInterest ? parseMoneyInput(split.interestRate) : 0,
  }));

  const submit = (event: FormEvent) => {
    event.preventDefault();
    if (parsedAmount <= 0) return setError('Informe um valor maior que zero.');
    if (!selectedCategory) return setError('Escolha uma categoria.');
    if (!date) return setError('Escolha a data do lançamento.');
    if (paymentMode === 'card') {
      if (splits.some((split) => !split.cardId)) return setError('Escolha o cartão de cada parte da compra.');
      if (new Set(splits.map((split) => split.cardId)).size !== splits.length) return setError('Escolha cartões diferentes para dividir a compra.');
      if (isSplitPurchase && Math.abs(splitDifference) > 0.009) return setError(`A divisão precisa fechar em ${formatCurrency(parsedAmount)}.`);
      if (splits.some((split) => split.hasInterest && parseMoneyInput(split.interestRate) <= 0)) return setError('Informe a taxa mensal das parcelas com juros.');
    }

    if (transaction) {
      const firstSplit = splits[0];
      onUpdate(transaction.id, {
        amount: parsedAmount,
        type,
        status: paymentMode === 'card' ? 'pending' : status,
        description: description.trim() || selectedCategory.label,
        categoryLabel: selectedCategory.label,
        categoryIcon: selectedCategory.icon,
        date: toLocalIso(date),
        cardId: type === 'expense' && paymentMode === 'card' ? firstSplit.cardId : undefined,
      });
    } else {
      const cardSplits = normalizedSplits();
      const firstSplit = cardSplits[0];
      onCreate({
        amount: parsedAmount,
        type,
        status: paymentMode === 'card' ? 'pending' : status,
        description,
        categoryLabel: selectedCategory.label,
        categoryIcon: selectedCategory.icon,
        date,
        cardId: type === 'expense' && paymentMode === 'card' && !isSplitPurchase ? firstSplit.cardId : undefined,
        installments: type === 'expense' && paymentMode === 'card' && !isSplitPurchase ? firstSplit.installments : 1,
        interestRateMonthly: type === 'expense' && paymentMode === 'card' && !isSplitPurchase ? firstSplit.interestRateMonthly : 0,
        paymentSplits: type === 'expense' && paymentMode === 'card' && isSplitPurchase ? cardSplits : undefined,
        recurringMonths: repeatMonthly && paymentMode === 'cash' ? 12 : 1,
      });
    }
    onClose();
  };

  return (
    <div className="modal-backdrop" role="presentation" onMouseDown={(event) => event.target === event.currentTarget && onClose()}>
      <section className="modal transaction-modal" role="dialog" aria-modal="true" aria-labelledby="transaction-title">
        <header className="modal__header">
          <div><span className="eyebrow">{transaction ? 'Editar lançamento' : 'Novo lançamento'}</span><h2 id="transaction-title">{transaction ? transaction.description : 'Anote em poucos segundos'}</h2></div>
          <button className="icon-button" onClick={onClose} aria-label="Fechar"><X size={20} /></button>
        </header>

        <form onSubmit={submit} className="transaction-form">
          <div className="segmented" aria-label="Tipo do lançamento">
            <button type="button" className={type === 'expense' ? 'is-active is-expense' : ''} onClick={() => changeType('expense')}>Saída</button>
            <button type="button" className={type === 'income' ? 'is-active is-income' : ''} onClick={() => changeType('income')}>Entrada</button>
          </div>

          <label className="amount-field"><span>{type === 'expense' ? 'Valor total da compra' : 'Valor da entrada'}</span><div><small>R$</small><input autoFocus inputMode="decimal" value={amount} onChange={(event) => { setAmount(event.target.value); setError(''); }} placeholder="0,00" aria-label="Valor" /></div></label>

          <div className="form-grid">
            <label className="field field--wide"><span>Descrição</span><input value={description} onChange={(event) => setDescription(event.target.value)} placeholder={type === 'expense' ? 'Ex.: mercado da semana' : 'Ex.: salário'} maxLength={80} /></label>
            <label className="field"><span><CalendarDays size={15} /> Data</span><input type="date" value={date} onChange={(event) => setDate(event.target.value)} /></label>
            {paymentMode === 'cash' && <label className="field"><span>Status</span><select value={status} onChange={(event) => setStatus(event.target.value as TransactionStatus)}><option value="paid">{type === 'income' ? 'Recebido' : 'Pago'}</option><option value="pending">Pendente</option></select></label>}
          </div>

          <fieldset className="category-picker"><legend>Categoria</legend><div>{categories.map((category) => <button key={category.id} type="button" className={categoryLabel === category.label ? 'is-selected' : ''} onClick={() => { setCategoryLabel(category.label); setError(''); }}><span aria-hidden="true">{category.icon}</span><small>{category.label}</small></button>)}</div></fieldset>

          {type === 'expense' && cards.length > 0 && (
            <section className="payment-section">
              <div className="payment-mode" aria-label="Forma de pagamento">
                <button type="button" className={paymentMode === 'cash' ? 'is-active' : ''} onClick={() => setPaymentMode('cash')}><WalletCards size={17} /> Pix, débito ou dinheiro</button>
                <button type="button" className={paymentMode === 'card' ? 'is-active' : ''} onClick={() => { setPaymentMode('card'); setRepeatMonthly(false); }}><CreditCard size={17} /> Cartão de crédito</button>
              </div>

              {paymentMode === 'card' && (
                <div className="split-payment">
                  <div className="split-payment__heading"><div><strong>{isSplitPurchase ? 'Compra dividida' : 'Parcelamento'}</strong><small>Até 48 parcelas, com ou sem juros.</small></div>{!transaction && splits.length < 4 && <button type="button" className="text-button" onClick={addSplit}><Plus size={15} /> Outro cartão</button>}</div>
                  {splits.map((split, index) => {
                    const principal = isSplitPurchase ? parseMoneyInput(split.amount) : parsedAmount;
                    const financing = calculateFixedInstallment(principal, split.hasInterest ? parseMoneyInput(split.interestRate) : 0, split.installments);
                    return (
                      <article className="split-row" key={split.id}>
                        <header><span>{isSplitPurchase ? `Cartão ${index + 1}` : 'Detalhes da compra'}</span>{isSplitPurchase && <button type="button" className="icon-button icon-button--danger" onClick={() => setSplits((current) => current.filter((item) => item.id !== split.id))} aria-label={`Remover cartão ${index + 1}`}><Trash2 size={15} /></button>}</header>
                        <div className={`split-row__fields ${isSplitPurchase ? 'has-amount' : ''}`}>
                          <label className="field"><span>Cartão</span><select value={split.cardId} onChange={(event) => updateSplit(split.id, { cardId: event.target.value })}><option value="">Selecione…</option>{cards.map((card) => <option key={card.id} value={card.id}>{card.bankName}</option>)}</select></label>
                          {isSplitPurchase && <label className="field"><span>Valor nesta parte</span><div className="money-input"><span>R$</span><input inputMode="decimal" value={split.amount} onChange={(event) => updateSplit(split.id, { amount: event.target.value })} placeholder="0,00" /></div></label>}
                          {!transaction && <label className="field"><span>Parcelas</span><select value={split.installments} onChange={(event) => updateSplit(split.id, { installments: Number(event.target.value) })}>{Array.from({ length: 48 }, (_, item) => item + 1).map((count) => <option key={count} value={count}>{count === 1 ? 'À vista' : `${count} vezes`}</option>)}</select></label>}
                          {!transaction && split.installments > 1 && <label className="field"><span>Condição</span><select value={split.hasInterest ? 'interest' : 'free'} onChange={(event) => updateSplit(split.id, { hasInterest: event.target.value === 'interest', interestRate: '' })}><option value="free">Sem juros</option><option value="interest">Com juros</option></select></label>}
                          {!transaction && split.installments > 1 && split.hasInterest && <label className="field"><span>Juros ao mês</span><div className="percent-input"><input inputMode="decimal" value={split.interestRate} onChange={(event) => updateSplit(split.id, { interestRate: event.target.value })} placeholder="0,00" /><span>%</span></div></label>}
                        </div>
                        {!transaction && split.installments > 1 && principal > 0 && <p className="installment-preview"><strong>{split.installments}× de {formatCurrency(financing.installmentValue)}</strong><span>Total desta parte: {formatCurrency(financing.totalPayable)}{financing.totalInterest > 0 ? ` · ${formatCurrency(financing.totalInterest)} em juros` : ' · sem juros'}</span></p>}
                      </article>
                    );
                  })}
                  {isSplitPurchase && <div className={`split-balance ${Math.abs(splitDifference) <= .009 ? 'is-balanced' : ''}`}><span>Distribuído: <strong>{formatCurrency(splitTotal)}</strong></span><span>{Math.abs(splitDifference) <= .009 ? <><Check size={15} /> Valores conferem</> : splitDifference > 0 ? `Faltam ${formatCurrency(splitDifference)}` : `Excedeu ${formatCurrency(Math.abs(splitDifference))}`}</span></div>}
                  {projectedCardTotal > parsedAmount + .009 && <div className="interest-total"><span>Custo final estimado</span><strong>{formatCurrency(projectedCardTotal)}</strong><small>O contrato pode incluir IOF, CET e outras tarifas não informadas aqui.</small></div>}
                </div>
              )}
            </section>
          )}

          {!transaction && paymentMode === 'cash' && <label className="check-row"><input type="checkbox" checked={repeatMonthly} onChange={(event) => setRepeatMonthly(event.target.checked)} /><span><Repeat2 size={18} /><strong>Repetir por 12 meses</strong><small>Ideal para salário, aluguel e assinaturas.</small></span></label>}
          {type === 'expense' && cards.length === 0 && <p className="form-hint form-hint--notice">Cadastre seus cartões nas configurações para parcelar ou dividir uma compra.</p>}
          {error && <p className="form-error" role="alert">{error}</p>}
          <footer className="modal__footer"><button type="button" className="button button--ghost" onClick={onClose}>Cancelar</button><button type="submit" className="button button--primary"><Check size={18} /> {transaction ? 'Salvar mudanças' : 'Adicionar lançamento'}</button></footer>
        </form>
      </section>
    </div>
  );
}
