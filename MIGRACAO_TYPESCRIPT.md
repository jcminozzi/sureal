# 🔄 GUIA DE MIGRAÇÃO JAVASCRIPT → TYPESCRIPT

## 📌 Visão Geral

Este guia orientará você através da migração gradual de JavaScript para TypeScript, começando com arquivos de menor risco e progredindo para componentes mais complexos.

### Timeline Recomendada
- **Fase 1** (15 min): Configuração ✅ (já completa)
- **Fase 2** (1 hora): Utilitários (`financial.js`, `banks.js`)
- **Fase 3** (2 horas): Contextos e Hooks
- **Fase 4** (3 horas): Componentes
- **Fase 5** (1 hora): Layouts e App.jsx

---

## 🎯 Fase 2: Utilitários (Sem Risco)

### Arquivo: `src/utils/financial.js` → `financial.ts`

#### ✅ ANTES
```javascript
// src/utils/financial.js
import { formatDistanceToNow } from 'date-fns';
import { ptBR } from 'date-fns/locale';

export const formatCurrency = (value, isPrivacyMode = false) => {
  if (isPrivacyMode) return '****';
  return new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL',
  }).format(value || 0);
};

export const validateTransaction = (transaction) => {
  const errors = [];
  
  if (!transaction.amount || transaction.amount <= 0) {
    errors.push('amount: Valor deve ser maior que 0');
  }
  
  if (!transaction.description || transaction.description.trim() === '') {
    errors.push('description: Descrição é obrigatória');
  }
  
  return {
    isValid: errors.length === 0,
    errors,
  };
};
```

#### ✅ DEPOIS
```typescript
// src/utils/financial.ts
import { formatDistanceToNow } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import type { 
  Transaction, 
  ValidationResult,
  CurrencyFormatOptions 
} from '@/types';

export const formatCurrency = (
  value: number,
  isPrivacyMode: boolean = false,
  options?: CurrencyFormatOptions
): string => {
  if (isPrivacyMode) return '****';
  
  return new Intl.NumberFormat(options?.locale || 'pt-BR', {
    style: 'currency',
    currency: options?.currency || 'BRL',
    minimumFractionDigits: options?.minimumFractionDigits ?? 2,
    maximumFractionDigits: options?.maximumFractionDigits ?? 2,
  }).format(value || 0);
};

export const validateTransaction = (
  transaction: Partial<Transaction>
): ValidationResult => {
  const errors: string[] = [];
  
  if (!transaction.amount || transaction.amount <= 0) {
    errors.push('amount: Valor deve ser maior que 0');
  }
  
  if (!transaction.description || transaction.description.trim() === '') {
    errors.push('description: Descrição é obrigatória');
  }
  
  if (!transaction.categoryLabel) {
    errors.push('categoryLabel: Categoria é obrigatória');
  }
  
  if (!transaction.date) {
    errors.push('date: Data é obrigatória');
  }
  
  return {
    isValid: errors.length === 0,
    errors,
  };
};

// Exemplo: adicione tipos para funções existentes
export const parseAmount = (value: string | number): number => {
  if (typeof value === 'number') return value;
  return parseFloat(value.replace(',', '.'));
};

export const groupTransactionsByCategory = (
  transactions: Transaction[]
): Record<string, number> => {
  return transactions.reduce(
    (acc, tx) => {
      acc[tx.categoryLabel] = (acc[tx.categoryLabel] || 0) + tx.amount;
      return acc;
    },
    {} as Record<string, number>
  );
};
```

#### 🔧 Checklist
- [ ] Renomeie o arquivo para `.ts`
- [ ] Adicione importações de type (`import type { ... }`)
- [ ] Anote parâmetros com tipos
- [ ] Anote retornos de funções
- [ ] Use `const` quando possível (melhor type inference)
- [ ] Teste no browser (F5 para reload)

---

### Arquivo: `src/constants/banks.js` → `banks.ts`

#### ✅ ANTES
```javascript
// src/constants/banks.js
export const BANKS = {
  itau: {
    id: 'itau',
    name: 'Itaú',
    gradient: 'from-orange-400 to-orange-600',
    color: 'bg-orange-500',
    text: 'text-white',
    border: 'border-orange-600',
  },
  // ... more banks
};
```

