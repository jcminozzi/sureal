import React, { useState } from 'react';
import { X, Save, User } from 'lucide-react';

export function SettingsModal({ onClose, userName, setUserName }) {
    const [name, setName] = useState(userName);

    const handleSave = () => {
        if (name.trim()) {
            setUserName(name);
            localStorage.setItem('user_name', name);
            onClose();
        }
    };

    return (
        <div className="fixed inset-0 z-[9999] bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
            <div className="bg-slate-800 w-full max-w-md p-6 rounded-2xl shadow-2xl border border-slate-700 animate-in fade-in zoom-in-95">
                <div className="flex justify-between items-center mb-6">
                    <h2 className="text-xl font-bold text-white flex items-center gap-2">
                        <User size={24} className="text-violet-500" />
                        Configurações
                    </h2>
                    <button onClick={onClose} className="text-slate-400 hover:text-white transition-colors">
                        <X size={24} />
                    </button>
                </div>

                <div className="mb-6">
                    <label className="block text-sm text-slate-400 mb-2">Seu Nome / Apelido</label>
                    <input
                        type="text"
                        value={name}
                        onChange={(e) => setName(e.target.value)}
                        className="w-full bg-slate-900 border border-slate-600 rounded-xl p-3 text-white outline-none focus:border-violet-500 transition-colors"
                        placeholder="Como quer ser chamado?"
                        autoFocus
                    />
                </div>

                <button
                    onClick={handleSave}
                    disabled={!name.trim()}
                    className="w-full py-3 bg-violet-600 hover:bg-violet-700 text-white font-bold rounded-xl shadow-lg shadow-violet-600/20 active:scale-95 transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                >
                    <Save size={20} />
                    Salvar Alterações
                </button>
            </div>
        </div>
    );
}
