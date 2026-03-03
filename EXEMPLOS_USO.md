/**
 * 📚 EXEMPLOS DE USO - Meus Gastinhos v2.0
 * 
 * Este arquivo contém exemplos de como usar os novos componentes,
 * hooks e utilitários da aplicação.
 */

// ============================================
// 1. USANDO CONTEXT API
// ============================================

import { useApp } from '@/hooks/useApp';

function MeuComponente() {
  // Obter dados do contexto
  const { 
    transactions,
    addTransaction,
    deleteTransaction,
    balance,
    income,
    financialData,
    userName,
    currentDate
  } = useApp();

  // Adicionar transação
  const handleAddTransaction = (data) => {
    addTransaction({
      id: Date.now().toString(),
      amount: data.amount,
      type: 'expense', // 'income' ou 'expense'
      categoryLabel: 'Mercado',
      date: new Date().toISOString(),
      status: 'paid', // 'paid' ou 'pending'
      description: 'Compra no supermercado'
    });
  };

  // Deletar transação
  const handleDelete = (id) => {
    deleteTransaction(id);
  };

  return (
    <div>
      <p>Saldo: R$ {balance}</p>
      <button onClick={() => handleAddTransaction({})}>Adicionar</button>
    </div>
  );
}

// ============================================
// 2. USANDO COMPONENTES REUTILIZÁVEIS
// ============================================

import { 
  StatCard, 
  EmptyState, 
  Alert, 
  ProgressBar,
  Badge 
} from '@/components/CommonComponents';
import { Wallet, TrendingUp } from 'lucide-react';

function Dashboard() {
  return (
    <div className="space-y-6">
      {/* Card de Estatística */}
      <StatCard 
        label="Saldo Total"
        value={5000}
        icon={Wallet}
        color="#8b5cf6"
        sub="Disponível"
        isPrivacyMode={false}
      />

      {/* Estado Vazio */}
      <EmptyState
        icon={Wallet}
        title="Sem Transações"
        description="Adicione sua primeira transação para começar"
        action={<button className="px-4 py-2 bg-violet-600 text-white rounded">Adicionar</button>}
      />

      {/* Alertas */}
      <Alert
        type="warning"
        title="Alta taxa de gasto!"
        message="Você já gastou 80% do seu orçamento"
      />

      {/* Barra de Progresso */}
      <ProgressBar 
        value={30} 
        max={100} 
        label="Progresso mensal"
        color="#8b5cf6"
      />

      {/* Badge */}
      <Badge text="Premium" color="#8b5cf6" variant="filled" />
    </div>
  );
}

// ============================================
// 3. USANDO ANALYTICS
// ============================================

import { useFinancialAnalytics } from '@/hooks/useFinancialAnalytics';

function AnalyticsPanel() {
  const { transactions, income, expenses } = useApp();
  
  const {
    healthScore,
    savingsRate,
    categoryDistribution,
    insights
  } = useFinancialAnalytics(transactions, income, expenses);

  return (
    <div>
      <h2>Saúde Financeira: {healthScore}%</h2>
      <p>Taxa de Poupança: {savingsRate}%</p>
      
      <h3>Gastos por Categoria:</h3>
      {categoryDistribution.map(cat => (
        <div key={cat.label}>
          {cat.label}: R$ {cat.total}
        </div>
      ))}

      <h3>Dicas:</h3>
      {insights.map((insight, idx) => (
        <Alert 
          key={idx}
          type={insight.type}
          title={insight.title}
          message={insight.message}
        />
      ))}
    </div>
  );
}

// ============================================
// 4. USANDO FORMULÁRIO UNIFICADO
// ============================================

import { UnifiedTransactionForm } from '@/components/UnifiedTransactionForm';
import { CATEGORIES } from '@/layouts/MobileLayout';
import { useState } from 'react';

function TransactionPage() {
  const [isFormOpen, setIsFormOpen] = useState(false);
  const { cards, addTransaction } = useApp();

  const handleSaveTransaction = (transaction) => {
    addTransaction(transaction);
    setIsFormOpen(false);
  };

  return (
    <div>
      <button onClick={() => setIsFormOpen(true)}>
        Nova Transação
      </button>

      {isFormOpen && (
        <UnifiedTransactionForm
          onClose={() => setIsFormOpen(false)}
          onSave={handleSaveTransaction}
          categories={CATEGORIES}
          cards={cards}
          isDesktop={true}
        />
      )}
    </div>
  );
}

// ============================================
// 5. USANDO UTILITÁRIOS FINANCEIROS
// ============================================

import {
  formatCurrency,
  parseAmount,
  validateTransaction,
  calculateHealthScore,
  groupTransactionsByCategory,
  generateBackup,
  validateBackup
} from '@/utils/financial';

