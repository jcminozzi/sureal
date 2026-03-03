import React, { createContext, useContext, useEffect } from 'react';

export const ThemeContext = createContext();

export function ThemeProvider({ children, theme = 'dark' }) {
  const [currentTheme, setCurrentTheme] = React.useState(() => {
    return localStorage.getItem('app_theme') || theme;
  });

  useEffect(() => {
    localStorage.setItem('app_theme', currentTheme);
    
    // Aplicar tema ao DOM
    if (currentTheme === 'dark') {
      document.documentElement.classList.add('dark');
      document.documentElement.style.colorScheme = 'dark';
    } else {
      document.documentElement.classList.remove('dark');
      document.documentElement.style.colorScheme = 'light';
    }
  }, [currentTheme]);

  const toggleTheme = () => {
    setCurrentTheme(prev => prev === 'dark' ? 'light' : 'dark');
  };

  const themes = {
    dark: {
      background: 'bg-slate-900',
      surface: 'bg-slate-800',
      surfaceSecondary: 'bg-slate-700',
      border: 'border-slate-700',
      text: 'text-white',
      textSecondary: 'text-slate-400',
      accent: 'bg-violet-600',
      accentHover: 'hover:bg-violet-700',
      success: 'bg-emerald-500',
      error: 'bg-red-500',
      warning: 'bg-amber-500'
    },
    light: {
      background: 'bg-slate-50',
      surface: 'bg-white',
      surfaceSecondary: 'bg-slate-100',
      border: 'border-slate-200',
      text: 'text-slate-900',
      textSecondary: 'text-slate-600',
      accent: 'bg-violet-600',
      accentHover: 'hover:bg-violet-700',
      success: 'bg-emerald-500',
      error: 'bg-red-500',
      warning: 'bg-amber-500'
    }
  };

  const value = {
    theme: currentTheme,
    toggleTheme,
    colors: themes[currentTheme] || themes.dark
  };

  return (
    <ThemeContext.Provider value={value}>
      {children}
    </ThemeContext.Provider>
  );
}

export function useTheme() {
  const context = useContext(ThemeContext);
  if (!context) {
    throw new Error('useTheme deve ser usado dentro de ThemeProvider');
  }
  return context;
}
