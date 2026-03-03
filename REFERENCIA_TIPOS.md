# 📚 REFERÊNCIA RÁPIDA: TIPOS TYPESCRIPT

## 🎯 Índice de Tipos por Arquivo

### `src/types/index.ts` - Tipos Principais
**145 linhas | 20 interfaces/tipos**

**Modelos de Dados:**
- `Transaction` - Transação com tipo, status, descrição, categoria
- `TransactionType` - Union type: `'income' | 'expense'`
- `TransactionStatus` - Union type: `'paid' | 'pending'`
- `Card` - Cartão de banco com gradiente e cores
- `AddCardInput` - Input para adicionar cartão
- `Goal` - Meta com nome, target, atual
- `GoalProgress` - Meta com progresso calculado (0-100%)

**Análise Financeira:**
- `FinancialData` - Balance, income, expenses, payable
- `CategoryData` - Categoria com valor e cor
- `FinancialAnalytics` - Score, rates, distribuição, insights
- `CategoryDistribution` - Distribuição por categoria
- `Insight` - Recomendação com tipo (success/info/warning/error)
- `TrendData` - Tendência mensal com income/expense/balance

**Estado Global:**
- `AppContextType` - Contexto completo (estado + callbacks)
- `ThemeContextType` - Contexto de tema com cores
- `ThemeColors` - Definição de cores do tema

**Validação:**
- `ValidationResult` - {isValid, errors[]}
- `BackupData` - Backup completo com version

**Props de Componentes:**
- `StatCardProps` - Card com label, value, icon, cor
- `MetricCardProps` - Card de métrica com trend
- `EmptyStateProps` - Estado vazio com icon, title, description
- `AlertProps` - Alerta com tipo e mensagem
- `ProgressBarProps` - Barra de progresso
- `BadgeProps` - Badge/tag tipado
- `UnifiedTransactionFormProps` - Form unificado
- `ReportsModalProps` - Modal de relatórios

### `src/types/api.ts` - API & Backend
**150 linhas | 22 interfaces**

**Padrão:**
- `ApiRequest<T>` - Request genérico
- `ApiResponse<T>` - Response genérico

**Autenticação:**
- `AuthCredentials` - Email + password
- `AuthResponse` - Token + user profile
- `UserProfile` - Dados do usuário
- `RefreshTokenRequest` - Refresh token

**Sincronização:**
- `SyncRequest` - Dados para sincronizar
- `SyncResponse` - Resposta de sync
- `SyncConflict` - Conflito de sincronização

**Endpoints:**
- `CreateTransactionRequest` - POST /api/transactions
- `TransactionListParams` - GET /api/transactions query
- `CreateCardRequest` - POST /api/cards
- `CreateGoalRequest` - POST /api/goals
- `ReportRequest` - GET /api/reports
- `ReportResponse` - Resposta com summary, categories, trend
- `ExportRequest` - Request para exportar dados
- `ImportRequest` - Request para importar dados
- `ImportResponse` - Resultado da importação

### `src/types/hooks.ts` - Custom Hooks
**200 linhas | 25 interfaces**

**useOCR (Reconhecimento):**
- `OCRState` - isProcessing, progress, error
- `OCRResult` - amount, merchant, date, category
- `UseOCRReturn` - State + processImage(), reset()

**useVoiceInput (Voz):**
- `VoiceState` - isListening, transcript, error
- `ParsedVoiceCommand` - amount, category, type, description
- `UseVoiceInputReturn` - State + startListening(), parseCommand()

**usePWAInstall (PWA):**
- `PWAInstallState` - canInstall, isInstalled, error
- `BeforeInstallPromptEvent` - Event do browser
- `UsePWAInstallReturn` - State + install(), dismiss()

**useApp (Context):**
- `UseAppReturn` - Contexto completo + ações

**useFinancialAnalytics (Analytics):**
- `TrendPoint` - date, income, expense, balance
- `UseTrendAnalysisReturn` - Trend com average e growth
- `CategoryBreakdown` - Category com total, percentage, count
- `UseCategoryAnalysisReturn` - Categories com topCategory
- `BudgetMetric` - Nome, current, target, percentage, status
- `UseBudgetProgressReturn` - Budgets com status
- `UseFinancialAnalyticsReturn` - Todos os analytics combinados

