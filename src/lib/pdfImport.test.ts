import { describe, expect, it } from 'vitest';
import { parsePdfStatementText } from './pdfImport';

describe('leitura de texto extraído de PDFs bancários', () => {
  it('separa o valor movimentado do saldo e entende débito e crédito', () => {
    const rows = parsePdfStatementText(`
      EXTRATO DA CONTA
      Período 01/08/2026 a 31/08/2026
      Data Histórico Valor Saldo
      24/08/2026 PIX ENVIADO JOAO -45,90 1.254,10
      23/08/2026 PIX RECEBIDO MARIA 300,00 C 1.300,00
      22/08/2026 SALDO DO DIA 1.300,00
    `);
    expect(rows).toHaveLength(2);
    expect(rows[0]).toMatchObject({ date: '2026-08-24T12:00:00.000', amount: 45.9, type: 'expense' });
    expect(rows[1]).toMatchObject({ amount: 300, type: 'income' });
  });

  it('entende datas por mês abreviado em faturas de cartão', () => {
    const rows = parsePdfStatementText(`
      FATURA DO CARTÃO DE CRÉDITO
      Vencimento 05/09/2026
      Data Estabelecimento Valor
      20 AGO AMAZON.COM.BR 189,90
      18 AGO IFOOD 42,50
    `);
    expect(rows).toHaveLength(2);
    expect(rows[0]).toMatchObject({ date: '2026-08-20T12:00:00.000', amount: 189.9, type: 'expense', categoryLabel: 'Compras' });
    expect(rows[1].categoryLabel).toBe('Alimentação');
  });

  it('recusa documentos sem texto útil', () => {
    expect(() => parsePdfStatementText('   ')).toThrow(/escaneado/i);
  });
});
