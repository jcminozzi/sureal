import React, { useState, useEffect } from 'react';
import {
    LayoutDashboard, Wallet, PieChart, Calendar as CalendarIcon, Settings,
    Plus, Search, Bell, TrendingUp, TrendingDown, DollarSign,
    ArrowUpRight, ArrowDownRight, CreditCard, Trash2, X, Check, Download, ChevronLeft, ChevronRight, Repeat,
    Eye, EyeOff, Upload, Save, Zap, User, Mic, Camera, Loader2
} from 'lucide-react';
import { format, startOfMonth, endOfMonth, eachDayOfInterval, isSameDay, getDay } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { BarChart, Bar, XAxis, Tooltip, ResponsiveContainer } from 'recharts';
import { CATEGORIES } from './MobileLayout';
import { BANKS } from '../constants/banks';
import { calculateLevel } from '../utils/gamification';
import { SmartTips } from '../components/SmartTips';
import { SubscriptionModal } from '../components/SubscriptionModal';
import { SettingsModal } from '../components/SettingsModal';
import { usePWAInstall } from '../hooks/usePWAInstall';
import { useVoiceInput } from '../hooks/useVoiceInput';
import { parseVoiceCommand } from '../utils/voiceParser';
import { useOCR } from '../hooks/useOCR';
import { UnifiedTransactionForm } from '../components/UnifiedTransactionForm';
import { DayDetailsModal } from '../components/DayDetailsModal';
import { AddCardModal } from '../components/AddCardModal';

// Componente importado do UnifiedTransactionForm, AddCardModal e DayDetailsModal

function CalendarView({ transactions, currentDate, cards, setTransactions }) {
    const [selectedDay, setSelectedDay] = useState(null);
    const start = startOfMonth(currentDate);
    const end = endOfMonth(currentDate);
    const days = eachDayOfInterval({ start, end });
    const weekDays = ['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb'];
    const startDay = getDay(start);
    const padding = Array(startDay).fill(null);

    // Filter transactions for the current month to optimize
    const monthTransactions = transactions.filter(t => {
        const d = new Date(t.date);
        return d.getMonth() === currentDate.getMonth() && d.getFullYear() === currentDate.getFullYear();
    });

    return (
        <div className="bg-slate-800/50 backdrop-blur-sm border border-slate-700 rounded-2xl p-8 h-full flex flex-col overflow-hidden relative">
            <h2 className="text-2xl font-bold mb-6">Calendário de Atividades</h2>

            <div className="grid grid-cols-7 gap-4 mb-4">
                {weekDays.map(d => <div key={d} className="text-center text-slate-500 font-semibold text-sm">{d}</div>)}
            </div>

            <div className="grid grid-cols-7 gap-4 overflow-y-auto pr-2 custom-scrollbar flex-1 content-start">
                {padding.map((_, i) => <div key={`pad-${i}`}></div>)}
                {days.map(day => {
                    const dayTx = monthTransactions.filter(t => isSameDay(new Date(t.date), day));
                    const dayIncome = dayTx.filter(t => t.type === 'income').reduce((acc, t) => acc + Number(t.amount), 0);
                    const dayExpense = dayTx.filter(t => t.type === 'expense').reduce((acc, t) => acc + Number(t.amount), 0);
                    const isToday = isSameDay(day, new Date());

                    // Check for Card Invoices closing on this day
                    const closingCards = cards.filter(c => c.dueDay && parseInt(c.dueDay) === day.getDate());

                    // Check for Subscriptions (recurring transactions on this day)
                    // Note: This is a simplification. Ideally we check the 'installment' or specific recurring logic.
                    // For now, we assume if it's in the transaction list, it's valid. 
                    // To show *upcoming* subscriptions that haven't been launched yet would require more complex logic.
                    // Here we just highlight if there are actual subscription transactions launched for this day.
                    const hasSubscription = dayTx.some(t => t.recurring || t.isSubscription);

                    return (
                        <div key={day.toString()} onClick={() => setSelectedDay(day)}
                            className={`aspect-square rounded-xl p-2 flex flex-col justify-between cursor-pointer transition-all hover:bg-slate-700 hover:scale-[1.02] border ${isToday ? 'bg-violet-600/10 border-violet-500' : 'bg-slate-800/50 border-slate-700/30'}`}>
                            <div className="flex justify-between items-start">
                                <span className={`text-sm ${isToday ? 'text-violet-400 font-bold' : 'text-slate-400'}`}>{format(day, 'd')}</span>
                                <div className="flex gap-1">
                                    {closingCards.length > 0 && <CreditCard size={12} className="text-amber-400" />}
                                    {hasSubscription && <Zap size={12} className="text-yellow-400" />}
                                </div>
                            </div>

                            <div className="flex flex-col gap-0.5 items-end">
                                {dayIncome > 0 && <span className="text-[10px] text-emerald-400 font-bold">+{Math.round(dayIncome)}</span>}
                                {dayExpense > 0 && <span className="text-[10px] text-red-400 font-bold">-{Math.round(dayExpense)}</span>}
                                {closingCards.length > 0 && <span className="text-[8px] text-amber-500 font-medium uppercase tracking-tighter">Fatura {closingCards[0].bankName}</span>}
                            </div>
                        </div>
                    );
                })}
            </div>

            {selectedDay && (
                <DayDetailsModal
                    date={selectedDay}
                    transactions={monthTransactions.filter(t => isSameDay(new Date(t.date), selectedDay))}
                    onClose={() => setSelectedDay(null)}
                    onDelete={(id) => {
                        if (confirm('Excluir esta transação?')) {
                            setTransactions(prev => prev.filter(t => t.id !== id));
                        }
                    }}
                />
            )}
        </div>
    );
}

