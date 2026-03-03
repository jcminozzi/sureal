import React, { useState, useEffect } from 'react';
import { Lightbulb, X, TrendingUp, AlertTriangle, ThumbsUp } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

export function SmartTips({ transactions, income, expenses, balance }) {
    const [tips, setTips] = useState([]);
    const [currentTipIndex, setCurrentTipIndex] = useState(0);
    const [isVisible, setIsVisible] = useState(true);

    useEffect(() => {
        const generateTips = () => {
            const newTips = [];

            // 1. Balance Health
            if (income > 0 && expenses > income * 0.9) {
                newTips.push({
                    id: 'high-expense',
                    icon: <AlertTriangle className="text-red-400" />,
                    title: 'Atenção aos Gastos',
                    text: 'Você já gastou mais de 90% da sua renda este mês. Que tal segurar um pouco?',
                    color: 'bg-red-500/10 border-red-500/50'
                });
            } else if (income > 0 && expenses < income * 0.5) {
                newTips.push({
                    id: 'good-saving',
                    icon: <ThumbsUp className="text-emerald-400" />,
                    title: 'Ótima Economia!',
                    text: 'Você economizou mais de 50% da sua renda. Já pensou em investir esse valor?',
                    color: 'bg-emerald-500/10 border-emerald-500/50'
                });
            }

            // 2. Category Analysis
            const catMap = {};
            transactions.filter(t => t.type === 'expense').forEach(t => {
                if (!catMap[t.categoryLabel]) catMap[t.categoryLabel] = 0;
                catMap[t.categoryLabel] += Number(t.amount);
            });

            const sortedCats = Object.entries(catMap).sort((a, b) => b[1] - a[1]);
            if (sortedCats.length > 0) {
                const topCat = sortedCats[0];
                const percentage = income > 0 ? Math.round((topCat[1] / income) * 100) : 0;

                if (percentage > 30) {
                    newTips.push({
                        id: 'top-category',
                        icon: <TrendingUp className="text-amber-400" />,
                        title: `Gastos com ${topCat[0]}`,
                        text: `${topCat[0]} representa ${percentage}% da sua renda. Tente estabelecer um limite para esta categoria.`,
                        color: 'bg-amber-500/10 border-amber-500/50'
                    });
                }
            }

            // 3. Recurring Expenses
            const recurringCount = transactions.filter(t => t.recurring).length;
            if (recurringCount > 5) {
                newTips.push({
                    id: 'recurring',
                    icon: <Lightbulb className="text-violet-400" />,
                    title: 'Muitas Assinaturas?',
                    text: `Você tem ${recurringCount} despesas fixas. Revise se ainda usa todos esses serviços.`,
                    color: 'bg-violet-500/10 border-violet-500/50'
                });
            }

            // Default Tip
            if (newTips.length === 0) {
                newTips.push({
                    id: 'default',
                    icon: <Lightbulb className="text-blue-400" />,
                    title: 'Dica do Dia',
                    text: 'Registre seus gastos diariamente para ter um controle mais preciso das suas finanças.',
                    color: 'bg-blue-500/10 border-blue-500/50'
                });
            }

            setTips(newTips);
        };

        generateTips();
    }, [transactions, income, expenses]);

    if (!isVisible || tips.length === 0) return null;

    const currentTip = tips[currentTipIndex];

    const nextTip = () => {
        setCurrentTipIndex((prev) => (prev + 1) % tips.length);
    };

    return (
        <AnimatePresence>
            <motion.div
                initial={{ opacity: 0, y: 50, scale: 0.9 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, scale: 0.9 }}
                className={`fixed bottom-24 left-6 right-6 sm:left-auto sm:right-6 sm:bottom-6 sm:w-80 p-4 rounded-2xl border backdrop-blur-md shadow-xl z-40 ${currentTip.color} flex flex-col gap-3`}
            >
                <div className="flex justify-between items-start">
                    <div className="flex items-center gap-3">
                        <div className="p-2 bg-slate-900/50 rounded-lg">
                            {currentTip.icon}
                        </div>
                        <h4 className="font-bold text-white text-sm">{currentTip.title}</h4>
                    </div>
                    <button onClick={() => setIsVisible(false)} className="text-slate-400 hover:text-white transition-colors">
                        <X size={16} />
                    </button>
                </div>

                <p className="text-xs text-slate-300 leading-relaxed">
                    {currentTip.text}
                </p>

                {tips.length > 1 && (
                    <div className="flex justify-between items-center mt-1">
                        <div className="flex gap-1">
                            {tips.map((_, idx) => (
                                <div key={idx} className={`w-1.5 h-1.5 rounded-full ${idx === currentTipIndex ? 'bg-white' : 'bg-white/20'}`}></div>
                            ))}
                        </div>
                        <button onClick={nextTip} className="text-[10px] font-bold text-slate-400 hover:text-white uppercase tracking-wider">
                            Próxima
                        </button>
                    </div>
                )}
            </motion.div>
        </AnimatePresence>
    );
}
