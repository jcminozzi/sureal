/**
 * 🎯 TIPOS PRINCIPAIS DA APLICAÇÃO
 * Definições TypeScript para estruturas de dados
 */

// ============================================
// TRANSAÇÃO
// ============================================

export interface Transaction {
  id: string;
  amount: number;
  type: 'income' | 'expense';
  status: 'paid' | 'pending';
  description: string;
  categoryLabel: string;
  categoryIcon: string;
  date: string; // ISO8601
  cardId?: string;
  installment?: string; // "1/12"
  recurring?: boolean;
}

export type TransactionType = Transaction['type'];
export type TransactionStatus = Transaction['status'];

// ============================================
// CARTÃO
// ============================================

export interface Card {
  id: string;
  bankName: string;
  bankId: string;
  dueDay: string | number;
  gradient?: string;
  text?: string;
  color?: string;
  border?: string;
}

export interface AddCardInput {
  bankName: string;
  bankId: string;
  dueDay: string | number;
}

// ============================================
// META
// ============================================

export interface Goal {
  id: string;
  name: string;
  target: number;
  current: number;
  emoji?: string;
}

export interface GoalProgress extends Goal {
  progress: number; // 0-100
  remaining: number;
  isCompleted: boolean;
  percentageText: string;
}

// ============================================
// CATEGORIA
// ============================================

export interface Category {
  id: string;
  icon: string;
  label: string;
  color: string;
}

// ============================================
// BANCO
// ============================================

export interface Bank {
  id: string;
  name: string;
  color: string;
  gradient: string;
  text: string;
  border?: string;
}

// ============================================
// DADOS FINANCEIROS
// ============================================

export interface FinancialData {
  balance: number;
  income: number;
  expenses: number;
  payable: number;
  projectedBalance: number;
  categoryData: CategoryData[];
  cardInvoices: Record<string, number>;
}

export interface CategoryData {
  name: string;
  value: number;
  color: string;
}

// ============================================
// ANALYTICS
// ============================================

export interface FinancialAnalytics {
  healthScore: number; // 0-100
  savingsRate: number; // 0-100
  categoryDistribution: CategoryDistribution[];
  topExpense: number;
  avgTransaction: number;
  topCategory: CategoryDistribution | null;
  recurringExpensesCount: number;
  insights: Insight[];
}

export interface CategoryDistribution {
  label: string;
  icon: string;
  total: number;
  count: number;
  transactions: Transaction[];
}

export interface Insight {
  type: 'success' | 'info' | 'warning' | 'error';
  title: string;
  message: string;
}

export interface TrendData {
  month: string;
  income: number;
  expense: number;
  balance: number;
}

// ============================================
// CONTEXTO
// ============================================

export interface AppContextType {
  // Estado
  transactions: Transaction[];
  cards: Card[];
  goals: Goal[];
  userName: string;
  currentDate: Date;
  isDesktop: boolean;
  theme: 'dark' | 'light';
  isPrivacyMode: boolean;
  monthlyTransactions: Transaction[];
  financialData: FinancialData;

  // Navegação
  nextMonth: () => void;
  prevMonth: () => void;
  goToToday: () => void;

  // Cartões
  addCard: (card: Card) => void;
  deleteCard: (id: string) => void;
  updateCard: (id: string, updates: Partial<Card>) => void;

  // Transações
  addTransaction: (transaction: Transaction) => void;
  deleteTransaction: (id: string) => void;
  updateTransaction: (id: string, updates: Partial<Transaction>) => void;
  deleteAllTransactions: () => void;

  // Metas
  addGoal: (goal: Goal) => void;
  deleteGoal: (id: string) => void;
  updateGoal: (id: string, updates: Partial<Goal>) => void;

  // Usuário
  setUserName: (name: string) => void;
  setTheme: (theme: 'dark' | 'light') => void;
  setIsPrivacyMode: (mode: boolean) => void;
  setIsDesktop: (isDesktop: boolean) => void;
}

export interface ThemeColors {
  background: string;
  surface: string;
  surfaceSecondary: string;
  border: string;
  text: string;
  textSecondary: string;
  accent: string;
  accentHover: string;
  success: string;
  error: string;
  warning: string;
}

export interface ThemeContextType {
  theme: 'dark' | 'light';
  toggleTheme: () => void;
  colors: ThemeColors;
}

// ============================================
// VALIDAÇÃO
// ============================================

export interface ValidationResult {
  isValid: boolean;
  errors: string[];
}

// ============================================
// BACKUP
// ============================================

export interface BackupData {
  transactions: Transaction[];
  cards: Card[];
  goals: Goal[];
  version: string;
  exportDate: string;
}

// ============================================
// MOCK DATA
// ============================================

