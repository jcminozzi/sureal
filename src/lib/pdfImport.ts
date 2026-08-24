import pdfWorkerUrl from 'pdfjs-dist/build/pdf.worker.min.mjs?url';
import type { ImportRule, TransactionType } from '../types';
import {
  buildImportFingerprint,
  categorizeDescription,
  normalizeSearchText,
  parseSignedMoney,
  parseStatementDate,
  type ImportCandidate,
} from './importers';

interface PdfTextItem {
  str: string;
  transform: number[];
  width: number;
  height: number;
  hasEOL?: boolean;
}

export interface PdfExtraction {
  text: string;
  pages: number;
}

const createId = (): string =>
  globalThis.crypto?.randomUUID?.() ?? `${Date.now()}-${Math.random().toString(16).slice(2)}`;

const pageItemsToLines = (items: PdfTextItem[]): string[] => {
  const positioned = items
    .filter((item) => item.str.trim())
    .map((item) => ({ text: item.str.trim(), x: item.transform[4] ?? 0, y: item.transform[5] ?? 0, width: item.width || 0, height: item.height || 8 }))
    .sort((a, b) => Math.abs(b.y - a.y) > 2.5 ? b.y - a.y : a.x - b.x);
  const lines: Array<{ y: number; items: typeof positioned }> = [];
  for (const item of positioned) {
    const tolerance = Math.max(2.5, item.height * 0.38);
    const line = lines.find((candidate) => Math.abs(candidate.y - item.y) <= tolerance);
    if (line) line.items.push(item);
    else lines.push({ y: item.y, items: [item] });
  }
  return lines
    .sort((a, b) => b.y - a.y)
    .map((line) => line.items.sort((a, b) => a.x - b.x).reduce((text, item, index, sorted) => {
      if (index === 0) return item.text;
      const previous = sorted[index - 1];
      const gap = item.x - (previous.x + previous.width);
      return `${text}${gap > 1.2 ? ' ' : ''}${item.text}`;
    }, '').replace(/\s+/g, ' ').trim())
    .filter(Boolean);
};

export const extractPdfText = async (buffer: ArrayBuffer): Promise<PdfExtraction> => {
  const pdfjs = await import('pdfjs-dist');
  pdfjs.GlobalWorkerOptions.workerSrc = pdfWorkerUrl;
  const loadingTask = pdfjs.getDocument({ data: new Uint8Array(buffer) });
  const document = await loadingTask.promise;
  if (document.numPages > 80) {
    await loadingTask.destroy();
    throw new Error('Esse PDF tem páginas demais para uma importação segura. Divida o extrato em períodos menores.');
  }
  const pages: string[] = [];
  for (let pageNumber = 1; pageNumber <= document.numPages; pageNumber += 1) {
    const page = await document.getPage(pageNumber);
    const content = await page.getTextContent();
    const items = content.items.filter((item): item is typeof item & PdfTextItem => 'str' in item) as PdfTextItem[];
    pages.push(pageItemsToLines(items).join('\n'));
    page.cleanup();
  }
  await loadingTask.destroy();
  return { text: pages.join('\n'), pages: pages.length };
};

const MONTHS: Record<string, number> = {
  jan: 1, fev: 2, mar: 3, abr: 4, mai: 5, jun: 6,
  jul: 7, ago: 8, set: 9, out: 10, nov: 11, dez: 12,
};

const slashDateAtStart = /^\s*(\d{1,2}\/\d{1,2}(?:\/\d{2,4})?)(?=\s|$)/;
const namedDateAtStart = /^\s*(\d{1,2})\s+(JAN|FEV|MAR|ABR|MAI|JUN|JUL|AGO|SET|OUT|NOV|DEZ)(?:\s+(\d{2,4}))?(?=\s|$)/i;
const moneyExpression = /(?:R\$\s*)?(?:[-+]\s*)?(?:\d{1,3}(?:\.\d{3})*|\d+)[,.]\d{2}(?:\s*[-+DC])?/gi;

const inferStatementYear = (text: string): number => {
  const fullDate = text.match(/\b\d{1,2}\/\d{1,2}\/(20\d{2})\b/);
  if (fullDate) return Number(fullDate[1]);
  const year = text.match(/\b(20\d{2})\b/);
  return year ? Number(year[1]) : new Date().getFullYear();
};

