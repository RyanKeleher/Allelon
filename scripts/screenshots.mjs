// Captures phone-sized screenshots of the web build against a local Supabase
// stack loaded with supabase/demo.sql.
//
//   npx supabase start && npx supabase db reset
//   psql "postgresql://postgres:postgres@127.0.0.1:54322/postgres" -f supabase/demo.sql
//   npx expo start --web --port 8081        (in another terminal)
//   SUPABASE_ANON_KEY=... SUPABASE_SERVICE_ROLE_KEY=... node scripts/screenshots.mjs [outDir]
//
// Requires Playwright (`npm i -D playwright` or a global install).
import { mkdir } from 'node:fs/promises';
import { chromium } from 'playwright';

const APP = process.env.APP_URL ?? 'http://localhost:8081';
const API = process.env.SUPABASE_URL ?? 'http://127.0.0.1:54321';
const ANON = process.env.SUPABASE_ANON_KEY;
const SERVICE = process.env.SUPABASE_SERVICE_ROLE_KEY;
const OUT = process.argv[2] ?? 'screenshots';
const STORAGE_KEY = `sb-${new URL(API).hostname.split('.')[0]}-auth-token`;
if (!ANON || !SERVICE) throw new Error('Set SUPABASE_ANON_KEY and SUPABASE_SERVICE_ROLE_KEY');

const GRACE = 'grace@demo.allelon.app';
const MY_REQUEST = 'd2000000-0000-0000-0000-000000000005';
const JAMES = 'd0000000-0000-0000-0000-000000000002';

async function signIn(email, password = 'allelon-demo') {
  const res = await fetch(`${API}/auth/v1/token?grant_type=password`, {
    method: 'POST',
    headers: { apikey: ANON, 'Content-Type': 'application/json' },
    body: JSON.stringify({ email, password }),
  });
  if (!res.ok) throw new Error(`sign-in failed for ${email}: ${await res.text()}`);
  return res.json();
}

async function freshUser() {
  const email = `newcomer-${Date.now()}@demo.allelon.app`;
  const res = await fetch(`${API}/auth/v1/admin/users`, {
    method: 'POST',
    headers: { apikey: SERVICE, Authorization: `Bearer ${SERVICE}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({ email, password: 'allelon-demo', email_confirm: true, user_metadata: { full_name: 'Sam Rivera' } }),
  });
  if (!res.ok) throw new Error(`could not create user: ${await res.text()}`);
  return signIn(email);
}

async function page(browser, scheme, session) {
  const context = await browser.newContext({
    viewport: { width: 390, height: 844 },
    deviceScaleFactor: 2,
    colorScheme: scheme,
    isMobile: true,
    hasTouch: true,
  });
  if (session) {
    await context.addInitScript(([key, value]) => localStorage.setItem(key, value), [STORAGE_KEY, JSON.stringify(session)]);
  }
  return context.newPage();
}

async function shot(p, path, name, scheme, prepare) {
  await p.goto(`${APP}${path}`);
  await p.waitForLoadState('networkidle');
  await p.waitForTimeout(1200);
  if (prepare) {
    await prepare(p);
    await p.waitForTimeout(600);
  }
  const file = `${OUT}/${name}-${scheme}.png`;
  await p.screenshot({ path: file });
  console.log('saved', file);
}

await mkdir(OUT, { recursive: true });
const browser = await chromium.launch(process.env.CHROMIUM_PATH ? { executablePath: process.env.CHROMIUM_PATH } : {});
const grace = await signIn(GRACE);
const newcomer = await freshUser();

for (const scheme of ['light', 'dark']) {
  await shot(await page(browser, scheme), '/', '1-sign-in', scheme);
  await shot(await page(browser, scheme, newcomer), '/', '2-onboarding', scheme);

  const p = await page(browser, scheme, grace);
  await shot(p, '/', '3-home', scheme);
  await shot(p, '/compose', '4-compose', scheme, async (pg) => {
    await pg.getByRole('textbox').first().fill('Job interview Friday. Pray for peace and clear words.');
    await pg.getByRole('checkbox', { name: 'Close friends' }).click();
  });
  await shot(p, `/request/${MY_REQUEST}`, '5-request-detail', scheme);
  await shot(p, '/profile', '6-my-profile', scheme);
  await shot(p, `/profile/${JAMES}`, '7-person-profile', scheme);
  await shot(p, '/follow-requests', '8-follow-requests', scheme);
}

await browser.close();
