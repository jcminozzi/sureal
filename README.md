# surReal

**Dinheiro real, sem complicação.**

O surReal ajuda a registrar entradas e saídas, acompanhar pendências, organizar cartões, parcelamentos, empréstimos, investimentos, limites mensais e metas financeiras. Não exige conta, conexão bancária ou envio dos lançamentos para um servidor: os dados ficam no navegador do próprio dispositivo.

## O que já funciona

- Resumo mensal de entradas, saídas, pendências e resultado projetado
- Cadastro, edição, exclusão, busca e filtros de lançamentos
- Alteração rápida entre pago/recebido e pendente
- Compras parceladas em até 48 vezes, com ou sem juros
- Divisão de uma compra entre até quatro cartões, com condições independentes
- Repetição mensal por 12 meses para contas fixas e receitas recorrentes
- Mais de 20 cartões predefinidos, incluindo Amazon e Mercado Pago
- Cartões próprios com fechamento e vencimento
- Limites de gasto por categoria com alerta de estouro
- Metas financeiras com acompanhamento de progresso
- Empréstimos e financiamentos com prestações fixas e cronograma de pagamento
- Carteira manual de investimentos com posição, ganho e rentabilidade
- Modo privacidade para ocultar valores na tela
- Tema claro e escuro
- Backup completo em JSON, restauração validada e exportação em CSV
- Interface responsiva para celular e computador
- Funcionamento offline após o primeiro acesso

## Privacidade e segurança dos dados

Os dados financeiros são armazenados localmente no IndexedDB, com fallback para o armazenamento local do navegador. Isso significa que:

- o aplicativo não cria conta nem envia lançamentos financeiros para uma API;
- apagar os dados do navegador pode apagar os dados do aplicativo;
- antes de trocar de aparelho ou limpar o navegador, baixe um backup em **Configurações → Seus dados**;
- o backup contém informações financeiras em texto legível e deve ser guardado em local seguro.

## Desenvolvimento

Requisitos: Node.js 20 ou mais recente.

```bash
npm install
npm run dev
```

Verificações completas:

```bash
npm run check
```

Build de produção:

```bash
npm run build
```

## Estrutura principal

```text
src/
├── components/     interface e formulários
├── constants/      categorias financeiras
├── lib/            cálculos, parcelamento e backup
├── store/          estado persistido no navegador
├── types/          contratos TypeScript
├── App.tsx
└── index.css
```

## Compatibilidade

A versão 4 mantém internamente a chave de armazenamento `meusgastinhos-storage` para que o rebranding não apague dados existentes. Backups antigos do **Meus Gastinhos** com `transactions`, `cards` e `exportDate` também podem ser restaurados.

Os cálculos de empréstimos e compras com juros são estimativas por prestações fixas e capitalização mensal. O custo real pode incluir IOF, seguros, tarifas e outras parcelas do CET informado pela instituição financeira.
