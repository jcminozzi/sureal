/**
 * 📊 DADOS DE EXEMPLO PARA TESTES
 * 
 * Use estes dados para popular a aplicação com informações de teste
 */

export const MOCK_TRANSACTIONS = [
  // Março 2026
  {
    id: "1",
    amount: 150.50,
    type: "expense",
    status: "paid",
    description: "Compras no supermercado",
    categoryLabel: "Mercado",
    categoryIcon: "🛒",
    date: "2026-03-01T10:30:00Z",
    recurring: false
  },
  {
    id: "2",
    amount: 50.00,
    type: "expense",
    status: "paid",
    description: "Almoço com amigos",
    categoryLabel: "Alimentação",
    categoryIcon: "🍽️",
    date: "2026-03-01T13:00:00Z",
    recurring: false
  },
  {
    id: "3",
    amount: 5000.00,
    type: "income",
    status: "paid",
    description: "Salário",
    categoryLabel: "Salário",
    categoryIcon: "💰",
    date: "2026-03-01T09:00:00Z",
    recurring: true
  },
  {
    id: "4",
    amount: 45.00,
    type: "expense",
    status: "paid",
    description: "Gasolina",
    categoryLabel: "Transporte",
    categoryIcon: "🚗",
    date: "2026-03-02T08:30:00Z",
    recurring: false
  },
  {
    id: "5",
    amount: 30.00,
    type: "expense",
    status: "pending",
    description: "Estacionamento",
    categoryLabel: "Transporte",
    categoryIcon: "🚗",
    date: "2026-03-02T17:00:00Z",
    cardId: "card_1",
    recurring: false
  },
  {
    id: "6",
    amount: 120.00,
    type: "expense",
    status: "pending",
    description: "Entrada de cinema",
    categoryLabel: "Lazer",
    categoryIcon: "🎉",
    date: "2026-03-02T19:30:00Z",
    cardId: "card_1",
    recurring: false
  },
  {
    id: "7",
    amount: 200.00,
    type: "expense",
    status: "paid",
    description: "Farmácia",
    categoryLabel: "Saúde",
    categoryIcon: "💊",
    date: "2026-03-03T14:00:00Z",
    recurring: false
  },
  {
    id: "8",
    amount: 89.90,
    type: "expense",
    status: "pending",
    description: "Netflix",
    categoryLabel: "Serviços",
    categoryIcon: "💡",
    date: "2026-03-03T11:00:00Z",
    cardId: "card_2",
    recurring: true,
    installment: null
  },
  {
    id: "9",
    amount: 300.00,
    type: "expense",
    status: "pending",
    description: "Livro - Clean Code",
    categoryLabel: "Educação",
    categoryIcon: "📚",
    date: "2026-03-04T16:30:00Z",
    cardId: "card_1",
    recurring: false
  },
  {
    id: "10",
    amount: 500.00,
    type: "expense",
    status: "pending",
    description: "Cursos online",
    categoryLabel: "Educação",
    categoryIcon: "📚",
    date: "2026-03-05T10:00:00Z",
    cardId: "card_1",
    recurring: true,
    installment: "2/3"
  },
  {
    id: "11",
    amount: 75.00,
    type: "expense",
    status: "paid",
    description: "Aluguel - Primeira parcela",
    categoryLabel: "Moradia",
    categoryIcon: "🏠",
    date: "2026-03-05T09:00:00Z",
    recurring: true
  }
];

export const MOCK_CARDS = [
  {
    id: "card_1",
    bankName: "Nubank",
    bankId: "nubank",
    dueDay: "15",
    gradient: "linear-gradient(135deg, #820ad1 0%, #400080 100%)",
    text: "white",
    color: "#820ad1"
  },
  {
    id: "card_2",
    bankName: "Inter",
    bankId: "inter",
    dueDay: "10",
    gradient: "linear-gradient(135deg, #ff7a00 0%, #ff5000 100%)",
    text: "white",
    color: "#ff7a00"
  },
  {
    id: "card_3",
    bankName: "Banco do Brasil",
    bankId: "bb",
    dueDay: "20",
    gradient: "linear-gradient(135deg, #1d4f91 0%, #173d73 100%)",
    text: "white",
    color: "#1d4f91"
  }
];

export const MOCK_GOALS = [
  {
    id: "goal_1",
    name: "PS5",
    target: 4000,
    current: 1500,
    emoji: "🎮"
  },
  {
    id: "goal_2",
    name: "Férias em Maldivas",
    target: 8000,
    current: 3200,
    emoji: "✈️"
  },
  {
    id: "goal_3",
    name: "Emergência (3 meses)",
    target: 15000,
    current: 12000,
    emoji: "🛡️"
  },
  {
    id: "goal_4",
    name: "Novo Laptop",
    target: 6000,
    current: 2000,
    emoji: "💻"
  },
  {
    id: "goal_5",
    name: "Carro Novo",
    target: 50000,
    current: 15000,
    emoji: "🚙"
  }
];