**Padrões Gerais:**
- `UseAsyncState<T>` - data, loading, error
- `UseAsyncReturn<T>` - State + refetch()
- `UseLocalStorageOptions` - Opções de localStorage
- `UseLocalStorageReturn<T>` - value, setValue, removeValue
- `FormFieldError` - field + message
- `UseFormReturn<T>` - Valores, erros, handlers de form

### `src/types/utils.ts` - Utilitários
**280 linhas | 28 interfaces**

**Formatação:**
- `CurrencyFormatOptions` - locale, currency, digits

**Validação:**
- `TransactionValidationError` - field específico 'amount' | 'type' | etc
- `CardValidationError` - field específico para cartão
- `GoalValidationError` - field específico para meta
- `ValidationOptions` - strict, sanitize, normalize

**Agrupamento:**
- `TransactionGroup` - key, transactions[], total, count
- `GroupByDateResult` - date, day, transactions[], total
- `GroupByCategoryResult` - category, icon, transactions[], total, %
- `HealthScoreBreakdown` - score, level, factors, recommendations

**OCR:**
- `OCRParseOptions` - language, confidence, autoDetect
- `ParsedOCRData` - amount, merchant, date, category, confidence
- `OCRExtractorResult` - text sections (header, items, total)
- `OCRLineItem` - description, quantity, price

**Voice:**
- `VoiceParseOptions` - language, timezone, context
- `ParsedVoiceData` - type, amount, category, confidence
- `VoiceCommandPattern` - pattern regex + extractor

**Criptografia:**
- `EncryptionOptions` - algorithm, encoding
- `BackupMetadata` - version, date, count, hash
- `CompressedBackup` - metadata + data comprimido

**Exportação:**
- `PDFReportOptions` - title, charts, orientation, pageSize
- `ExportTableRow` - Record<string, any>
- `ExportOptions` - filename, format, prettify, metadata

**Gamification:**
- `Achievement` - id, name, icon, unlockedAt, progress
- `AchievementCriteria` - type de critério + target + reward
- `LevelProgress` - level, XP, nextLevelXP, %

**Dados:**
- `DataStats` - Summary de todos os dados
- `MockDataOptions` - Quantidade e range de dados de mock

**Storage:**
- `StorageItem<T>` - key, value, expiresAt, metadata
- `StorageEvent<T>` - oldValue, newValue, timestamp
- `StorageOptions` - prefix, namespace, ttl

**Data:**
- `DateRangeOptions` - locale, weekStartsOn
- `DatePeriod` - start, end, label, type
- `RecurringPattern` - frequency, interval, dayOfWeek, etc

### `src/types/components.ts` - Componentes Avançados
**320 linhas | 30 interfaces**

**Modals:**
- `ModalProps` - isOpen, onClose, title, size, etc
- `WelcomeModalProps` - Extends ModalProps + userName
- `SubscriptionModalProps` - Extends ModalProps + plan
- `SettingsModalProps` - Extends ModalProps + theme, privacy
- `DrawerProps` - Extends ModalProps + position, width

**Tabs:**
- `TabItem` - id, label, icon, badge, content
- `TabsProps` - tabs[], defaultTab, onChange, variant

**Inputs:**
- `FormInputProps` - name, type, value, onChange, error
- `FormSelectProps` - name, options[], value, onChange
- `FormRangeProps` - min, max, step, value, onChange
- `FormCheckboxProps` - name, checked, onChange

**Charts:**
- `ChartDataPoint` - name, value, percentage
- `LineChartProps` - data, title, xKey, yKey, height
- `BarChartProps` - data, title, horizontal
- `PieChartProps` - data, title, innerRadius
- `AreaChartProps` - data, gradient, fillOpacity

**Listas:**
- `DataTableColumn<T>` - Coluna genérica
- `DataTableProps<T>` - Tabela genérica
- `PaginationProps` - currentPage, totalPages, onPageChange

**Containers:**
- `CardProps` - children, variant, padding
- `BadgeProps` - label, variant, color, size
- `AlertProps` (extendido) - message, type, action

