import React, { useState, useEffect } from 'react';
import {
  Plus, TrendingUp, TrendingDown, X, Trash2, Check, CreditCard,
  Mic, Camera, Loader2, Repeat
} from 'lucide-react';
import { motion } from 'framer-motion';
import { useVoiceInput } from '../hooks/useVoiceInput';
import { useOCR } from '../hooks/useOCR';
import { parseVoiceCommand } from '../utils/voiceParser';
import { validateTransaction, formatAmount, parseAmount } from '../utils/financial';

export function UnifiedTransactionForm({ 
  onClose, 
  onSave, 
  categories, 
  cards, 
  isDesktop = true,
  initialData = null 
}) {
  const [amount, setAmount] = useState(initialData?.amount ? formatAmount(initialData.amount) : '');
  const [description, setDescription] = useState(initialData?.description || '');
  const [type, setType] = useState(initialData?.type || 'expense');
  const [selectedCategory, setSelectedCategory] = useState(initialData?.categoryLabel ? categories.find(c => c.label === initialData.categoryLabel) : null);
  const [paymentMethod, setPaymentMethod] = useState(initialData?.cardId ? 'credit' : 'debit');
  const [selectedCardId, setSelectedCardId] = useState(initialData?.cardId || '');
  const [isInstallment, setIsInstallment] = useState(initialData?.installment ? true : false);
  const [installmentsCount, setInstallmentsCount] = useState(initialData?.installment ? parseInt(initialData.installment.split('/')[1]) : 2);
  const [isRecurring, setIsRecurring] = useState(initialData?.recurring || false);
  const [errors, setErrors] = useState([]);

  const { isListening, transcript, startListening, stopListening, isSupported, error: voiceError } = useVoiceInput();
  const { processImage, isProcessing, progress } = useOCR();

  useEffect(() => {
    if (transcript) {
      const { type: newType, amount: newAmount, category: newCategory, description: newDesc } = parseVoiceCommand(transcript);

      if (newType) setType(newType);
      if (newAmount) setAmount(newAmount.toFixed(2).replace('.', ','));
      if (newCategory) setSelectedCategory(newCategory);
      if (newDesc) setDescription(newDesc);
    }
  }, [transcript]);

  const handleImageUpload = async (e) => {
    const file = e.target.files[0];
    if (file) {
      const data = await processImage(file);
      if (data) {
        if (data.amount) setAmount(data.amount.toFixed(2).replace('.', ','));
        if (data.category) setSelectedCategory(data.category);
        if (data.description) setDescription(data.description);
      }
    }
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    setErrors([]);

    if (!amount || !selectedCategory) {
      setErrors(['Preencha todos os campos obrigatórios']);
      return;
    }

    const transaction = {
      id: initialData?.id || Date.now().toString(),
      description: description || selectedCategory.label,
      amount: parseAmount(amount),
      type,
      status: (type === 'expense' && paymentMethod === 'credit') ? 'pending' : 'paid',
      date: initialData?.date || new Date().toISOString(),
      categoryIcon: selectedCategory.icon,
      categoryLabel: selectedCategory.label,
      cardId: (type === 'expense' && paymentMethod === 'credit') ? selectedCardId : null,
      installment: (type === 'expense' && paymentMethod === 'credit' && isInstallment) ? `1 / ${installmentsCount} ` : null,
      recurring: isRecurring
    };

    const validation = validateTransaction(transaction);
    if (!validation.isValid) {
      setErrors(validation.errors);
      return;
    }

    onSave(transaction);
  };

  const containerClass = isDesktop
    ? "fixed inset-0 z-[9999] bg-black/60 backdrop-blur-sm flex items-center justify-center"
    : "fixed inset-0 z-[9999] bg-slate-900/95 backdrop-blur-sm flex flex-col items-center justify-end sm:justify-center";

  const formClass = isDesktop
    ? "bg-slate-800 w-[500px] p-8 rounded-2xl shadow-2xl border border-slate-700 animate-in fade-in zoom-in-95"
    : "w-full h-[90vh] sm:h-auto sm:max-w-md bg-slate-800 rounded-t-3xl sm:rounded-3xl p-6 shadow-2xl overflow-y-auto border-t border-slate-700";

  return (
    <motion.div
      initial={{ opacity: 0 }} 
      animate={{ opacity: 1 }} 
      exit={{ opacity: 0 }}
      className={containerClass}
    >
      <motion.div
        initial={isDesktop ? { scale: 0.9, opacity: 0 } : { y: "100%" }}
        animate={isDesktop ? { scale: 1, opacity: 1 } : { y: 0 }}
        exit={isDesktop ? { scale: 0.9, opacity: 0 } : { y: "100%" }}
        transition={{ type: "spring", damping: 25, stiffness: 300 }}
        className={formClass}
      >
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-xl font-bold text-white">{initialData ? 'Editar Transação' : 'Nova Transação'}</h2>
          <button 
            onClick={onClose} 
            className="p-2 rounded-full hover:bg-slate-700 transition-colors text-slate-200"
          >
            <X size={24} />
          </button>
        </div>

        {/* Erros */}
        {errors.length > 0 && (
          <div className="mb-4 p-3 bg-red-500/20 border border-red-500/50 rounded-xl text-red-300 text-xs space-y-1">
            {errors.map((error, idx) => <div key={idx}>• {error}</div>)}
          </div>
        )}

        {/* Smart Input Buttons */}
        <div className="grid grid-cols-2 gap-3 mb-6">
          {isSupported && (
            <button
              type="button"
              onClick={isListening ? stopListening : startListening}
              className={`py-3 rounded-xl font-bold flex items-center justify-center gap-2 transition-all text-sm ${
                isListening 
                  ? 'bg-red-500/20 text-red-400 border border-red-500 animate-pulse' 
                  : 'bg-violet-600/10 text-violet-400 border border-violet-500/30 hover:bg-violet-600/20'
              }`}
            >
              <Mic size={18} className={isListening ? 'animate-bounce' : ''} />
              {isListening ? 'Ouvindo...' : 'Voz'}
            </button>
          )}

          <label className={`py-3 rounded-xl font-bold flex items-center justify-center gap-2 transition-all text-sm cursor-pointer ${
            isProcessing 
              ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500' 
              : 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/30 hover:bg-emerald-500/20'
          }`}>
            {isProcessing ? <Loader2 size={18} className="animate-spin" /> : <Camera size={18} />}
            {isProcessing ? `${progress}%` : 'Foto/Scan'}
            <input 
              type="file" 
              accept="image/*" 
              className="hidden" 
              onChange={handleImageUpload} 
              disabled={isProcessing} 
            />
          </label>
        </div>

        {voiceError && (
          <div className="mb-4 p-3 bg-red-500/20 border border-red-500/50 rounded-xl text-red-300 text-xs text-center">
            {voiceError}
          </div>
        )}

        {/* Tipo de Transação */}
        <div className="flex gap-3 mb-6">
          <button
            type="button"
            onClick={() => setType('income')}
            className={`flex-1 py-4 rounded-xl font-bold flex items-center justify-center gap-2 transition-all ${
              type === 'income' 
                ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/50' 
                : 'bg-slate-700/50 text-slate-400'
            }`}
          >
            <TrendingUp size={20} /> Receita
          </button>
          <button
            type="button"
            onClick={() => setType('expense')}
            className={`flex-1 py-4 rounded-xl font-bold flex items-center justify-center gap-2 transition-all ${
              type === 'expense' 
                ? 'bg-red-500/20 text-red-400 border border-red-500/50' 
                : 'bg-slate-700/50 text-slate-400'
            }`}
          >
            <TrendingDown size={20} /> Despesa
          </button>
        </div>

        {/* Valor */}
        <div className="mb-6">
          <input
            type="tel"
            placeholder="R$ 0,00"
            value={amount}
            onChange={e => setAmount(e.target.value)}
            className="w-full bg-transparent text-center text-5xl font-bold text-white placeholder-slate-600 outline-none pb-2 border-b-2 border-slate-700 focus:border-violet-500 transition-colors"
            autoFocus
          />
        </div>

        {/* Método de Pagamento */}
        {type === 'expense' && (
          <div className="space-y-4 mb-6">
            <div className="flex gap-2">
              <button
                type="button"
                onClick={() => setPaymentMethod('debit')}
                className={`flex-1 py-2 rounded-lg text-sm font-semibold transition-colors ${
                  paymentMethod === 'debit' 
                    ? 'bg-blue-600 text-white' 
                    : 'bg-slate-700 text-slate-400'
                }`}
              >
                Débito/Dinheiro
              </button>
              <button
                type="button"
                onClick={() => setPaymentMethod('credit')}
                className={`flex-1 py-2 rounded-lg text-sm font-semibold transition-colors ${
                  paymentMethod === 'credit' 
                    ? 'bg-violet-600 text-white' 
                    : 'bg-slate-700 text-slate-400'
                }`}
              >
                Crédito
              </button>
            </div>

            {paymentMethod === 'credit' && (
              <motion.div 
                initial={{ opacity: 0, height: 0 }} 
                animate={{ opacity: 1, height: 'auto' }}
                className="bg-slate-900/50 p-4 rounded-xl border border-slate-700 space-y-4"
              >
                <div>
                  <label className="block text-sm text-slate-400 mb-2">Cartão</label>
                  <select 
                    value={selectedCardId} 
                    onChange={e => setSelectedCardId(e.target.value)}
                    className="w-full bg-slate-800 text-white p-3 rounded-lg outline-none border border-slate-600 focus:border-violet-500"
                  >
                    <option value="">Selecione...</option>
                    {cards.map(c => <option key={c.id} value={c.id}>{c.bankName}</option>)}
                  </select>
                </div>

                <div className="flex items-center gap-3">
                  <input 
                    type="checkbox" 
                    id="installment" 
                    checked={isInstallment} 
                    onChange={e => setIsInstallment(e.target.checked)} 
                    className="w-5 h-5 accent-violet-600" 
                  />
                  <label htmlFor="installment" className="text-sm text-slate-300">Parcelar?</label>
                </div>

                {isInstallment && (
                  <div>
                    <div className="flex items-center gap-4">
                      <input 
                        type="range" 
                        min="2" 
                        max="12" 
                        value={installmentsCount} 
                        onChange={e => setInstallmentsCount(parseInt(e.target.value))} 
                        className="flex-1 accent-violet-600" 
                      />
                      <span className="font-bold text-lg w-10 text-center text-white">{installmentsCount}x</span>
                    </div>
                  </div>
                )}
              </motion.div>
            )}
          </div>
        )}

        {/* Categoria */}
        <div className="mb-6">
          <label className="block text-sm text-slate-400 mb-2">Categoria</label>
          <div className="grid grid-cols-5 gap-2 max-h-32 overflow-y-auto pr-2">
            {categories.map(cat => (
              <button
                type="button"
                key={cat.id}
                onClick={() => setSelectedCategory(cat)}
                className={`flex flex-col items-center justify-center p-2 rounded-xl transition-all ${
                  selectedCategory?.id === cat.id 
                    ? 'bg-violet-600 text-white scale-105' 
                    : 'bg-slate-700/30 text-slate-400 hover:bg-slate-700'
                }`}
              >
                <span className="text-2xl mb-1">{cat.icon}</span>
                <span className="text-[10px] font-medium truncate w-full text-center">{cat.label}</span>
              </button>
            ))}
          </div>
        </div>

        {/* Descrição */}
        <div className="mb-6">
          <input 
            type="text" 
            placeholder="Descrição (Opcional)" 
            value={description} 
            onChange={e => setDescription(e.target.value)}
            className="w-full bg-slate-900/50 border border-slate-700 rounded-xl p-4 text-white outline-none focus:border-violet-500"
          />
        </div>

        {/* Recorrente */}
        <div className="mb-6 flex items-center gap-3 px-2">
          <input 
            type="checkbox" 
            id="recurring" 
            checked={isRecurring} 
            onChange={e => setIsRecurring(e.target.checked)}
            className="w-5 h-5 accent-violet-600 rounded" 
          />
          <label htmlFor="recurring" className="text-slate-300 text-sm flex items-center gap-2">
            <Repeat size={16} /> Repetir todo mês (Fixo)
          </label>
        </div>

        {/* Botão Submit */}
        <button 
          onClick={handleSubmit}
          disabled={!amount || !selectedCategory}
          className={`w-full py-4 bg-gradient-to-r from-violet-600 to-indigo-600 text-white font-bold rounded-xl shadow-lg shadow-violet-500/25 active:scale-95 disabled:opacity-50 disabled:active:scale-100 transition-all flex items-center justify-center gap-2 ${
            isDesktop ? '' : 'mt-8'
          }`}
        >
          <Check size={20} /> {initialData ? 'Atualizar' : 'Confirmar'} Lançamento
        </button>
      </motion.div>
    </motion.div>
  );
}