function MenuItem({ icon, label, active, onClick }) {
    return (
        <button onClick={onClick}
            className={`w-full flex items-center gap-3 px-5 py-4 rounded-xl transition-all ${active ? 'bg-violet-600/10 text-violet-400 border-l-4 border-violet-600' : 'text-slate-400 hover:bg-slate-800 hover:text-white border-l-4 border-transparent'}`}>
            {icon}
            <span className="font-medium">{label}</span>
        </button>
    );
}

function StatCard({ label, value, icon, color, sub, isPrivacyMode }) {
    const formatMoney = (v) => isPrivacyMode ? '****' : new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(v);
    return (
        <div className="bg-slate-900/60 backdrop-blur-2xl border border-white/[0.08] p-6 rounded-3xl hover:scale-[1.02] transition-transform cursor-default shadow-2xl shadow-indigo-900/10">
            <div className="flex justify-between items-start mb-4">
                <div style={{ color, backgroundColor: `${color}20` }} className="p-3 rounded-2xl">
                    {icon}
                </div>
            </div>
            <div>
                <div className="text-4xl font-black text-white mb-2 tracking-tight font-outfit text-gradient">{formatMoney(value)}</div>
                <div className="flex justify-between items-center mt-4">
                    <span className="text-slate-400 text-sm font-medium uppercase tracking-wider">{label}</span>
                    <span style={{ color, backgroundColor: `${color}15` }} className="text-[10px] px-2 py-1 rounded-lg font-bold uppercase">{sub}</span>
                </div>
            </div>
        </div>
    )
}

