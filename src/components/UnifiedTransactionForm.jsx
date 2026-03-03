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
    ? "glass w-[500px] p-8 rounded-[2rem] shadow-2xl relative overflow-hidden animate-in fade-in zoom-in-95"
    : "w-full h-[90vh] sm:h-auto sm:max-w-md bg-slate-900/95 backdrop-blur-2xl rounded-t-[2.5rem] sm:rounded-3xl p-8 shadow-2xl overflow-y-auto border-t border-white/[0.08]";

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
        {isDesktop && <div className="absolute top-0 right-0 w-64 h-64 bg-violet-600/10 blur-[80px] rounded-full -mr-20 -mt-20 pointer-events-none"></div>}

        <div className="flex justify-between items-center mb-8 relative z-10">
          <h2 className="text-2xl font-black font-outfit text-white tracking-tight text-gradient">{initialData ? 'Editar Transação' : 'Nova Transação'}</h2>
          <button
            onClick={onClose}
            className="p-3 bg-white/5 border border-white/5 rounded-2xl hover:bg-white/10 hover:border-white/10 hover:scale-105 active:scale-95 transition-all text-slate-300 hover:text-white"
          >
            <X size={20} />
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
              className={`py-3 rounded-xl font-bold flex items-center justify-center gap-2 transition-all text-sm ${isListening
                  ? 'bg-red-500/20 text-red-400 border border-red-500 animate-pulse'
                  : 'bg-violet-600/10 text-violet-400 border border-violet-500/30 hover:bg-violet-600/20'
                }`}
            >
              <Mic size={18} className={isListening ? 'animate-bounce' : ''} />
              {isListening ? 'Ouvindo...' : 'Voz'}
            </button>
          )}

          <label className={`py-3 rounded-xl font-bold flex items-center justify-center gap-2 transition-all text-sm cursor-pointer ${isProcessing
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
        <div className="flex gap-3 mb-8 relative z-10">
          <button
            type="button"
            onClick={() => setType('income')}
            className={`flex-1 py-4 rounded-2xl font-bold flex items-center justify-center gap-2 transition-all ${type === 'income'
                ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/50 shadow-inner'
                : 'bg-slate-800/50 text-slate-400 border border-transparent hover:bg-slate-800/80 hover:border-white/5'
              }`}
          >
            <TrendingUp size={20} /> Receita
          </button>
          <button
            type="button"
            onClick={() => setType('expense')}
            className={`flex-1 py-4 rounded-2xl font-bold flex items-center justify-center gap-2 transition-all ${type === 'expense'
                ? 'bg-red-500/20 text-red-400 border border-red-500/50 shadow-inner'
                : 'bg-slate-800/50 text-slate-400 border border-transparent hover:bg-slate-800/80 hover:border-white/5'
              }`}
          >
            <TrendingDown size={20} /> Despesa
          </button>
        </div>

        {/* Valor */}
        <div className="mb-8 relative z-10 flex flex-col items-center">
          <span className="text-slate-400 font-bold uppercase tracking-widest text-[10px] mb-2">{type === 'income' ? 'Valor Recebido' : 'Valor da Despesa'}</span>
          <input
            type="tel"
            placeholder="0,00"
            value={amount}
            onChange={e => setAmount(e.target.value)}
            className="w-full bg-transparent text-center text-6xl font-black font-outfit tracking-tighter text-white placeholder-slate-700 outline-none pb-4 border-b-2 border-white/10 focus:border-violet-500 transition-colors"
            autoFocus
          />
        </div>

        {/* Método de Pagamento */}
        {type === 'expense' && (
          <div className="space-y-4 mb-8 relative z-10">
            <div className="flex gap-2 bg-slate-900/50 p-1.5 rounded-2xl border border-white/5">
              <button
                type="button"
                onClick={() => setPaymentMethod('debit')}
                className={`flex-1 py-3 rounded-xl text-sm font-bold transition-all ${paymentMethod === 'debit'
                    ? 'bg-blue-600 shadow-md shadow-blue-600/20 text-white'
                    : 'text-slate-500 hover:text-slate-300 hover:bg-white/5'
                  }`}
              >
                Débito / Pix
              </button>
              <button
                type="button"
                onClick={() => setPaymentMethod('credit')}
                className={`flex-1 py-3 rounded-xl text-sm font-bold transition-all ${paymentMethod === 'credit'
                    ? 'bg-violet-600 shadow-md shadow-violet-600/20 text-white'
                    : 'text-slate-500 hover:text-slate-300 hover:bg-white/5'
                  }`}
              >
                Crédito
              </button>
            </div>

            {paymentMethod === 'credit' && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                className="bg-slate-800/40 p-5 rounded-2xl border border-white/5 space-y-5"
              >
                <div>
                  <label className="block text-xs font-bold uppercase text-slate-400 mb-2 tracking-wider">Cartão</label>
                  <select
                    value={selectedCardId}
                    onChange={e => setSelectedCardId(e.target.value)}
                    className="input-field"
                  >
                    <option value="">Selecione o cartão...</option>
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
        <div className="mb-8 relative z-10">
          <label className="block text-xs font-bold uppercase tracking-wider text-slate-400 mb-3">Categoria</label>
          <div className="grid grid-cols-5 gap-3 max-h-36 overflow-y-auto pr-2 custom-scrollbar">
            {categories.map(cat => (
              <button
                type="button"
                key={cat.id}
                onClick={() => setSelectedCategory(cat)}
                className={`flex flex-col items-center justify-center p-3 rounded-2xl transition-all border ${selectedCategory?.id === cat.id
                    ? 'bg-violet-600/20 text-violet-400 border-violet-500/50 shadow-inner scale-105'
                    : 'bg-slate-800/30 text-slate-400 border-transparent hover:bg-slate-800 hover:border-white/5 hover:text-white'
                  }`}
              >
                <span className="text-2xl mb-1.5">{cat.icon}</span>
                <span className="text-[9px] font-bold uppercase tracking-wide truncate w-full text-center">{cat.label}</span>
              </button>
            ))}
          </div>
        </div>

        {/* Descrição */}
        <div className="mb-6 relative z-10">
          <input
            type="text"
            placeholder="Descrição (Opcional)"
            value={description}
            onChange={e => setDescription(e.target.value)}
            className="input-field"
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
          className={`w-full py-5 btn-primary text-lg flex items-center justify-center gap-3 relative z-10 ${isDesktop ? '' : 'mt-8'
            }`}
        >
          <Check size={22} /> {initialData ? 'Atualizar' : 'Confirmar'} Lançamento
        </button>
      </motion.div>
    </motion.div>
  );
}