export interface MockDataStats {
  totalTransactions: number;
  totalCards: number;
  totalGoals: number;
  totalIncome: number;
  totalExpense: number;
  balance: number;
  averageTransaction: number;
}

// ============================================
// COMPONENTES PROPS
// ============================================

export interface StatCardProps {
  label: string;
  value: number;
  icon: React.ReactNode;
  color?: string;
  sub?: string;
  isPrivacyMode?: boolean;
}

export interface MetricCardProps {
  title: string;
  value: string | number;
  icon: React.ReactNode;
  color?: string;
  trend?: number;
}

export interface EmptyStateProps {
  icon: React.ReactNode;
  title: string;
  description: string;
  action?: React.ReactNode;
}

export interface AlertProps {
  type?: 'info' | 'success' | 'warning' | 'error';
  title?: string;
  message?: string;
  onClose?: () => void;
}

export interface ProgressBarProps {
  value: number;
  max?: number;
  label?: string;
  color?: string;
  showPercentage?: boolean;
}

export interface BadgeProps {
  text: string;
  color?: string;
  variant?: 'filled' | 'outline';
}

export interface UnifiedTransactionFormProps {
  onClose: () => void;
  onSave: (transaction: Transaction) => void;
  categories: Category[];
  cards: Card[];
  isDesktop?: boolean;
  initialData?: Partial<Transaction>;
}

export interface ReportsModalProps {
  onClose: () => void;
  transactions: Transaction[];
  income: number;
  expenses: number;
  balance: number;
  categoryData?: CategoryData[];
}

// ============================================
// RE-EXPORTS FROM SPECIALIZED TYPE MODULES
// ============================================

// API Types
export type {
  ApiRequest,
  ApiResponse,
  AuthCredentials,
  AuthResponse,
  UserProfile,
  RefreshTokenRequest,
  SyncRequest,
  SyncResponse,
  SyncConflict,
  CreateTransactionRequest,
  UpdateTransactionRequest,
  TransactionListParams,
  CreateCardRequest,
  UpdateCardRequest,
  CreateGoalRequest,
  UpdateGoalRequest,
  ReportRequest,
  ReportResponse,
  ExportRequest,
  ImportRequest,
  ImportResponse,
} from './api';

// Hook Types
export type {
  OCRState,
  OCRResult,
  UseOCRReturn,
  VoiceState,
  ParsedVoiceCommand,
  UseVoiceInputReturn,
  PWAInstallState,
  BeforeInstallPromptEvent,
  UsePWAInstallReturn,
  UseAppReturn,
  TrendPoint,
  UseTrendAnalysisReturn,
  CategoryBreakdown,
  UseCategoryAnalysisReturn,
  BudgetMetric,
  UseBudgetProgressReturn,
  UseFinancialAnalyticsReturn,
  UseAsyncState,
  UseAsyncReturn,
  UseLocalStorageOptions,
  UseLocalStorageReturn,
  FormFieldError,
  UseFormReturn,
} from './hooks';

// Utility Types
export type {
  CurrencyFormatOptions,
  TransactionValidationError,
  CardValidationError,
  GoalValidationError,
  TransactionGroup,
  GroupByDateResult,
  GroupByCategoryResult,
  HealthScoreBreakdown,
  OCRParseOptions,
  ParsedOCRData,
  OCRExtractorResult,
  OCRLineItem,
  VoiceParseOptions,
  ParsedVoiceData,
  VoiceCommandPattern,
  EncryptionOptions,
  BackupMetadata,
  CompressedBackup,
  PDFReportOptions,
  ExportTableRow,
  ExportOptions,
  Achievement,
  AchievementCriteria,
  LevelProgress,
  DataStats,
  MockDataOptions,
  StorageItem,
  StorageEvent,
  StorageOptions,
  ValidationOptions,
  SanitizeOptions,
  NormalizationRules,
  DateRangeOptions,
  DatePeriod,
  RecurringPattern,
} from './utils';

// Component Types
export type {
  ModalProps,
  WelcomeModalProps,
  SubscriptionModalProps,
  SettingsModalProps,
  TabItem,
  TabsProps,
  FormInputProps,
  FormSelectProps,
  FormRangeProps,
  FormCheckboxProps,
  ChartDataPoint,
  LineChartProps,
  BarChartProps,
  PieChartProps,
  AreaChartProps,
  DataTableColumn,
  DataTableProps,
  PaginationProps,
  CardProps,
  DrawerProps,
  BudgetMetric as BudgetMetricComponent,
  ButtonProps,
  IconButtonProps,
  FloatingActionButtonProps,
  TooltipProps,
  PopoverProps,
  AnimationVariants,
  TransitionProps,
  CompoundComponentProps,
  WithCompoundComponents,
  ResponsiveValue,
  ResponsiveProps,
  SlotProps,
  PresetSlotProps,
} from './components';
