import React, { useState } from 'react';
import { X, Check, Music, Video, ShoppingBag, Zap } from 'lucide-react';

const PRESETS = [
    { id: 'spotify', name: 'Spotify', icon: <Music />, color: '#1DB954', category: 'Lazer', cost: 21.90 },
    { id: 'netflix', name: 'Netflix', icon: <Video />, color: '#E50914', category: 'Lazer', cost: 39.90 },
    { id: 'youtube', name: 'YouTube Premium', icon: <Video />, color: '#FF0000', category: 'Lazer', cost: 24.90 },
    { id: 'amazon', name: 'Amazon Prime', icon: <ShoppingBag />, color: '#00A8E1', category: 'Serviços', cost: 19.90 },
    { id: 'disney', name: 'Disney+', icon: <Video />, color: '#113CCF', category: 'Lazer', cost: 33.90 },
    { id: 'hbo', name: 'HBO Max', icon: <Video />, color: '#5822B4', category: 'Lazer', cost: 34.90 },
    { id: 'deezer', name: 'Deezer', icon: <Music />, color: '#EF5466', category: 'Lazer', cost: 22.90 },
    { id: 'cinemark', name: 'Cinemark Club', icon: <Video />, color: '#B5121B', category: 'Lazer', cost: 29.90 },
];

export function SubscriptionModal({ onClose, onSave, categories, cards }) {
    const [selectedPreset, setSelectedPreset] = useState(null);
    const [customName, setCustomName] = useState('');
    const [amount, setAmount] = useState('');
    const [selectedCardId, setSelectedCardId] = useState('');
    const [day, setDay] = useState('10');

    const handlePresetSelect = (preset) => {
        setSelectedPreset(preset);
        setCustomName(preset.name);
        setAmount(preset.cost.toFixed(2).replace('.', ','));
    };

    const handleSubmit = () => {
        if (!customName || !amount) return;

        const val = parseFloat(amount.replace(/\./g, '').replace(',', '.'));
        const category = categories.find(c => c.label === (selectedPreset?.category || 'Serviços')) || categories[0];

        onSave({
            id: Date.now().toString(),
            description: customName,
            amount: val,
            type: 'expense',
            status: selectedCardId ? 'pending' : 'paid', // Credit card = pending, Debit/Account = paid (assumed auto-debit)
            date: new Date().toISOString(), // Will need logic to repeat this monthly
            categoryIcon: category.icon,
            categoryLabel: category.label,
            cardId: selectedCardId || null,
            recurring: true,
            isSubscription: true,
            subscriptionService: selectedPreset?.id || 'custom'
        });
    };

    return (
        <div className="fixed inset-0 z-[9999] bg-black/60 backdrop-blur-sm flex items-center justify-center">
            <div className="bg-slate-800 w-[600px] p-8 rounded-2xl shadow-2xl border border-slate-700 animate-in fade-in zoom-in-95 max-h-[90vh] overflow-y-auto custom-scrollbar">
                <div className="flex justify-between items-center mb-6">
                    <h2 className="text-2xl font-bold text-white">Adicionar Assinatura</h2>
                    <button onClick={onClose} className="text-slate-400 hover:text-white"><X /></button>
                </div>

                <div className="mb-6">
                    <label className="block text-sm text-slate-400 mb-3">Escolha um serviço ou crie o seu:</label>
                    <div className="grid grid-cols-4 gap-3">
                        {PRESETS.map(preset => (
                            <button
                                key={preset.id}
                                onClick={() => handlePresetSelect(preset)}
                                className={`p-3 rounded-xl border flex flex-col items-center gap-2 transition-all ${selectedPreset?.id === preset.id ? 'bg-violet-600/20 border-violet-500 text-white' : 'bg-slate-700/30 border-slate-700 text-slate-400 hover:bg-slate-700'}`}
                            >
                                <div className="w-8 h-8 rounded-full flex items-center justify-center text-white" style={{ backgroundColor: preset.color }}>
                                    {preset.icon}
                                </div>
                                <span className="text-[10px] font-medium text-center leading-tight">{preset.name}</span>
                            </button>
                        ))}
                        <button
                            onClick={() => { setSelectedPreset(null); setCustomName(''); setAmount(''); }}
                            className={`p-3 rounded-xl border flex flex-col items-center gap-2 transition-all ${!selectedPreset ? 'bg-violet-600/20 border-violet-500 text-white' : 'bg-slate-700/30 border-slate-700 text-slate-400 hover:bg-slate-700'}`}
                        >
                            <div className="w-8 h-8 rounded-full bg-slate-600 flex items-center justify-center text-white">
                                <Zap size={16} />
                            </div>
                            <span className="text-[10px] font-medium text-center leading-tight">Outro</span>
                        </button>
                    </div>
                </div>

                <div className="space-y-4 mb-8">
                    <div>
                        <label className="block text-xs text-slate-400 mb-1">Nome do Serviço</label>
                        <input type="text" value={customName} onChange={e => setCustomName(e.target.value)} className="w-full bg-slate-900 border border-slate-600 rounded-xl p-3 text-white outline-none focus:border-violet-500" placeholder="Ex: Academia" />
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <label className="block text-xs text-slate-400 mb-1">Valor Mensal</label>
                            <input type="text" value={amount} onChange={e => setAmount(e.target.value)} className="w-full bg-slate-900 border border-slate-600 rounded-xl p-3 text-white outline-none focus:border-violet-500" placeholder="0,00" />
                        </div>
                        <div>
                            <label className="block text-xs text-slate-400 mb-1">Dia do Pagamento</label>
                            <input type="number" value={day} onChange={e => setDay(e.target.value)} className="w-full bg-slate-900 border border-slate-600 rounded-xl p-3 text-white outline-none focus:border-violet-500" placeholder="Dia" min="1" max="31" />
                        </div>
                    </div>

                    <div>
                        <label className="block text-xs text-slate-400 mb-1">Forma de Pagamento</label>
                        <select value={selectedCardId} onChange={e => setSelectedCardId(e.target.value)} className="w-full bg-slate-900 border border-slate-600 rounded-xl p-3 text-white outline-none focus:border-violet-500">
                            <option value="">Débito Automático / Pix</option>
                            {cards.map(c => <option key={c.id} value={c.id}>Cartão {c.bankName}</option>)}
                        </select>
                    </div>
                </div>

                <button onClick={handleSubmit} disabled={!customName || !amount} className="w-full py-4 bg-violet-600 hover:bg-violet-700 disabled:opacity-50 disabled:cursor-not-allowed text-white font-bold rounded-xl shadow-lg shadow-violet-600/20 active:scale-95 transition-all flex items-center justify-center gap-2">
                    <Check size={20} /> Salvar Assinatura
                </button>
            </div>
        </div>
    );
}
