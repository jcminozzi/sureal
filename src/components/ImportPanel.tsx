import { useMemo, useRef, useState, type ChangeEvent, type FormEvent } from 'react';
import { ArrowLeft, CheckCircle2, FileSpreadsheet, FileUp, Lightbulb, Plus, ShieldCheck, Trash2, Upload, X } from 'lucide-react';
import { CATEGORIES, EXPENSE_CATEGORIES, INCOME_CATEGORIES } from '../constants/categories';
import {
  buildImportFingerprint,
  candidateToTransaction,
  categorizeDescription,
  decodeStatementBuffer,
  fingerprintTransaction,
  inferCsvMapping,
  mapCsvRows,
  normalizeSearchText,
  parseCsvDocument,
  parseOfx,
  type CsvDocument,
  type CsvMapping,
  type ImportCandidate,
} from '../lib/importers';
import { formatCurrency } from '../lib/finance';
import { extractPdfText, parsePdfStatementText } from '../lib/pdfImport';
import { useStore } from '../store/useStore';
import type { ImportRule, TransactionType } from '../types';

interface ImportPanelProps {
  onClose: () => void;
  onImported: () => void;
}

type Stage = 'upload' | 'mapping' | 'review' | 'success';
type AmountMode = 'single' | 'separate';
type ReviewCandidate = ImportCandidate & { selected: boolean; duplicate: boolean; originalType: TransactionType };

const emptyMapping: CsvMapping = { date: -1, description: -1, amount: -1, debit: -1, credit: -1, type: -1 };

const createId = (): string =>
  globalThis.crypto?.randomUUID?.() ?? `${Date.now()}-${Math.random().toString(16).slice(2)}`;

const isOfxFile = (name: string, text: string): boolean =>
  /\.(ofx|qfx)$/i.test(name) || /<OFX>|OFXHEADER\s*:/i.test(text.slice(0, 2500));

function ColumnSelect({ label, headers, value, required, onChange }: {
  label: string;
  headers: string[];
  value: number;
  required?: boolean;
  onChange: (value: number) => void;
}) {
  return (
    <label className="field">
      <span>{label}{required ? ' *' : ''}</span>
      <select value={value} onChange={(event) => onChange(Number(event.target.value))}>
        <option value={-1}>Não usar</option>
        {headers.map((header, index) => <option key={`${header}-${index}`} value={index}>{header}</option>)}
      </select>
    </label>
  );
}

