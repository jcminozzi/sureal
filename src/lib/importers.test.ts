import { describe, expect, it } from 'vitest';
import {
  buildImportFingerprint,
  candidateToTransaction,
  categorizeDescription,
  inferCsvMapping,
  mapCsvRows,
  parseCsvDocument,
  parseOfx,
  parseSignedMoney,
  parseStatementDate,
} from './importers';

describe('leitura de valores e datas bancárias', () => {
  it('entende formatos brasileiro, internacional e negativo', () => {
    expect(parseSignedMoney('R$ 1.234,56')).toBe(1234.56);
    expect(parseSignedMoney('-89,90')).toBe(-89.9);
    expect(parseSignedMoney('(1,234.56)')).toBe(-1234.56);
  });

  it('entende datas brasileiras, ISO, OFX e serial do Excel', () => {
    expect(parseStatementDate('24/08/2026')?.slice(0, 10)).toBe('2026-08-24');
    expect(parseStatementDate('2026-08-24')?.slice(0, 10)).toBe('2026-08-24');
    expect(parseStatementDate('20260824120000')?.slice(0, 10)).toBe('2026-08-24');
    expect(parseStatementDate('46258')?.slice(0, 10)).toBe('2026-08-24');
  });
});

describe('importação CSV', () => {
  it('preserva um crédito e seu vínculo ao cartão', () => {
    const document = parseCsvDocument('Data;Descrição;Valor;Tipo\n03/09/2026;Estorno;25,00;Crédito');
    const [candidate] = mapCsvRows(document, inferCsvMapping(document));
    expect(candidateToTransaction(candidate, 'fatura.csv', { cardId: 'card-1', status: 'paid' }))
      .toMatchObject({ type: 'income', amount: 25, cardId: 'card-1', status: 'paid' });
  });
  it('ignora linhas de apresentação, infere colunas e converte transações', () => {
    const document = parseCsvDocument([
      'Extrato da conta;;;;',
      'Período;Agosto de 2026;;;',
      'Data;Histórico;Valor;Tipo',
      '24/08/2026;UBER *TRIP;35,90;Débito',
      '23/08/2026;SALARIO EMPRESA;2500,00;Crédito',
    ].join('\n'));
    const mapping = inferCsvMapping(document);
    const rows = mapCsvRows(document, mapping);
    expect(document.headers).toEqual(['Data', 'Histórico', 'Valor', 'Tipo']);
    expect(rows).toHaveLength(2);
    expect(rows[0]).toMatchObject({ type: 'expense', amount: 35.9, categoryLabel: 'Transporte' });
    expect(rows[1]).toMatchObject({ type: 'income', amount: 2500, categoryLabel: 'Salário' });
  });

  it('entende arquivos com débito e crédito em colunas separadas', () => {
    const document = parseCsvDocument('Data,Descrição,Débito,Crédito\n24/08/2026,Farmácia,45.50,\n24/08/2026,Pix recebido,,100.00');
    const rows = mapCsvRows(document, inferCsvMapping(document));
    expect(rows.map((row) => row.type)).toEqual(['expense', 'income']);
    expect(rows.map((row) => row.amount)).toEqual([45.5, 100]);
  });
});

describe('importação OFX', () => {
  it('lê OFX SGML mesmo sem fechamento individual de tags', () => {
    const rows = parseOfx(`OFXHEADER:100
<OFX><BANKTRANLIST>
<STMTTRN><TRNTYPE>DEBIT<DTPOSTED>20260824120000<TRNAMT>-59.90<FITID>abc-1<NAME>IFOOD<MEMO>Pedido 123
<STMTTRN><TRNTYPE>CREDIT<DTPOSTED>20260823120000<TRNAMT>1800.00<FITID>abc-2<NAME>SALARIO
</BANKTRANLIST></OFX>`);
    expect(rows).toHaveLength(2);
    expect(rows[0]).toMatchObject({ amount: 59.9, type: 'expense', categoryLabel: 'Alimentação', externalId: 'abc-1' });
    expect(rows[1]).toMatchObject({ amount: 1800, type: 'income', categoryLabel: 'Salário' });
  });
});

describe('categorização e duplicatas', () => {
  it('prioriza regras personalizadas sobre sugestões padrão', () => {
    const category = categorizeDescription('UBER TRIP', 'expense', [{
      id: 'rule-1',
      keyword: 'uber',
      categoryLabel: 'Lazer',
      categoryIcon: '🎉',
      transactionType: 'expense',
      createdAt: '2026-08-24T12:00:00.000',
    }]);
    expect(category.label).toBe('Lazer');
  });

  it('produz a mesma impressão digital para o mesmo lançamento', () => {
    const first = buildImportFingerprint('2026-08-24T12:00:00.000', 'Mercado Livre', 199.9, 'expense', 'fit-1');
    const second = buildImportFingerprint('2026-08-24T18:00:00.000', '  MERCADO   LIVRE ', 199.9, 'expense', 'FIT-1');
    expect(first).toBe(second);
  });
});
