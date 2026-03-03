# ⚡ TYPESCRIPT: QUICK START (5 minutos)

## 🎯 Em 5 Minutos

### 1️⃣ Entenda o Básico (1 min)

```typescript
// ✅ TypeScript = JavaScript + Tipos
const mensagem: string = 'Olá';      // ✅ Correto
const mensagem: number = 'Olá';      // ❌ Erro: esperava número

// ✅ Tipos Union (múltiplas opções)
type Tipo = 'income' | 'expense';
const tipo: Tipo = 'income';         // ✅
const tipo: Tipo = 'gasto';          // ❌ Erro

// ✅ Interfaces (estruturas de dados)
interface Transaction {
  id: string;
  amount: number;
  type: 'income' | 'expense';
}
```

### 2️⃣ Use Types em seu Código (2 min)

```typescript
// ✅ Em Componentes React
import type { FC } from 'react';
import type { Transaction } from '@/types';

interface MyComponentProps {
  transaction: Transaction;
  onDelete: (id: string) => void;
}

const MyComponent: FC<MyComponentProps> = ({ transaction, onDelete }) => {
  return (
    <div onClick={() => onDelete(transaction.id)}>
      {transaction.description}: R$ {transaction.amount}
    </div>
  );
};

// ✅ Em Hooks
import { useApp } from '@/hooks/useApp';

function MyHook() {
  const { transactions, addTransaction } = useApp();
  // transactions: automaticamente tipo Transaction[]
  // addTransaction: automaticamente tipo (tx: Transaction) => void
  
  return { transactions, addTransaction };
}

// ✅ Em Funções
import { validateTransaction } from '@/utils/financial';
import type { ValidationResult } from '@/types';

const validate = (tx: Partial<Transaction>): ValidationResult => {
  return validateTransaction(tx);
};
```

### 3️⃣ Teste TypeScript (1 min)

```bash
# Verificar erros
npm run type-check

# Ver erros no editor
# → Extensions recomendadas:
#   - "TypeScript Vue Plugin (Volar)"
#   - "TypeScript Next"

# Compilar
npm run build
```

### 4️⃣ Veja IDE Magic (1 min)

```typescript
// Posicione seu cursor após "useApp()" e pressione Ctrl+Space
const { 
  // IDE mostra TODAS as opções:
  // - transactions: Transaction[]
  // - cards: Card[]
  // - goals: Goal[]
  // - addTransaction: (tx: Transaction) => void
  // - deleteTransaction: (id: string) => void
  // - setTheme: (theme: 'light' | 'dark') => void
  // etc...
} = useApp();

// ✅ Refatorar é seguro
// Se o tipo muda, TypeScript avisa automaticamente

// ✅ Erro é detectado antes de executar
const tx: Transaction = {
  // ❌ TypeScript avisa quais campos faltam
  amount: 100,
};
```

---

## 🚀 Começar Agora

### Opção 1: Use Types em Nova File (Recomendado)

```bash
# Criar novo arquivo .ts
touch src/components/MyComponent.tsx

# Copiar template:
cat > src/components/MyComponent.tsx << 'EOF'
import React, { FC } from 'react';
import type { Transaction } from '@/types';

interface MyComponentProps {
  transaction: Transaction;
}

const MyComponent: FC<MyComponentProps> = ({ transaction }) => {
  return <div>{transaction.description}</div>;
};

export default MyComponent;
EOF
```

### Opção 2: Migrar File Existente (Gradual)

```bash
# 1. Renomear
mv src/utils/myfile.js src/utils/myfile.ts

# 2. Adicionar tipos
# Antes:
#   export function myFunc(data) { ... }
# Depois:
#   import type { Transaction } from '@/types';
#   export function myFunc(data: Transaction): void { ... }

# 3. Testar
npm run type-check
```

---

## 📋 Tipos Mais Usados

### Dados

```typescript
import type { 
  Transaction,    // Transação
  Card,          // Cartão de banco
  Goal,          // Meta
  FinancialData, // Dados financeiros (balance, income, etc)
} from '@/types';
```

### Contexto

```typescript
import { useApp } from '@/hooks/useApp';     // Acesso ao estado global
import { useTheme } from '@/context/ThemeContext'; // Tema
```

### Analytics

```typescript
import { useFinancialAnalytics } from '@/hooks/useFinancialAnalytics';
// Retorna: { analytics, trends, categories, budget, insights }
```

### Validação

```typescript
import { validateTransaction } from '@/utils/financial';
const result: ValidationResult = validateTransaction(data);
```

### Componentes

```typescript
import type { 
  StatCardProps,
  AlertProps,
  ButtonProps,
  FormInputProps,
} from '@/types/components';
```

---

## ❓ FAQ Rápido

**P: Preciso renomear tudo para .ts agora?**  
R: Não! Pode fazer gradualmente. JavaScript e TypeScript convivem.

**P: Como debugar type errors?**  
R: Execute `npm run type-check` e veja os erros.

**P: O app fica mais lento?**  
R: Não! Types são removidos durante a build. Zero impacto runtime.

**P: Posso usar types de libraries externas?**  
R: Sim! Ex: `import type { FC } from 'react'`

**P: E se não souber o tipo exato?**  
R: Use `any` temporariamente (mas evite). IDE pode inferir.

---

## 🎓 Próximos Passos

1. **Ler**: [TIPOS_TYPESCRIPT.md](./TIPOS_TYPESCRIPT.md) para tipos específicos
2. **Migrar**: [MIGRACAO_TYPESCRIPT.md](./MIGRACAO_TYPESCRIPT.md) para passo-a-passo
3. **Consultar**: [REFERENCIA_TIPOS.md](./REFERENCIA_TIPOS.md) para busca rápida

---

**Dúvidas?** Veja exemplos em [EXEMPLOS_USO.md](./EXEMPLOS_USO.md) ✨
