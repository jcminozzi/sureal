# surReal

**Seu dinheiro, com inteligência.**

O surReal ajuda a registrar entradas e saídas, acompanhar pendências, organizar cartões, parcelamentos, empréstimos, investimentos, limites mensais e metas financeiras. Sem ativar o surReal IQ, não exige conta, conexão bancária ou envio dos lançamentos para um servidor: os dados ficam no navegador do próprio dispositivo.

O **surReal IQ** adiciona um copiloto financeiro opcional. Ele analisa o recorte de dados que aparece na conversa, responde perguntas e prepara ações no aplicativo. Toda mudança precisa ser confirmada antes de ser aplicada.

## surReal IQ

- Chat financeiro contextual em português
- Leitura de entradas, despesas, categorias, limites, metas e pendências
- Ações confirmáveis para adicionar lançamentos, definir orçamento, criar ou atualizar metas e alterar status
- Alertas locais imediatos mesmo antes de chamar a IA
- Consentimento explícito e opção de desligar a integração
- Integração via Puter.js, sem chave de API ou conta de cobrança do desenvolvedor

Ao usar o chat, um recorte dos dados financeiros necessários para a pergunta é enviado à Puter e ao provedor do modelo. O restante do aplicativo continua local e pode ser usado sem ativar a IA. Cada usuário utiliza a própria franquia da Puter; quando ela termina, a própria plataforma informa as opções disponíveis.

## Interface e navegação

- Painel com evolução do resultado mensal e atalhos para receitas, despesas, importação e cartões
- Agenda com contas atrasadas e compromissos dos próximos 30 dias, independentemente do mês selecionado
- Lançamento simplificado, com data, status e recorrência em opções adicionais
- Busca em todo o histórico e filtro por cartão
- Exclusão de lançamentos com opção de desfazer durante 8 segundos
- Configurações divididas em perfil, cartões e dados
- Diálogos com navegação por teclado, foco contido, Escape e retorno do foco ao fechar
- Temas claro/escuro e animações que respeitam a preferência por movimento reduzido

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
- Importação local de extratos e faturas OFX, QFX, CSV e PDF, com pré-visualização e mapeamento de colunas
- Detecção de lançamentos duplicados, categorização automática e regras personalizadas
- Interface responsiva para celular e computador
- Funcionamento offline após o primeiro acesso

## Privacidade e segurança dos dados

Os dados financeiros são armazenados localmente no IndexedDB, com fallback para o armazenamento local do navegador. Isso significa que:

- o aplicativo principal não cria conta nem envia lançamentos financeiros para uma API; o envio só ocorre ao perguntar algo no surReal IQ depois do consentimento;
- apagar os dados do navegador pode apagar os dados do aplicativo;
- antes de trocar de aparelho ou limpar o navegador, baixe um backup em **Configurações → Seus dados**;
- o backup contém informações financeiras em texto legível e deve ser guardado em local seguro.

## Desenvolvimento

### Contas, assinatura e nuvem

O painel inclui comparação interativa de seis meses, distribuição de gastos e primeiros passos guiados. A área **Minha conta** suporta integração opcional com Supabase e Stripe por Netlify Functions. Sem configuração, o aplicativo continua local e não oferece checkout.

Leia [o guia de integração](docs/INTEGRATION.md) para configurar os serviços, executar a migração e testar a cobrança antes de habilitá-la. O backup na nuvem desta versão é manual; IA pela Puter não está incluída no plano.

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

A versão 5.1 mantém internamente a chave de armazenamento `meusgastinhos-storage` para que as atualizações não apaguem dados existentes. Backups antigos do **Meus Gastinhos** com `transactions`, `cards` e `exportDate` também podem ser restaurados.

Os cálculos de empréstimos e compras com juros são estimativas por prestações fixas e capitalização mensal. O custo real pode incluir IOF, seguros, tarifas e outras parcelas do CET informado pela instituição financeira.

PDFs são processados integralmente no navegador e precisam conter texto selecionável. Arquivos escaneados como imagem, protegidos por senha, maiores que 20 MB ou com mais de 80 páginas devem ser exportados novamente pelo banco ou convertidos para OFX/CSV. Esses limites evitam travamentos em celulares e computadores mais modestos.
