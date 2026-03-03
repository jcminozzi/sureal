# 🚀 Guia de Otimização e Manutenibilidade

## Performance

### 1. **Memoização de Componentes**

```jsx
// Antes (re-renderiza sempre)
export function TransactionItem({ transaction, onDelete }) {
  return <div>{transaction.description}</div>;
}

// Depois (re-renderiza apenas quando props mudam)
export const TransactionItem = React.memo(function TransactionItem({ 
  transaction, 
  onDelete 
}) {
  return <div>{transaction.description}</div>;
});
```

### 2. **useMemo para Cálculos Pesados**

```jsx
// Antes (recalcula sempre)
const total = transactions.reduce((sum, t) => sum + t.amount, 0);

// Depois (recalcula apenas quando transactions muda)
const total = useMemo(() => {
  return transactions.reduce((sum, t) => sum + t.amount, 0);
}, [transactions]);
```

### 3. **useCallback para Funções**

```jsx
// Antes (novo objeto de função a cada render)
<button onClick={() => deleteItem(id)}>Deletar</button>

// Depois (mesma função)
const handleDelete = useCallback((itemId) => {
  deleteItem(itemId);
}, []);

<button onClick={() => handleDelete(id)}>Deletar</button>
```

### 4. **Code Splitting com Lazy Loading**

```jsx
// Importação normal (carrega sempre)
import ReportsModal from './ReportsModal';

// Lazy loading (carrega sob demanda)
const ReportsModal = lazy(() => import('./ReportsModal'));

// Usar com Suspense
<Suspense fallback={<div>Carregando...</div>}>
  <ReportsModal />
</Suspense>
```

### 5. **Virtual Scrolling para Listas Grandes**

```jsx
// Use react-window para listas com 1000+ itens
import { FixedSizeList } from 'react-window';

const Row = ({ index, style }) => (
  <div style={style}>
    {transactions[index].description}
  </div>
);

<FixedSizeList
  height={600}
  itemCount={transactions.length}
  itemSize={35}
>
  {Row}
</FixedSizeList>
```

## Manutenibilidade

### 1. **Estrutura de Pastas Clara**

```
src/
├── components/
│   ├── common/           # Componentes reutilizáveis
│   ├── forms/            # Formulários
│   ├── modals/           # Modais
│   └── layouts/          # Layouts
├── hooks/
│   ├── useApp.js
│   ├── useFinancial.js
│   └── ...
├── utils/
│   ├── financial.js
│   ├── validation.js
│   └── ...
├── types/ (future TypeScript)
│   └── index.ts
└── constants/
    └── ...
```

### 2. **Testes Unitários**

```javascript
// utils/financial.test.js
import { calculateHealthScore } from './financial';

describe('calculateHealthScore', () => {
  it('deve retornar percentual correto', () => {
    expect(calculateHealthScore(1000, 500)).toBe(50);
  });

  it('deve retornar 0 para renda 0', () => {
    expect(calculateHealthScore(0, 100)).toBe(0);
  });

  it('deve retornar máximo 100', () => {
    expect(calculateHealthScore(100, 0)).toBe(100);
  });
});
```

### 3. **Tratamento de Erros Consistente**

```jsx
// Antes (sem tratamento)
const getTransactions = async () => {
  const data = await fetch('/api/transactions');
  return data.json();
};

// Depois (com tratamento)
const getTransactions = async () => {
  try {
    const response = await fetch('/api/transactions');
    if (!response.ok) {
      throw new Error(`Erro: ${response.statusText}`);
    }
    return await response.json();
  } catch (error) {
    console.error('Erro ao buscar transações:', error);
    throw error;
  }
};
```

### 4. **Logging Estruturado**

```javascript
// utils/logger.js
export const logger = {
  info: (message, data) => {
    if (process.env.NODE_ENV === 'development') {
      console.log(`[INFO] ${message}`, data);
    }
  },
  
  warn: (message, data) => {
    console.warn(`[WARN] ${message}`, data);
  },
  
  error: (message, error) => {
    console.error(`[ERROR] ${message}`, error);
  }
};
```

### 5. **Documentação com JSDoc**

```javascript
/**
 * Calcula a saúde financeira do usuário
 * @param {number} income - Renda total do mês
 * @param {number} expenses - Despesas totais do mês
 * @returns {number} Percentual de saúde (0-100)
 * 
 * @example
 * const health = calculateHealthScore(5000, 3000);
 * console.log(health); // 40
 */
export function calculateHealthScore(income, expenses) {
  if (income <= 0) return 0;
  return Math.min(100, Math.round(((income - expenses) / income) * 100));
}
```

## Segurança

### 1. **Validação de Input**

```jsx
function handleAddTransaction(data) {
  // Validar
  const validation = validateTransaction(data);
  if (!validation.isValid) {
    setErrors(validation.errors);
    return;
  }

  // Processar
  addTransaction(data);
}
```