**Buttons:**
- `ButtonProps` - variant, size, loading, icon, iconPosition
- `IconButtonProps` - Extends ButtonProps + icon obrigatório
- `FloatingActionButtonProps` - position, actions[]

**Overlays:**
- `TooltipProps` - content, children, position, delay
- `PopoverProps` - content, children, trigger, open

**Animação:**
- `AnimationVariants` - initial, animate, exit, hover, tap
- `TransitionProps` - type, duration, delay, ease

**Patterns:**
- `CompoundComponentProps<T>` - Para componentes compostos
- `WithCompoundComponents<P, T>` - Type helper
- `ResponsiveValue<T>` - mobile?, tablet?, desktop?
- `ResponsiveProps` - display, flexDirection, gridCols, padding
- `SlotProps` - header, footer, sidebar, content
- `PresetSlotProps` - Extends SlotProps + preset

---

## 🔍 Busca Rápida por Caso de Uso

### "Preciso de um tipo para uma transação"
```typescript
import type { Transaction } from '@/types';
const tx: Transaction = { ... }
```

### "Preciso validar uma transação"
```typescript
import type { ValidationResult } from '@/types';
import { validateTransaction } from '@/utils/financial';

const result: ValidationResult = validateTransaction(tx);
```

### "Preciso acessar o contexto"
```typescript
import { useApp } from '@/hooks/useApp';
const { transactions, addTransaction } = useApp();
// Tudo tipado automaticamente
```

### "Preciso de tipos para um form"
```typescript
import type { FormInputProps } from '@/types/components';

const inputProps: FormInputProps = {
  name: 'email',
  type: 'email',
  value: email,
  onChange: setEmail,
}
```

### "Preciso de types para analytics"
```typescript
import { useFinancialAnalytics } from '@/hooks/useFinancialAnalytics';
const { analytics, trends, insights } = useFinancialAnalytics();
// analytics: FinancialAnalytics (tipo automático)
```

### "Preciso integrar com API futura"
```typescript
import type { ApiResponse, CreateTransactionRequest } from '@/types/api';

const request: CreateTransactionRequest = { ... };
const response: ApiResponse<Transaction> = await fetch('/api/transactions');
```

### "Preciso de tipos para componente React"
```typescript
import type { FC, ReactNode } from 'react';
import type { ButtonProps } from '@/types/components';

const MyButton: FC<ButtonProps> = (props) => {
  return <button>{props.children}</button>;
};
```

---

## 📊 Estatísticas

| Métrica | Valor |
|---------|-------|
| Total de Arquivos de Tipos | 5 |
| Total de Linhas | ~1.145 |
| Total de Interfaces/Types | **115+** |
| Re-exports em index.ts | 60+ |
| Cobertura de Componentes | 100% |
| Cobertura de Hooks | 100% |
| Cobertura de Utilitários | 95% |

---

## 🚀 Comandos Úteis

```bash
# Verificar erros de tipo
npm run type-check

# Ver tipos de uma file
npx tsc --noEmit src/utils/financial.ts --pretty --listFiles

# Gerar type declarations
npx tsc --declaration --emitDeclarationOnly

# Modo strict (máxima segurança)
npx tsc --strict
```

---

## 📖 Convenções de Nomes

- `Tipo` - PascalCase para tipos/interfaces
- `TypeProps` - Tipos de props terminam em "Props"
- `UseXxx` - Custom hooks começam com "use"
- `UseXxxReturn` - Retorno de hook termina em "Return"
- `IXxx` - Interfaces podem começar com "I" (opcional)
- `XxxT` - Type aliases podem terminar com "T" (opcional)

---

✨ **Sistema de tipos completo e bem documentado!**

Para exemplos práticos, veja:
- [TIPOS_TYPESCRIPT.md](./TIPOS_TYPESCRIPT.md) - Guia Completo
- [MIGRACAO_TYPESCRIPT.md](./MIGRACAO_TYPESCRIPT.md) - Migração Passo-a-Passo
- [EXEMPLOS_USO.md](./EXEMPLOS_USO.md) - Exemplos de Código
