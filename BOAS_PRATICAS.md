# 📋 Guia de Boas Práticas - Meus Gastinhos

## Padrões de Código

### 1. **Componentes**

✅ **Bom:**
```jsx
export function TransactionItem({ transaction, onDelete }) {
  const { formatMoney } = useMoney();
  
  return (
    <div className="...">
      {/* conteúdo */}
    </div>
  );
}
```

❌ **Ruim:**
```jsx
export default function TransactionItem(props) {
  return (
    <div>
      {/* conteúdo inline */}
    </div>
  );
}
```

### 2. **Hooks**

✅ **Bom:**
```jsx
const { transactions, addTransaction } = useApp();

useEffect(() => {
  // efeito com dependências explícitas
}, [transactions]);
```

❌ **Ruim:**
```jsx
useEffect(() => {
  // sem dependências ou dependências incorretas
});
```

### 3. **Estado**

✅ **Bom:**
```jsx
// Use Context para estado global
const { transactions, setTransactions } = useApp();

// Use useState apenas para estado local
const [isOpen, setIsOpen] = useState(false);
```

❌ **Ruim:**
```jsx
// Props drilling excessivo
<Component prop1={x} prop2={y} prop3={z} ... />
```

### 4. **Validação**

✅ **Bom:**
```jsx
import { validateTransaction } from '../utils/financial';

const handleSubmit = (data) => {
  const { isValid, errors } = validateTransaction(data);
  if (!isValid) {
    setErrors(errors);
    return;
  }
  // salvar
};
```

❌ **Ruim:**
```jsx
const handleSubmit = (data) => {
  if (!data.amount) return;
  // sem validação adequada
};
```

## Estrutura de Pastas

```
src/
├── components/     (Componentes React)
├── context/        (Context API)
├── hooks/          (Hooks customizados)
├── layouts/        (Layouts principais)
├── utils/          (Funções utilitárias)
├── constants/      (Constantes)
└── App.jsx         (Entrada)
```

## Convenções de Nomenclatura

### Componentes
- **PascalCase**: `TransactionForm`, `SmartTips`
- **Arquivos**: `TransactionForm.jsx`

### Funções e Variáveis
- **camelCase**: `formatMoney`, `calculateTotal`
- **Arquivos**: `financial.js`, `utils.js`

### Constantes
- **UPPER_SNAKE_CASE**: `MAX_TRANSACTIONS`, `DEFAULT_LIMIT`

### Types de Dados
```javascript
// Transaction
{
  id: string,
  amount: number,
  type: 'income' | 'expense',
  category: string,
  date: ISO8601,
  status: 'paid' | 'pending',
  description: string
}

// Card
{
  id: string,
  bankName: string,
  dueDay: number,
  gradient: string
}

// Goal
{
  id: string,
  name: string,
  target: number,
  current: number,
  emoji: string
}
```

## Performance

### 1. **Memoização**
```jsx
const categoryData = useMemo(() => {
  return expensiveCalculation();
}, [dependencies]);
```

### 2. **useCallback**
```jsx
const handleDelete = useCallback((id) => {
  setTransactions(prev => prev.filter(t => t.id !== id));
}, []);
```

### 3. **Lazy Loading**
```jsx
const ReportsModal = lazy(() => import('./ReportsModal'));

<Suspense fallback={<LoadingSpinner />}>
  <ReportsModal />
</Suspense>
```

## Acessibilidade

```jsx
// Use labels gerenciados
<label htmlFor="amount">Valor</label>
<input id="amount" type="number" />

// Use ARIA quando necessário
<div role="alert" aria-label="Erro de validação">
  Valor inválido
</div>

// Use title para tooltips
<button title="Deletar transação">✕</button>
```

## Testes

```javascript
// Exemplo de teste
import { calculateHealthScore } from '../utils/financial';

describe('calculateHealthScore', () => {
  it('deve retornar 0 para renda 0', () => {
    expect(calculateHealthScore(0, 100)).toBe(0);
  });

  it('deve retornar 50 para renda = despesa', () => {
    expect(calculateHealthScore(100, 50)).toBe(50);
  });
});
```

## Commits

Padrão Conventional Commits:

```
feat: adiciona validação de transações
fix: corrige cálculo de saldo mensal
refactor: extrai component reutilizável
docs: atualiza README
perf: otimiza re-renders do dashboard
test: adiciona testes para financial utils
```

## Variáveis de Ambiente

```env
# .env.local (não commitar)
VITE_API_URL=http://localhost:3000
VITE_APP_VERSION=2.0.0
```

## Debugging

```javascript
// Use console com cuidado (será alertado pelo ESLint)
console.warn('Algo pode estar errado');
console.error('Um erro ocorreu');

// Remova em produção
if (process.env.NODE_ENV === 'development') {
  console.log('Debug info');
}
```

## Anti-Patterns

❌ **Evite:**

1. Props drilling excessivo
```jsx
// Não faça isso:
<A a={x} b={x} c={x}>
  <B a={x} b={x} c={x}>
    <C a={x} b={x} c={x} />
  </B>
</A>
```

2. Criar novo objeto em renderização
```jsx
// Ruim
<Component style={{ color: 'red' }} />

// Bom
const STYLES = { color: 'red' };
<Component style={STYLES} />
```

3. Arrow functions inline em listas
```jsx
// Ruim
{items.map(item => <Item onDelete={() => delete(item.id)} />)}

// Bom
const handleDelete = useCallback((id) => delete(id), []);
{items.map(item => <Item key={item.id} onDelete={() => handleDelete(item.id)} />)}
```

4. SetState direto sem verificação
```jsx
// Ruim
const data = state;
data.value = 10;
setState(data);

// Bom
setState(prev => ({ ...prev, value: 10 }));
```

## Checklist de PR

- [ ] Código segue padrões da equipe
- [ ] Validação implementada
- [ ] Sem console.log em produção
- [ ] Mobile responsive testado
- [ ] Acessibilidade verificada
- [ ] Performance aceitável
- [ ] Testes implementados
- [ ] Não há código duplicado
- [ ] Documentação atualizada

---

**Dúvidas?** Consulte o arquivo `MELHORIAS.md`
