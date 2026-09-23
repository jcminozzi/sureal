import { afterEach, describe, expect, it, vi } from 'vitest';
import handler, { allowedOrigin, sessionCookie } from '../netlify/functions/account.mjs';

afterEach(() => { vi.unstubAllEnvs(); vi.unstubAllGlobals(); });
describe('account API boundaries', () => {
  it('uses a secure cookie that cannot be read by client JavaScript', () => {
    expect(sessionCookie('token', 999999)).toBe('__Host-surreal-session=token; Path=/; HttpOnly; Secure; SameSite=Strict; Max-Age=3600');
    expect(sessionCookie('', 0)).toContain('Max-Age=0');
  });
  it('rejects missing and foreign origins for mutations', async () => {
    vi.stubEnv('APP_URL', 'https://surreal.example');
    expect(allowedOrigin(new Request('https://surreal.example'))).toBe(false);
    expect(allowedOrigin(new Request('https://surreal.example', { headers: { Origin: 'https://surreal.example' } }))).toBe(true);
    const response = await handler(new Request('https://surreal.example/.netlify/functions/account?action=logout', { method: 'POST', headers: { Origin: 'https://evil.example' } }));
    expect(response.status).toBe(403);
  });
  it('fails closed when integrations are not configured', async () => {
    vi.stubEnv('SUPABASE_URL', ''); vi.stubEnv('BILLING_ENABLED', 'false');
    const response = await handler(new Request('https://surreal.example/.netlify/functions/account?action=config'));
    expect(await response.json()).toEqual({ accounts: false, billing: false, price: null });
  });
  it('does not allow unauthenticated cloud access', async () => {
    vi.stubEnv('SUPABASE_URL', 'https://supabase.example'); vi.stubEnv('SUPABASE_PUBLISHABLE_KEY', 'sb_publishable_test'); vi.stubEnv('APP_URL', 'https://surreal.example');
    const fetchMock = vi.fn(); vi.stubGlobal('fetch', fetchMock);
    const response = await handler(new Request('https://surreal.example/.netlify/functions/account?action=cloud'));
    expect(response.status).toBe(401); expect(fetchMock).not.toHaveBeenCalled();
  });
  it('uses the default Supabase magic link and returns it to the configured app origin', async () => {
    vi.stubEnv('SUPABASE_URL', 'https://supabase.example'); vi.stubEnv('SUPABASE_PUBLISHABLE_KEY', 'sb_publishable_test'); vi.stubEnv('APP_URL', 'https://surreal.example/app');
    const fetchMock = vi.fn().mockResolvedValue(new Response('{}', { status: 200 })); vi.stubGlobal('fetch', fetchMock);
    const response = await handler(new Request('https://surreal.example/.netlify/functions/account?action=send-link', { method: 'POST', headers: { Origin: 'https://surreal.example', 'Content-Type': 'application/json' }, body: JSON.stringify({ email: 'test@example.com' }) }));
    expect(response.status).toBe(200);
    expect(JSON.parse(fetchMock.mock.calls[0][1].body)).toMatchObject({ email: 'test@example.com', email_redirect_to: 'https://surreal.example/?account=1' });
    expect(fetchMock.mock.calls[0][1].headers.apikey).toBe('sb_publishable_test');
    expect(fetchMock.mock.calls[0][1].headers.Authorization).toBeUndefined();
  });
  it('validates a magic-link token before putting it in the secure session cookie', async () => {
    vi.stubEnv('SUPABASE_URL', 'https://supabase.example'); vi.stubEnv('SUPABASE_PUBLISHABLE_KEY', 'sb_publishable_test'); vi.stubEnv('APP_URL', 'https://surreal.example');
    const fetchMock = vi.fn().mockResolvedValue(new Response(JSON.stringify({ id: 'user-1', email: 'test@example.com' }), { status: 200 })); vi.stubGlobal('fetch', fetchMock);
    const token = 'a'.repeat(64);
    const response = await handler(new Request('https://surreal.example/.netlify/functions/account?action=adopt-session', { method: 'POST', headers: { Origin: 'https://surreal.example', 'Content-Type': 'application/json' }, body: JSON.stringify({ accessToken: token }) }));
    expect(response.status).toBe(200);
    expect(response.headers.get('set-cookie')).toContain('__Host-surreal-session=');
    expect(fetchMock.mock.calls[0][1].headers.apikey).toBe('sb_publishable_test');
    expect(fetchMock.mock.calls[0][1].headers.Authorization).toBe(`Bearer ${token}`);
  });
  it('requires active membership before storing a cloud backup', async () => {
    vi.stubEnv('SUPABASE_URL', 'https://supabase.example'); vi.stubEnv('SUPABASE_PUBLISHABLE_KEY', 'sb_publishable_test'); vi.stubEnv('APP_URL', 'https://surreal.example'); vi.stubEnv('BILLING_ENABLED', 'false');
    const fetchMock = vi.fn().mockResolvedValue(new Response(JSON.stringify({ id: 'user-1', email: 'test@example.com' }), { status: 200 })); vi.stubGlobal('fetch', fetchMock);
    const response = await handler(new Request('https://surreal.example/.netlify/functions/account?action=cloud', { method: 'POST', headers: { Origin: 'https://surreal.example', Cookie: '__Host-surreal-session=test', 'Content-Type': 'application/json' }, body: '{}' }));
    expect(response.status).toBe(403); expect(fetchMock).toHaveBeenCalledTimes(1);
  });
  it('sends an existing past-due subscription to the portal instead of creating another subscription', async () => {
    vi.stubEnv('SUPABASE_URL', 'https://supabase.example'); vi.stubEnv('SUPABASE_PUBLISHABLE_KEY', 'sb_publishable_test'); vi.stubEnv('SUPABASE_SECRET_KEY', 'sb_secret_server-only');
    vi.stubEnv('APP_URL', 'https://surreal.example'); vi.stubEnv('BILLING_ENABLED', 'true'); vi.stubEnv('STRIPE_SECRET_KEY', 'test-secret'); vi.stubEnv('STRIPE_PRICE_ID', 'price_test');
    const fetchMock = vi.fn();
    for (const payload of [{ id: 'user-1', email: 'test@example.com' }, [{ customer_id: 'cus_test' }], { data: [{ id: 'sub_test', status: 'past_due', items: { data: [{ price: { id: 'price_test' } }] } }] }, { url: 'https://billing.stripe.com/p/session/test' }]) fetchMock.mockResolvedValueOnce(new Response(JSON.stringify(payload)));
    vi.stubGlobal('fetch', fetchMock);
    const response = await handler(new Request('https://surreal.example/.netlify/functions/account?action=checkout', { method: 'POST', headers: { Origin: 'https://surreal.example', Cookie: '__Host-surreal-session=test' } }));
    expect(response.status).toBe(200);
    expect(await response.json()).toEqual({ url: 'https://billing.stripe.com/p/session/test' });
    expect(fetchMock.mock.calls[3][0]).toBe('https://api.stripe.com/v1/billing_portal/sessions');
    expect(fetchMock.mock.calls.some(([url]) => url.includes('checkout/sessions'))).toBe(false);
  });
});
