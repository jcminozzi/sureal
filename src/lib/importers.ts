import { CATEGORIES } from '../constants/categories';
import type { Category, ImportRule, Transaction, TransactionType } from '../types';

export interface CsvDocument {
  headers: string[];
  rows: string[][];
  delimiter: string;
}

export interface CsvMapping {
  date: number;
  description: number;
  amount: number;
  debit: number;
  credit: number;
  type: number;
}

export interface ImportCandidate {
  id: string;
  date: string;
  description: string;
  amount: number;
  type: TransactionType;
  categoryLabel: string;
  categoryIcon: string;
  fingerprint: string;
  externalId?: string;
}

const createId = (): string =>
  globalThis.crypto?.randomUUID?.() ?? `${Date.now()}-${Math.random().toString(16).slice(2)}`;

export const normalizeSearchText = (value: string): string =>
  value.normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLocaleLowerCase('pt-BR').replace(/\s+/g, ' ').trim();

const DEFAULT_PATTERNS: Array<{ type: TransactionType; category: string; keywords: string[] }> = [
  { type: 'income', category: 'Salário', keywords: ['salario', 'folha de pagamento', 'pagamento salario', 'proventos'] },
  { type: 'income', category: 'Rendimentos', keywords: ['rendimento', 'dividendo', 'juros sobre capital', 'jcp', 'cashback'] },
  { type: 'income', category: 'Renda extra', keywords: ['honorario', 'freelance', 'comissao', 'repasse'] },
  { type: 'expense', category: 'Mercado', keywords: ['supermercado', 'mercado', 'atacadao', 'assai', 'carrefour', 'pao de acucar', 'hortifruti'] },
  { type: 'expense', category: 'Alimentação', keywords: ['ifood', 'restaurante', 'lanchonete', 'padaria', 'burger', 'mcdonald', 'mc donald', 'rappi', 'uber eats'] },
  { type: 'expense', category: 'Transporte', keywords: ['uber', '99app', '99 app', 'combustivel', 'posto ', 'shell', 'ipiranga', 'estacionamento', 'pedagio'] },
  { type: 'expense', category: 'Moradia', keywords: ['aluguel', 'condominio', 'imobiliaria', 'iptu'] },
  { type: 'expense', category: 'Saúde', keywords: ['farmacia', 'drogaria', 'hospital', 'clinica', 'laboratorio', 'odonto'] },
  { type: 'expense', category: 'Educação', keywords: ['escola', 'faculdade', 'universidade', 'udemy', 'curso ', 'mensalidade escolar'] },
  { type: 'expense', category: 'Lazer', keywords: ['cinema', 'ingresso', 'steam', 'playstation', 'xbox', 'parque', 'show '] },
  { type: 'expense', category: 'Contas e serviços', keywords: ['energia', 'enel', 'cemig', 'sabesp', 'saneamento', 'internet', 'netflix', 'spotify', 'claro', 'vivo', 'tim ', 'amazon prime', 'apple.com/bill', 'google '] },
  { type: 'expense', category: 'Compras', keywords: ['mercado livre', 'amazon', 'shopee', 'olx', 'magalu', 'magazine luiza', 'americanas'] },
  { type: 'expense', category: 'Empréstimos', keywords: ['emprestimo', 'financiamento', 'parcela credito'] },
  { type: 'expense', category: 'Seguros', keywords: ['seguro', 'porto seguro', 'azul seguros'] },
];

const fallbackCategory = (type: TransactionType): Category =>
  CATEGORIES.find((category) => category.id === (type === 'income' ? 'other-income' : 'other-expense')) ?? CATEGORIES[0];

export const categorizeDescription = (description: string, type: TransactionType, rules: ImportRule[] = []): Category => {
  const normalized = normalizeSearchText(description);
  const matchingRule = [...rules]
    .filter((rule) => rule.transactionType === 'both' || rule.transactionType === type)
    .sort((a, b) => b.keyword.length - a.keyword.length)
    .find((rule) => normalized.includes(normalizeSearchText(rule.keyword)));
  if (matchingRule) {
    return CATEGORIES.find((category) => category.label === matchingRule.categoryLabel)
      ?? { id: matchingRule.categoryLabel, label: matchingRule.categoryLabel, icon: matchingRule.categoryIcon, color: '#7a837e', type };
  }
  const pattern = DEFAULT_PATTERNS.find((item) => item.type === type && item.keywords.some((keyword) => normalized.includes(keyword)));
  return CATEGORIES.find((category) => category.label === pattern?.category) ?? fallbackCategory(type);
};