#### ✅ DEPOIS
```typescript
// src/constants/banks.ts
import type { Bank } from '@/types';

export const BANKS: Record<string, Bank> = {
  itau: {
    id: 'itau',
    name: 'Itaú',
    gradient: 'from-orange-400 to-orange-600',
    color: 'bg-orange-500',
    text: 'text-white',
    border: 'border-orange-600',
  },
  // ... more banks
};

// Função para obter banco - agora type-safe
export const getBank = (bankId: string): Bank | undefined => {
  return BANKS[bankId];
};

// Getter de todos os IDs
export const BANK_IDS = Object.keys(BANKS) as const;
export type BankId = typeof BANK_IDS[number];
```

#### 🔧 Como Usar Tipos Union
```typescript
// Usando BankId como tipo
const selectBank = (id: BankId) => {
  const bank = BANKS[id]; // ✅ TypeScript sabe que bank existe
};

// ❌ Isso será erro:
selectBank('banco_inexistente'); // Error: "'banco_inexistente' não é assignable to BankId"
```

---

## 🎯 Fase 3: Contextos e Hooks

### Arquivo: `src/context/AppContext.jsx` → `AppContext.ts`

#### Passo 1: Renomear e adicionar tipos

```typescript
// src/context/AppContext.ts
import React, { createContext, useCallback, useMemo, useEffect, useState } from 'react';
import type { 
  AppContextType, 
  Transaction, 
  Card, 
  Goal,
  FinancialData 
} from '@/types';
import { safeSetLocalStorage, safeGetLocalStorage } from '@/utils/financial';

export const AppContext = createContext<AppContextType | undefined>(undefined);

interface AppProviderProps {
  children: React.ReactNode;
}

export const AppProvider: React.FC<AppProviderProps> = ({ children }) => {
  // Estado com tipos explícitos
  const [transactions, setTransactions] = useState<Transaction[]>(() => {
    const saved = safeGetLocalStorage<Transaction[]>('transactions');
    return saved || [];
  });

  const [cards, setCards] = useState<Card[]>(() => {
    const saved = safeGetLocalStorage<Card[]>('cards');
    return saved || [];
  });

  const [goals, setGoals] = useState<Goal[]>(() => {
    const saved = safeGetLocalStorage<Goal[]>('goals');
    return saved || [];
  });

  const [userName, setUserName] = useState<string>(() => {
    return safeGetLocalStorage<string>('userName') || 'Usuário';
  });

  const [currentDate, setCurrentDate] = useState<Date>(new Date());
  const [theme, setTheme] = useState<'light' | 'dark'>(() => {
    return (safeGetLocalStorage<'light' | 'dark'>('theme') || 'dark') as 'light' | 'dark';
  });

  const [isPrivacyMode, setIsPrivacyMode] = useState<boolean>(() => {
    return safeGetLocalStorage<boolean>('isPrivacyMode') || false;
  });

  // Callbacks com tipos
  const addTransaction = useCallback((transaction: Transaction): void => {
    setTransactions(prev => [...prev, transaction]);
  }, []);

  const deleteTransaction = useCallback((id: string): void => {
    setTransactions(prev => prev.filter(tx => tx.id !== id));
  }, []);

  const updateTransaction = useCallback(
    (id: string, updates: Partial<Transaction>): void => {
      setTransactions(prev =>
        prev.map(tx => (tx.id === id ? { ...tx, ...updates } : tx))
      );
    },
    []
  );

  // Computed values com tipos
  const monthlyTransactions = useMemo((): Transaction[] => {
    const month = currentDate.getMonth();
    const year = currentDate.getFullYear();
    
    return transactions.filter(tx => {
      const txDate = new Date(tx.date);
      return txDate.getMonth() === month && txDate.getFullYear() === year;
    });
  }, [transactions, currentDate]);

  const financialData = useMemo((): FinancialData => {
    let balance = 0;
    let income = 0;
    let expenses = 0;
    let payable = 0;

    monthlyTransactions.forEach(tx => {
      if (tx.type === 'income') {
        income += tx.amount;
        balance += tx.amount;
      } else {
        expenses += tx.amount;
        balance -= tx.amount;
        if (tx.status === 'pending') {
          payable += tx.amount;
        }
      }
    });

    return {
      balance,
      income,
      expenses,
      payable,
      projectedBalance: balance,
      categoryData: [],
      cardInvoices: {},
    };
  }, [monthlyTransactions]);

  // Effects para persistência
  useEffect(() => {
    safeSetLocalStorage('transactions', transactions);
  }, [transactions]);

  useEffect(() => {
    safeSetLocalStorage('userName', userName);
  }, [userName]);

  useEffect(() => {
    safeSetLocalStorage('theme', theme);
  }, [theme]);

  // Value com tipo explícito
  const value: AppContextType = {
    // Estado
    transactions,
    cards,
    goals,
    userName,
    currentDate,
    theme,
    isPrivacyMode,
    monthlyTransactions,
    financialData,

    // Ações para transações
    addTransaction,
    deleteTransaction,
    updateTransaction,
    deleteAllTransactions: () => setTransactions([]),

    // Ações para cartões
    addCard: (card: Card) => setCards(prev => [...prev, card]),
    deleteCard: (id: string) => setCards(prev => prev.filter(c => c.id !== id)),
    updateCard: (id: string, updates: Partial<Card>) =>
      setCards(prev => prev.map(c => (c.id === id ? { ...c, ...updates } : c))),

    // Ações para metas
    addGoal: (goal: Goal) => setGoals(prev => [...prev, goal]),
    deleteGoal: (id: string) => setGoals(prev => prev.filter(g => g.id !== id)),
    updateGoal: (id: string, updates: Partial<Goal>) =>
      setGoals(prev => prev.map(g => (g.id === id ? { ...g, ...updates } : g))),

    // Ações de usuário
    setUserName,
    setTheme: (newTheme: 'light' | 'dark') => setTheme(newTheme),
    setIsPrivacyMode,
  };

  return (
    <AppContext.Provider value={value}>
      {children}
    </AppContext.Provider>
  );
};
```

