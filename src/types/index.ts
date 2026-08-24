export type TransactionType = 'income' | 'expense';
export type TransactionStatus = 'paid' | 'pending';
export type Theme = 'light' | 'dark';

export interface Transaction {
  id: string;
  amount: number;
  type: TransactionType;
  status: TransactionStatus;
  description: string;
  categoryLabel: string;
  categoryIcon: string;
  date: string;
  cardId?: string;
  installment?: string;
  recurring?: boolean;
  recurringGroupId?: string;
  seriesType?: 'installment' | 'recurring' | 'loan';
  interestRateMonthly?: number;
  originalTotal?: number;
  totalWithInterest?: number;
  loanId?: string;
  splitGroupId?: string;
  splitPart?: string;
  createdAt?: string;
}

export interface TransactionDraft {
  amount: number;
  type: TransactionType;
  status: TransactionStatus;
  description: string;
  categoryLabel: string;
  categoryIcon: string;
  date: string;
  cardId?: string;
  installments?: number;
  recurringMonths?: number;
  interestRateMonthly?: number;
  paymentSplits?: PaymentSplit[];
}

export interface PaymentSplit {
  cardId: string;
  amount: number;
  installments: number;
  interestRateMonthly: number;
}

export interface Card {
  id: string;
  bankName: string;
  bankId?: string;
  presetId?: string;
  kind?: 'credit-card' | 'store-card' | 'wallet';
  dueDay: string | number;
  closingDay?: string | number;
  accentColor?: string;
  gradient?: string;
  text?: string;
  color?: string;
  border?: string;
}

export interface CardPreset {
  id: string;
  name: string;
  shortName: string;
  kind: NonNullable<Card['kind']>;
  color: string;
  textColor: string;
}

export interface Goal {
  id: string;
  name: string;
  target: number;
  current: number;
  emoji?: string;
}

export interface Category {
  id: string;
  icon: string;
  label: string;
  color: string;
  type?: TransactionType | 'both';
}

export type Budgets = Record<string, number>;

export type InvestmentType = 'fixed-income' | 'treasury' | 'fund' | 'stock' | 'etf' | 'fii' | 'crypto' | 'savings' | 'other';

export interface Investment {
  id: string;
  name: string;
  type: InvestmentType;
  institution: string;
  investedAmount: number;
  currentValue: number;
  updatedAt: string;
}

export type LoanType = 'personal' | 'financing' | 'credit-line' | 'invoice-installment' | 'consortium' | 'other';

export interface Loan {
  id: string;
  name: string;
  lender: string;
  type: LoanType;
  principal: number;
  monthlyRate: number;
  installments: number;
  installmentValue: number;
  totalPayable: number;
  firstPaymentDate: string;
  paymentTransactionIds: string[];
  incomeTransactionId?: string;
  createdAt: string;
}

export interface LoanDraft {
  name: string;
  lender: string;
  type: LoanType;
  principal: number;
  monthlyRate: number;
  installments: number;
  firstPaymentDate: string;
  receivedDate: string;
  includeProceeds: boolean;
}

export interface FinancialSummary {
  income: number;
  expenses: number;
  payable: number;
  receivable: number;
  balance: number;
  projectedBalance: number;
}

export interface BackupData {
  app: 'meus-gastinhos';
  version: 4;
  exportedAt: string;
  transactions: Transaction[];
  cards: Card[];
  goals: Goal[];
  budgets: Budgets;
  investments: Investment[];
  loans: Loan[];
  userName: string;
  theme: Theme;
}
