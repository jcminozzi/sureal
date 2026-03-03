# 💰 Meus Gastinhos - v2.0

Um **rastreador de despesas inteligente** com suporte a OCR, entrada de voz, integrações com cartões de crédito e análises financeiras avançadas.

![Status](https://img.shields.io/badge/status-active-success) ![Version](https://img.shields.io/badge/version-2.0.0-blue) ![License](https://img.shields.io/badge/license-MIT-green)

## ✨ Recursos Principais

### 📊 Análise Financeira
- 📈 Dashboard em tempo real com gráficos interativos
- 💹 Análise de tendências de gastos
- 🎯 Rastreamento de metas e sonhos
- 📊 Relatórios detalhados por categoria
- 🏆 Sistema de gamificação com níveis

### 🎤 Entrada Inteligente
- 🎙️ Entrada por voz (português)
- 📷 OCR para ler recibos (câmera)
- ⌨️ Entrada manual rápida
- 🔄 Suporte a parcelamento de cartão
- 🔁 Transações recorrentes/fixas

### 💳 Gerenciamento de Cartões
- 16+ bancos brasileiros pré-configurados
- Rastreamento de faturas em aberto
- Notificações de vencimento
- Integração com despesas identificadas por cartão

### 🔐 Privacidade & Segurança
- 🔒 Armazenamento local (sem servidor)
- 🕶️ Modo privacidade (ofusca valores)
- 💾 Backup/Restore automático
- ✅ Validação de dados em tempo real

### 📱 Responsividade
- 📱 Interface mobile otimizada
- 🖥️ Dashboard desktop completo
- ⚡ Performance otimizada (PWA)

## 🚀 Quick Start

### Instalação

```bash
# Clone o repositório
git clone https://github.com/seu-usuario/meusgastos.git
cd meusgastos

# Instale as dependências
npm install

# Inicie o servidor de desenvolvimento
npm run dev
```

### Build para Produção

```bash
npm run build
npm run preview
```

## 📚 Documentação

- 📖 [Guia de Boas Práticas](./BOAS_PRATICAS.md) - Padrões de código e convenções
- 🔧 [Melhorias Implementadas](./MELHORIAS.md) - v2.0 features
- 📚 [Exemplos de Uso](./EXEMPLOS_USO.md) - Como usar novos componentes

## 🏗️ Arquitetura

### Context API
```
AppContext (Estado Global)
├── transactions
├── cards
├── goals
└── financialData

ThemeContext (Temas)
├── dark
└── light
```

### Estrutura de Pastas

```
src/
├── components/          # Componentes React reutilizáveis
├── context/            # Context API (AppContext, ThemeContext)
├── hooks/              # Hooks customizados
│   ├── useApp.js
│   ├── useFinancialAnalytics.js
│   ├── useOCR.js
│   ├── useVoiceInput.js
│   └── usePWAInstall.js
├── layouts/            # Layouts principais (Mobile, Desktop)
├── utils/              # Utilitários
│   └── financial.js    # Funções financeiras
├── constants/          # Constantes (bancos, categorias)
└── App.jsx             # Entrada
```

## 🔑 Componentes Principais

### Context Providers
```jsx
<AppProvider>
  <ThemeProvider>
    <App />
  </ThemeProvider>
</AppProvider>
```

### Hooks

```jsx
// Estado global
const { transactions, addTransaction, balance } = useApp();

// Analytics
const { healthScore, insights } = useFinancialAnalytics(
  transactions, income, expenses
);

// Tema
const { theme, toggleTheme } = useTheme();
```

### Componentes Reutilizáveis

```jsx
<StatCard label="Saldo" value={5000} icon={Wallet} />
<Alert type="warning" title="Aviso" message="Texto" />
<ProgressBar value={60} max={100} />
<Badge text="Premium" color="#8b5cf6" />
```

## 💾 Dados

### Estrutura de Transação
```javascript
{
  id: "1234567890",
  amount: 150.50,
  type: "expense",            // 'expense' | 'income'
  status: "paid",             // 'paid' | 'pending'
  description: "Mercado",
  categoryLabel: "Alimentação",
  categoryIcon: "🛒",
  date: "2024-03-02T10:30:00Z",
  cardId: "card_123",         // opcional
  installment: "1/12",        // opcional
  recurring: false            // opcional
}
```

### Estrutura de Cartão
```javascript
{
  id: "card_123",
  bankName: "Nubank",
  bankId: "nubank",
  dueDay: "15",
  gradient: "linear-gradient(...)",
  text: "white"
}
```

### Estrutura de Meta
```javascript
{
  id: "goal_123",
  name: "PS5",
  target: 4000,
  current: 1500,
  emoji: "🎮"
}
```

## 🔧 Configuração

### Variáveis de Ambiente

Crie um arquivo `.env.local`:

```env
VITE_APP_VERSION=2.0.0
VITE_API_URL=http://localhost:3000
```

### ESLint

```bash
npm run lint        # Verificar
npm run lint:fix    # Corrigir automaticamente
```

## 📊 Scripts Disponíveis

```bash
npm run dev         # Servidor de desenvolvimento
npm run build       # Build para produção
npm run preview     # Visualizar build
npm run lint        # Verificar eslint
npm run lint:fix    # Corrigir eslint
```

## 🎯 Funcionalidades Futuras

- [ ] Backend com sincronização
- [ ] Autenticação OAuth
- [ ] Integração com bancos API
- [ ] Orçamento familiar compartilhado
- [ ] IA para categorização automática
- [ ] Recomendações inteligentes
- [ ] Conversão de moedas
- [ ] Modo offline completo
- [ ] Aplicativo desktop (Electron)
- [ ] Suporte a múltiplas moedas

## 📱 Compatibilidade

| Navegador | Versão | Status |
|-----------|--------|--------|
| Chrome    | 90+    | ✅     |
| Firefox   | 88+    | ✅     |
| Safari    | 14+    | ✅     |
| Edge      | 90+    | ✅     |

## 🔒 Segurança

- ✅ Sem requisições a servidores externos
- ✅ Dados armazenados localmente
- ✅ Validação de entrada em tempo real
- ✅ Modo privacidade para dados sensíveis
- ✅ Backup com ofuscação

## 📈 Performance

- ⚡ Lazy loading de componentes
- 🚀 Memoização de cálculos
- 📦 Bundle otimizado
- 🔄 PWA com Service Worker
- �まcache inteligente

## 🤝 Contribuindo

```bash
# 1. Fork o repositório
# 2. Crie uma branch (git checkout -b feature/AmazingFeature)
# 3. Commit suas mudanças (git commit -m 'Add some AmazingFeature')
# 4. Push para a branch (git push origin feature/AmazingFeature)
# 5. Abra um Pull Request
```

## 📝 Commit Conventions

```
feat: adiciona nova funcionalidade
fix: corrige um bug
refactor: refatora código
docs: atualiza documentação
perf: otimiza performance
test: adiciona testes
```

## 📄 Licença

Este projeto está sob licença MIT - veja o arquivo LICENSE para detalhes.

## 👨‍💻 Autor

**Seu Nome**
- GitHub: [@seu-usuario](https://github.com/seu-usuario)
- Email: seu.email@exemplo.com

## 🙏 Agradecimentos

- Comunidade React
- Autores das bibliotecas utilizadas
- Contribuidores

## 📞 Suporte

Tem dúvidas ou encontrou um bug? Abra uma [Issue](https://github.com/seu-usuario/meusgastos/issues)

---

**Versão:** 2.0.0  
**Última atualização:** Março 2026  
**Próxima release:** v2.1.0 (Q2 2026)

⭐ Se este projeto foi útil, deixe uma star!
