import React, { createContext, useState, useCallback, useMemo, useEffect } from 'react';
import { addMonths, subMonths, startOfMonth, endOfMonth, isWithinInterval, parseISO } from 'date-fns';

// Criar o contexto
export const AppContext = createContext();

export function AppProvider({ children }) {
  // ========== ESTADO GLOBAL ==========
  const [transactions, setTransactions] = useState(() => {
    const saved = localStorage.getItem('transactions');
    return saved ? JSON.parse(saved) : [];
  });

  const [cards, setCards] = useState(() => {
    const saved = localStorage.getItem('cards');
    return saved ? JSON.parse(saved) : [];
  });

  const [goals, setGoals] = useState(() => {
    const saved = localStorage.getItem('goals');
    return saved ? JSON.parse(saved) : [];
  });

  const [userName, setUserName] = useState(() => {
    return localStorage.getItem('user_name') || '';
  });

  const [currentDate, setCurrentDate] = useState(new Date());
  const [isDesktop, setIsDesktop] = useState(window.innerWidth >= 1280);
  const [theme, setTheme] = useState(() => localStorage.getItem('theme') || 'dark');
  const [isPrivacyMode, setIsPrivacyMode] = useState(() => {
    const saved = localStorage.getItem('privacy_mode');
    return saved ? JSON.parse(saved) : false;
  });

  // ========== PERSISTÊNCIA ==========
  useEffect(() => {
    localStorage.setItem('transactions', JSON.stringify(transactions));
  }, [transactions]);

  useEffect(() => {
    localStorage.setItem('cards', JSON.stringify(cards));
  }, [cards]);

  useEffect(() => {
    localStorage.setItem('goals', JSON.stringify(goals));
  }, [goals]);

  useEffect(() => {
    localStorage.setItem('user_name', userName);
  }, [userName]);

  useEffect(() => {
    localStorage.setItem('privacy_mode', JSON.stringify(isPrivacyMode));
  }, [isPrivacyMode]);

  // ========== LISTENER RESPONSIVO ==========
  useEffect(() => {
    const handleResize = () => setIsDesktop(window.innerWidth >= 1280);
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  // ========== AÇÕES DE NAVEGAÇÃO ==========
  const nextMonth = useCallback(() => {
    setCurrentDate(prev => addMonths(prev, 1));
  }, []);

  const prevMonth = useCallback(() => {
    setCurrentDate(prev => subMonths(prev, 1));
  }, []);

  const goToToday = useCallback(() => {
    setCurrentDate(new Date());
  }, []);

  // ========== AÇÕES DE CARTÃO ==========
  const addCard = useCallback((card) => {
    setCards(prev => [...prev, card]);
  }, []);

  const deleteCard = useCallback((id) => {
    setCards(prev => prev.filter(c => c.id !== id));
  }, []);

  const updateCard = useCallback((id, updates) => {
    setCards(prev => prev.map(c => c.id === id ? { ...c, ...updates } : c));
  }, []);

  // ========== AÇÕES DE TRANSAÇÃO ==========
  const addTransaction = useCallback((transaction) => {
    setTransactions(prev => [transaction, ...prev]);
  }, []);

  const deleteTransaction = useCallback((id) => {
    setTransactions(prev => prev.filter(t => t.id !== id));
  }, []);

  const updateTransaction = useCallback((id, updates) => {
    setTransactions(prev => prev.map(t => t.id === id ? { ...t, ...updates } : t));
  }, []);

  const deleteAllTransactions = useCallback(() => {
    setTransactions([]);
  }, []);

  // ========== AÇÕES DE META ==========
  const addGoal = useCallback((goal) => {
    setGoals(prev => [...prev, goal]);
  }, []);

  const deleteGoal = useCallback((id) => {
    setGoals(prev => prev.filter(g => g.id !== id));
  }, []);

  const updateGoal = useCallback((id, updates) => {
    setGoals(prev => prev.map(g => g.id === id ? { ...g, ...updates } : g));
  }, []);

  // ========== CÁLCULOS MEMOIZADOS ==========
  const monthlyTransactions = useMemo(() => {
    return transactions.filter(t => {
      const date = parseISO(t.date);
      return isWithinInterval(date, {
        start: startOfMonth(currentDate),
        end: endOfMonth(currentDate)
      });
    });
  }, [transactions, currentDate]);

  const financialData = useMemo(() => {
    let balance = 0;
    let income = 0;
    let expenses = 0;
    let payable = 0;
    const catMap = {};
    const cardMap = {};

    monthlyTransactions.forEach(t => {
      const amount = parseFloat(t.amount);
      if (t.type === 'income') {
        if (t.status === 'paid') {
          balance += amount;
          income += amount;
        }
      } else {
        if (!catMap[t.categoryLabel]) catMap[t.categoryLabel] = 0;
        catMap[t.categoryLabel] += amount;

        if (t.cardId) {
          if (!cardMap[t.cardId]) cardMap[t.cardId] = 0;
          cardMap[t.cardId] += amount;
        }

        if (t.status === 'paid') {
          balance -= amount;
          expenses += amount;
        } else {
          payable += amount;
        }
      }
    });

    const categoryData = Object.keys(catMap).map(key => {
      const catDef = require('../layouts/MobileLayout').CATEGORIES.find(c => c.label === key);
      return {
        name: key,
        value: catMap[key],
        color: catDef ? catDef.color : '#94a3b8'
      };
    }).filter(i => i.value > 0);

    return {
      balance,
      income,
      expenses,
      payable,
      projectedBalance: balance - payable,
      categoryData,
      cardInvoices: cardMap
    };
  }, [monthlyTransactions]);

  // ========== CONTEXTO ==========
  const value = useMemo(() => ({
    // Estado
    transactions,
    cards,
    goals,
    userName,
    currentDate,
    isDesktop,
    theme,
    isPrivacyMode,
    monthlyTransactions,
    financialData,

    // Ações de navegação
    nextMonth,
    prevMonth,
    goToToday,

    // Ações de cartão
    addCard,
    deleteCard,
    updateCard,

    // Ações de transação
    addTransaction,
    deleteTransaction,
    updateTransaction,
    deleteAllTransactions,

    // Ações de meta
    addGoal,
    deleteGoal,
    updateGoal,

    // Ações de usuário
    setUserName,
    setTheme,
    setIsPrivacyMode,
    setIsDesktop
  }), [
    transactions, cards, goals, userName, currentDate, isDesktop, theme, isPrivacyMode,
    monthlyTransactions, financialData, nextMonth, prevMonth, goToToday, addCard, deleteCard,
    updateCard, addTransaction, deleteTransaction, updateTransaction, deleteAllTransactions,
    addGoal, deleteGoal, updateGoal, setUserName, setTheme, setIsPrivacyMode, setIsDesktop
  ]);

  return (
    <AppContext.Provider value={value}>
      {children}
    </AppContext.Provider>
  );
}