#### ✅ Teste
```bash
npm run type-check  # Verificar erros de tipo
npm run dev         # Deve compilar sem erros
```

---

### Arquivo: Criar `src/hooks/useApp.ts`

```typescript
// src/hooks/useApp.ts
import { useContext } from 'react';
import type { AppContextType } from '@/types';
import { AppContext } from '@/context/AppContext';

export const useApp = (): AppContextType => {
  const context = useContext(AppContext);
  
  if (!context) {
    throw new Error('useApp deve ser usado dentro de AppProvider');
  }
  
  return context;
};
```

#### 🔧 Benefício
```typescript
// ✅ Antes: sem type-checking
const app = useContext(AppContext);
app.addTransaction({});  // ❌ Sem validação

// ✅ Depois: type-safe
const { addTransaction } = useApp();
addTransaction({
  // ❌ TypeScript reclama: faltam campos obrigatórios
  // ✅ IDE mostra quais campos são obrigatórios
});
```

---

## 🎯 Fase 4: Componentes

### Arquivo: `src/components/UnifiedTransactionForm.jsx` → `UnifiedTransactionForm.tsx`

#### Antes: Sem tipos
```jsx
// ❌ Sem tipos - difícil de debugar
export function UnifiedTransactionForm({ 
  onClose, 
  onSave, 
  categories, 
  cards, 
  isDesktop, 
  initialData 
}) {
  const [formData, setFormData] = useState({});
  
  return (
    // JSX
  );
}
```

#### Depois: Com tipos
```typescript
// ✅ Com tipos - IDE sabe tudo
import React, { useState, useCallback } from 'react';
import type { 
  UnifiedTransactionFormProps,
  Transaction,
  Category,
  Card,
} from '@/types';
import { useApp } from '@/hooks/useApp';

export const UnifiedTransactionForm: React.FC<UnifiedTransactionFormProps> = ({
  onClose,
  onSave,
  categories,
  cards,
  isDesktop = false,
  initialData,
}) => {
  // Tipos são inferidos automaticamente
  const [formData, setFormData] = useState<Partial<Transaction>>(
    initialData || {}
  );
  const [errors, setErrors] = useState<Record<string, string>>({});

  const handleChange = useCallback(
    <K extends keyof Transaction>(
      field: K, 
      value: Transaction[K]
    ) => {
      setFormData(prev => ({
        ...prev,
        [field]: value,
      }));
    },
    []
  );

  const handleSubmit = useCallback(async () => {
    // Validar...
    const transaction: Transaction = {
      id: `tx_${Date.now()}`,
      amount: formData.amount || 0,
      type: formData.type || 'expense',
      status: formData.status || 'paid',
      description: formData.description || '',
      categoryLabel: formData.categoryLabel || '',
      categoryIcon: formData.categoryIcon || '',
      date: formData.date || new Date().toISOString(),
      cardId: formData.cardId,
      installment: formData.installment,
      recurring: formData.recurring,
    };

    onSave(transaction);
  }, [formData, onSave]);

  return (
    <div>
      {/* Formulário */}
    </div>
  );
};
```

