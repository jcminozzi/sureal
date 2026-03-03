import React, { useState } from 'react';
import { CreditCard } from 'lucide-react';
import { BANKS } from '../constants/banks';

export function AddCardModal({ onClose, onSave }) {
    const [selectedBankKey, setSelectedBankKey] = useState(BANKS[0].id);
    const [dueDay, setDueDay] = useState('');
    const selectedBank = BANKS.find(b => b.id === selectedBankKey) || BANKS[0];

    return (
        <div className="fixed inset-0 z-[9999] bg-slate-900/80 backdrop-blur-sm flex items-center justify-center p-4">
            <div className="glass w-full max-w-[450px] p-8 rounded-[2rem] shadow-2xl relative overflow-hidden animate-in fade-in zoom-in-95">
                <div className="absolute top-0 right-0 w-64 h-64 bg-violet-600/10 blur-[80px] rounded-full -mr-20 -mt-20 pointer-events-none"></div>
                <h2 className="text-2xl font-black mb-6 text-white font-outfit tracking-tight text-gradient">Novo Cartão</h2>

                <div className="mb-6">
                    <label className="block text-sm text-slate-400 mb-2">Banco</label>
                    <div className="grid grid-cols-3 gap-3 max-h-48 overflow-y-auto pr-2 custom-scrollbar">
                        {BANKS.map(bank => (
                            <div key={bank.id} onClick={() => setSelectedBankKey(bank.id)}
                                className={`p-3 rounded-2xl cursor-pointer text-center border transition-all ${selectedBankKey === bank.id ? 'border-violet-500 bg-violet-500/10 shadow-inner' : 'border-white/5 hover:bg-slate-800/80 hover:border-white/10'}`}>
                                <div className="w-8 h-8 rounded-full mx-auto mb-2 shadow-sm" style={{ backgroundColor: bank.color }}></div>
                                <span className="text-[11px] font-bold uppercase tracking-wider text-slate-300">{bank.name}</span>
                            </div>
                        ))}
                    </div>
                </div>

                <div className="mb-6 relative z-10">
                    <label className="block text-xs font-bold uppercase tracking-wider text-slate-400 mb-2">Dia do Fechamento</label>
                    <input type="number" placeholder="Ex: 05" value={dueDay} onChange={e => setDueDay(e.target.value)}
                        className="input-field font-outfit font-bold text-lg" />
                    <small className="block mt-2 text-[10px] uppercase font-bold text-slate-500">Dia que a fatura fecha (melhor dia de compra).</small>
                </div>

                <div className="mb-8 relative z-10">
                    <label className="block text-xs font-bold uppercase tracking-wider text-slate-400 mb-2">Pré-visualização</label>
                    <div className="rounded-3xl p-6 h-48 relative shadow-2xl shadow-black/40 border border-white/20 overflow-hidden" style={{ background: selectedBank.gradient, color: selectedBank.text }}>
                        {/* Shine effect */}
                        <div className="absolute top-0 left-0 w-full h-full bg-gradient-to-tr from-white/0 via-white/20 to-white/0 opacity-30 transform -skew-x-12 translate-x-[-100%] hover:translate-x-[100%] transition-transform duration-1000"></div>

                        <div className="flex justify-between items-center">
                            <span className="font-black font-outfit text-xl tracking-tight">{selectedBank.name}</span>
                            <CreditCard size={28} className="opacity-80" />
                        </div>
                        <div className="absolute bottom-6 left-6">
                            <div className="text-[10px] font-bold tracking-widest uppercase opacity-70 mb-1">Fatura Atual</div>
                            <div className="text-3xl font-black font-outfit">R$ 0,00</div>
                        </div>
                        <div className="absolute bottom-6 right-6 text-right">
                            <div className="text-[10px] font-bold tracking-widest uppercase opacity-70 mb-1">FECHA</div>
                            <div className="text-xl font-black font-outfit">{dueDay || 'DD'}</div>
                        </div>
                    </div>
                </div>

                <div className="flex flex-col gap-3 relative z-10">
                    <button onClick={() => { if (dueDay) onSave({ id: Date.now().toString(), bankId: selectedBank.id, bankName: selectedBank.name, dueDay, color: selectedBank.color, gradient: selectedBank.gradient, text: selectedBank.text }); }}
                        className="btn-primary w-full text-base">Criar Cartão</button>
                    <button onClick={onClose} className="w-full py-4 rounded-2xl text-slate-400 hover:text-white hover:bg-slate-800/80 font-bold transition-colors">Cancelar</button>
                </div>
            </div>
        </div>
    );
}
