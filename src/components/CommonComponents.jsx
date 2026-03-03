import React from 'react';
import { Wallet, TrendingUp, TrendingDown, Target, AlertCircle } from 'lucide-react';
import { formatCurrency } from '../utils/financial';

export function StatCard({ label, value, icon: Icon, color = '#8b5cf6', sub = '', isPrivacyMode = false }) {
  return (
    <div className="bg-slate-800/50 backdrop-blur-sm border border-slate-700 p-6 rounded-2xl hover:scale-105 transition-transform cursor-default shadow-lg">
      <div className="flex justify-between items-start mb-4">
        <div style={{ color, backgroundColor: `${color}20` }} className="p-3 rounded-xl">
          <Icon size={24} />
        </div>
      </div>
      <div>
        <div className="text-3xl font-extrabold text-white mb-2 tracking-tight">
          {formatCurrency(value, isPrivacyMode)}
        </div>
        <div className="flex justify-between items-center">
          <span className="text-slate-400 text-sm font-medium">{label}</span>
          <span style={{ color, backgroundColor: `${color}15` }} className="text-xs px-2 py-1 rounded-lg font-bold">
            {sub}
          </span>
        </div>
      </div>
    </div>
  );
}

export function MetricCard({ title, value, icon: Icon, color = '#8b5cf6', trend = null }) {
  return (
    <div className={`bg-${color === '#10b981' ? 'emerald' : color === '#ef4444' ? 'red' : color === '#3b82f6' ? 'blue' : 'violet'}-500/10 border border-${color === '#10b981' ? 'emerald' : color === '#ef4444' ? 'red' : color === '#3b82f6' ? 'blue' : 'violet'}-500/30 p-4 rounded-xl`}>
      <div className="flex items-center justify-between mb-2">
        <span className="text-sm text-slate-400">{title}</span>
        <Icon size={16} style={{ color }} />
      </div>
      <div className="text-lg font-bold text-white flex items-center gap-2">
        {value}
        {trend && (
          <span className={`text-xs font-bold ${trend > 0 ? 'text-emerald-400' : 'text-red-400'}`}>
            {trend > 0 ? '↑' : '↓'} {Math.abs(trend)}%
          </span>
        )}
      </div>
    </div>
  );
}

export function EmptyState({ icon: Icon, title, description, action = null }) {
  return (
    <div className="flex flex-col items-center justify-center py-16 text-center px-4">
      <div className="mb-4 p-4 rounded-full bg-slate-800/50">
        <Icon size={32} className="text-slate-500" />
      </div>
      <h3 className="text-lg font-bold text-white mb-2">{title}</h3>
      <p className="text-slate-400 text-sm mb-4 max-w-xs">{description}</p>
      {action && action}
    </div>
  );
}

export function LoadingSpinner({ size = 'md', text = 'Carregando...' }) {
  const sizeClass = {
    sm: 'w-4 h-4',
    md: 'w-8 h-8',
    lg: 'w-12 h-12'
  }[size];

  return (
    <div className="flex flex-col items-center justify-center gap-3">
      <div className={`${sizeClass} border-3 border-slate-700 border-t-violet-600 rounded-full animate-spin`} />
      {text && <p className="text-slate-400 text-sm">{text}</p>}
    </div>
  );
}

export function Alert({ type = 'info', title, message, onClose = null }) {
  const colors = {
    info: 'bg-blue-500/10 border-blue-500/50 text-blue-300',
    success: 'bg-emerald-500/10 border-emerald-500/50 text-emerald-300',
    warning: 'bg-amber-500/10 border-amber-500/50 text-amber-300',
    error: 'bg-red-500/10 border-red-500/50 text-red-300'
  };

  const icons = {
    info: '🔔',
    success: '✓',
    warning: '⚠️',
    error: '✕'
  };

  return (
    <div className={`p-4 rounded-xl border ${colors[type] || colors.info}`}>
      <div className="flex items-start justify-between">
        <div className="flex items-start gap-3">
          <span className="text-lg">{icons[type]}</span>
          <div>
            {title && <h4 className="font-bold text-sm mb-1">{title}</h4>}
            {message && <p className="text-xs opacity-90">{message}</p>}
          </div>
        </div>
        {onClose && (
          <button 
            onClick={onClose}
            className="text-lg hover:opacity-60 transition-opacity"
          >
            ✕
          </button>
        )}
      </div>
    </div>
  );
}

export function ProgressBar({ value, max = 100, label = '', color = '#8b5cf6', showPercentage = true }) {
  const percentage = Math.min(100, (value / max) * 100);

  return (
    <div>
      {(label || showPercentage) && (
        <div className="flex justify-between items-center mb-2">
          {label && <span className="text-sm text-slate-400">{label}</span>}
          {showPercentage && <span className="text-xs font-bold text-slate-300">{Math.round(percentage)}%</span>}
        </div>
      )}
      <div className="w-full h-3 bg-slate-700 rounded-full overflow-hidden">
        <div
          className="h-full rounded-full transition-all duration-500"
          style={{ width: `${percentage}%`, backgroundColor: color }}
        />
      </div>
    </div>
  );
}

export function Badge({ text, color = '#8b5cf6', variant = 'filled' }) {
  const filledClass = `bg-${color === '#10b981' ? 'emerald' : color === '#ef4444' ? 'red' : color === '#3b82f6' ? 'blue' : 'violet'}-500/20 text-${color === '#10b981' ? 'emerald' : color === '#ef4444' ? 'red' : color === '#3b82f6' ? 'blue' : 'violet'}-400`;
  const outlineClass = `border border-${color === '#10b981' ? 'emerald' : color === '#ef4444' ? 'red' : color === '#3b82f6' ? 'blue' : 'violet'}-500/50 text-${color === '#10b981' ? 'emerald' : color === '#ef4444' ? 'red' : color === '#3b82f6' ? 'blue' : 'violet'}-400`;

  return (
    <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-bold ${variant === 'filled' ? filledClass : outlineClass}`}>
      {text}
    </span>
  );
}

export function TransactionListItem({ transaction, onDelete = null, onEdit = null, formatMoney }) {
  return (
    <div className="bg-slate-800 p-4 rounded-xl flex items-center justify-between border border-slate-700/50 hover:border-violet-500/30 transition-colors group">
      <div className="flex items-center gap-4">
        <div className="w-10 h-10 rounded-full bg-slate-700 flex items-center justify-center text-xl">
          {transaction.categoryIcon}
        </div>
        <div>
          <div className="font-semibold text-white">{transaction.description}</div>
          <div className="text-xs text-slate-400">{transaction.categoryLabel}</div>
        </div>
      </div>
      <div className="flex items-center gap-3">
        <div className="text-right">
          <div className={`font-bold ${transaction.type === 'income' ? 'text-emerald-400' : 'text-white'}`}>
            {transaction.type === 'income' ? '+' : '-'} {formatMoney(transaction.amount)}
          </div>
          {transaction.status === 'pending' && (
            <div className="text-[10px] text-red-400 font-bold">PENDENTE</div>
          )}
        </div>
        {onDelete && (
          <button
            onClick={() => onDelete(transaction.id)}
            className="opacity-0 group-hover:opacity-100 transition-opacity text-slate-500 hover:text-red-400 p-1"
          >
            ✕
          </button>
        )}
      </div>
    </div>
  );
}
