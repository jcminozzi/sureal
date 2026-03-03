/**
 * 🎨 TIPOS PARA COMPONENTES AVANÇADOS
 */

import type { ReactNode, ComponentType } from 'react';
import type { Transaction, Card, Goal, ValidationResult } from './index';

// ============================================
// MODALS
// ============================================

export interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
  title?: string;
  description?: string;
  size?: 'sm' | 'md' | 'lg' | 'xl';
  closeOnBackdropClick?: boolean;
  closeOnEscape?: boolean;
  footer?: ReactNode;
}

export interface WelcomeModalProps extends ModalProps {
  userName?: string;
  onUserNameChange?: (name: string) => void;
}

export interface SubscriptionModalProps extends ModalProps {
  planType?: 'free' | 'pro' | 'premium';
  onSelectPlan?: (plan: string) => void;
}

export interface SettingsModalProps extends ModalProps {
  currentTheme?: 'light' | 'dark';
  privacyMode?: boolean;
  onThemeChange?: (theme: 'light' | 'dark') => void;
  onPrivacyModeChange?: (enabled: boolean) => void;
}

// ============================================
// TABS
// ============================================

export interface TabItem {
  id: string;
  label: string;
  icon?: ReactNode;
  badge?: string | number;
  disabled?: boolean;
  content: ReactNode;
}

export interface TabsProps {
  tabs: TabItem[];
  defaultTab?: string;
  onChange?: (tabId: string) => void;
  variant?: 'default' | 'pills' | 'segments';
  orientation?: 'horizontal' | 'vertical';
}

// ============================================
// FORMS
// ============================================

export interface FormInputProps {
  name: string;
  label?: string;
  type?: 'text' | 'email' | 'password' | 'number' | 'date' | 'tel' | 'url';
  placeholder?: string;
  value: string | number;
  onChange: (value: string | number) => void;
  error?: string;
  disabled?: boolean;
  required?: boolean;
  autoComplete?: string;
  helperText?: string;
}

export interface FormSelectProps {
  name: string;
  label?: string;
  options: Array<{
    value: string | number;
    label: string;
    description?: string;
    icon?: ReactNode;
  }>;
  value: string | number;
  onChange: (value: string | number) => void;
  error?: string;
  disabled?: boolean;
  required?: boolean;
  searchable?: boolean;
  clearable?: boolean;
  multiple?: boolean;
}

export interface FormRangeProps {
  name: string;
  label?: string;
  min: number;
  max: number;
  step?: number;
  value: number;
  onChange: (value: number) => void;
  marks?: boolean;
  showLabel?: boolean;
  formatLabel?: (value: number) => string;
}

export interface FormCheckboxProps {
  name: string;
  label?: string;
  checked: boolean;
  onChange: (checked: boolean) => void;
  disabled?: boolean;
  helperText?: string;
}

// ============================================
// CHARTS & VISUALIZATIONS
// ============================================

export interface ChartDataPoint {
  name: string;
  value: number;
  percentage?: number;
  fill?: string;
}

export interface LineChartProps {
  data: ChartDataPoint[];
  title?: string;
  xKey?: string;
  yKey?: string;
  showGrid?: boolean;
  showLegend?: boolean;
  strokeWidth?: number;
  height?: number;
}

export interface BarChartProps {
  data: ChartDataPoint[];
  title?: string;
  xKey?: string;
  yKey?: string;
  showGrid?: boolean;
  showLegend?: boolean;
  horizontal?: boolean;
  height?: number;
}

export interface PieChartProps {
  data: ChartDataPoint[];
  title?: string;
  showLabel?: boolean;
  showLegend?: boolean;
  height?: number;
  innerRadius?: number;
}

export interface AreaChartProps {
  data: ChartDataPoint[];
  title?: string;
  xKey?: string;
  yKey?: string;
  fillOpacity?: number;
  showGrid?: boolean;
  showLegend?: boolean;
  height?: number;
  gradient?: boolean;
}

// ============================================
// LISTS & TABLES
// ============================================

export interface DataTableColumn<T> {
  id: string;
  label: string;
  accessor?: (item: T) => ReactNode;
  render?: (item: T, index: number) => ReactNode;
  sortable?: boolean;
  filterable?: boolean;
  width?: string | number;
  align?: 'left' | 'center' | 'right';
}

export interface DataTableProps<T> {
  columns: DataTableColumn<T>[];
  data: T[];
  keyExtractor: (item: T, index: number) => string;
  onRowClick?: (item: T) => void;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
  rowsPerPage?: number;
  paginated?: boolean;
  selectable?: boolean;
  onSelectionChange?: (selected: string[]) => void;
  loading?: boolean;
  emptyMessage?: string;
}

