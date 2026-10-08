// Лист сверки: для каждого состояния и темы — эталон Figma (get_screenshot 390×844 @1x),
// кадр приложения 390×844 @1x, наложение 50% и карта разницы.
// Красные рамки — элементы, у которых геометрия ушла > 2 px (из runs/home-geometry.json
// runs/sheet-geometry.json и runs/impact-geometry.json — сначала прогнать эти стражи). Ничего не чинит — только показывает.
// `node checks/compare-board.mjs` — Home → compare-board.png;
// `node checks/compare-board.mjs 1 2 5 6` — эти состояния → compare-board-1-2-5-6.png.
// Кадры приложения: runs/app-<состояние>-<тема>.png.
import fs from 'node:fs';
import path from 'node:path';
import { chromium } from 'file:///C:/Users/ADMIN/AppData/Local/npm-cache/_npx/705bc6b22212b352/node_modules/playwright/index.mjs';
import { ROOT, RUNS, openState, line } from './_stand.mjs';

const STATES = process.argv.slice(2).length ? process.argv.slice(2) : ['home'];
const geo = name => {
  const f = path.join(RUNS, name);
  if (!fs.existsSync(f)) { line(`нет runs/${name} — сначала соответствующий страж геометрии`); process.exit(2); }
  return JSON.parse(fs.readFileSync(f, 'utf8'));
};
const GEO_HOME = STATES.includes('home') ? geo('home-geometry.json') : null;
const IMPACT = s => s === '3' || s === '4';
const GEO_SHEET = STATES.some(s => s !== 'home' && !IMPACT(s)) ? geo('sheet-geometry.json') : null;
const GEO_IMPACT = STATES.some(IMPACT) ? geo('impact-geometry.json') : null;
const geoOf = (state, theme) => state === 'home' ? (GEO_HOME[theme] || {})
  : (((IMPACT(state) ? GEO_IMPACT : GEO_SHEET)[theme] || {})[state] || {});
const refOf = (state, theme) => path.join(ROOT, 'ref', state === 'home' ? `home-${theme}.png` : `s${state}-${theme}.png`);
const TITLE = { home: 'Home', 1: '1 · Enter amount', 2: '2 · Confirm', 3: '3 · Calculating impact', 4: '4 · Projected impact', 5: '5 · Not enough money', 6: '6 · Above channel limit' };
const NODE = { home: ['90:8017', '90:8103'], 1: ['90:6627', '90:7344'], 2: ['90:6784', '90:7495'], 3: ['90:7298', '90:7926'], 4: ['90:7233', '90:7962'], 5: ['90:6915', '90:7620'], 6: ['90:7073', '90:7772'] };
const b64 = f => 'data:image/png;base64,' + fs.readFileSync(f).toString('base64');

const shots = {};
for (const state of STATES) for (const theme of ['night', 'day']) {
  const { page, close } = await openState(theme, state);
  await page.addStyleTag({ content: 'html,body{background:transparent!important}' });
  const box = await page.$eval('#phone', el => { const r = el.getBoundingClientRect(); return { x: r.x, y: r.y, width: r.width, height: r.height }; });
  const out = path.join(RUNS, `app-${state}-${theme}.png`);
  await page.screenshot({ path: out, clip: box, omitBackground: true });
  shots[`${state}-${theme}`] = out;
  await close();
}

const rows = STATES.flatMap(state => ['night', 'day'].map(theme => ({
  theme: `${TITLE[state]} · ${theme}`, key: `${state}-${theme}`,
  fig: b64(refOf(state, theme)),
  app: b64(shots[`${state}-${theme}`]),
  bad: Object.entries(geoOf(state, theme)).filter(([, v]) => v.bad).map(([k, v]) => ({ k, fig: v.fig || v.app, app: v.app, d: v.d || [0, 0, 0, 0] })),
})));