export function DesktopLayout({ transactions, setTransactions, cards, addCard, deleteCard, cardInvoices, currentDate, nextMonth, prevMonth, balance, income, expenses, userName, setUserName }) {
    const [activeTab, setActiveTab] = useState('dashboard');
    const [searchTerm, setSearchTerm] = useState('');
    const [isTxModalOpen, setIsTxModalOpen] = useState(false);
    const [isCardModalOpen, setIsCardModalOpen] = useState(false);
    const [isSubModalOpen, setIsSubModalOpen] = useState(false);
    const [isSettingsModalOpen, setIsSettingsModalOpen] = useState(false);
    const [isPrivacyMode, setIsPrivacyMode] = useState(false);
    const { isInstallable, install } = usePWAInstall();

    const formatMoney = (v) => isPrivacyMode ? '****' : new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(v);
    const healthScore = income > 0 ? Math.min(100, Math.round(((income - expenses) / income) * 100)) : 0;

    const { currentLevel, progress, nextLevel } = calculateLevel(balance, transactions.length);

    const handleBackup = () => {
        const data = { transactions, cards, version: '1.0', exportDate: new Date().toISOString() };
        const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `backup_gastinhos_${format(new Date(), 'yyyy-MM-dd')}.json`;
        a.click();
    };

    const handleRestore = () => {
        const input = document.createElement('input');
        input.type = 'file';
        input.accept = 'application/json';
        input.onchange = (e) => {
            const file = e.target.files[0];
            const reader = new FileReader();
            reader.onload = (event) => {
                try {
                    const data = JSON.parse(event.target.result);
                    if (data.transactions && data.cards) {
                        if (confirm(`Restaurar backup de ${new Date(data.exportDate).toLocaleDateString()}? Isso substituirá os dados atuais.`)) {
                            setTransactions(data.transactions);
                            localStorage.setItem('transactions', JSON.stringify(data.transactions));
                            localStorage.setItem('cards', JSON.stringify(data.cards));
                            alert('Backup restaurado com sucesso! O app será recarregado.');
                            window.location.reload();
                        }
                    } else {
                        alert('Arquivo de backup inválido.');
                    }
                } catch (err) {
                    alert('Erro ao ler arquivo.');
                }
            };
            reader.readAsText(file);
        };
        input.click();
    };

    const renderContent = () => {
        switch (activeTab) {
            case 'transactions':
                return (
                    <div className="bg-slate-800/50 backdrop-blur-sm border border-slate-700 rounded-2xl p-8 h-full flex flex-col">
                        <div className="flex justify-between items-center mb-6">
                            <h2 className="text-2xl font-bold text-white">Lançamentos</h2>
                            <div className="relative">
                                <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                                <input
                                    type="text" placeholder="Filtrar..."
                                    value={searchTerm} onChange={e => setSearchTerm(e.target.value)}
                                    className="bg-slate-900 border border-slate-700 rounded-lg pl-10 pr-4 py-2 text-sm text-white outline-none focus:border-violet-500 w-64"
                                />
                            </div>
                        </div>
                        <div className="overflow-auto flex-1 custom-scrollbar">
                            <table className="w-full text-left border-collapse">
                                <thead className="sticky top-0 bg-slate-800/95 z-10">
                                    <tr className="text-slate-400 text-sm border-b border-slate-700">
                                        <th className="p-4 font-medium">Data</th>
                                        <th className="p-4 font-medium">Categoria</th>
                                        <th className="p-4 font-medium">Descrição</th>
                                        <th className="p-4 font-medium">Valor</th>
                                        <th className="p-4 font-medium">Status</th>
                                        <th className="p-4 font-medium"></th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-slate-700/50">
                                    {transactions.filter(t => t.description.toLowerCase().includes(searchTerm.toLowerCase())).sort((a, b) => new Date(b.date) - new Date(a.date)).map(t => (
                                        <tr key={t.id} className="hover:bg-slate-700/30 transition-colors group">
                                            <td className="p-4 text-slate-400 text-sm">{new Date(t.date).toLocaleDateString()}</td>
                                            <td className="p-4"><span className="inline-flex items-center gap-2 bg-slate-700/50 px-3 py-1 rounded-full text-xs text-slate-300">{t.categoryIcon} {t.categoryLabel}</span></td>
                                            <td className="p-4">
                                                <div className="flex items-center gap-2">
                                                    {t.description}
                                                    {t.recurring && <Repeat size={14} className="text-violet-400" />}
                                                    {t.cardId && <span className="text-[10px] bg-violet-500/20 text-violet-400 px-1.5 py-0.5 rounded uppercase font-bold">Crédito</span>}
                                                    {t.installment && <span className="text-[10px] bg-amber-500/20 text-amber-400 px-1.5 py-0.5 rounded font-bold">{t.installment}</span>}
                                                </div>
                                            </td>
                                            <td className={`p-4 font-bold ${t.type === 'income' ? 'text-emerald-400' : 'text-white'}`}>{t.type === 'income' ? '+' : '-'} {formatMoney(t.amount)}</td>
                                            <td className="p-4">{t.status === 'paid' ? <div className="flex items-center gap-1 text-emerald-400 text-xs font-bold"><Check size={14} /> PAGO</div> : <div className="text-red-400 text-xs font-bold bg-red-500/10 px-2 py-0.5 rounded-full inline-block">PENDENTE</div>}</td>
                                            <td className="p-4 text-right">
                                                <button onClick={() => { if (confirm('Apagar?')) setTransactions(prev => prev.filter(x => x.id !== t.id)) }} className="text-slate-600 hover:text-red-400 opacity-0 group-hover:opacity-100 transition-opacity"><Trash2 size={16} /></button>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    </div>
                );
            case 'calendar': return <CalendarView transactions={transactions} currentDate={currentDate} cards={cards} setTransactions={setTransactions} />;
            case 'reports':
                return (
                    <div className="flex flex-col items-center justify-center h-full text-slate-500 gap-4">
                        <PieChart size={64} className="opacity-20" />
                        <p>Relatórios detalhados em breve.</p>
                    </div>
                );
            case 'subscriptions':
                const subs = transactions.filter(t => t.isSubscription || t.recurring);
                return (
                    <div className="bg-slate-800/50 backdrop-blur-sm border border-slate-700 rounded-2xl p-8 h-full flex flex-col">
                        <div className="flex justify-between items-center mb-6">
                            <h2 className="text-2xl font-bold text-white">Assinaturas Recorrentes</h2>
                            <button onClick={() => setIsSubModalOpen(true)} className="flex items-center gap-2 px-4 py-2 bg-violet-600 hover:bg-violet-700 text-white font-bold rounded-lg transition-colors text-sm">
                                <Plus size={16} /> Nova Assinatura
                            </button>
                        </div>
                        <div className="grid grid-cols-3 gap-4 overflow-y-auto custom-scrollbar">
                            {subs.length === 0 && <div className="col-span-3 text-center py-10 text-slate-500">Nenhuma assinatura encontrada.</div>}
                            {subs.map(sub => (
                                <div key={sub.id} className="bg-slate-800 p-6 rounded-2xl border border-slate-700 flex items-center justify-between group hover:border-violet-500 transition-colors">
                                    <div className="flex items-center gap-4">
                                        <div className="w-12 h-12 rounded-xl bg-slate-700 flex items-center justify-center text-2xl">
                                            {sub.categoryIcon}
                                        </div>
                                        <div>
                                            <div className="font-bold text-white text-lg">{sub.description}</div>
                                            <div className="text-sm text-slate-400">Recorrente Mensal</div>
                                        </div>
                                    </div>
                                    <div className="text-right">
                                        <div className="font-bold text-white text-xl">{formatMoney(sub.amount)}</div>
                                        <button onClick={() => { if (confirm('Remover assinatura?')) setTransactions(prev => prev.filter(x => x.id !== sub.id)) }} className="text-red-400 text-xs hover:underline mt-1 opacity-0 group-hover:opacity-100 transition-opacity">Remover</button>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                );
            case 'dashboard':
            default:
                return (
                    <div className="grid grid-cols-[2fr_1fr] gap-8 h-full overflow-hidden">
                        <div className="flex flex-col gap-8 h-full overflow-y-auto pr-2 custom-scrollbar">
                            {/* Chart Area */}
                            <div className="glass p-8 min-h-[350px]">
                                <h3 className="font-bold text-xl mb-8 text-white tracking-tight">Fluxo Mensal</h3>
                                <div className="h-64">
                                    <ResponsiveContainer width="100%" height="100%">
                                        <BarChart data={[{ name: 'Total', entrada: income, saida: expenses }]}>
                                            <XAxis dataKey="name" hide />
                                            <Tooltip contentStyle={{ background: '#0f172a', border: '1px solid rgba(255,255,255,0.05)', borderRadius: 16, boxShadow: '0 25px 50px -12px rgba(0,0,0,0.5)' }} cursor={{ fill: 'rgba(255,255,255,0.02)' }} />
                                            <Bar dataKey="entrada" fill="#10b981" radius={[8, 8, 4, 4]} barSize={90} />
                                            <Bar dataKey="saida" fill="#ef4444" radius={[8, 8, 4, 4]} barSize={90} />
                                        </BarChart>
                                    </ResponsiveContainer>
                                </div>
                            </div>

                            {/* Recent Activity */}
                            <div className="glass p-8">
                                <h3 className="font-bold text-xl mb-6 text-white tracking-tight">Últimas Atividades</h3>
                                <div className="space-y-4">
                                    {transactions.slice(0, 5).map(t => (
                                        <div key={t.id} className="flex justify-between items-center py-3 border-b border-white/[0.05] last:border-0 group hover:bg-slate-800/30 rounded-xl px-2 transition-colors -mx-2">
                                            <div className="flex items-center gap-4">
                                                <div className="w-12 h-12 rounded-2xl bg-slate-800/80 border border-white/5 flex items-center justify-center text-xl shadow-inner group-hover:scale-110 transition-transform">{t.categoryIcon}</div>
                                                <div>
                                                    <div className="font-semibold text-white">{t.description}</div>
                                                    <div className="text-sm text-slate-500">{new Date(t.date).toLocaleDateString()}</div>
                                                </div>
                                            </div>
                                            <div className={`font-bold font-outfit text-lg ${t.type === 'income' ? 'text-emerald-400' : 'text-slate-200'}`}>{formatMoney(t.amount)}</div>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        </div>

                        {/* Right Column (Cards) */}
                        <div className="flex flex-col gap-6">
                            <div className="bg-slate-900/60 backdrop-blur-2xl p-8 rounded-[2.5rem] border border-white/[0.08] shadow-2xl shadow-black/40 h-full overflow-hidden flex flex-col relative">
                                <div className="absolute top-0 right-0 w-64 h-64 bg-violet-600/10 blur-[80px] rounded-full -mr-20 -mt-20"></div>
                                <div className="absolute bottom-0 left-0 w-64 h-64 bg-slate-600/10 blur-[80px] rounded-full -ml-20 -mb-20"></div>

                                <div className="flex justify-between items-center mb-8 relative z-10">
                                    <h3 className="font-bold text-xl text-white tracking-tight">Meus Cartões</h3>
                                    <button onClick={() => setIsCardModalOpen(true)} className="p-3 bg-white/5 hover:bg-white/10 border border-white/10 rounded-xl transition-all text-white hover:scale-105 active:scale-95"><Plus size={18} /></button>
                                </div>

                                <div className="flex-1 overflow-y-auto space-y-4 pr-1 custom-scrollbar">
                                    {cards.length === 0 && <div className="text-center py-10 text-slate-500 text-sm border-2 border-dashed border-slate-700 rounded-xl">Nenhum cartão. Adicione um!</div>}

                                    {cards.map(card => {
                                        const bankPreset = BANKS.find(b => b.id === card.bankId) ||
                                            BANKS.find(b => b.name === card.bankName) ||
                                            BANKS.find(b => card.bankName && card.bankName.toLowerCase().includes(b.name.toLowerCase())) ||
                                            {};
                                        const gradient = card.gradient || bankPreset.gradient || 'linear-gradient(135deg, #64748b 0%, #475569 100%)';

                                        // Calculate pending amount for this card
                                        const pendingAmount = transactions
                                            .filter(t => t.cardId === card.id && t.status === 'pending')
                                            .reduce((acc, t) => acc + Number(t.amount), 0);

                                        return (
                                            <div key={card.id} className="relative rounded-2xl p-5 shadow-lg transform transition-transform hover:scale-[1.02]" style={{ background: gradient, color: card.text || bankPreset.text || 'white' }}>
                                                <div className="flex justify-between items-start mb-6">
                                                    <div>
                                                        <div className="font-bold text-lg tracking-wide">{card.bankName}</div>
                                                        <div className="w-8 h-6 bg-gradient-to-tr from-yellow-400 to-yellow-600 rounded mt-3 opacity-80"></div>
                                                    </div>
                                                    <CreditCard className="opacity-80" />
                                                </div>
                                                <div className="flex justify-between items-end">
                                                    <div>
                                                        <div className="text-[10px] uppercase opacity-80 mb-1">Fatura Aberta</div>
                                                        <div className="text-xl font-bold flex items-center gap-2">
                                                            {formatMoney(pendingAmount)}
                                                            {pendingAmount === 0 && <Check size={16} className="text-emerald-300" />}
                                                        </div>
                                                    </div>
                                                    <div className="text-right">
                                                        <div className="text-[10px] uppercase opacity-80">FECHA</div>
                                                        <div className="text-lg font-semibold">{dueDay || 'DD'}</div>
                                                    </div>
                                                </div>
                                                <button onClick={() => { if (confirm('Remover?')) deleteCard(card.id) }} className="absolute top-3 right-3 opacity-0 hover:opacity-100 text-white/50 hover:text-white transition-opacity"><Trash2 size={14} /></button>
                                            </div>
                                        )
                                    })}
                                </div>
                            </div>
                        </div>
                    </div>
                );
        }
    }

    const exportPDF = () => {
        import('jspdf').then(({ jsPDF }) => {
            import('jspdf-autotable').then(({ default: autoTable }) => {
                const doc = new jsPDF();

                // Header
                doc.setFillColor(15, 23, 42); // slate-900
                doc.rect(0, 0, 210, 40, 'F');
                doc.setTextColor(255, 255, 255);
                doc.setFontSize(22);
                doc.text('Relatório Financeiro', 14, 20);
                doc.setFontSize(10);
                doc.text(`Gerado em: ${new Date().toLocaleDateString()} - Meus Gastinhos`, 14, 30);

                // Summary
                doc.setTextColor(0, 0, 0);
                doc.setFontSize(12);
                doc.text(`Saldo: ${formatMoney(balance)} | Receitas: ${formatMoney(income)} | Despesas: ${formatMoney(expenses)}`, 14, 50);

                // Table
                const tableData = transactions
                    .sort((a, b) => new Date(b.date) - new Date(a.date))
                    .map(t => [
                        new Date(t.date).toLocaleDateString(),
                        t.categoryLabel,
                        t.description,
                        t.type === 'income' ? 'Receita' : 'Despesa',
                        formatMoney(t.amount)
                    ]);

                autoTable(doc, {
                    startY: 60,
                    head: [['Data', 'Categoria', 'Descrição', 'Tipo', 'Valor']],
                    body: tableData,
                    theme: 'grid',
                    headStyles: { fillColor: [124, 58, 237] }, // violet-600
                    styles: { fontSize: 9 },
                    alternateRowStyles: { fillColor: [241, 245, 249] } // slate-100
                });

                doc.save('relatorio-gastinhos.pdf');
            });
        });
    };

    return (
        <div className="flex h-screen bg-[#0b0f19] text-slate-200 overflow-hidden font-sans selection:bg-violet-500/30">
            {/* Sidebar */}
            <aside className="w-72 bg-slate-900/40 backdrop-blur-3xl border-r border-white/[0.05] p-6 flex flex-col relative overflow-hidden">
                {/* Glow effect sidebar */}
                <div className="absolute top-0 left-0 w-full h-64 bg-violet-600/10 blur-[100px] -z-10"></div>

                <div className="flex items-center gap-4 mb-10 mt-2">
                    <div className="relative">
                        <div className="w-14 h-14 bg-gradient-to-tr from-violet-600 to-indigo-500 rounded-2xl flex items-center justify-center shadow-xl shadow-violet-600/30 text-2xl border border-white/10">
                            {currentLevel.emoji}
                        </div>
                        <div className="absolute -bottom-2 -right-2 bg-slate-900 text-[10px] font-bold px-2 py-0.5 rounded-lg border border-slate-700 text-yellow-400">
                            Lvl
                        </div>
                    </div>
                    <div>
                        <h1 className="font-black text-2xl tracking-tight leading-none text-transparent bg-clip-text bg-gradient-to-r from-white to-slate-400 font-outfit">Gastinhos</h1>
                        <div className="flex flex-col mt-1">
                            <span className="text-xs font-medium text-slate-500">Olá, <span className="text-slate-300">{userName || 'Usuário'}</span></span>
                        </div>
                    </div>
                </div>

                <nav className="flex-1 space-y-2">
                    <MenuItem icon={<LayoutDashboard size={20} />} label="Visão Geral" active={activeTab === 'dashboard'} onClick={() => setActiveTab('dashboard')} />
                    <MenuItem icon={<Wallet size={20} />} label="Lançamentos" active={activeTab === 'transactions'} onClick={() => setActiveTab('transactions')} />
                    <MenuItem icon={<Zap size={20} />} label="Assinaturas" active={activeTab === 'subscriptions'} onClick={() => setActiveTab('subscriptions')} />
                    <MenuItem icon={<CalendarIcon size={20} />} label="Calendário" active={activeTab === 'calendar'} onClick={() => setActiveTab('calendar')} />
                    <MenuItem icon={<PieChart size={20} />} label="Relatórios" active={activeTab === 'reports'} onClick={() => setActiveTab('reports')} />
                </nav>

                <div className="mt-auto pt-6 border-t border-slate-800 space-y-2">
                    {isInstallable && (
                        <button onClick={install} className="w-full py-4 flex items-center gap-3 px-5 rounded-2xl bg-gradient-to-tr from-violet-600 to-indigo-500 hover:from-violet-500 hover:to-indigo-400 text-white transition-all shadow-lg shadow-violet-600/20 mb-2 active:scale-95 group">
                            <Download size={20} className="group-hover:animate-bounce" />
                            <span className="font-bold">Instalar App</span>
                        </button>
                    )}

                    <button onClick={() => setIsSettingsModalOpen(true)} className="w-full py-4 flex items-center gap-3 px-5 rounded-2xl text-slate-400 hover:bg-slate-800/80 hover:text-white border border-transparent hover:border-white/5 transition-all outline-none">
                        <Settings size={20} />
                        <span className="font-medium">Configurações</span>
                    </button>

                    <div className="grid grid-cols-2 gap-3 mb-4 mt-2">
                        <button onClick={handleBackup} className="py-3 flex items-center justify-center gap-2 text-slate-400 hover:text-white bg-slate-800/40 hover:bg-slate-700/60 border border-white/5 rounded-xl text-xs font-bold transition-all">
                            <Save size={14} /> Backup
                        </button>
                        <button onClick={handleRestore} className="py-3 flex items-center justify-center gap-2 text-slate-400 hover:text-white bg-slate-800/40 hover:bg-slate-700/60 border border-white/5 rounded-xl text-xs font-bold transition-all">
                            <Upload size={14} /> Restaurar
                        </button>
                    </div>
                    <button onClick={() => { if (confirm('⚠️ Resetar tudo?')) { localStorage.clear(); window.location.reload(); } }} className="w-full py-3 mt-2 flex items-center justify-center gap-2 text-red-500/70 hover:text-red-400 hover:bg-red-500/10 rounded-xl transition-colors font-semibold text-sm">
                        <Trash2 size={16} /> Resetar App
                    </button>
                </div>
            </aside>

            {/* Main */}
            <main className="flex-1 flex flex-col overflow-hidden relative">
                {/* Header Navbar */}
                <header className="h-24 px-10 flex justify-between items-center border-b border-white/[0.02] bg-transparent relative z-20">
                    <div className="flex items-center gap-6">
                        <h2 className="text-3xl font-black text-white font-outfit tracking-tight capitalize">{format(currentDate, 'MMMM yyyy', { locale: ptBR })}</h2>
                        <div className="flex bg-slate-900/80 border border-white/5 rounded-xl p-1 shadow-inner">
                            <button onClick={prevMonth} className="px-3 py-1.5 hover:bg-slate-800 rounded-lg hover:text-white text-slate-400 transition-colors"><ChevronLeft size={18} /></button>
                            <button onClick={nextMonth} className="px-3 py-1.5 hover:bg-slate-800 rounded-lg hover:text-white text-slate-400 transition-colors"><ChevronRight size={18} /></button>
                        </div>
                        <button onClick={() => setIsPrivacyMode(!isPrivacyMode)} className="p-3 bg-slate-900/40 border border-white/5 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800 transition-colors" title="Modo Privacidade">
                            {isPrivacyMode ? <EyeOff size={18} /> : <Eye size={18} />}
                        </button>
                    </div>
                    <div className="flex gap-4">
                        <button onClick={exportPDF} className="p-4 text-slate-400 hover:text-white bg-slate-900/50 rounded-2xl border border-white/10 hover:border-violet-500 hover:shadow-lg hover:shadow-violet-500/20 transition-all group" title="Baixar Relatório PDF">
                            <Download size={20} className="group-hover:-translate-y-1 transition-transform" />
                        </button>
                        <button onClick={() => setIsTxModalOpen(true)} className="btn-primary flex items-center gap-2 text-base px-8">
                            <Plus size={20} /> <span className="pt-0.5">Nova Transação</span>
                        </button>
                    </div>
                </header>

                <div className="flex-1 overflow-hidden p-10 relative z-10">
                    {activeTab === 'dashboard' && (
                        <div className="grid grid-cols-4 gap-6 mb-8">
                            <StatCard label="Saldo Total" value={balance} icon={<Wallet />} color="#8b5cf6" sub="Disponível" isPrivacyMode={isPrivacyMode} />
                            <StatCard label="Receita" value={income} icon={<ArrowUpRight />} color="#10b981" sub="Mensal" isPrivacyMode={isPrivacyMode} />
                            <StatCard label="Despesa" value={expenses} icon={<ArrowDownRight />} color="#ef4444" sub="Mensal" isPrivacyMode={isPrivacyMode} />
                            <StatCard label="Economia" value={income - expenses} icon={<DollarSign />} color="#3b82f6" sub="Reserva" isPrivacyMode={isPrivacyMode} />
                        </div>
                    )}
                    {renderContent()}
                </div>
            </main>

            {isTxModalOpen && <UnifiedTransactionForm isDesktop={true} onClose={() => setIsTxModalOpen(false)} onSave={t => { setTransactions([t, ...transactions]); setIsTxModalOpen(false) }} categories={CATEGORIES} cards={cards} />}
            {isCardModalOpen && <AddCardModal onClose={() => setIsCardModalOpen(false)} onSave={c => { addCard(c); setIsCardModalOpen(false) }} />}
            {isSubModalOpen && <SubscriptionModal onClose={() => setIsSubModalOpen(false)} onSave={t => { setTransactions([t, ...transactions]); setIsSubModalOpen(false) }} categories={CATEGORIES} cards={cards} />}
            {isSettingsModalOpen && <SettingsModal onClose={() => setIsSettingsModalOpen(false)} userName={userName} setUserName={setUserName} />}
            <SmartTips transactions={transactions} income={income} expenses={expenses} balance={balance} />
        </div>
    );
}
