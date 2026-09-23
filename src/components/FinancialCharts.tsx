import { useState } from 'react';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { ArrowDownLeft, ArrowUpRight, ChartNoAxesCombined, EyeOff } from 'lucide-react';
import { categoryDistribution, monthlyHistory } from '../lib/analytics';
import { formatCurrency } from '../lib/finance';
import type { Transaction } from '../types';

const palette = ['#14b8a6', '#818cf8', '#f5a65b', '#e879a9', '#60a5fa', '#a3b85c'];

export function FinancialCharts({ transactions, selectedTransactions, month, hidden, onCategory }: {
  transactions: Transaction[]; selectedTransactions: Transaction[]; month: Date; hidden: boolean; onCategory: (label: string) => void;
}) {
  const history = monthlyHistory(transactions, month);
  const [selection, setSelection] = useState<string | null>(null);
  const active = history.find((item) => item.key === selection) ?? history[5];
  const categories = categoryDistribution(selectedTransactions);
  const total = categories.reduce((sum, item) => sum + item.value, 0);
  const maximum = Math.max(1, ...history.flatMap((item) => [item.income, item.expenses]));
  const visible = categories.slice(0, 5);
  const remaining = categories.slice(5).reduce((sum, item) => sum + item.value, 0);
  const segments = [...visible, ...(remaining ? [{ label: 'Demais categorias', value: remaining, share: remaining / total }] : [])];
  let offset = 0;
  const gradient = segments.map((item, index) => {
    const start = offset; offset += item.share * 100;
    return `${palette[index]} ${start}% ${offset}%`;
  }).join(',');

  return <section className="financial-charts" aria-label="Análises financeiras">
    <article className="panel history-chart">
      <header className="panel__header"><div><span className="eyebrow">Sua trajetória</span><h2>Um mês melhor que o outro</h2><p>Entradas e saídas confirmadas nos últimos 6 meses</p></div><ChartNoAxesCombined size={23} /></header>
      {hidden ? <div className="chart-placeholder"><EyeOff size={20} /> Gráfico oculto no modo privacidade</div> : <>
        <div className="history-summary" aria-live="polite"><span>{format(active.date, 'MMMM yyyy', { locale: ptBR })}{active.count === 0 ? ' · sem registros' : ''}</span><div><span><ArrowDownLeft size={16} />{formatCurrency(active.income)}</span><span><ArrowUpRight size={16} />{formatCurrency(active.expenses)}</span></div></div>
        <div className="monthly-bars" role="group" aria-label="Selecione um mês para ver os valores">
          {history.map((item) => <button key={item.key} aria-pressed={active.key === item.key} onClick={() => setSelection(item.key)} aria-label={`${format(item.date, 'MMMM yyyy', { locale: ptBR })}: entradas ${formatCurrency(item.income)}, saídas ${formatCurrency(item.expenses)}`}><span className="bar-pair"><i className="bar-income" style={{ height: `${item.income / maximum * 100}%` }} /><i className="bar-expense" style={{ height: `${item.expenses / maximum * 100}%` }} /></span><span>{format(item.date, 'MMM', { locale: ptBR })}</span></button>)}
        </div><div className="chart-legend"><span><i className="legend-income" /> Entradas</span><span><i className="legend-expense" /> Saídas</span><small>Toque em um mês para explorar</small></div>
      </>}
    </article>
    <article className="panel distribution-chart"><header className="panel__header"><div><span className="eyebrow">Cada real conta</span><h2>Para onde foi seu dinheiro</h2><p>Despesas pagas e pendentes do mês</p></div></header>
      {hidden ? <div className="chart-placeholder"><EyeOff size={20} /> Distribuição oculta</div> : total > 0 ? <div className="distribution-body"><div className="expense-donut" style={{ background: `conic-gradient(${gradient})` }} role="img" aria-label={`Total de despesas: ${formatCurrency(total)}. Detalhamento por categoria abaixo.`}><div><small>Total do mês</small><strong>{formatCurrency(total)}</strong><span>{categories.length} categorias</span></div></div><div className="distribution-legend">{segments.map((item, index) => index < 5 ? <button key={item.label} onClick={() => onCategory(item.label)}><i style={{ background: palette[index] }} /><span>{item.label}<small>{formatCurrency(item.value)}</small></span><b>{Math.round(item.share * 100)}%</b></button> : <div key={item.label}><i style={{ background: palette[index] }} /><span>{item.label}<small>{formatCurrency(item.value)}</small></span><b>{Math.round(item.share * 100)}%</b></div>)}</div></div> : <div className="chart-placeholder"><ChartNoAxesCombined size={28} /><span>Registre uma despesa para descobrir seus maiores gastos.</span></div>}
    </article>
  </section>;
}
