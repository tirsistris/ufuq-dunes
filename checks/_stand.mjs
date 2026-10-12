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
  // 3: блок «Calculating impact» на 3 px ниже — геометрия 3/4 обязана покраснеть
  calcpos: ['styles.css', 'position: absolute; left: 16px; top: 356px; width: 358px;', 'position: absolute; left: 16px; top: 359px; width: 358px;'],
  // размытие карточки 24 вместо 12 (значение Figma вместо CSS) — цвета 3/4 обязаны покраснеть
  blur: ['styles.css', '-webkit-backdrop-filter: blur(12px); backdrop-filter: blur(12px);', '-webkit-backdrop-filter: blur(24px); backdrop-filter: blur(24px);'],
  // Confirm через Smart animate вместо Dissolve — поток обязан покраснеть
  dissolve: ['app.js', "go('3', DISSOLVE(240))", "go('3', SMART(240))"],
  // таймер 3 → 4 короче Figma (1 400 вместо 1 500) — поток обязан покраснеть
  timer: ['app.js', 'const CALC_MS = 1500;', 'const CALC_MS = 1400;'],
  // новые координаты снимаются после старта анимации предка — сдвиг считается дважды
  flipnow: ['app.js', 'const o = old.get(k), n = now.get(k);', 'const o = old.get(k), n = rect(el);'],
  // дюны 4 проявляются с нуля поверх гаснущих 3 — сквозь них просвечивает Home
  scenefade: ['app.js', 'if (el.dataset.k && before.has(el.dataset.k)) continue;', ''],
  // дневной destructive на ступень — цвета шторки обязаны покраснеть
  destr: ['styles.css', '--destructive: #bd0005;', '--destructive: #bd0006;'],
  // шторка при открытии только проявляется, а не выезжает — поток обязан покраснеть
  sheetslide: ['app.js', "else sh.animate([{ transform: down(sh) }, { transform: 'none' }], opt);", "else sh.animate([{ opacity: 0 }, { opacity: 1 }], opt);"],
  // крестик снова мгновенный — шторка пропадает сразу
  closenow: ['app.js', "go('home', SHEET_OUT(SHEET_CLOSE.duration))", "go('home')"],
  // закрытие шторки снова ease-out (240 вместо ease-in 160) — поток обязан покраснеть
  closeease: ['app.js', "const SHEET_CLOSE = { duration: 160, easing: 'ease-in' };", "const SHEET_CLOSE = { duration: 240, easing: 'ease-out' };"],
  // Done снова без Dissolve
  donenow: ['app.js', "go('home', DISSOLVE(240))", "go('home')"],
  // дневной upcoming светлее (≈ 2,5 на card) — контраст обязан покраснеть (порог 3 и эталон Figma)
  upc: ['styles.css', '--seg-upcoming: #8b84bc;', '--seg-upcoming: #a49fcc;'],
  // tabular-nums на телефоне (в Figma цифры пропорциональные) — геометрия обязана покраснеть
  tnum: ['styles.css', '/* ---------- витрина ---------- */', '#phone * { font-variant-numeric: tabular-nums; }\n/* ---------- витрина ---------- */'],
  // AR: Inter вместо Readex Pro — ширины AR обязаны покраснеть
  arfont: ['styles.css', ".t-title3, .t-title3-s, .t-large, .t-amount44, .t-tab, .t-tab-s) { font-family: 'Readex Pro'; }", ".t-title3, .t-title3-s, .t-large, .t-amount44, .t-tab, .t-tab-s) { font-family: Inter; }"],
  // AR: «label Upcoming» на x 44 (ошибка, уже исправленная в Figma) — геометрия AR обязана покраснеть
  arupc: ['styles.css', '/* ---------- витрина ---------- */', ".phone[lang='ar'] .bar-labels .l-upcoming { inset-inline-end: 44px; }\n/* ---------- витрина ---------- */"],
  // AR: иконки статус-бара зеркалятся вместе с телефоном — геометрия AR обязана покраснеть
  ardir: ['styles.css', 'align-items: center; direction: ltr; }', 'align-items: center; }'],
  // AR: клавиатура зеркалится вместе с телефоном (3-2-1) — геометрия шторки AR обязана покраснеть
  arkeys: ['styles.css', ".phone[lang='ar'] .keypad { direction: ltr; }", ''],
  // AR: ⌫ не отражён — геометрия шторки AR (проверка transform) обязана покраснеть
  ardel: ['styles.css', ".phone[lang='ar'] [data-key='del'] svg { transform: scaleX(-1); }", ''],
  // AR: восточно-арабские цифры не подставляются — логика суммы AR обязана покраснеть
  ardigits: ['app.js', "  if (lang !== 'ar') return String(n)", "  if (true) return String(n)"],
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

// theme: 'night' | 'day'; state: 'home' | '1'..'6'; opts.lang: 'en' (по умолчанию) | 'ar'
export async function openHome(theme, opts = {}) { return openState(theme, 'home', opts); }

export async function openState(theme, state, opts = {}) {
  const srv = await serve();
  const browser = await chromium.launch();
  const page = await browser.newPage({
    viewport: { width: 900, height: 920 }, deviceScaleFactor: 1,
    colorScheme: theme === 'night' ? 'dark' : 'light',
    reducedMotion: opts.reducedMotion ? 'reduce' : 'no-preference',
  });
  if (opts.init) await page.addInitScript(opts.init);
  // 3 сам уходит в 4 через 1500 мс (таймер Figma) — часы ставим на паузу до загрузки,
  // чтобы кадр 3 стоял; поток проверяется отдельно (checks/flow.mjs, clock.runFor).
  if (state === '3' || opts.clock) {
    await page.clock.install({ time: new Date('2026-09-04T09:41:00') });
    await page.clock.pauseAt(new Date('2026-09-04T09:41:01'));
  }
  const lang = opts.lang || 'en';
  await page.goto(`${srv.url}?${lang === 'ar' ? 'lang=ar&' : ''}theme=${theme === 'night' ? 'dark' : 'light'}&state=${state}`);
  await page.evaluate(() => document.fonts.ready);
  await page.waitForFunction(() => [...document.images].every(i => i.complete));
  const t = await page.$eval('#phone', el => el.dataset.theme);
  if (t !== theme) throw new Error(`тема ${t}, ждали ${theme}`);
  const st = await page.$eval('#phone', el => el.dataset.state);
  if (st !== state) throw new Error(`состояние ${st}, ждали ${state}`);
  const lg = await page.$eval('#phone', el => (el.lang || 'en') + (el.dir === 'rtl' ? '/rtl' : ''));
  if (lg !== (lang === 'ar' ? 'ar/rtl' : 'en')) throw new Error(`язык ${lg}, ждали ${lang}`);
  return { page, close: async () => { await browser.close(); srv.close(); } };
}

export function line(s) { console.log(s); }
if (SPOIL) line(`ПОРЧА: ${SPOIL}`);
