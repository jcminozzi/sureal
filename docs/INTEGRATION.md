# Integração do surReal

## Estado desta entrega

O aplicativo continua funcionando sem serviços externos: lançamentos, gráficos, importação, orçamento, metas e backup local. O painel é a entrada principal. O chat Puter existente continua opcional e separado da assinatura.

Há código para autenticação por link de e-mail, backup manual na nuvem, checkout recorrente e portal de cobrança. Essas integrações ficam indisponíveis até a configuração abaixo. Não foram feitos deploys, pagamentos nem criação de contas externas nesta entrega.

**Não anunciar ainda:** sincronização automática, IA incluída no Pro, conexão bancária, análise de todos os investimentos pela IA, certificação de segurança ou renda garantida. O Pro implementado oferece backup manual na nuvem; é uma base técnica para piloto, não a proposta comercial final recomendada.

## Configuração

1. Crie um projeto Supabase e execute `supabase/migrations/001_accounts.sql` no editor SQL. Use projeto de teste primeiro. A migração não deve ser executada novamente sem verificar as tabelas existentes.
2. Ative login por e-mail e configure a Site URL para a origem HTTPS do aplicativo. O fluxo inicial usa o Magic Link padrão do Supabase e não exige editar o template. Teste novo usuário, usuário existente, link expirado e link já utilizado. A sessão do surReal dura até uma hora, exigindo novo link após expirar. Antes de abrir ao público, configure SMTP próprio, remetente verificado e limites de envio.
3. Crie produto e preço recorrente no Stripe em modo de teste. Configure o Customer Portal com cancelamento, atualização de pagamento e histórico de faturas. O preço mostrado no app vem desse preço no Stripe; não é uma promessa fixa de R$ 19,90.
4. Configure as variáveis de `.env.example` no Netlify, com escopo de Functions. Em **Supabase → Project Settings → API Keys**, use a chave `Publishable` em `SUPABASE_PUBLISHABLE_KEY` e a chave `Secret` em `SUPABASE_SECRET_KEY`. A Function também aceita temporariamente as chaves legadas `anon` e `service_role` com seus nomes antigos, mas não configure os dois formatos ao mesmo tempo. Nunca use `VITE_` para segredos. `APP_URL` deve ser a origem HTTPS exata usada pelos clientes. O cookie Secure exige HTTPS. Não use a origem de produção para validar um deploy de preview.
5. Mantenha `BILLING_ENABLED=false` até terminar os testes. A conta Stripe e o portal de cobrança são diferentes da conta Puter.
6. Após validação e revisão da oferta, ative a cobrança. O endpoint `/.netlify/functions/account` consulta a assinatura no Stripe antes de permitir gravar backups; a página de retorno do checkout nunca libera o plano sozinha.

Não há webhook nesta versão: a consulta de assinatura é feita diretamente à Stripe no acesso à conta e na gravação na nuvem. Isso evita estado de pagamento controlado pelo navegador, mas adiciona latência e dependência de disponibilidade. Para escala, implementar eventos autenticados, processamento idempotente e reconciliação periódica antes de substituir essa consulta.

## Backup e isolamento

- Os dados locais existentes não são enviados automaticamente ao entrar na conta.
- Salvar uma cópia substitui o backup da conta após confirmação; não faz merge entre dispositivos.
- Restaurar substitui os dados locais após confirmação e validação do formato.
- Um cliente sem assinatura pode ler ou excluir sua cópia, mas não gravar outra.
- A tabela de backups usa RLS para leitura e exclusão por `auth.uid()`. Escritas diretas por `authenticated` são revogadas; somente o servidor grava após conferir a assinatura.
- A tabela de clientes Stripe é inacessível a usuários comuns. A chave administrativa fica somente na Function.
- A sessão fica em cookie HttpOnly, Secure e SameSite=Strict. Mutações verificam a origem. Os tokens não são retornados ao JavaScript.
- Excluir a conta apaga seu backup por cascata. Assinaturas ainda em vigor devem ser encerradas antes. Registros de cobrança na Stripe seguem a retenção do provedor; não são apagados por essa operação.
- Dispositivos compartilhados continuam exigindo cuidado: sair da conta online não apaga os dados locais. A interface informa isso.

## Validação obrigatória com serviços reais de teste

- Duas contas A/B: B não lê, grava ou exclui dados de A, inclusive acessando o REST do Supabase diretamente com o token de B.
- E-mail: link correto, inválido, expirado, já utilizado, reenvio e limites de abuso.
- Cookie: expiração, logout, origem estrangeira e ausência de autenticação.
- Stripe: compra aprovada, recusada, autenticação adicional, clique repetido, renovação falha, cancelamento imediato e ao fim do ciclo, retorno sem pagamento e acesso ao portal.
- Nuvem: exportar local, salvar, restaurar em outro dispositivo, cancelar assinatura e ainda recuperar o backup, exclusão permanente.
- Manter `BILLING_ENABLED=false` se algum teste falhar. Os testes automatizados locais não substituem esses testes.

## Antes de vender ao público

Preparar termos e política de privacidade com responsável e contato reais; informar Supabase, Stripe e Puter, retenção e direitos; configurar monitoramento sem dados financeiros nos logs, alertas de custo e recuperação de backups; testar isolamento no banco provisionado e revisar regras do provedor. Configurar controles de abuso e envio de e-mails adequados ao volume. Não há auditoria de segurança independente nesta entrega.

Para a proposta comercial recomendada, ainda faltam IA no servidor com franquia e orçamento global, sincronização automática com resolução de conflitos, relatórios recorrentes e validação de retenção com usuários. Não habilite uma oferta que prometa esses recursos antes de implementá-los.

## Fontes técnicas

- Supabase Auth: https://supabase.com/docs/guides/auth
- RLS: https://supabase.com/docs/guides/database/postgres/row-level-security
- Stripe Checkout: https://docs.stripe.com/api/checkout/sessions/create
- Stripe Portal: https://docs.stripe.com/api/customer_portal/sessions/create
- Netlify Functions: https://docs.netlify.com/build/functions/api/