const parsePdfRowDate = (line: string, inferredYear: number): { date: string; token: string } | null => {
  const slash = line.match(slashDateAtStart);
  if (slash) {
    const token = slash[1];
    const date = parseStatementDate(token.split('/').length === 2 ? `${token}/${inferredYear}` : token);
    return date ? { date, token } : null;
  }
  const named = line.match(namedDateAtStart);
  if (!named) return null;
  const year = Number(named[3] || inferredYear);
  const normalizedYear = year < 100 ? year + 2000 : year;
  const month = MONTHS[normalizeSearchText(named[2]).slice(0, 3)];
  const date = parseStatementDate(`${String(named[1]).padStart(2, '0')}/${String(month).padStart(2, '0')}/${normalizedYear}`);
  return date ? { date, token: named[0].trim() } : null;
};

const hasMoney = (line: string): boolean => {
  moneyExpression.lastIndex = 0;
  return moneyExpression.test(line);
};

const buildLogicalRows = (text: string): string[] => {
  const lines = text.split(/\r?\n/).map((line) => line.replace(/\s+/g, ' ').trim()).filter(Boolean);
  const year = inferStatementYear(text);
  const rows: string[] = [];
  let current = '';
  for (const line of lines) {
    if (parsePdfRowDate(line, year)) {
      if (current) rows.push(current);
      current = line;
    } else if (current && !hasMoney(current) && rows.length < 5000) {
      current = `${current} ${line}`;
    }
  }
  if (current) rows.push(current);
  return rows;
};

const inferPdfTransactionType = (description: string, rawAmount: string, isCardStatement: boolean): TransactionType => {
  const normalizedDescription = normalizeSearchText(description);
  const normalizedAmount = rawAmount.toLocaleUpperCase('pt-BR').replace(/\s/g, '');
  if (/[C+]$/.test(normalizedAmount) || /(pix recebido|credito|deposito|salario|rendimento|estorno|reembolso|cashback)/.test(normalizedDescription)) return 'income';
  if (/^-|^R\$-|[D-]$/.test(normalizedAmount) || /(pix enviado|debito|compra|pagamento|saque|tarifa|boleto)/.test(normalizedDescription)) return 'expense';
  return isCardStatement ? 'expense' : 'expense';
};

const ignoredDescription = (description: string): boolean => {
  const normalized = normalizeSearchText(description);
  return /^(saldo|saldo anterior|saldo do dia|saldo final|total|total da fatura|vencimento|pagamento minimo|limite disponivel|limite total)/.test(normalized);
};

export const parsePdfStatementText = (text: string, rules: ImportRule[] = []): ImportCandidate[] => {
  if (text.replace(/\s/g, '').length < 40) throw new Error('Este PDF parece ser escaneado ou não possui texto selecionável. Use OFX/CSV ou um PDF digital do banco.');
  const inferredYear = inferStatementYear(text);
  const normalizedDocument = normalizeSearchText(text);
  const isCardStatement = /(fatura|cartao de credito|cartao credito)/.test(normalizedDocument);
  const hasBalanceColumn = /\bsaldo\b/.test(normalizedDocument);
  const candidates = buildLogicalRows(text).flatMap((line) => {
    const dateInfo = parsePdfRowDate(line, inferredYear);
    if (!dateInfo) return [];
    moneyExpression.lastIndex = 0;
    const monetaryValues = [...line.matchAll(moneyExpression)];
    if (monetaryValues.length === 0) return [];
    const valueMatch = hasBalanceColumn && monetaryValues.length > 1 ? monetaryValues[0] : monetaryValues[monetaryValues.length - 1];
    const rawAmount = valueMatch[0];
    const parsedAmount = parseSignedMoney(rawAmount.replace(/([DC])$/i, ''));
    if (parsedAmount === null || parsedAmount === 0) return [];
    const description = line
      .replace(dateInfo.token, '')
      .replace(moneyExpression, ' ')
      .replace(/\b(?:D|C)\b/gi, ' ')
      .replace(/[|•]+/g, ' ')
      .replace(/\s+/g, ' ')
      .trim();
    if (!description || ignoredDescription(description)) return [];
    const type = inferPdfTransactionType(description, rawAmount, isCardStatement);
    const amount = Math.abs(parsedAmount);
    const category = categorizeDescription(description, type, rules);
    return [{
      id: createId(),
      date: dateInfo.date,
      description,
      amount,
      type,
      categoryLabel: category.label,
      categoryIcon: category.icon,
      fingerprint: buildImportFingerprint(dateInfo.date, description, amount, type),
    }];
  });
  if (candidates.length === 0) throw new Error('Não consegui reconhecer lançamentos nesse PDF. Tente exportar o extrato em OFX ou CSV.');
  return candidates;
};