export function ImportPanel({ onClose, onImported }: ImportPanelProps) {
  const store = useStore();
  const fileRef = useRef<HTMLInputElement>(null);
  const [stage, setStage] = useState<Stage>('upload');
  const [fileName, setFileName] = useState('');
  const [fileDetails, setFileDetails] = useState('');
  const [isReading, setIsReading] = useState(false);
  const [csvDocument, setCsvDocument] = useState<CsvDocument | null>(null);
  const [mapping, setMapping] = useState<CsvMapping>(emptyMapping);
  const [amountMode, setAmountMode] = useState<AmountMode>('single');
  const [rows, setRows] = useState<ReviewCandidate[]>([]);
  const [error, setError] = useState('');
  const [importedCount, setImportedCount] = useState(0);
  const [importedIds, setImportedIds] = useState<string[]>([]);
  const [destinationCardId, setDestinationCardId] = useState('');
  const [importStatus, setImportStatus] = useState<'paid' | 'pending'>('paid');
  const [ruleKeyword, setRuleKeyword] = useState('');
  const [ruleType, setRuleType] = useState<TransactionType>('expense');
  const [ruleCategory, setRuleCategory] = useState(EXPENSE_CATEGORIES[0]?.label ?? 'Outros gastos');

  const existingFingerprints = useMemo(
    () => new Set(store.transactions.map(fingerprintTransaction)),
    [store.transactions],
  );
  const selectedRows = rows.filter((row) => row.selected);
  const duplicateCount = rows.filter((row) => row.duplicate).length;
  const selectedTotal = selectedRows.reduce((sum, row) => sum + (row.type === 'income' ? row.amount : -row.amount), 0);
  const ruleCategories = ruleType === 'income' ? INCOME_CATEGORIES : EXPENSE_CATEGORIES;

  const prepareReview = (candidates: ImportCandidate[]) => {
    const seen = new Set(existingFingerprints);
    setRows(candidates.map((candidate) => {
      const duplicate = seen.has(candidate.fingerprint);
      seen.add(candidate.fingerprint);
      return { ...candidate, duplicate, selected: !duplicate, originalType: candidate.type };
    }));
    setStage('review');
    setError('');
  };

  const readFile = async (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    event.target.value = '';
    if (!file) return;
    setError('');
    setFileName(file.name);
    if (file.size > 20 * 1024 * 1024) {
      setError('O arquivo ultrapassa 20 MB. Exporte um período menor para proteger o desempenho do dispositivo.');
      return;
    }
    setIsReading(true);
    try {
      const buffer = await file.arrayBuffer();
      if (/\.pdf$/i.test(file.name) || file.type === 'application/pdf') {
        const extraction = await extractPdfText(buffer);
        setFileDetails(`PDF · ${extraction.pages} ${extraction.pages === 1 ? 'página' : 'páginas'}`);
        prepareReview(parsePdfStatementText(extraction.text, store.importRules));
        return;
      }
      const text = decodeStatementBuffer(buffer);
      if (isOfxFile(file.name, text)) {
        setFileDetails('OFX');
        prepareReview(parseOfx(text, store.importRules));
        return;
      }
      const document = parseCsvDocument(text);
      const inferred = inferCsvMapping(document);
      setCsvDocument(document);
      setMapping(inferred);
      setAmountMode(inferred.amount >= 0 ? 'single' : 'separate');
      setStage('mapping');
    } catch (cause) {
      const message = cause instanceof Error ? cause.message : 'Não consegui ler esse arquivo.';
      setError(/password|senha/i.test(message) ? 'O PDF está protegido por senha. Exporte uma cópia sem senha ou use OFX/CSV.' : message);
    } finally {
      setIsReading(false);
    }
  };

  const continueCsv = () => {
    if (!csvDocument) return;
    try {
      prepareReview(mapCsvRows(csvDocument, mapping, store.importRules));
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : 'Confira as colunas selecionadas.');
    }
  };

  const updateRow = (id: string, updates: Partial<ReviewCandidate>) => {
    setRows((current) => current.map((row) => {
      if (row.id !== id) return row;
      const next = { ...row, ...updates };
      next.fingerprint = buildImportFingerprint(next.date, next.description, next.amount, next.type, next.externalId);
      next.duplicate = existingFingerprints.has(next.fingerprint);
      return next;
    }));
  };

  const changeRowType = (row: ReviewCandidate, type: TransactionType) => {
    const category = categorizeDescription(row.description, type, store.importRules);
    updateRow(row.id, { type, categoryLabel: category.label, categoryIcon: category.icon });
  };

  const changeRowCategory = (row: ReviewCandidate, categoryLabel: string) => {
    const category = CATEGORIES.find((item) => item.label === categoryLabel);
    if (category) updateRow(row.id, { categoryLabel: category.label, categoryIcon: category.icon });
  };

  const changeImportOrigin = (cardId: string) => {
    setDestinationCardId(cardId);
    setImportStatus(cardId ? 'pending' : 'paid');
    setRows((current) => current.map((row) => {
      const type: TransactionType = cardId ? 'expense' : row.originalType;
      const category = categorizeDescription(row.description, type, store.importRules);
      const fingerprint = buildImportFingerprint(row.date, row.description, row.amount, type, row.externalId);
      return { ...row, type, categoryLabel: category.label, categoryIcon: category.icon, fingerprint, duplicate: existingFingerprints.has(fingerprint) };
    }));
  };

  const addRule = (event: FormEvent) => {
    event.preventDefault();
    const keyword = ruleKeyword.trim();
    const category = CATEGORIES.find((item) => item.label === ruleCategory);
    if (!keyword || !category) return;
    const rule: ImportRule = {
      id: createId(),
      keyword,
      categoryLabel: category.label,
      categoryIcon: category.icon,
      transactionType: ruleType,
      createdAt: new Date().toISOString(),
    };
    store.addImportRule(rule);
    setRows((current) => current.map((row) => {
      if (row.type !== ruleType || !normalizeSearchText(row.description).includes(normalizeSearchText(keyword))) return row;
      return { ...row, categoryLabel: category.label, categoryIcon: category.icon };
    }));
    setRuleKeyword('');
  };

  const importSelected = () => {
    const transactions = selectedRows.map((row) => candidateToTransaction(row, fileName, { cardId: destinationCardId, status: importStatus }));
    if (transactions.length === 0) return;
    store.addTransactions(transactions);
    const latestDate = [...transactions].sort((a, b) => b.date.localeCompare(a.date))[0]?.date;
    if (latestDate) store.setCurrentDate(new Date(latestDate));
    setImportedCount(transactions.length);
    setImportedIds(transactions.map((transaction) => transaction.id));
    setStage('success');
  };

  const reset = () => {
    setStage('upload');
    setFileName('');
    setFileDetails('');
    setCsvDocument(null);
    setMapping(emptyMapping);
    setRows([]);
    setDestinationCardId('');
    setImportStatus('paid');
    setError('');
  };

  const undoImport = () => {
    store.deleteTransactions(importedIds);
    reset();
  };

  return (
    <div className="modal-backdrop" role="presentation" onMouseDown={(event) => event.target === event.currentTarget && onClose()}>
      <section className="modal import-modal" role="dialog" aria-modal="true" aria-labelledby="import-title">
        <header className="modal__header">
          <div><span className="eyebrow">Importação privada</span><h2 id="import-title">{stage === 'success' ? 'Extrato importado' : 'Trazer extrato'}</h2></div>
          <button className="icon-button" onClick={onClose} aria-label="Fechar"><X size={20} /></button>
        </header>

        <div className="import-content">
          {stage === 'upload' && (
            <>
              <button className="import-dropzone" type="button" onClick={() => fileRef.current?.click()} disabled={isReading}>
                <span><FileUp size={27} /></span>
                <strong>{isReading ? 'Lendo o arquivo com segurança…' : 'Escolha um arquivo OFX, CSV ou PDF'}</strong>
                <small>{isReading ? 'Arquivos PDF podem levar alguns segundos. Nada será enviado para fora.' : 'Baixe o extrato ou a fatura no aplicativo do seu banco e selecione-o aqui.'}</small>
              </button>
              <input ref={fileRef} className="sr-only" type="file" accept=".ofx,.qfx,.csv,.txt,.pdf,text/csv,application/x-ofx,application/pdf" onChange={readFile} />
              <div className="import-assurance"><ShieldCheck size={19} /><span><strong>O arquivo não sai deste dispositivo</strong><small>A leitura, categorização e comparação acontecem somente no seu navegador.</small></span></div>
              <section className="rules-box">
                <header><div><Lightbulb size={18} /><span><strong>Regras automáticas</strong><small>Exemplo: tudo que contém “Uber” vai para Transporte.</small></span></div></header>
                {store.importRules.length > 0 && <div className="rule-list">{store.importRules.map((rule) => <div key={rule.id}><span><strong>“{rule.keyword}”</strong><small>{rule.categoryIcon} {rule.categoryLabel} · {rule.transactionType === 'income' ? 'entrada' : 'saída'}</small></span><button className="icon-button icon-button--danger" onClick={() => store.deleteImportRule(rule.id)} aria-label={`Excluir regra ${rule.keyword}`}><Trash2 size={15} /></button></div>)}</div>}
                <form className="rule-form" onSubmit={addRule}>
                  <label className="field"><span>Quando contiver</span><input value={ruleKeyword} onChange={(event) => setRuleKeyword(event.target.value)} placeholder="Ex.: Uber" /></label>
                  <label className="field"><span>Tipo</span><select value={ruleType} onChange={(event) => { const type = event.target.value as TransactionType; setRuleType(type); setRuleCategory((type === 'income' ? INCOME_CATEGORIES : EXPENSE_CATEGORIES)[0]?.label ?? ''); }}><option value="expense">Saída</option><option value="income">Entrada</option></select></label>
                  <label className="field"><span>Categoria</span><select value={ruleCategory} onChange={(event) => setRuleCategory(event.target.value)}>{ruleCategories.map((category) => <option key={category.id} value={category.label}>{category.icon} {category.label}</option>)}</select></label>
                  <button className="button button--secondary" type="submit" disabled={!ruleKeyword.trim()}><Plus size={16} /> Criar</button>
                </form>
              </section>
            </>
          )}

          {stage === 'mapping' && csvDocument && (
            <>
              <div className="import-file"><FileSpreadsheet size={20} /><span><strong>{fileName}</strong><small>{csvDocument.rows.length} linhas encontradas · separador {csvDocument.delimiter === '\t' ? 'tabulação' : `“${csvDocument.delimiter}”`}</small></span></div>
              <section className="mapping-box">
                <div><span className="eyebrow">Confirme as colunas</span><p>O surReal tentou reconhecer tudo automaticamente. Ajuste apenas se algo estiver diferente.</p></div>
                <div className="form-grid">
                  <ColumnSelect label="Data" headers={csvDocument.headers} value={mapping.date} required onChange={(date) => setMapping((current) => ({ ...current, date }))} />
                  <ColumnSelect label="Descrição ou histórico" headers={csvDocument.headers} value={mapping.description} required onChange={(description) => setMapping((current) => ({ ...current, description }))} />
                </div>
                <div className="segmented" aria-label="Formato dos valores">
                  <button className={amountMode === 'single' ? 'is-active' : ''} onClick={() => { setAmountMode('single'); setMapping((current) => ({ ...current, debit: -1, credit: -1 })); }}>Uma coluna de valor</button>
                  <button className={amountMode === 'separate' ? 'is-active' : ''} onClick={() => { setAmountMode('separate'); setMapping((current) => ({ ...current, amount: -1 })); }}>Débito e crédito separados</button>
                </div>
                {amountMode === 'single' ? (
                  <div className="form-grid">
                    <ColumnSelect label="Valor" headers={csvDocument.headers} value={mapping.amount} required onChange={(amount) => setMapping((current) => ({ ...current, amount }))} />
                    <ColumnSelect label="Tipo (opcional)" headers={csvDocument.headers} value={mapping.type} onChange={(type) => setMapping((current) => ({ ...current, type }))} />
                  </div>
                ) : (
                  <div className="form-grid">
                    <ColumnSelect label="Débito / saídas" headers={csvDocument.headers} value={mapping.debit} onChange={(debit) => setMapping((current) => ({ ...current, debit }))} />
                    <ColumnSelect label="Crédito / entradas" headers={csvDocument.headers} value={mapping.credit} onChange={(credit) => setMapping((current) => ({ ...current, credit }))} />
                  </div>
                )}
              </section>
              {error && <p className="form-error" role="alert">{error}</p>}
              <footer className="modal__footer import-footer"><button className="button button--ghost" onClick={reset}><ArrowLeft size={16} /> Voltar</button><button className="button button--primary" onClick={continueCsv}>Revisar lançamentos</button></footer>
            </>
          )}

          {stage === 'review' && (
            <>
              <div className="import-file"><FileSpreadsheet size={20} /><span><strong>{fileName}</strong><small>{fileDetails || `${rows.length} linhas reconhecidas`}</small></span></div>
              <div className="import-summary">
                <div><span><strong>{rows.length}</strong><small>encontrados</small></span><span><strong>{selectedRows.length}</strong><small>selecionados</small></span><span className={duplicateCount ? 'has-warning' : ''}><strong>{duplicateCount}</strong><small>duplicados</small></span></div>
                <button className="text-button" onClick={() => setRows((current) => current.map((row) => ({ ...row, selected: !row.duplicate })))}>Selecionar sem duplicados</button>
              </div>
              <p className="import-review-hint">Confira antes de salvar. Você pode corrigir a descrição, o tipo e a categoria de cada linha.</p>
              <div className="import-options">
                <label className="field"><span>Origem do arquivo</span><select value={destinationCardId} onChange={(event) => changeImportOrigin(event.target.value)}><option value="">Conta bancária ou dinheiro</option>{store.cards.map((card) => <option key={card.id} value={card.id}>Fatura · {card.bankName}</option>)}</select></label>
                <label className="field"><span>Status dos lançamentos</span><select value={importStatus} onChange={(event) => setImportStatus(event.target.value as 'paid' | 'pending')}><option value="paid">Já pagos ou recebidos</option><option value="pending">Pendentes</option></select></label>
              </div>
              <div className="import-table" role="table" aria-label="Pré-visualização do extrato">
                {rows.map((row) => {
                  const categories = row.type === 'income' ? INCOME_CATEGORIES : EXPENSE_CATEGORIES;
                  return (
                    <article className={`import-row ${row.duplicate ? 'is-duplicate' : ''}`} key={row.id} role="row">
                      <label className="import-check"><input type="checkbox" checked={row.selected} onChange={(event) => updateRow(row.id, { selected: event.target.checked })} aria-label={`Selecionar ${row.description}`} /></label>
                      <label className="import-date"><span className="sr-only">Data</span><input type="date" value={row.date.slice(0, 10)} onChange={(event) => updateRow(row.id, { date: `${event.target.value}T12:00:00.000` })} /></label>
                      <label className="import-description"><span className="sr-only">Descrição</span><input value={row.description} onChange={(event) => updateRow(row.id, { description: event.target.value })} />{row.duplicate && <small>Possível duplicado</small>}</label>
                      <select className={`import-type is-${row.type}`} value={row.type} onChange={(event) => changeRowType(row, event.target.value as TransactionType)} aria-label={`Tipo de ${row.description}`}><option value="expense">Saída</option><option value="income">Entrada</option></select>
                      <select className="import-category" value={row.categoryLabel} onChange={(event) => changeRowCategory(row, event.target.value)} aria-label={`Categoria de ${row.description}`}>{categories.map((category) => <option key={category.id} value={category.label}>{category.icon} {category.label}</option>)}</select>
                      <label className="import-amount"><span>R$</span><input type="number" min="0.01" step="0.01" inputMode="decimal" value={row.amount} onChange={(event) => { const amount = Number(event.target.value); if (Number.isFinite(amount)) updateRow(row.id, { amount: Math.abs(amount) }); }} /></label>
                    </article>
                  );
                })}
              </div>
              <div className="import-total"><span>Impacto líquido selecionado</span><strong className={selectedTotal >= 0 ? 'is-positive' : 'is-negative'}>{selectedTotal >= 0 ? '+' : '−'} {formatCurrency(Math.abs(selectedTotal))}</strong></div>
              <footer className="modal__footer import-footer"><button className="button button--ghost" onClick={csvDocument ? () => setStage('mapping') : reset}><ArrowLeft size={16} /> Voltar</button><button className="button button--primary" onClick={importSelected} disabled={selectedRows.length === 0}><Upload size={17} /> Importar {selectedRows.length}</button></footer>
            </>
          )}

          {stage === 'success' && (
            <div className="import-success">
              <span><CheckCircle2 size={34} /></span>
              <h3>{importedCount} {importedCount === 1 ? 'lançamento importado' : 'lançamentos importados'}</h3>
              <p>As categorias podem ser ajustadas normalmente. O surReal guardou a origem para evitar duplicações futuras.</p>
              <div><button className="button button--ghost" onClick={undoImport}>Desfazer</button><button className="button button--secondary" onClick={reset}>Importar outro arquivo</button><button className="button button--primary" onClick={onImported}>Ver lançamentos</button></div>
            </div>
          )}

          {error && stage === 'upload' && <p className="form-error" role="alert">{error}</p>}
        </div>
      </section>
    </div>
  );
}
