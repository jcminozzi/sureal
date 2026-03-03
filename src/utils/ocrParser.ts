import { CATEGORIES } from '../constants/categories';

export const parseReceiptText = (text) => {
    const cleanText = text.toUpperCase();
    const lines = cleanText.split('\n');

    let amount = null;
    let date = null;
    let category = null;
    let description = '';

    // 1. Encontrar Valor Total
    // Procura por linhas com TOTAL, VALOR, PAGAR seguidos de números
    // Ou simplesmente o maior valor encontrado no texto (risco de pegar troco, mas é um chute inicial)
    const moneyRegex = /R\$\s?(\d+[.,]\d{2})|(\d+[.,]\d{2})/g;
    const allValues = [];

    lines.forEach(line => {
        const matches = line.match(moneyRegex);
        if (matches) {
            matches.forEach(m => {
                const val = parseFloat(m.replace('R$', '').replace('.', '').replace(',', '.').trim());
                if (!isNaN(val)) allValues.push(val);
            });
        }
    });

    // Tenta achar explicitamente o total
    const totalLine = lines.find(l => l.includes('TOTAL') || l.includes('VALOR A PAGAR'));
    if (totalLine) {
        const matches = totalLine.match(moneyRegex);
        if (matches) {
            amount = parseFloat(matches[0].replace('R$', '').replace('.', '').replace(',', '.').trim());
        }
    }

    // Se não achou total explícito, pega o maior valor (assumindo que é o total)
    if (!amount && allValues.length > 0) {
        amount = Math.max(...allValues);
    }

    // 2. Encontrar Data
    const dateRegex = /(\d{2})\/(\d{2})\/(\d{2,4})/;
    const dateMatch = cleanText.match(dateRegex);
    if (dateMatch) {
        // Formato ISO para o input type="date" ou Date object
        // dateMatch[0] é a string completa "dd/mm/yyyy"
        // Mas o app usa new Date().toISOString()
        const [_, day, month, year] = dateMatch;
        const fullYear = year.length === 2 ? `20${year}` : year;
        date = new Date(`${fullYear}-${month}-${day}`).toISOString();
    }

    // 3. Encontrar Categoria e Descrição (Nome do Estabelecimento)
    // Geralmente o nome do estabelecimento está nas primeiras linhas
    const firstLines = lines.slice(0, 5).join(' ');

    const categoryKeywords = {
        market: ['MERCADO', 'SUPERMERCADO', 'ATACADÃO', 'ASSAI', 'CARREFOUR', 'EXTRA', 'PÃO DE AÇÚCAR', 'DIA'],
        food: ['RESTAURANTE', 'LANCHONETE', 'BURGER', 'PIZZA', 'MCDONALDS', 'IFOOD', 'PADARIA'],
        transport: ['UBER', '99', 'POSTO', 'IPIRANGA', 'SHELL', 'BR', 'AUTO'],
        health: ['DROGARIA', 'FARMÁCIA', 'PACHECO', 'RAIA', 'DROGASIL'],
        leisure: ['CINEMA', 'INGRESSO', 'PLAY'],
        services: ['VIVO', 'CLARO', 'TIM', 'NET', 'ENEL', 'SABESP']
    };

    for (const [catId, keywords] of Object.entries(categoryKeywords)) {
        if (keywords.some(k => cleanText.includes(k))) {
            category = CATEGORIES.find(c => c.id === catId);
            break;
        }
    }

    // Tenta pegar o nome do estabelecimento da primeira linha que não seja vazia
    const establishment = lines.find(l => l.trim().length > 3 && !l.includes('CNPJ') && !l.includes('EXTRATO'));
    if (establishment) {
        description = establishment.trim().split(' ').slice(0, 3).join(' '); // Pega as 3 primeiras palavras
        description = description.charAt(0).toUpperCase() + description.slice(1).toLowerCase();
    }

    return { amount, date, category, description };
};
