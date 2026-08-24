import { useEffect, useRef, useState, type ChangeEvent, type FormEvent } from 'react';
import { CreditCard, Download, FileDown, HardDrive, Moon, Plus, ShieldCheck, Sun, Trash2, Upload, UserRound, X } from 'lucide-react';
import { CARD_PRESETS } from '../constants/cardPresets';
import { parseBackup } from '../lib/finance';
import { useStore } from '../store/useStore';
import type { BackupData, Card } from '../types';

interface SettingsPanelProps { onClose: () => void }

const downloadFile = (name: string, content: string, type: string) => {
  const url = URL.createObjectURL(new Blob([content], { type }));
  const anchor = document.createElement('a');
  anchor.href = url;
  anchor.download = name;
  anchor.click();
  URL.revokeObjectURL(url);
};

const csvCell = (value: unknown) => `"${String(value ?? '').replace(/"/g, '""')}"`;

export function SettingsPanel({ onClose }: SettingsPanelProps) {
  const store = useStore();
  const [name, setName] = useState(store.userName);
  const [bankName, setBankName] = useState('');
  const [dueDay, setDueDay] = useState('10');
  const [closingDay, setClosingDay] = useState('3');
  const [selectedPresetId, setSelectedPresetId] = useState('');
  const [message, setMessage] = useState('');
  const importRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => event.key === 'Escape' && onClose();
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [onClose]);

  const saveProfile = () => {
    store.setUserName(name);
    setMessage('Preferências salvas.');
  };

  const addCard = (event: FormEvent) => {
    event.preventDefault();
    const day = Math.max(1, Math.min(31, Number(dueDay)));
    if (!bankName.trim() || !Number.isFinite(day)) return;
    const preset = CARD_PRESETS.find((item) => item.id === selectedPresetId);
    const card: Card = {
      id: globalThis.crypto?.randomUUID?.() ?? `${Date.now()}`,
      bankName: bankName.trim(),
      dueDay: day,
      closingDay: Math.max(1, Math.min(31, Number(closingDay))),
      presetId: preset?.id,
      bankId: preset?.id,
      kind: preset?.kind ?? 'credit-card',
      accentColor: preset?.color ?? '#183b34',
    };
    store.addCard(card);
    setBankName('');
    setSelectedPresetId('');
    setMessage('Cartão adicionado.');
  };

  const exportBackup = () => {
    const data: BackupData = {
      app: 'meus-gastinhos',
      version: 4,
      exportedAt: new Date().toISOString(),
      transactions: store.transactions,
      cards: store.cards,
      goals: store.goals,
      budgets: store.budgets,
      investments: store.investments,
      loans: store.loans,
      userName: store.userName,
      theme: store.theme,
    };
    downloadFile(`surreal-backup-${new Date().toISOString().slice(0, 10)}.json`, JSON.stringify(data, null, 2), 'application/json');
    setMessage('Backup baixado. Guarde esse arquivo em local seguro.');
  };

  const exportCsv = () => {
    const header = ['Data', 'Tipo', 'Status', 'Descrição', 'Categoria', 'Valor', 'Parcela'];
    const rows = [...store.transactions]
      .sort((a, b) => a.date.localeCompare(b.date))
      .map((item) => [
        item.date.slice(0, 10),
        item.type === 'income' ? 'Entrada' : 'Saída',
        item.status === 'paid' ? 'Pago/recebido' : 'Pendente',
        item.description,
        item.categoryLabel,
        item.amount.toFixed(2).replace('.', ','),
        item.installment ?? '',
      ]);
    downloadFile(
      `surreal-lancamentos-${new Date().toISOString().slice(0, 10)}.csv`,
      `\uFEFF${[header, ...rows].map((row) => row.map(csvCell).join(';')).join('\n')}`,
      'text/csv;charset=utf-8',
    );
    setMessage('Planilha exportada.');
  };

  const importBackup = async (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    event.target.value = '';
    if (!file) return;
    try {
      const parsed = parseBackup(JSON.parse(await file.text()));
      if (!parsed) return setMessage('Esse arquivo não é um backup válido.');
      if (!window.confirm(`Restaurar ${parsed.transactions.length} lançamentos? Os dados atuais serão substituídos.`)) return;
      store.replaceFromBackup(parsed);
      setName(parsed.userName);
      setMessage('Backup restaurado com sucesso.');
    } catch {
      setMessage('Não foi possível ler esse arquivo.');
    }
  };

  const clearData = () => {
    if (!window.confirm('Apagar lançamentos, cartões, metas, limites, empréstimos e investimentos deste dispositivo?')) return;
    if (!window.confirm('Esta ação não pode ser desfeita sem um backup. Deseja continuar?')) return;
    store.clearAllData();
    setName('');
    setMessage('Dados apagados.');
  };

  return (
    <div className="modal-backdrop" role="presentation" onMouseDown={(event) => event.target === event.currentTarget && onClose()}>
      <section className="modal settings-modal" role="dialog" aria-modal="true" aria-labelledby="settings-title">
        <header className="modal__header">
          <div><span className="eyebrow">Preferências e segurança</span><h2 id="settings-title">Seu espaço</h2></div>
          <button className="icon-button" onClick={onClose} aria-label="Fechar"><X size={20} /></button>
        </header>

        <div className="settings-content">
          <section className="settings-section">
            <div className="settings-section__title"><UserRound size={20} /><div><h3>Perfil e aparência</h3><p>Deixe o app com a sua cara.</p></div></div>
            <div className="form-grid">
              <label className="field"><span>Como quer ser chamado?</span><input value={name} onChange={(event) => setName(event.target.value)} placeholder="Seu nome ou apelido" /></label>
              <div className="field"><span>Tema</span><div className="theme-switch"><button className={store.theme === 'light' ? 'is-active' : ''} onClick={() => store.setTheme('light')}><Sun size={16} /> Claro</button><button className={store.theme === 'dark' ? 'is-active' : ''} onClick={() => store.setTheme('dark')}><Moon size={16} /> Escuro</button></div></div>
            </div>
            <button className="button button--secondary" onClick={saveProfile}>Salvar preferências</button>
          </section>

          <section className="settings-section">
            <div className="settings-section__title"><CreditCard size={20} /><div><h3>Cartões</h3><p>Use cartões para lançar e parcelar compras.</p></div></div>
            <div className="card-presets" aria-label="Cartões predefinidos">
              {CARD_PRESETS.map((preset) => <button key={preset.id} type="button" className={selectedPresetId === preset.id ? 'is-selected' : ''} onClick={() => { setSelectedPresetId(preset.id); setBankName(preset.name); }}><span style={{ background: preset.color, color: preset.textColor }}>{preset.shortName}</span><small>{preset.name}</small></button>)}
              <button type="button" className={selectedPresetId === 'custom' ? 'is-selected' : ''} onClick={() => { setSelectedPresetId('custom'); setBankName(''); }}><span className="custom-card-mark">+</span><small>Outro</small></button>
            </div>
            {store.cards.length > 0 && <div className="card-list">{store.cards.map((card) => <div key={card.id}><span><i className="card-dot" style={{ background: card.accentColor ?? '#183b34' }} /><CreditCard size={17} /><strong>{card.bankName}</strong><small>Fecha dia {card.closingDay ?? '—'} · vence dia {card.dueDay}</small></span><button className="icon-button icon-button--danger" onClick={() => window.confirm(`Excluir ${card.bankName}?`) && store.deleteCard(card.id)} aria-label={`Excluir ${card.bankName}`}><Trash2 size={17} /></button></div>)}</div>}
            <form className="inline-form" onSubmit={addCard}>
              <label className="field"><span>Nome do cartão</span><input value={bankName} onChange={(event) => setBankName(event.target.value)} placeholder="Ex.: Nubank" /></label>
              <label className="field field--small"><span>Fechamento</span><input type="number" min="1" max="31" value={closingDay} onChange={(event) => setClosingDay(event.target.value)} /></label>
              <label className="field field--small"><span>Vencimento</span><input type="number" min="1" max="31" value={dueDay} onChange={(event) => setDueDay(event.target.value)} /></label>
              <button className="button button--secondary" type="submit" disabled={!bankName.trim()}><Plus size={17} /> Adicionar</button>
            </form>
          </section>

          <section className="settings-section">
            <div className="settings-section__title"><HardDrive size={20} /><div><h3>Seus dados</h3><p>Ficam apenas neste navegador. Faça backup antes de trocar de aparelho.</p></div></div>
            <div className="settings-actions">
              <button className="button button--secondary" onClick={exportBackup}><Download size={17} /> Baixar backup</button>
              <button className="button button--secondary" onClick={exportCsv}><FileDown size={17} /> Exportar planilha</button>
              <button className="button button--ghost" onClick={() => importRef.current?.click()}><Upload size={17} /> Restaurar backup</button>
              <input ref={importRef} className="sr-only" type="file" accept="application/json,.json" onChange={importBackup} />
            </div>
            <div className="privacy-note"><ShieldCheck size={19} /><span><strong>Privacidade local</strong><small>Nenhum lançamento financeiro é enviado para uma conta ou servidor pelo aplicativo.</small></span></div>
            <button className="danger-link" onClick={clearData}><Trash2 size={16} /> Apagar todos os dados deste dispositivo</button>
          </section>

          {message && <p className="settings-message" role="status">{message}</p>}
        </div>
      </section>
    </div>
  );
}
