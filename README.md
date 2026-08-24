# Meus Gastinhos

Controle financeiro pessoal simples, privado e direto ao ponto.

O Meus Gastinhos ajuda a registrar entradas e saídas, acompanhar pendências, planejar limites mensais e avançar em metas financeiras. Não exige conta, conexão bancária ou envio dos lançamentos para um servidor: os dados ficam no navegador do próprio dispositivo.

## O que já funciona

- Resumo mensal de entradas, saídas, pendências e resultado projetado
- Cadastro, edição, exclusão, busca e filtros de lançamentos
- Alteração rápida entre pago/recebido e pendente
- Compras parceladas com divisão exata do valor total
- Repetição mensal por 12 meses para contas fixas e receitas recorrentes
- Cartões próprios com dia de vencimento
- Limites de gasto por categoria com alerta de estouro
- Metas financeiras com acompanhamento de progresso
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

A versão 3 mantém a chave de armazenamento `meusgastinhos-storage` e normaliza os dados das versões anteriores. Backups antigos com `transactions`, `cards` e `exportDate` também podem ser restaurados.
