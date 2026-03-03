/**
 * Utilitários para formatação e validação de dados financeiros
 */

export const formatCurrency = (value, isPrivacyMode = false) => {
  if (isPrivacyMode) return '****';
  return new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL'
  }).format(value);
};

export const parseAmount = (value) => {
  if (typeof value === 'number') return value;
  const normalized = String(value).replace(/\./g, '').replace(',', '.').trim();
  return parseFloat(normalized) || 0;
};

export const formatAmount = (value) => {
  const num = parseAmount(value);
  return num.toFixed(2).replace('.', ',');
};

export const validateTransaction = (transaction) => {
  const errors = [];
  
  if (!transaction.amount || parseAmount(transaction.amount) <= 0) {
    errors.push('Valor deve ser maior que 0');
  }
  
  if (!transaction.categoryLabel) {
    errors.push('Categoria é obrigatória');
  }
  
  if (!transaction.date) {
    errors.push('Data é obrigatória');
  }
  
  if (!['income', 'expense'].includes(transaction.type)) {
    errors.push('Tipo de transação inválido');
  }
  
  if (!['paid', 'pending'].includes(transaction.status)) {
    errors.push('Status de transação inválido');
  }

  return {
    isValid: errors.length === 0,
    errors
  };
};

export const validateCard = (card) => {
  const errors = [];
  
  if (!card.bankName || card.bankName.trim().length === 0) {
    errors.push('Nome do banco é obrigatório');
  }
  
  if (!card.dueDay || parseInt(card.dueDay) < 1 || parseInt(card.dueDay) > 31) {
    errors.push('Dia de fechamento inválido (1-31)');
  }

  return {
    isValid: errors.length === 0,
    errors
  };
};

export const validateGoal = (goal) => {
  const errors = [];
  
  if (!goal.name || goal.name.trim().length === 0) {
    errors.push('Nome da meta é obrigatório');
  }
  
  if (!goal.target || parseAmount(goal.target) <= 0) {
    errors.push('Valor alvo deve ser maior que 0');
  }

  return {
    isValid: errors.length === 0,
    errors
  };
};

// Funções para backup e restore
export const generateBackup = (data) => {
  return {
    transactions: data.transactions || [],
    cards: data.cards || [],
    goals: data.goals || [],
    version: '2.0',
    exportDate: new Date().toISOString()
  };
};

export const validateBackup = (data) => {
  return (
    data &&
    typeof data === 'object' &&
    Array.isArray(data.transactions) &&
    Array.isArray(data.cards) &&
    data.exportDate
  );
};

// Funções para cálculos financeiros
export const calculateHealthScore = (income, expenses) => {
  if (income <= 0) return 0;
  return Math.min(100, Math.round(((income - expenses) / income) * 100));
};

export const calculateSavingsRate = (income, expenses) => {
  if (income <= 0) return 0;
  return Math.round(((income - expenses) / income) * 100);
};

export const groupTransactionsByCategory = (transactions) => {
  const grouped = {};
  transactions.forEach(t => {
    if (!grouped[t.categoryLabel]) {
      grouped[t.categoryLabel] = {
        label: t.categoryLabel,
        icon: t.categoryIcon,
        total: 0,
        count: 0,
        transactions: []
      };
    }
    grouped[t.categoryLabel].total += parseAmount(t.amount);
    grouped[t.categoryLabel].count += 1;
    grouped[t.categoryLabel].transactions.push(t);
  });
  return Object.values(grouped).sort((a, b) => b.total - a.total);
};

export const groupTransactionsByDate = (transactions) => {
  const grouped = {};
  transactions.forEach(t => {
    const date = t.date.split('T')[0];
    if (!grouped[date]) {
      grouped[date] = [];
    }
    grouped[date].push(t);
  });
  return grouped;
};

// Cache de localStorage com validação
export const safeGetLocalStorage = (key, defaultValue = null) => {
  try {
    const item = localStorage.getItem(key);
    return item ? JSON.parse(item) : defaultValue;
  } catch (e) {
    console.error('Erro ao recuperar do localStorage:', e);
    return defaultValue;
  }
};

export const safeSetLocalStorage = (key, value) => {
  try {
    localStorage.setItem(key, JSON.stringify(value));
  } catch (e) {
    console.error('Erro ao salvar no localStorage:', e);
  }
};

// Encriptação básica (não é segura para dados sensíveis, apenas ofusca)
export const simpleEncrypt = (text) => {
  return btoa(text);
};

export const simpleDecrypt = (encoded) => {
  try {
    return atob(encoded);
  } catch (e) {
    return '';
  }
};
