import React, { useState, useEffect, lazy, Suspense } from 'react';

import { ThemeProvider } from './context/ThemeContext';

const MobileLayout = lazy(() => import('./layouts/MobileLayout').then(module => ({ default: module.MobileLayout })));
const DesktopLayout = lazy(() => import('./layouts/DesktopLayout').then(module => ({ default: module.DesktopLayout })));
import { WelcomeModal } from './components/WelcomeModal';
import { useApp } from './hooks/useApp';

function AppContent() {
  const {
    userName,
    setUserName,
    isDesktop,
    monthlyTransactions,
    financialData,
    currentDate,
    nextMonth,
    prevMonth,
    goToToday,
    transactions,
    cards,
    goals,
    addCard,
    deleteCard,
    addTransaction,
    deleteTransaction,
    setGoals
  } = useApp();

  const [showWelcome, setShowWelcome] = useState(false);

  useEffect(() => {
    if (!userName) {
      setShowWelcome(true);
    }
  }, [userName]);

  const handleSaveName = (name) => {
    setUserName(name);
    setShowWelcome(false);
  };

  if (showWelcome) {
    return <WelcomeModal onSave={handleSaveName} />;
  }

  const layoutProps = {
    transactions,
    monthlyTransactions,
    cards,
    goals,
    currentDate,
    userName,
    addCard,
    deleteCard,
    addTransaction,
    deleteTransaction,
    setGoals,
    nextMonth,
    prevMonth,
    goToToday,
    ...financialData
  };

  return (
    <Suspense fallback={<div className="flex h-screen w-screen items-center justify-center">Carregando interface...</div>}>
      {isDesktop ? (
        <DesktopLayout {...layoutProps} />
      ) : (
        <MobileLayout {...layoutProps} />
      )}
    </Suspense>
  );
}

export default function App() {
  return (
    <ThemeProvider theme="dark">
      <AppContent />
    </ThemeProvider>
  );
}
