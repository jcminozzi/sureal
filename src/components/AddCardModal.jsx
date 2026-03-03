import React, { useState } from 'react';
import { CreditCard } from 'lucide-react';
import { BANKS } from '../constants/banks';

export function AddCardModal({ onClose, onSave }) {
    const [selectedBankKey, setSelectedBankKey] = useState(BANKS[0].id);
    const [dueDay, setDueDay] = useState('');
    const selectedBank = BANKS.find(b => b.id === selectedBankKey) || BANKS[0];

    return (
        <div className="fixed inset-0 z-[9999] bg-black/60 backdrop-blur-sm flex items-center justify-center">
            <div className="bg-slate-800 w-[450px] p-8 rounded-2xl shadow-2xl border border-slate-700 animate-in fade-in zoom-in-95">
                <h2 className="text-2xl font-bold mb-6 text-white">Novo Cartão</h2>

                <div className="mb-6">
                    <label className="block text-sm text-slate-400 mb-2">Banco</label>
                    <div className="grid grid-cols-3 gap-3 max-h-48 overflow-y-auto pr-2 custom-scrollbar">
                        {BANKS.map(bank => (
                            <div key={bank.id} onClick={() => setSelectedBankKey(bank.id)}
                                className={`p-3 rounded-xl cursor-pointer text-center border transition-all ${selectedBankKey === bank.id ? 'border-violet-500 bg-violet-500/10' : 'border-slate-600 hover:bg-slate-700/50'}`}>
                                <div className="w-6 h-6 rounded-full mx-auto mb-2" style={{ backgroundColor: bank.color }}></div>
                                <span className="text-xs font-medium text-slate-300">{bank.name}</span>
                            </div>
                        ))}
                    </div>
                </div>

                <div className="mb-6">
                    <label className="block text-sm text-slate-400 mb-2">Dia do Fechamento</label>
                    <input type="number" placeholder="Ex: 05" value={dueDay} onChange={e => setDueDay(e.target.value)}
                        className="w-full bg-slate-900 border border-slate-600 rounded-xl p-3 text-white outline-none focus:border-violet-500" />
                    <small className="block mt-2 text-xs text-slate-500">Dia que a fatura fecha (melhor dia de compra).</small>
                </div>

                <div className="mb-8">
                    <label className="block text-sm text-slate-400 mb-2">Pré-visualização</label>
                    <div className="rounded-2xl p-6 h-44 relative shadow-lg" style={{ background: selectedBank.gradient, color: selectedBank.text }}>
                        <div className="flex justify-between items-center">
                            <span className="font-bold text-lg">{selectedBank.name}</span>
                            <CreditCard size={24} />
                        </div>
                        <div className="absolute bottom-5 left-6">
                            <div className="text-xs opacity-80 mb-1">Fatura Atual</div>
                            <div className="text-2xl font-bold">R$ 0,00</div>
                        </div>
                        <div className="absolute bottom-5 right-6 text-right">
                            <div className="text-xs opacity-80 mb-1">FECHA</div>
                            <div className="text-lg font-semibold">{dueDay || 'DD'}</div>
                        </div>
                    </div>
                </div>

                <div className="flex flex-col gap-3">
                    <button onClick={() => { if (dueDay) onSave({ id: Date.now().toString(), bankId: selectedBank.id, bankName: selectedBank.name, dueDay, color: selectedBank.color, gradient: selectedBank.gradient, text: selectedBank.text }); }}
                        className="w-full py-3 bg-violet-600 hover:bg-violet-700 text-white font-bold rounded-xl transition-colors">Criar Cartão</button>
                    <button onClick={onClose} className="w-full py-3 text-slate-400 hover:text-white font-medium transition-colors">Cancelar</button>
                </div>
            </div>
        </div>
    );
}