#### 🔧 Benefícios
- ✅ IDE auto-completa props
- ✅ Erros de tipo detectados antes de runtime
- ✅ Refatorações seguras
- ✅ Documentação inline

---

## 🎯 Fase 5: Layouts e App.jsx

### Arquivo: `src/App.jsx` → `App.tsx`

#### Antes
```jsx
// ❌ Sem tipos
function App() {
  const [isDesktop, setIsDesktop] = useState(false);
  
  useEffect(() => {
    setIsDesktop(window.innerWidth >= 1024);
  }, []);
  
  return (
    <AppProvider>
      {isDesktop ? <DesktopLayout /> : <MobileLayout />}
    </AppProvider>
  );
}
```

#### Depois
```typescript
// ✅ Com tipos
import React from 'react';
import { AppProvider } from '@/context/AppContext';
import DesktopLayout from '@/layouts/DesktopLayout';
import MobileLayout from '@/layouts/MobileLayout';

const App: React.FC = () => {
  const [isDesktop, setIsDesktop] = React.useState<boolean>(false);
  
  React.useEffect(() => {
    const handleResize = (): void => {
      setIsDesktop(window.innerWidth >= 1024);
    };
    
    handleResize();
    window.addEventListener('resize', handleResize);
    
    return () => window.removeEventListener('resize', handleResize);
  }, []);
  
  return (
    <AppProvider>
      {isDesktop ? <DesktopLayout /> : <MobileLayout />}
    </AppProvider>
  );
};

export default App;
```

---

## 📋 Checklist de Migração Completa

### Para cada arquivo migrado:

- [ ] Arquivo renomeado para `.ts` ou `.tsx`
- [ ] `import type` adicionado onde apropriado
- [ ] Parâmetros de função têm tipos
- [ ] Retornos de função têm tipos (ou são inferidos)
- [ ] Estados React têm tipos genéricos: `useState<Type>()`
- [ ] Callbacks têm tipos: `useCallback<(arg: Type) => void>`
- [ ] Componentes do React têm tipo: `React.FC<Props>`
- [ ] Nenhum `any` (a menos que absolutamente necessário)
- [ ] `tsconfig.json` completa
- [ ] `npm run type-check` passa sem erros
- [ ] Aplicação funciona (F5 para reload)

---

## 🆘 Troubleshooting

### Erro: "Cannot find module '@/types'"

**Solução**: Verifique `tsconfig.json` tem `"baseUrl": "."` e path alias:
```json
{
  "compilerOptions": {
    "baseUrl": ".",
    "paths": {
      "@/*": ["src/*"]
    }
  }
}
```

### Erro: "Type 'any' implicitly"

**Solução**: Adicione tipo explícito:
```typescript
// ❌ Ruim
const items = [];

// ✅ Bom
const items: Transaction[] = [];
```

### Erro: "Property does not exist on type"

**Solução**: Verifique que a propriedade existe no tipo ou ajuste o tipo

---

## ✅ Progresso Esperado

| Fase | Tempo | Status |
|------|-------|--------|
| 1. Configuração | 15 min | ✅ Completo |
| 2. Utilitários | 1 hora | ⏳ Próximo |
| 3. Contextos | 1,5 horas | ⏳ Próximo |
| 4. Componentes | 2 horas | ⏳ Depois |
| 5. Layouts | 1 hora | ⏳ Depois |
| **Total** | **5-6 horas** | **EM PROGRESSO** |

---

## 🚀 Próxima Etapa

Quando estiver pronto, execute:

```bash
# Migrar utilitários
mv src/utils/financial.js src/utils/financial.ts
mv src/constants/banks.js src/constants/banks.ts

# Migrar contextos
mv src/context/AppContext.jsx src/context/AppContext.ts

# Verificar erros
npm run type-check

# Testar
npm run dev
```

---

Boa migração! 🎉