export const parseSignedMoney = (rawValue: string): number | null => {
  const value = rawValue.trim();
  if (!value || value === '-') return null;
  const negative = /^-/.test(value) || /^\(.*\)$/.test(value);
  let cleaned = value.replace(/[^\d,.-]/g, '').replace(/-/g, '');
  if (!cleaned) return null;
  const lastComma = cleaned.lastIndexOf(',');
  const lastDot = cleaned.lastIndexOf('.');
  if (lastComma >= 0 && lastDot >= 0) {
    const decimal = lastComma > lastDot ? ',' : '.';
    const thousands = decimal === ',' ? /\./g : /,/g;
    cleaned = cleaned.replace(thousands, '').replace(decimal, '.');
  } else if (lastComma >= 0) {
    const decimalDigits = cleaned.length - lastComma - 1;
    cleaned = decimalDigits === 2 ? cleaned.replace(/\./g, '').replace(',', '.') : cleaned.replace(/,/g, '');
  } else if (lastDot >= 0) {
    const decimalDigits = cleaned.length - lastDot - 1;
    cleaned = decimalDigits === 2 ? cleaned.replace(/,/g, '') : cleaned.replace(/\./g, '');
  }
  const parsed = Number(cleaned);
  if (!Number.isFinite(parsed)) return null;
  return negative ? -Math.abs(parsed) : parsed;
};