### 2. **Proteção contra XSS**

```jsx
// Ruim (vulnerável a XSS)
<div dangerHTML={{ __html: userInput }} />

// Bom (seguro)
<div>{userInput}</div>

// Se realmente precisar de HTML
import DOMPurify from 'dompurify';
<div dangerouslySetInnerHTML={{ 
  __html: DOMPurify.sanitize(userInput) 
}} />
```

### 3. **Proteção contra CSRF**

```javascript
// Adicionar token CSRF ao fazer requisições
const headers = {
  'Content-Type': 'application/json',
  'X-CSRF-Token': getCsrfToken()
};

fetch('/api/transactions', {
  method: 'POST',
  headers,
  body: JSON.stringify(data)
});
```

## Monitoramento

### 1. **Performance Monitoring**

```javascript
// Usar Web Vitals
import { getCLS, getFID, getFCP, getLCP, getTTFB } from 'web-vitals';

getCLS(console.log); // Cumulative Layout Shift
getFID(console.log); // First Input Delay
getFCP(console.log); // First Contentful Paint
getLCP(console.log); // Largest Contentful Paint
getTTFB(console.log); // Time to First Byte
```

### 2. **Error Tracking**

```javascript
// Usar serviço como Sentry
import * as Sentry from "@sentry/react";

Sentry.init({
  dsn: "https://key@sentry.io/project",
  environment: process.env.NODE_ENV
});

// Capturar erros
try {
  riskyOperation();
} catch (error) {
  Sentry.captureException(error);
}
```

### 3. **Analytics**

```javascript
// Rastrear eventos
export function trackEvent(eventName, data) {
  if (window.gtag) {
    window.gtag('event', eventName, data);
  }
}

// Usar em componentes
trackEvent('transaction_added', {
  amount: 150,
  category: 'food'
});
```

## Bundle Size

### 1. **Analisar Bundle**

```bash
npm install -D webpack-bundle-analyzer

# Na configuração do Vite
import { visualizer } from 'rollup-plugin-visualizer';

export default {
  plugins: [
    visualizer()
  ]
}
```

### 2. **Tree Shaking**

```javascript
// Ruim (importa tudo)
import * as utils from './utils';

// Bom (importa apenas o necessário)
import { calculateHealthScore } from './utils/financial';
```

### 3. **Comprimir Build**

```javascript
// vite.config.js
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import compression from 'vite-plugin-compression';

export default defineConfig({
  plugins: [
    react(),
    compression({
      algorithm: 'brotli',
      ext: '.br'
    })
  ]
});
```

## Escalabilidade

### 1. **Preparar para Backend**

```javascript
// Criar camada de API
export const api = {
  transactions: {
    getAll: () => fetch('/api/transactions').then(r => r.json()),
    create: (data) => fetch('/api/transactions', {
      method: 'POST',
      body: JSON.stringify(data)
    }).then(r => r.json()),
    delete: (id) => fetch(`/api/transactions/${id}`, {
      method: 'DELETE'
    })
  }
};

// Usar em componentes
const transactions = await api.transactions.getAll();
```

### 2. **Preparar para Base de Dados**

```javascript
// Schema de banco de dados
const TransactionSchema = {
  id: 'UUID',
  userId: 'UUID FK',
  amount: 'DECIMAL(12,2)',
  type: 'ENUM(income, expense)',
  categoryLabel: 'VARCHAR(50)',
  date: 'TIMESTAMP',
  status: 'ENUM(paid, pending)',
  description: 'TEXT',
  cardId: 'UUID FK',
  recurring: 'BOOLEAN',
  createdAt: 'TIMESTAMP',
  updatedAt: 'TIMESTAMP'
};
```

## Checklist de Deploy

- [ ] Build otimizado (`npm run build`)
- [ ] Testes passando (`npm run test`)
- [ ] Sem console.log em produção
- [ ] Sem erros de ESLint
- [ ] PWA manifest correto
- [ ] Service worker funcional
- [ ] HTTPS ativado
- [ ] Compressão gzip/brotli
- [ ] Cache headers corretos
- [ ] Backup funcionando
- [ ] Monitoramento ativo
- [ ] Documentação atualizada

## Recursos Úteis

- 🎯 [Web Vitals](https://web.dev/vitals/)
- 🔍 [Lighthouse CI](https://github.com/GoogleChrome/lighthouse-ci)
- 🐛 [Sentry](https://sentry.io/)
- 📊 [Datadog](https://www.datadoghq.com/)
- 🧪 [Jest Documentation](https://jestjs.io/)
- ⚡ [Vite Guide](https://vitejs.dev/)

---

**Dica:** Sempre mensure antes de otimizar. Use ferramentas de profiling para identificar gargalos reais.
