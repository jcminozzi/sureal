import { useEffect, useMemo, useState, type FormEvent } from 'react';
import { CalendarDays, Check, CreditCard, Repeat2, X } from 'lucide-react';
import { EXPENSE_CATEGORIES, INCOME_CATEGORIES } from '../constants/categories';
import { formatCurrency, parseMoneyInput, toDateInput, toLocalIso } from '../lib/finance';
import type { Card, Transaction, TransactionDraft, TransactionStatus, TransactionType } from '../types';

interface TransactionFormProps {
  cards: Card[];
  transaction?: Transaction | null;
  onClose: () => void;
  onCreate: (draft: TransactionDraft) => void;
  onUpdate: (id: string, changes: Partial<Transaction>) => void;
}

export function TransactionForm({ cards, transaction, onClose, onCreate, onUpdate }: TransactionFormProps) {
  const [type, setType] = useState<TransactionType>(transaction?.type ?? 'expense');
  const [amount, setAmount] = useState(transaction ? String(transaction.amount).replace('.', ',') : '');
  const [description, setDescription] = useState(transaction?.description ?? '');
  const [date, setDate] = useState(transaction ? toDateInput(transaction.date) : toDateInput(new Date()));
  const [status, setStatus] = useState<TransactionStatus>(transaction?.status ?? 'paid');
  const [categoryLabel, setCategoryLabel] = useState(transaction?.categoryLabel ?? '');
  const [cardId, setCardId] = useState(transaction?.cardId ?? '');
  const [installments, setInstallments] = useState(1);
  const [repeatMonthly, setRepeatMonthly] = useState(false);
  const [error, setError] = useState('');
  const categories = type === 'expense' ? EXPENSE_CATEGORIES : INCOME_CATEGORIES;
  const parsedAmount = parseMoneyInput(amount);
  const selectedCategory = useMemo(
    () => categories.find((category) => category.label === categoryLabel),
    [categories, categoryLabel],
  );

  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => event.key === 'Escape' && onClose();
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [onClose]);

  const changeType = (nextType: TransactionType) => {
    setType(nextType);
    setCategoryLabel('');
    if (nextType === 'income') {
      setCardId('');
      setInstallments(1);
    }
  };

  const submit = (event: FormEvent) => {
    event.preventDefault();
    if (parsedAmount <= 0) return setError('Informe um valor maior que zero.');
    if (!selectedCategory) return setError('Escolha uma categoria.');
    if (!date) return setError('Escolha a data do lançamento.');

    if (transaction) {
      onUpdate(transaction.id, {
        amount: parsedAmount,
        type,
        status,
        description: description.trim() || selectedCategory.label,
        categoryLabel: selectedCategory.label,
        categoryIcon: selectedCategory.icon,
        date: toLocalIso(date),
        cardId: type === 'expense' && cardId ? cardId : undefined,
      });
    } else {
      onCreate({
        amount: parsedAmount,
        type,
        status,
        description,
        categoryLabel: selectedCategory.label,
        categoryIcon: selectedCategory.icon,
        date,
        cardId: type === 'expense' && cardId ? cardId : undefined,
        installments: type === 'expense' ? installments : 1,
        recurringMonths: repeatMonthly ? 12 : 1,
      });
    }
    onClose();
  };

  return (
    <div className="modal-backdrop" role="presentation" onMouseDown={(event) => event.target === event.currentTarget && onClose()}>
      <section className="modal transaction-modal" role="dialog" aria-modal="true" aria-labelledby="transaction-title">
        <header className="modal__header">
          <div>
            <span className="eyebrow">{transaction ? 'Editar lançamento' : 'Novo lançamento'}</span>
            <h2 id="transaction-title">{transaction ? transaction.description : 'Anote em poucos segundos'}</h2>
          </div>
          <button className="icon-button" onClick={onClose} aria-label="Fechar"><X size={20} /></button>
        </header>

        <form onSubmit={submit} className="transaction-form">
          <div className="segmented" aria-label="Tipo do lançamento">
            <button type="button" className={type === 'expense' ? 'is-active is-expense' : ''} onClick={() => changeType('expense')}>Saída</button>
            <button type="button" className={type === 'income' ? 'is-active is-income' : ''} onClick={() => changeType('income')}>Entrada</button>
          </div>

          <label className="amount-field">
            <span>Valor {installments > 1 ? 'total' : ''}</span>
            <div><small>R$</small><input autoFocus inputMode="decimal" value={amount} onChange={(event) => { setAmount(event.target.value); setError(''); }} placeholder="0,00" aria-label="Valor" /></div>
          </label>

          {installments > 1 && parsedAmount > 0 && (
            <p className="form-hint form-hint--center">{installments} parcelas de {formatCurrency(parsedAmount / installments)}</p>
          )}

          <div className="form-grid">
            <label className="field field--wide">
              <span>Descrição</span>
              <input value={description} onChange={(event) => setDescription(event.target.value)} placeholder={type === 'expense' ? 'Ex.: mercado da semana' : 'Ex.: salário'} maxLength={80} />
            </label>
            <label className="field">
              <span><CalendarDays size={15} /> Data</span>
              <input type="date" value={date} onChange={(event) => setDate(event.target.value)} />
            </label>
            <label className="field">
              <span>Status</span>
              <select value={status} onChange={(event) => setStatus(event.target.value as TransactionStatus)}>
                <option value="paid">{type === 'income' ? 'Recebido' : 'Pago'}</option>
                <option value="pending">Pendente</option>
              </select>
            </label>
          </div>

          <fieldset className="category-picker">
            <legend>Categoria</legend>
            <div>
              {categories.map((category) => (
                <button key={category.id} type="button" className={categoryLabel === category.label ? 'is-selected' : ''} onClick={() => { setCategoryLabel(category.label); setError(''); }}>
                  <span aria-hidden="true">{category.icon}</span><small>{category.label}</small>
                </button>
              ))}
            </div>
          </fieldset>

          {type === 'expense' && cards.length > 0 && (
            <div className="form-grid">
              <label className="field">
                <span><CreditCard size={15} /> Forma de pagamento</span>
                <select value={cardId} onChange={(event) => { setCardId(event.target.value); if (event.target.value) setStatus('pending'); }}>
                  <option value="">Débito, Pix ou dinheiro</option>
                  {cards.map((card) => <option key={card.id} value={card.id}>{card.bankName}</option>)}
                </select>
              </label>
              {cardId && !transaction && (
                <label className="field">
                  <span>Parcelas</span>
                  <select value={installments} onChange={(event) => { setInstallments(Number(event.target.value)); setRepeatMonthly(false); }}>
                    {Array.from({ length: 12 }, (_, index) => index + 1).map((count) => <option key={count} value={count}>{count === 1 ? 'À vista' : `${count} vezes`}</option>)}
                  </select>
                </label>
              )}
            </div>
          )}

          {!transaction && installments === 1 && (
            <label className="check-row">
              <input type="checkbox" checked={repeatMonthly} onChange={(event) => setRepeatMonthly(event.target.checked)} />
              <span><Repeat2 size={18} /><strong>Repetir por 12 meses</strong><small>Ideal para salário, aluguel e assinaturas.</small></span>
            </label>
          )}

          {error && <p className="form-error" role="alert">{error}</p>}
          <footer className="modal__footer">
            <button type="button" className="button button--ghost" onClick={onClose}>Cancelar</button>
            <button type="submit" className="button button--primary"><Check size={18} /> {transaction ? 'Salvar mudanças' : 'Adicionar lançamento'}</button>
          </footer>
        </form>
      </section>
    </div>
  );
}

