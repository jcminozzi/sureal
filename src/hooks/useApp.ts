import { useMemo, useCallback } from 'react';
import { useStore } from '../store/useStore';
import { addMonths, subMonths, startOfMonth, endOfMonth, isWithinInterval, parseISO } from 'date-fns';
import { CATEGORIES } from '../constants/categories';

export function useApp() {
  const store = useStore();

  // Navigation actions
  const nextMonth = useCallback(() => {
    store.setCurrentDate((prev) => addMonths(prev, 1));
  }, [store]);

  const prevMonth = useCallback(() => {
    store.setCurrentDate((prev) => subMonths(prev, 1));
  }, [store]);

  const goToToday = useCallback(() => {
    store.setCurrentDate(new Date());
  }, [store]);

  // Computed data
  const monthlyTransactions = useMemo(() => {
    return store.transactions.filter(t => {
      const date = parseISO(t.date);
      return isWithinInterval(date, {
        start: startOfMonth(store.currentDate),
        end: endOfMonth(store.currentDate)
      });
    });
  }, [store.transactions, store.currentDate]);

  const financialData = useMemo(() => {
    let balance = 0;
    let income = 0;
    let expenses = 0;
    let payable = 0;
    const catMap = {};
    const cardMap = {};

    monthlyTransactions.forEach(t => {
      const amount = typeof t.amount === 'string' ? parseFloat(t.amount) : t.amount;
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
      const catDef = CATEGORIES.find(c => c.label === key);
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

  // Return the unified interface keeping compatibility with the old Context API
  return {
    ...store,
    monthlyTransactions,
    financialData,
    nextMonth,
    prevMonth,
    goToToday,
  };
}