export const parseStatementDate = (rawValue: string): string | null => {
  const value = rawValue.trim().replace(/^['"]|['"]$/g, '');
  let year: number;
  let month: number;
  let day: number;
  let match = value.match(/^(\d{4})[-/.](\d{1,2})[-/.](\d{1,2})/);
  if (match) {
    [, year, month, day] = match.map(Number);
  } else {
    match = value.match(/^(\d{1,2})[-/.](\d{1,2})[-/.](\d{2,4})/);
    if (match) {
      day = Number(match[1]);
      month = Number(match[2]);
      year = Number(match[3]);
      if (year < 100) year += 2000;
    } else {
      match = value.match(/^(\d{4})(\d{2})(\d{2})/);
      if (match) {
        year = Number(match[1]);
        month = Number(match[2]);
        day = Number(match[3]);
      } else if (/^\d{5}(?:\.\d+)?$/.test(value)) {
        const excelDate = new Date(Date.UTC(1899, 11, 30) + Number(value) * 86400000);
        year = excelDate.getUTCFullYear();
        month = excelDate.getUTCMonth() + 1;
        day = excelDate.getUTCDate();
      } else return null;
    }
  }
  const date = new Date(year, month - 1, day, 12);
  if (date.getFullYear() !== year || date.getMonth() !== month - 1 || date.getDate() !== day) return null;
  return `${year}-${String(month).padStart(2, '0')}-${String(day).padStart(2, '0')}T12:00:00.000`;
};

const csvRow = (line: string, delimiter: string): string[] => {
  const result: string[] = [];
  let value = '';
  let quoted = false;
  for (let index = 0; index < line.length; index += 1) {
    const character = line[index];
    if (character === '"') {
      if (quoted && line[index + 1] === '"') {
        value += '"';
        index += 1;
      } else quoted = !quoted;
    } else if (character === delimiter && !quoted) {
      result.push(value.trim());
      value = '';
    } else value += character;
  }
  result.push(value.trim());
  return result;
};

const logicalCsvLines = (text: string): string[] => {
  const lines: string[] = [];
  let line = '';
  let quoted = false;
  for (let index = 0; index < text.length; index += 1) {
    const character = text[index];
    if (character === '"') {
      line += character;
      if (quoted && text[index + 1] === '"') {
        line += text[index + 1];
        index += 1;
      } else quoted = !quoted;
    } else if ((character === '\n' || character === '\r') && !quoted) {
      if (line.trim()) lines.push(line);
      line = '';
      if (character === '\r' && text[index + 1] === '\n') index += 1;
    } else line += character;
  }
  if (line.trim()) lines.push(line);
  return lines;
};

const headerScore = (row: string[]): number => {
  const normalized = row.map(normalizeSearchText);
  let score = 0;
  if (normalized.some((item) => /(^|\s)(data|date)(\s|$)/.test(item))) score += 3;
  if (normalized.some((item) => /(descricao|historico|lancamento|estabelecimento|memo)/.test(item))) score += 3;
  if (normalized.some((item) => /(valor|amount|debito|credito|saida|entrada)/.test(item))) score += 3;
  return score + Math.min(row.length, 6) * 0.1;
};

export const parseCsvDocument = (text: string): CsvDocument => {
  const normalizedText = text.replace(/^\uFEFF/, '');
  const lines = logicalCsvLines(normalizedText);
  if (lines.length < 2) throw new Error('O CSV não possui linhas suficientes.');
  const delimiters = [';', ',', '\t', '|'];
  const delimiter = delimiters
    .map((candidate) => ({ candidate, columns: Math.max(...lines.slice(0, 12).map((line) => csvRow(line, candidate).length)) }))
    .sort((a, b) => b.columns - a.columns)[0].candidate;
  const parsed = lines.map((line) => csvRow(line, delimiter));
  const headerIndex = parsed.slice(0, 15)
    .map((row, index) => ({ index, score: headerScore(row) }))
    .sort((a, b) => b.score - a.score)[0]?.index ?? 0;
  const headers = parsed[headerIndex].map((header, index) => header.replace(/^\uFEFF/, '').trim() || `Coluna ${index + 1}`);
  const rows = parsed.slice(headerIndex + 1).filter((row) => row.some((cell) => cell.trim()));
  if (headers.length < 2 || rows.length === 0) throw new Error('Não encontrei uma tabela válida nesse arquivo.');
  return { headers, rows, delimiter };
};

const findHeader = (headers: string[], patterns: RegExp[]): number => {
  const normalized = headers.map(normalizeSearchText);
  return normalized.findIndex((header) => patterns.some((pattern) => pattern.test(header)));
};

export const inferCsvMapping = (document: CsvDocument): CsvMapping => ({
  date: findHeader(document.headers, [/^data/, /^date/, /data.*lanc/, /data.*trans/]),
  description: findHeader(document.headers, [/descri/, /histor/, /lancamento/, /estabelecimento/, /^memo$/, /detalhe/]),
  amount: findHeader(document.headers, [/^valor$/, /valor.*lanc/, /^amount$/, /^quantia$/]),
  debit: findHeader(document.headers, [/debito/, /^saida$/, /valor.*deb/]),
  credit: findHeader(document.headers, [/credito/, /^entrada$/, /valor.*cred/]),
  type: findHeader(document.headers, [/^tipo$/, /natureza/, /^d\s*[/.-]?\s*c$/, /debito.*credito/, /credito.*debito/]),
});

const resolveType = (rawType: string, signedAmount: number): TransactionType => {
  const normalized = normalizeSearchText(rawType);
  if (/^(c|cr)$|(credito|entrada|receita|recebido|credit|income)/.test(normalized)) return 'income';
  if (/^(d|db)$|(debito|saida|despesa|pagamento|debit|expense)/.test(normalized)) return 'expense';
  return signedAmount < 0 ? 'expense' : 'income';
};

export const buildImportFingerprint = (date: string, description: string, amount: number, type: TransactionType, externalId = ''): string => {
  const key = `${date.slice(0, 10)}|${type}|${Math.round(amount * 100)}|${normalizeSearchText(description)}|${normalizeSearchText(externalId)}`;
  let hash = 2166136261;
  for (let index = 0; index < key.length; index += 1) {
    hash ^= key.charCodeAt(index);
    hash = Math.imul(hash, 16777619);
  }
  return `imp-${(hash >>> 0).toString(16)}`;
};

export const fingerprintTransaction = (transaction: Transaction): string =>
  transaction.importFingerprint ?? buildImportFingerprint(transaction.date, transaction.description, transaction.amount, transaction.type, transaction.externalId);

export const mapCsvRows = (document: CsvDocument, mapping: CsvMapping, rules: ImportRule[] = []): ImportCandidate[] => {
  if (mapping.date < 0 || mapping.description < 0) throw new Error('Escolha as colunas de data e descrição.');
  if (mapping.amount < 0 && mapping.debit < 0 && mapping.credit < 0) throw new Error('Escolha uma coluna de valor ou as colunas de débito e crédito.');
  return document.rows.flatMap((row) => {
    const date = parseStatementDate(row[mapping.date] ?? '');
    const description = (row[mapping.description] ?? '').trim().replace(/\s+/g, ' ');
    if (!date || !description) return [];
    let rawAmount: number | null = null;
    let type: TransactionType;
    if (mapping.amount >= 0) {
      rawAmount = parseSignedMoney(row[mapping.amount] ?? '');
      if (rawAmount === null || rawAmount === 0) return [];
      type = resolveType(mapping.type >= 0 ? row[mapping.type] ?? '' : '', rawAmount);
    } else {
      const debit = mapping.debit >= 0 ? parseSignedMoney(row[mapping.debit] ?? '') : null;
      const credit = mapping.credit >= 0 ? parseSignedMoney(row[mapping.credit] ?? '') : null;
      if (debit !== null && debit !== 0) {
        rawAmount = debit;
        type = 'expense';
      } else if (credit !== null && credit !== 0) {
        rawAmount = credit;
        type = 'income';
      } else return [];
    }
    const amount = Math.abs(rawAmount);
    const category = categorizeDescription(description, type, rules);
    return [{
      id: createId(),
      date,
      description,
      amount,
      type,
      categoryLabel: category.label,
      categoryIcon: category.icon,
      fingerprint: buildImportFingerprint(date, description, amount, type),
    }];
  });
};

const tagValue = (block: string, tag: string): string => {
  const match = block.match(new RegExp(`<${tag}(?:\\s[^>]*)?>\\s*([^<\\r\\n]+)`, 'i'));
  return match?.[1]?.trim() ?? '';
};

export const parseOfx = (text: string, rules: ImportRule[] = []): ImportCandidate[] => {
  const blocks = text.match(/<STMTTRN(?:\s[^>]*)?>[\s\S]*?(?:<\/STMTTRN>|(?=<STMTTRN|<\/BANKTRANLIST|<\/CCBANKTRANLIST))/gi) ?? [];
  if (blocks.length === 0) throw new Error('Não encontrei lançamentos válidos nesse OFX.');
  const candidates = blocks.flatMap((block) => {
    const date = parseStatementDate(tagValue(block, 'DTPOSTED'));
    const rawAmount = parseSignedMoney(tagValue(block, 'TRNAMT'));
    if (!date || rawAmount === null || rawAmount === 0) return [];
    const name = tagValue(block, 'NAME');
    const memo = tagValue(block, 'MEMO');
    const description = [name, memo].filter((item, index, values) => item && values.indexOf(item) === index).join(' · ') || tagValue(block, 'TRNTYPE') || 'Lançamento importado';
    const type: TransactionType = rawAmount < 0 ? 'expense' : 'income';
    const amount = Math.abs(rawAmount);
    const externalId = tagValue(block, 'FITID') || undefined;
    const category = categorizeDescription(description, type, rules);
    return [{
      id: createId(),
      date,
      description,
      amount,
      type,
      categoryLabel: category.label,
      categoryIcon: category.icon,
      externalId,
      fingerprint: buildImportFingerprint(date, description, amount, type, externalId),
    }];
  });
  if (candidates.length === 0) throw new Error('Os lançamentos do OFX não possuem datas ou valores reconhecíveis.');
  return candidates;
};

export const decodeStatementBuffer = (buffer: ArrayBuffer): string => {
  const utf8 = new TextDecoder('utf-8').decode(buffer);
  const header = utf8.slice(0, 1200).toLocaleUpperCase('en-US');
  if (/ENCODING\s*:\s*(1252|WINDOWS-1252|USASCII)|CHARSET\s*:\s*(1252|WINDOWS-1252)/.test(header) || utf8.includes('\uFFFD')) {
    return new TextDecoder('windows-1252').decode(buffer);
  }
  return utf8;
};

export const candidateToTransaction = (candidate: ImportCandidate, source: string, options?: { cardId?: string; status?: Transaction['status'] }): Transaction => ({
  id: candidate.id,
  amount: candidate.amount,
  type: candidate.type,
  status: options?.status ?? 'paid',
  description: candidate.description,
  categoryLabel: candidate.categoryLabel,
  categoryIcon: candidate.categoryIcon,
  date: candidate.date,
  cardId: candidate.type === 'expense' ? options?.cardId || undefined : undefined,
  importFingerprint: candidate.fingerprint,
  importSource: source,
  externalId: candidate.externalId,
  importedAt: new Date().toISOString(),
  createdAt: new Date().toISOString(),
});