/**
 * Função para popular localStorage com dados de teste
 */
export function loadMockData() {
  localStorage.setItem('transactions', JSON.stringify(MOCK_TRANSACTIONS));
  localStorage.setItem('cards', JSON.stringify(MOCK_CARDS));
  localStorage.setItem('goals', JSON.stringify(MOCK_GOALS));
  localStorage.setItem('user_name', 'Usuário Teste');
  console.log('Dados de teste carregados com sucesso!');
}

/**
 * Função para limpar todos os dados
 */
export function clearAllData() {
  localStorage.clear();
  console.log('Todos os dados foram limpos!');
}

/**
 * Gerar transações aleatórias para teste
 */
export function generateRandomTransactions(count = 50) {
  const categories = [
    { label: 'Mercado', icon: '🛒' },
    { label: 'Alimentação', icon: '🍽️' },
    { label: 'Transporte', icon: '🚗' },
    { label: 'Lazer', icon: '🎉' },
    { label: 'Saúde', icon: '💊' },
    { label: 'Educação', icon: '📚' },
    { label: 'Serviços', icon: '💡' },
    { label: 'Moradia', icon: '🏠' }
  ];

  const transactions = [];
  const now = new Date();

  for (let i = 0; i < count; i++) {
    const date = new Date(now);
    date.setDate(date.getDate() - Math.floor(Math.random() * 90));

    const category = categories[Math.floor(Math.random() * categories.length)];
    const isIncome = Math.random() > 0.85;
    const amount = isIncome 
      ? Math.random() * 3000 + 1000
      : Math.random() * 500 + 10;

    transactions.push({
      id: `mock_${i}_${Date.now()}`,
      amount: Math.round(amount * 100) / 100,
      type: isIncome ? 'income' : 'expense',
      status: Math.random() > 0.2 ? 'paid' : 'pending',
      description: `Transação ${i + 1}`,
      categoryLabel: category.label,
      categoryIcon: category.icon,
      date: date.toISOString(),
      recurring: Math.random() > 0.9
    });
  }

  localStorage.setItem('transactions', JSON.stringify(transactions));
  console.log(`${count} transações aleatórias geradas!`);
  return transactions;
}

/**
 * Exportar dados atuais como JSON (para backup)
 */
export function exportCurrentData() {
  const transactions = JSON.parse(localStorage.getItem('transactions') || '[]');
  const cards = JSON.parse(localStorage.getItem('cards') || '[]');
  const goals = JSON.parse(localStorage.getItem('goals') || '[]');

  const data = {
    transactions,
    cards,
    goals,
    exportDate: new Date().toISOString(),
    version: '2.0.0'
  };

  const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `gastinhos_${new Date().toISOString().split('T')[0]}.json`;
  a.click();

  return data;
}

/**
 * Importar dados de um arquivo JSON
 */
export function importData(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const data = JSON.parse(event.target.result);
        if (data.transactions && data.cards) {
          localStorage.setItem('transactions', JSON.stringify(data.transactions));
          localStorage.setItem('cards', JSON.stringify(data.cards));
          if (data.goals) {
            localStorage.setItem('goals', JSON.stringify(data.goals));
          }
          resolve(data);
        } else {
          reject(new Error('Formato de arquivo inválido'));
        }
      } catch (err) {
        reject(err);
      }
    };
    reader.onerror = () => reject(new Error('Erro ao ler arquivo'));
    reader.readAsText(file);
  });
}

/**
 * Obter estatísticas dos dados
 */
export function getDataStats() {
  const transactions = JSON.parse(localStorage.getItem('transactions') || '[]');
  const cards = JSON.parse(localStorage.getItem('cards') || '[]');
  const goals = JSON.parse(localStorage.getItem('goals') || '[]');

  const income = transactions
    .filter(t => t.type === 'income')
    .reduce((sum, t) => sum + parseFloat(t.amount), 0);

  const expense = transactions
    .filter(t => t.type === 'expense')
    .reduce((sum, t) => sum + parseFloat(t.amount), 0);

  return {
    totalTransactions: transactions.length,
    totalCards: cards.length,
    totalGoals: goals.length,
    totalIncome: income,
    totalExpense: expense,
    balance: income - expense,
    averageTransaction: transactions.length > 0 
      ? (income + expense) / transactions.length 
      : 0
  };
}

console.log('Mock data utilities loaded. Use loadMockData() to populate test data.');