export interface PaginationProps {
  currentPage: number;
  totalPages: number;
  onPageChange: (page: number) => void;
  pageSize?: number;
  showSizeChanger?: boolean;
  onPageSizeChange?: (size: number) => void;
}

// ============================================
// CARDS & CONTAINERS
// ============================================

export interface CardProps {
  children: ReactNode;
  variant?: 'default' | 'elevated' | 'outlined' | 'filled';
  padding?: 'xs' | 'sm' | 'md' | 'lg' | 'xl';
  onClick?: () => void;
  hoverable?: boolean;
  className?: string;
}

export interface AlertProps {
  message: string;
  type: 'info' | 'success' | 'warning' | 'error';
  closeable?: boolean;
  onClose?: () => void;
  icon?: ReactNode;
  action?: {
    label: string;
    onClick: () => void;
  };
}

export interface BadgeProps {
  label: string;
  variant?: 'solid' | 'outline' | 'dot';
  color?: 'primary' | 'success' | 'warning' | 'error' | 'info';
  size?: 'sm' | 'md' | 'lg';
  icon?: ReactNode;
}

// ============================================
// BUTTONS & INPUTS
// ============================================

export interface ButtonProps {
  children: ReactNode;
  onClick?: () => void;
  variant?: 'primary' | 'secondary' | 'outline' | 'ghost' | 'danger';
  size?: 'xs' | 'sm' | 'md' | 'lg' | 'xl';
  loading?: boolean;
  disabled?: boolean;
  fullWidth?: boolean;
  icon?: ReactNode;
  iconPosition?: 'left' | 'right';
  type?: 'button' | 'submit' | 'reset';
  className?: string;
}

export interface IconButtonProps extends ButtonProps {
  icon: ReactNode;
}

export interface FloatingActionButtonProps extends ButtonProps {
  position?: 'bottom-right' | 'bottom-left' | 'top-right' | 'top-left';
  actions?: Array<{
    label: string;
    icon: ReactNode;
    onClick: () => void;
  }>;
}

// ============================================
// OVERLAYS & POPOVERS
// ============================================

export interface TooltipProps {
  content: ReactNode;
  children: ReactNode;
  position?: 'top' | 'bottom' | 'left' | 'right';
  delay?: number;
  theme?: 'light' | 'dark';
}

export interface PopoverProps {
  content: ReactNode;
  children: ReactNode;
  position?: 'top' | 'bottom' | 'left' | 'right';
  trigger?: 'click' | 'hover' | 'focus';
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
}

export interface DrawerProps extends ModalProps {
  position?: 'left' | 'right' | 'top' | 'bottom';
  width?: string;
}

// ============================================
// ANIMATION PROPS
// ============================================

export interface AnimationVariants {
  initial: Record<string, any>;
  animate: Record<string, any>;
  exit: Record<string, any>;
  hover?: Record<string, any>;
  tap?: Record<string, any>;
}

export interface TransitionProps {
  type?: 'spring' | 'tween' | 'inertia';
  duration?: number;
  delay?: number;
  ease?: 'easeIn' | 'easeOut' | 'easeInOut' | 'linear' | string;
}

// ============================================
// COMPOUND COMPONENT PATTERNS
// ============================================

export interface CompoundComponentProps<T extends Record<string, ComponentType<any>>> {
  children: ReactNode;
}

export type WithCompoundComponents<P, T extends Record<string, ComponentType<any>>> = P & {
  [K in keyof T]: T[K];
};

// ============================================
// RESPONSIVE PROPS
// ============================================

export interface ResponsiveValue<T> {
  mobile?: T;
  tablet?: T;
  desktop?: T;
}

export interface ResponsiveProps {
  display?: ResponsiveValue<'block' | 'inline' | 'none'>;
  flexDirection?: ResponsiveValue<'row' | 'column'>;
  gridCols?: ResponsiveValue<number>;
  padding?: ResponsiveValue<string | number>;
  margin?: ResponsiveValue<string | number>;
}

// ============================================
// SLOT PROPS (COMPOSITION)
// ============================================

export interface SlotProps {
  header?: ReactNode;
  footer?: ReactNode;
  sidebar?: ReactNode;
  content?: ReactNode;
  overlay?: ReactNode;
}

export interface PresetSlotProps extends SlotProps {
  preset?: 'default' | 'sidebar' | 'header-footer' | 'split';
}
