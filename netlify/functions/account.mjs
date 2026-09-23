const COOKIE = '__Host-surreal-session';
const json = (body, status = 200, headers = {}) => new Response(JSON.stringify(body), { status, headers: { 'Content-Type': 'application/json', 'Cache-Control': 'no-store', ...headers } });
const configured = () => Boolean(process.env.SUPABASE_URL && process.env.SUPABASE_ANON_KEY && process.env.APP_URL);
const billingReady = () => Boolean(process.env.BILLING_ENABLED === 'true' && process.env.STRIPE_SECRET_KEY && process.env.STRIPE_PRICE_ID && process.env.SUPABASE_SERVICE_ROLE_KEY);
const fail = (status, message) => { throw Object.assign(new Error(message), { status }); };

export function sessionCookie(token, seconds = 3600) {
  return `${COOKIE}=${encodeURIComponent(token)}; Path=/; HttpOnly; Secure; SameSite=Strict; Max-Age=${Math.min(3600, Math.max(0, seconds))}`;
}

export function allowedOrigin(request) {
  return Boolean(process.env.APP_URL && request.headers.get('origin') === new URL(process.env.APP_URL).origin);
}

async function upstream(url, options = {}) {
  const response = await fetch(url, { ...options, signal: AbortSignal.timeout(12000) });
  const data = await response.json().catch(() => ({}));
  if (!response.ok) fail(response.status === 429 ? 429 : 502, response.status === 429 ? 'Muitas tentativas. Aguarde antes de tentar novamente.' : 'O serviço não concluiu a operação. Confira os dados e tente novamente.');
  return data;
}

function supabase(path, options = {}, token, admin = false) {
  const key = admin ? process.env.SUPABASE_SERVICE_ROLE_KEY : process.env.SUPABASE_ANON_KEY;
  return upstream(`${process.env.SUPABASE_URL}${path}`, { ...options, headers: { apikey: key, Authorization: `Bearer ${token || key}`, 'Content-Type': 'application/json', ...options.headers } });
}

async function identity(request) {
  const cookie = (request.headers.get('cookie') || '').split(';').map((item) => item.trim()).find((item) => item.startsWith(`${COOKIE}=`));
  if (!cookie) fail(401, 'Entre na sua conta para continuar.');
  const token = decodeURIComponent(cookie.slice(COOKIE.length + 1));
  let user;
  try { user = await supabase('/auth/v1/user', {}, token); } catch { fail(401, 'Sua sessão terminou. Entre novamente.'); }
  if (!user?.id) fail(401, 'Sessão inválida.');
  return { user, token };
}

function stripe(path, fields, key) {
  return upstream(`https://api.stripe.com/v1/${path}`, { method: fields ? 'POST' : 'GET', headers: { Authorization: `Bearer ${process.env.STRIPE_SECRET_KEY}`, ...(fields ? { 'Content-Type': 'application/x-www-form-urlencoded' } : {}), ...(key ? { 'Idempotency-Key': key } : {}) }, ...(fields ? { body: new URLSearchParams(fields).toString() } : {}) });
}

async function customerFor(user, create = false) {
  const rows = await supabase(`/rest/v1/billing_customers?user_id=eq.${encodeURIComponent(user.id)}&select=customer_id`, {}, undefined, true);
  if (rows[0]?.customer_id) return rows[0].customer_id;
  if (!create) return null;
  const customer = await stripe('customers', { email: user.email, 'metadata[user_id]': user.id }, `surreal-customer-${user.id}`);
  await supabase('/rest/v1/billing_customers?on_conflict=user_id', { method: 'POST', headers: { Prefer: 'resolution=ignore-duplicates' }, body: JSON.stringify({ user_id: user.id, customer_id: customer.id }) }, undefined, true);
  const saved = await customerFor(user);
  if (!saved) fail(502, 'Não foi possível preparar sua assinatura.');
  return saved;
}

async function subscriptionFor(user) {
  if (!process.env.SUPABASE_SERVICE_ROLE_KEY) return { active: false, customer: null, subscription: null };
  const customer = await customerFor(user);
  if (!customer) return { active: false, customer: null, subscription: null };
  if (!process.env.STRIPE_SECRET_KEY || !process.env.STRIPE_PRICE_ID) fail(503, 'Não foi possível verificar sua assinatura. Tente novamente mais tarde.');
  const result = await stripe(`subscriptions?customer=${encodeURIComponent(customer)}&status=all&limit=100`);
  const subscription = result.data?.find((item) => ['active', 'trialing'].includes(item.status) && item.items?.data?.some((line) => line.price.id === process.env.STRIPE_PRICE_ID));
  const hasOpenSubscription = result.data?.some((item) => !['canceled', 'incomplete_expired'].includes(item.status));
  return { active: Boolean(subscription), customer, subscription, hasOpenSubscription };
}

async function bodyOf(request, limit = 1_500_000) {
  if (!request.headers.get('content-type')?.includes('application/json')) fail(415, 'Envie dados em JSON.');
  const raw = await request.text();
  if (Buffer.byteLength(raw) > limit) fail(413, 'Os dados excedem o limite permitido.');
  try { return JSON.parse(raw); } catch { fail(400, 'Dados inválidos.'); }
}

