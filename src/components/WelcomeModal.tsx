import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Check } from 'lucide-react';

export function WelcomeModal({ onSave }) {
    const [name, setName] = useState('');

    const handleSubmit = (e) => {
        e.preventDefault();
        if (name.trim()) {
            onSave(name.trim());
        }
    };

    return (
        <div className="fixed inset-0 z-[9999] bg-slate-950/90 backdrop-blur-md flex items-center justify-center p-4">
            <motion.div
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                className="bg-slate-900 border border-slate-800 p-8 rounded-3xl max-w-md w-full shadow-2xl relative overflow-hidden"
            >
                {/* Decorative background elements */}
                <div className="absolute top-0 right-0 w-64 h-64 bg-violet-600/10 rounded-full blur-3xl -mr-32 -mt-32 pointer-events-none"></div>
                <div className="absolute bottom-0 left-0 w-64 h-64 bg-emerald-500/10 rounded-full blur-3xl -ml-32 -mb-32 pointer-events-none"></div>

                <div className="relative z-10 text-center">
                    <div className="w-20 h-20 bg-gradient-to-br from-violet-600 to-indigo-600 rounded-2xl mx-auto mb-6 flex items-center justify-center text-4xl shadow-lg shadow-violet-600/20">
                        👋
                    </div>

                    <h2 className="text-3xl font-bold text-white mb-2">Bem-vindo(a)!</h2>
                    <p className="text-slate-400 mb-8">Como você gostaria de ser chamado(a)?</p>

                    <form onSubmit={handleSubmit}>
                        <input
                            autoFocus
                            type="text"
                            placeholder="Seu nome ou apelido"
                            value={name}
                            onChange={(e) => setName(e.target.value)}
                            className="w-full bg-slate-800/50 border border-slate-700 rounded-xl p-4 text-center text-xl text-white outline-none focus:border-violet-500 focus:bg-slate-800 transition-all mb-6 placeholder-slate-600"
                        />

                        <button
                            type="submit"
                            disabled={!name.trim()}
                            className="w-full py-4 bg-violet-600 hover:bg-violet-700 disabled:opacity-50 disabled:cursor-not-allowed text-white font-bold rounded-xl shadow-lg shadow-violet-600/25 active:scale-95 transition-all flex items-center justify-center gap-2"
                        >
                            Começar <Check size={20} />
                        </button>
                    </form>
                </div>
            </motion.div>
        </div>
    );
}
