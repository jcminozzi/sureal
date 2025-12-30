import { CATEGORIES } from '../layouts/MobileLayout';

export const parseVoiceCommand = (transcript) => {
    const text = transcript.toLowerCase();
    let type = 'expense';
    let amount = null;
    let category = null;
    let description = '';

    // Detectar Tipo
    if (text.includes('recebi') || text.includes('ganhei') || text.includes('depósito') || text.includes('salário')) {
        type = 'income';
    }

    // Detectar Valor (Regex para pegar números, inclusive com vírgula ou "reais")
    // Ex: "50 reais", "50,00", "50"
    const amountMatch = text.match(/(\d+([.,]\d{1,2})?)/);
    if (amountMatch) {
        amount = parseFloat(amountMatch[0].replace(',', '.'));
    }

    // Detectar Categoria
    // Mapeamento de palavras-chave para categorias
    const categoryKeywords = {
        market: ['mercado', 'compras', 'supermercado', 'açougue', 'feira'],
        food: ['comida', 'restaurante', 'almoço', 'jantar', 'lanche', 'ifood', 'pizza'],
        transport: ['transporte', 'uber', '99', 'táxi', 'ônibus', 'metrô', 'gasolina', 'combustível'],
        home: ['casa', 'aluguel', 'condomínio', 'luz', 'água', 'internet', 'moradia'],
        leisure: ['lazer', 'cinema', 'jogo', 'passeio', 'viagem', 'bar'],
        health: ['saúde', 'remédio', 'farmácia', 'médico', 'dentista', 'exame'],
        education: ['educação', 'escola', 'faculdade', 'curso', 'livro'],
        services: ['serviço', 'assinatura', 'streaming', 'celular'],
        salary: ['salário', 'pagamento'],
        investment: ['investimento', 'poupança', 'cdb', 'ações']
    };

    for (const [catId, keywords] of Object.entries(categoryKeywords)) {
        if (keywords.some(k => text.includes(k))) {
            category = CATEGORIES.find(c => c.id === catId);
            break;
        }
    }

    // Descrição: O que sobrou ou a própria categoria
    // Remove palavras comuns para limpar a descrição
    let cleanText = text
        .replace('gastei', '')
        .replace('paguei', '')
        .replace('recebi', '')
        .replace('ganhei', '')
        .replace('reais', '')
        .replace('real', '')
        .replace('no', '')
        .replace('na', '')
        .replace('em', '')
        .replace('com', '')
        .replace(amountMatch ? amountMatch[0] : '', '')
        .trim();

    description = cleanText.charAt(0).toUpperCase() + cleanText.slice(1);
    if (!description && category) description = category.label;

    return { type, amount, category, description };
};