const html = `<!doctype html><meta charset=utf-8>
<style>
body{margin:0;padding:24px;background:#f2f2f5;font:13px/18px Inter,system-ui,sans-serif;color:#222}
h1{font-size:18px;margin:0 0 4px} .sub{color:#666;margin-bottom:16px}
.row{display:flex;gap:16px;margin-bottom:12px} .cell{display:flex;flex-direction:column;gap:6px}
.cap{font-weight:600} canvas,.frame{width:390px;height:844px;display:block;background:#888}
.frame{position:relative} .frame img{position:absolute;inset:0}
.box{position:absolute;border:2px solid #e00000;box-sizing:border-box}
.notes{width:390px;font-size:12px;line-height:17px} .red{color:#c00000;font-weight:600} .ok{color:#0a7a2f;font-weight:600}
</style>
<h1>Ufuq v2 «Дюны» — сверка: ${STATES.map(s => TITLE[s]).join(', ')}</h1>
<div class=sub>Figma Page 2: ${STATES.map(s => `${TITLE[s]} — Night ${NODE[s][0]}, Day ${NODE[s][1]}`).join(' · ')} · приложение 390×844 @1x, Chromium · красная рамка = геометрия Figma там, где отклонение &gt; 2 px</div>
<div id=rows></div>
<script>
const ROWS = ${JSON.stringify(rows)};
const load = src => new Promise(r => { const i = new Image(); i.onload = () => r(i); i.src = src; });
(async () => {
  const stats = {};
  for (const row of ROWS) {
    const [fig, app] = await Promise.all([load(row.fig), load(row.app)]);
    const el = document.createElement('div'); el.className = 'row';
    const cell = (cap, node) => { const c = document.createElement('div'); c.className = 'cell'; c.innerHTML = '<span class=cap>' + cap + '</span>'; c.append(node); el.append(c); };
    const frame = (imgs, boxes) => { const f = document.createElement('div'); f.className = 'frame';
      for (const [img, op] of imgs) { const i = img.cloneNode(); i.style.opacity = op; f.append(i); }
      for (const b of boxes) { const d = document.createElement('div'); d.className = 'box';
        const [x, y, w, h] = b.fig; Object.assign(d.style, { left: x - 2 + 'px', top: y - 2 + 'px', width: w + 4 + 'px', height: h + 4 + 'px' }); f.append(d); }
      return f; };
    cell('Figma · ' + row.theme, frame([[fig, 1]], []));
    cell('Приложение · ' + row.theme, frame([[app, 1]], row.bad));
    cell('Наложение 50%', frame([[fig, 1], [app, 0.5]], row.bad));
    // разница: |figma − app| по каналам, ×4; пиксели вне скругления Figma пропускаются
    const cv = document.createElement('canvas'); cv.width = 390; cv.height = 844;
    const cx = cv.getContext('2d');
    cx.drawImage(fig, 0, 0); const A = cx.getImageData(0, 0, 390, 844);
    cx.clearRect(0, 0, 390, 844); cx.drawImage(app, 0, 0); const B = cx.getImageData(0, 0, 390, 844);
    const D = cx.createImageData(390, 844); let sum = 0, n = 0, big = 0;
    for (let i = 0; i < A.data.length; i += 4) {
      if (A.data[i + 3] < 255 || B.data[i + 3] < 255) { D.data[i + 3] = 255; D.data[i] = D.data[i + 1] = D.data[i + 2] = 40; continue; }
      const d = Math.max(Math.abs(A.data[i] - B.data[i]), Math.abs(A.data[i + 1] - B.data[i + 1]), Math.abs(A.data[i + 2] - B.data[i + 2]));
      sum += d; n++; if (d > 48) big++;
      D.data[i] = Math.min(255, d * 4); D.data[i + 1] = Math.min(255, d * 4) * 0.25; D.data[i + 2] = 0; D.data[i + 3] = 255;
    }
    cx.putImageData(D, 0, 0);
    cell('Разница ×4', cv);
    const notes = document.createElement('div'); notes.className = 'notes';
    const pct = (100 * big / n).toFixed(2);
    notes.innerHTML = '<div class=cap>' + row.theme + '</div>' +
      '<div>Средняя разница пикселя: ' + (sum / n).toFixed(2) + ' / 255</div>' +
      '<div>Пикселей с разницей &gt; 48: ' + pct + '%</div><br>' +
      (row.bad.length ? '<div class=red>Геометрия &gt; 2 px: ' + row.bad.length + '</div>' + row.bad.map(b => '<div class=red>' + b.k + ': Δx ' + b.d[0] + ', Δw ' + b.d[2] + '</div>').join('')
        : '<div class=ok>Геометрия: все элементы в допуске ±2 px</div>');
    stats[row.key] = { mean: +(sum / n).toFixed(2), bigPct: +pct, bad: row.bad.length };
    el.append(notes);
    document.getElementById('rows').append(el);
  }
  window.STATS = stats; document.body.dataset.done = '1';
})();
</script>`;

const board = path.join(RUNS, 'compare-board.html');
fs.writeFileSync(board, html);
const browser = await chromium.launch();
const page = await browser.newPage({ viewport: { width: 2100, height: 800 }, deviceScaleFactor: 1 });
const OUT = STATES.join() === 'home' ? 'compare-board.png' : `compare-board-${STATES.join('-')}.png`;
await page.goto('file:///' + board.replace(/\\/g, '/'));
await page.waitForSelector('body[data-done="1"]');
const stats = await page.evaluate(() => window.STATS);
await page.screenshot({ path: path.join(ROOT, OUT), fullPage: true });
await browser.close();
for (const [t, s] of Object.entries(stats)) line(`${t}: средняя разница ${s.mean}/255, пикселей >48: ${s.bigPct}%, геометрия >2px: ${s.bad}`);
line(`лист: ${OUT}`);