function FinancialUtils() {
  // Formatar moeda
  const formatted = formatCurrency(1500.50); // "R$ 1.500,50"
  
  // Parse de valor
  const amount = parseAmount('1.500,50'); // 1500.50
  
  // Validar transação
  const { isValid, errors } = validateTransaction({
    amount: 100,
    categoryLabel: 'Mercado',
    type: 'expense',
    status: 'paid',
    date: new Date().toISOString()
  });

  // Calcular score
  const score = calculateHealthScore(5000, 3000); // 40
  
  // Agrupar por categoria
  const grouped = groupTransactionsByCategory(transactions);
  
  // Backup
  const backup = generateBackup({
    transactions: [],
    cards: [],
    goals: []
  });
  
  // Validar backup
  const isBackupValid = validateBackup(backup);

  return (
    <div>
      <p>{formatted}</p>
      <p>{score}% saudável</p>
    </div>
  );
}

// ============================================
// 6. USANDO TEMA
// ============================================

import { useTheme } from '@/context/ThemeContext';

function ThemedComponent() {
  const { theme, toggleTheme, colors } = useTheme();

  return (
    <div className={`${colors.background} ${colors.text}`}>
      <p>Tema atual: {theme}</p>
      
      <button
        className={`${colors.accent} ${colors.accentHover} text-white px-4 py-2 rounded`}
        onClick={toggleTheme}
      >
        Alternar Tema
      </button>

      {/* Cores disponíveis */}
      <div className={colors.surface}>
        <span className={colors.textSecondary}>Texto secundário</span>
      </div>
    </div>
  );
}

// ============================================
// 7. RENDERIZANDO RELATÓRIO
// ============================================

import { ReportsModal } from '@/components/ReportsModal';

function ReportPage() {
  const [isOpen, setIsOpen] = useState(false);
  const { 
    transactions, 
    income, 
    expenses, 
    balance,
    categoryData 
  } = useApp();

  return (
    <div>
      <button onClick={() => setIsOpen(true)}>
        Ver Relatório
      </button>

      {isOpen && (
        <ReportsModal
          onClose={() => setIsOpen(false)}
          transactions={transactions}
          income={income}
          expenses={expenses}
          balance={balance}
          categoryData={categoryData}
        />
      )}
    </div>
  );
}

// ============================================
// 8. INTEGRAÇÃO COMPLETA
// ============================================

function FullIntegration() {
  const { 
    transactions,
    addTransaction,
    cards,
    monthlyTransactions,
    financialData
  } = useApp();

  const {
    healthScore,
    categoryDistribution,
    insights
  } = useFinancialAnalytics(
    transactions,
    financialData.income,
    financialData.expenses
  );

  const [isFormOpen, setIsFormOpen] = useState(false);

  return (
    <div className="min-h-screen space-y-8">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold">Meus Gastinhos</h1>
        <button 
          onClick={() => setIsFormOpen(true)}
          className="mt-4 px-4 py-2 bg-violet-600 text-white rounded"
        >
          + Nova Transação
        </button>
      </div>

      {/* Cards de Estatísticas */}
      <div className="grid grid-cols-3 gap-4">
        <StatCard
          label="Saldo"
          value={financialData.balance}
          icon={Wallet}
          color="#8b5cf6"
        />
        <StatCard
          label="Receita"
          value={financialData.income}
          icon={TrendingUp}
          color="#10b981"
        />
        <StatCard
          label="Despesa"
          value={financialData.expenses}
          icon={TrendingDown}
          color="#ef4444"
        />
      </div>

      {/* Insights */}
      <div className="space-y-3">
        {insights.map((insight, idx) => (
          <Alert
            key={idx}
            type={insight.type}
            title={insight.title}
            message={insight.message}
          />
        ))}
      </div>

      {/* Lista de Transações */}
      <div>
        <h2 className="text-xl font-bold mb-4">Últimas Transações</h2>
        {monthlyTransactions.length === 0 ? (
          <EmptyState
            icon={Wallet}
            title="Sem transações"
            description="Comece adicionando sua primeira transação"
          />
        ) : (
          <div className="space-y-2">
            {monthlyTransactions.slice(0, 5).map(t => (
              <TransactionListItem
                key={t.id}
                transaction={t}
                formatMoney={formatCurrency}
              />
            ))}
          </div>
        )}
      </div>

      {/* Formulário */}
      {isFormOpen && (
        <UnifiedTransactionForm
          onClose={() => setIsFormOpen(false)}
          onSave={(t) => {
            addTransaction(t);
            setIsFormOpen(false);
          }}
          categories={CATEGORIES}
          cards={cards}
          isDesktop={true}
        />
      )}
    </div>
  );
}

export {
  MeuComponente,
  Dashboard,
  AnalyticsPanel,
  TransactionPage,
  FinancialUtils,
  ThemedComponent,
  ReportPage,
  FullIntegration
};
