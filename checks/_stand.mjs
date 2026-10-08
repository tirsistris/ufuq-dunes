// Общий стенд: статический сервер корня репо + Chromium, телефон 390×844 @1x.
// SPOIL=<имя> подменяет файл на лету (файлы на диске не трогаются) —
// так каждый страж доказывается поломкой: `SPOIL=shift node checks/home-geometry.mjs`.
import { chromium } from 'file:///C:/Users/ADMIN/AppData/Local/npm-cache/_npx/705bc6b22212b352/node_modules/playwright/index.mjs';
import http from 'node:http';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

export const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
export const RUNS = path.join(ROOT, 'runs');
fs.mkdirSync(RUNS, { recursive: true });

const SPOILS = {
  // сдвиг карточки баланса на 3 px вниз — геометрия обязана покраснеть
  shift: ['styles.css', '.balance {\n  margin-top: 16px;', '.balance {\n  margin-top: 19px;'],
  // ночной foreground на одну ступень — цвета обязаны покраснеть
  token: ['styles.css', '--foreground: #edf0f8;', '--foreground: #edf0f9;'],
  // зона нажатия иконки 40 вместо 44
  tap: ['styles.css', '.hit44 { width: 44px; height: 44px;', '.hit44 { width: 40px; height: 40px;'],
  // шторка: верхний отступ земли 14 → 17 — геометрия шторки обязана покраснеть
  sheetpad: ['styles.css', '  padding: 14px 20px 34px; background: var(--card);', '  padding: 17px 20px 34px; background: var(--card);'],
  // лимит канала «больше» → «больше или равно» — логика обязана покраснеть на ровно 2 500
  limit: ['app.js', 'if (a > CHANNEL_LIMIT)', 'if (a >= CHANNEL_LIMIT)'],
  // клавиша 40 вместо 48 — зоны нажатия обязаны покраснеть
  keytap: ['styles.css', '  height: 48px; border-radius: 12px; background: var(--tint);', '  height: 40px; border-radius: 12px; background: var(--tint);'],
  // сумма 0 снова даёт активный Continue — логика обязана покраснеть
  zero: ['app.js', "state !== '1' || amount === 0;", "state !== '1';"],
  // лимит 6 цифр снят — логика обязана покраснеть
  maxlen: ['app.js', 'const MAX_DIGITS = 6;', 'const MAX_DIGITS = 99;'],
  // дневной destructive на ступень — цвета шторки обязаны покраснеть
  destr: ['styles.css', '--destructive: #bd0005;', '--destructive: #bd0006;'],
  // tabular-nums на телефоне (в Figma цифры пропорциональные) — геометрия обязана покраснеть
  tnum: ['styles.css', '/* ---------- витрина ---------- */', '#phone * { font-variant-numeric: tabular-nums; }\n/* ---------- витрина ---------- */'],
};
export const SPOIL = process.env.SPOIL || '';
if (SPOIL && !SPOILS[SPOIL]) throw new Error(`нет порчи ${SPOIL}`);

const TYPES = { '.html': 'text/html', '.css': 'text/css', '.js': 'text/javascript', '.svg': 'image/svg+xml', '.woff2': 'font/woff2', '.png': 'image/png', '.json': 'application/json' };

export async function serve() {
  const server = http.createServer((req, res) => {
    const rel = decodeURIComponent(new URL(req.url, 'http://x').pathname).replace(/^\/+/, '') || 'index.html';
    const file = path.join(ROOT, rel);
    if (!file.startsWith(ROOT) || !fs.existsSync(file) || fs.statSync(file).isDirectory()) { res.writeHead(404); return res.end(); }
    let body = fs.readFileSync(file);
    if (SPOIL && SPOILS[SPOIL][0] === rel) {
      const [, from, to] = SPOILS[SPOIL];
      const s = body.toString().replace(/\r\n/g, '\n');
      if (!s.includes(from)) { console.log(`якорь порчи ${SPOIL} не найден`); process.exit(2); }
      body = s.replace(from, to);
    }
    res.writeHead(200, { 'content-type': TYPES[path.extname(file)] || 'application/octet-stream' });
    res.end(body);
  });
  await new Promise(r => server.listen(0, '127.0.0.1', r));
  return { url: `http://127.0.0.1:${server.address().port}/`, close: () => server.close() };
}

// theme: 'night' | 'day'; state: 'home' | '1'..'6'
export async function openHome(theme) { return openState(theme, 'home'); }

export async function openState(theme, state) {
  const srv = await serve();
  const browser = await chromium.launch();
  const page = await browser.newPage({
    viewport: { width: 900, height: 920 }, deviceScaleFactor: 1,
    colorScheme: theme === 'night' ? 'dark' : 'light',
  });
  await page.goto(`${srv.url}?theme=${theme === 'night' ? 'dark' : 'light'}&state=${state}`);
  await page.evaluate(() => document.fonts.ready);
  await page.waitForFunction(() => [...document.images].every(i => i.complete));
  const t = await page.$eval('#phone', el => el.dataset.theme);
  if (t !== theme) throw new Error(`тема ${t}, ждали ${theme}`);
  const st = await page.$eval('#phone', el => el.dataset.state);
  if (st !== state) throw new Error(`состояние ${st}, ждали ${state}`);
  return { page, close: async () => { await browser.close(); srv.close(); } };
}

export function line(s) { console.log(s); }
if (SPOIL) line(`ПОРЧА: ${SPOIL}`);