export default async function handler(request) {
  try {
    const action = new URL(request.url).searchParams.get('action') || 'session';
    if (!['GET', 'POST'].includes(request.method)) return json({ error: 'Método não permitido.' }, 405);
    if (request.method === 'POST' && !allowedOrigin(request)) return json({ error: 'Origem não permitida.' }, 403);
    if (action === 'config' && request.method === 'GET') {
      let price = null;
      if (billingReady()) {
        const configuredPrice = await stripe(`prices/${encodeURIComponent(process.env.STRIPE_PRICE_ID)}`);
        if (configuredPrice.active && configuredPrice.recurring && configuredPrice.unit_amount !== null) price = { amount: configuredPrice.unit_amount / 100, currency: configuredPrice.currency, interval: configuredPrice.recurring.interval, intervalCount: configuredPrice.recurring.interval_count };
      }
      return json({ accounts: configured(), billing: billingReady() && Boolean(price), price });
    }
    if (!configured()) return json({ error: 'Contas online ainda não estão disponíveis. Seus dados locais continuam acessíveis.' }, 503);
    if (action === 'logout' && request.method === 'POST') return json({ ok: true }, 200, { 'Set-Cookie': sessionCookie('', 0) });
    if (['send-code', 'verify-code'].includes(action) && request.method === 'POST') {
      const body = await bodyOf(request, 2048);
      if (typeof body.email !== 'string' || body.email.length > 254 || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(body.email)) fail(400, 'Informe um e-mail válido.');
      if (action === 'send-code') {
        await supabase('/auth/v1/otp', { method: 'POST', body: JSON.stringify({ email: body.email, create_user: true }) });
        return json({ ok: true });
      }
      if (typeof body.code !== 'string' || !/^\d{6,8}$/.test(body.code)) fail(400, 'Confira o código recebido.');
      const session = await supabase('/auth/v1/verify', { method: 'POST', body: JSON.stringify({ email: body.email, token: body.code, type: 'email' }) });
      if (!session.access_token || !session.user) fail(401, 'Código inválido ou expirado.');
      return json({ email: session.user.email }, 200, { 'Set-Cookie': sessionCookie(session.access_token, session.expires_in) });
    }
    const { user, token } = await identity(request);
    if (action === 'session' && request.method === 'GET') {
      const membership = await subscriptionFor(user);
      return json({ email: user.email, active: membership.active, hasBillingAccount: Boolean(membership.customer), cancelAtPeriodEnd: Boolean(membership.subscription?.cancel_at_period_end) });
    }
    if (['checkout', 'portal'].includes(action) && request.method === 'POST') {
      if (action === 'checkout' && !billingReady()) fail(503, 'As assinaturas ainda não estão abertas.');
      const membership = await subscriptionFor(user);
      if (action === 'portal' && !membership.customer) fail(404, 'Sua conta ainda não possui um perfil de cobrança.');
      const customer = membership.customer || await customerFor(user, true);
      const origin = new URL(process.env.APP_URL).origin;
      if (action === 'portal' || membership.hasOpenSubscription) {
        const portal = await stripe('billing_portal/sessions', { customer, return_url: `${origin}/?account=1` });
        return json({ url: portal.url });
      }
      const checkout = await stripe('checkout/sessions', { mode: 'subscription', customer, 'line_items[0][price]': process.env.STRIPE_PRICE_ID, 'line_items[0][quantity]': '1', client_reference_id: user.id, 'subscription_data[metadata][user_id]': user.id, success_url: `${origin}/?account=1`, cancel_url: `${origin}/?account=1`, locale: 'pt-BR', expires_at: String((Math.floor(Date.now() / 1000 / 1800) + 2) * 1800) }, `surreal-checkout-${user.id}-${Math.floor(Date.now() / 1800000)}`);
      return json({ url: checkout.url });
    }
    if (action === 'cloud' && request.method === 'GET') {
      const rows = await supabase('/rest/v1/financial_backups?select=payload,updated_at', {}, token);
      return json({ backup: rows[0] ?? null });
    }
    if (action === 'cloud' && request.method === 'POST') {
      const membership = await subscriptionFor(user);
      if (!membership.active) fail(403, 'O backup na nuvem requer uma assinatura ativa.');
      const body = await bodyOf(request);
      if (body?.app !== 'meus-gastinhos' || body.version !== 5 || !Array.isArray(body.transactions) || !Array.isArray(body.cards)) fail(400, 'Backup inválido.');
      const updatedAt = new Date().toISOString();
      await supabase('/rest/v1/financial_backups?on_conflict=user_id', { method: 'POST', headers: { Prefer: 'resolution=merge-duplicates' }, body: JSON.stringify({ user_id: user.id, payload: body, updated_at: updatedAt }) }, undefined, true);
      return json({ updatedAt });
    }
    if (action === 'delete-cloud' && request.method === 'POST') {
      await supabase('/rest/v1/financial_backups', { method: 'DELETE' }, token);
      return json({ ok: true });
    }
    if (action === 'delete-account' && request.method === 'POST') {
      if (!process.env.SUPABASE_SERVICE_ROLE_KEY) fail(503, 'A exclusão de conta está temporariamente indisponível.');
      const membership = await subscriptionFor(user);
      if (membership.customer) {
        const subscriptions = await stripe(`subscriptions?customer=${encodeURIComponent(membership.customer)}&status=all&limit=100`);
        if (subscriptions.data?.some((item) => !['canceled', 'incomplete_expired'].includes(item.status))) fail(409, 'Encerre sua assinatura no portal antes de excluir a conta.');
      }
      await supabase(`/auth/v1/admin/users/${encodeURIComponent(user.id)}`, { method: 'DELETE' }, undefined, true);
      return json({ ok: true }, 200, { 'Set-Cookie': sessionCookie('', 0) });
    }
    return json({ error: 'Operação não encontrada.' }, 404);
  } catch (error) {
    return json({ error: error.status ? error.message : 'Serviço indisponível. Tente novamente mais tarde.' }, error.status || 503);
  }
}
