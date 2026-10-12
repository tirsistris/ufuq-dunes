// Геометрия Home против Figma, обе темы, EN (ref/home.rects.json) и AR (ref/ar/home.rects.json).
// Отчёты: runs/home-geometry.json (EN), runs/home-ar-geometry.json (AR).
// Красное: любое отклонение x/y/w/h > 2 px. Ширина текста в Figma округлена
// вверх до целого — допуск это покрывает.
import fs from 'node:fs';
import path from 'node:path';
import { ROOT, RUNS, openHome, line } from './_stand.mjs';

const TOL = 2;
let red = 0;
for (const lang of ['en', 'ar']) {
const REF = JSON.parse(fs.readFileSync(path.join(ROOT, lang === 'ar' ? 'ref/ar/home.rects.json' : 'ref/home.rects.json'), 'utf8'));
const report = {};
const tag = lang === 'ar' ? 'AR ' : '';

for (const theme of ['night', 'day']) {
  const { page, close } = await openHome(theme, { lang });
  const keys = Object.keys(REF).filter(k => !k.startsWith('_') && (!k.includes('@') || k.endsWith('@' + theme)));
  const got = await page.evaluate(keys => {
    const p = document.getElementById('phone').getBoundingClientRect();
    const out = {};
    for (const k of keys) {
      const el = document.querySelector(`#phone [data-k="${k.split('@')[0]}"]`);
      if (!el) { out[k] = null; continue; }
      const r = el.getBoundingClientRect();
      out[k] = [r.x - p.x, r.y - p.y, r.width, r.height];
    }
    return out;
  }, keys);
  report[theme] = {};
  let ok = 0;
  for (const k of keys) {
    const e = REF[k], g = got[k];
    if (!g) { red++; line(`КРАСНОЕ ${tag}${theme} ${k}: элемента нет`); report[theme][k] = { missing: true }; continue; }
    const d = g.map((v, i) => +(v - e[i]).toFixed(2));
    const bad = d.some(v => Math.abs(v) > TOL);
    report[theme][k] = { fig: e, app: g.map(v => +v.toFixed(2)), d, bad };
    if (bad) { red++; line(`КРАСНОЕ ${tag}${theme} ${k}: figma ${e.join(',')} app ${g.map(v => v.toFixed(1)).join(',')} Δ ${d.join(',')}`); }
    else ok++;
  }
  line(`${tag}${theme}: ${ok}/${keys.length} в допуске ±${TOL}px`);
  await close();
}
fs.writeFileSync(path.join(RUNS, lang === 'ar' ? 'home-ar-geometry.json' : 'home-geometry.json'), JSON.stringify(report, null, 1));
}
line(red ? `ИТОГ: КРАСНОЕ (${red})` : 'ИТОГ: зелёное');
process.exit(red ? 1 : 0);
