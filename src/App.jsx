import React, { useState, useEffect, useMemo } from 'react';
import { MobileLayout, CATEGORIES } from './layouts/MobileLayout';
import { DesktopLayout } from './layouts/DesktopLayout';
import { addMonths, subMonths, startOfMonth, endOfMonth, isWithinInterval, parseISO } from 'date-fns';

const STORAGE_KEY = 'expense_tracker_data';
const CARDS_STORAGE_KEY = 'expense_tracker_cards';

export default function App() {
  // --- GLOBAL STATE ---
  const [transactions, setTransactions] = useState(() => {
    const saved = localStorage.getItem(STORAGE_KEY);
    return saved ? JSON.parse(saved) : [];
  });

  const [cards, setCards] = useState(() => {
    const saved = localStorage.getItem(CARDS_STORAGE_KEY);
    return saved ? JSON.parse(saved) : [];
  });

  const [currentDate, setCurrentDate] = useState(new Date());
  const [isDesktop, setIsDesktop] = useState(window.innerWidth >= 1280);

  // --- PERSISTENCE ---
  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(transactions));
  }, [transactions]);

  useEffect(() => {
    localStorage.setItem(CARDS_STORAGE_KEY, JSON.stringify(cards));
  }, [cards]);

  // --- RESPONSIVE LISTENER ---
  useEffect(() => {
    const handleResize = () => setIsDesktop(window.innerWidth >= 1280);
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  // --- BUSINESS LOGIC ---
  const nextMonth = () => setCurrentDate(addMonths(currentDate, 1));
  const prevMonth = () => setCurrentDate(subMonths(currentDate, 1));
  const goToToday = () => setCurrentDate(new Date());

  const addCard = (card) => {
    setCards([...cards, card]);
  };

  const deleteCard = (id) => {
    setCards(cards.filter(c => c.id !== id));
  };

  const monthlyTransactions = useMemo(() => {
    return transactions.filter(t => {
      const date = parseISO(t.date);
      return isWithinInterval(date, {
        start: startOfMonth(currentDate),
        end: endOfMonth(currentDate)
      });
    });
  }, [transactions, currentDate]);

  const { balance, income, expenses, payable, projectedBalance, categoryData, cardInvoices } = useMemo(() => {
    let bal = 0;
    let inc = 0;
    let exp = 0;
    let pay = 0;
    const catMap = {};
    const cardMap = {}; // Map cardId -> total invoice

    monthlyTransactions.forEach(t => {
      const amount = parseFloat(t.amount);
      if (t.type === 'income') {
        if (t.status === 'paid') {
          bal += amount;
          inc += amount;
        }
      } else {
        if (!catMap[t.categoryLabel]) catMap[t.categoryLabel] = 0;
        catMap[t.categoryLabel] += amount;

        // Credit Card Logic
        if (t.cardId) {
          if (!cardMap[t.cardId]) cardMap[t.cardId] = 0;
          cardMap[t.cardId] += amount;
        }

        if (t.status === 'paid') {
          bal -= amount;
          exp += amount;
        } else {
          pay += amount;
        }
      }
    });

    const chartData = Object.keys(catMap).map(key => {
      const catDef = CATEGORIES.find(c => c.label === key);
      return {
        name: key,
        value: catMap[key],
        color: catDef ? catDef.color : '#94a3b8'
      };
    }).filter(i => i.value > 0);

    return {
      balance: bal,
      income: inc,
      expenses: exp,
      payable: pay,
      projectedBalance: bal - pay,
      categoryData: chartData,
      cardInvoices: cardMap
    };
  }, [monthlyTransactions]);

  const sharedProps = {
    transactions,
    setTransactions,
    cards,
    addCard,
    deleteCard,
    cardInvoices,
    currentDate,
    nextMonth,
    prevMonth,
    goToToday,
    balance,
    income,
    expenses,
    payable,
    projectedBalance,
    categoryData,
    monthlyTransactions
  };

  return isDesktop ? (
    <DesktopLayout {...sharedProps} />
  ) : (
    <MobileLayout {...sharedProps} />
  );
}
