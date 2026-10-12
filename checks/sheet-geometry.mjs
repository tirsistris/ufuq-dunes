// Геометрия шторки (состояния 1, 2, 5, 6) против Figma, обе темы: EN (ref/sheet.rects.json) и AR (ref/ar/sheet.rects.json).
// Ключ «k@night» / «k@day» — только для этой темы. Отчёты: runs/sheet-geometry.json, runs/sheet-ar-geometry.json.
// Красное: отклонение x/y/w/h > 2 px; элемента из эталона нет или он скрыт;
// виден элемент шторки, которого в этом состоянии в Figma нет.
import fs from 'node:fs';
import path from 'node:path';
import { ROOT, RUNS, openState, line } from './_stand.mjs';

const TOL = 2;
let red = 0;
for (const lang of ['en', 'ar']) {
const REF = JSON.parse(fs.readFileSync(path.join(ROOT, lang === 'ar' ? 'ref/ar/sheet.rects.json' : 'ref/sheet.rects.json'), 'utf8'));
const STATES = Object.keys(REF).filter(k => !k.startsWith('_'));
const base = k => k.split('@')[0];
const ALL = [...new Set(STATES.flatMap(s => Object.keys(REF[s]).map(base)))];
const report = {};
const tag = lang === 'ar' ? 'AR ' : '';

for (const theme of ['night', 'day']) {
  report[theme] = {};
  for (const state of STATES) {
    const { page, close } = await openState(theme, state, { lang });
    const got = await page.evaluate(keys => {
      const p = document.getElementById('phone').getBoundingClientRect();
      const out = {};
      for (const k of keys) {
        const el = document.querySelector(`#phone [data-k="${k}"]`);
        if (!el || !el.getClientRects().length) { out[k] = null; continue; }
        const r = el.getBoundingClientRect();
        out[k] = [r.x - p.x, r.y - p.y, r.width, r.height];
      }
      return out;
    }, ALL);
    const ref = {};
    for (const [k, v] of Object.entries(REF[state])) if (!k.includes('@')) ref[k] = v;
    for (const [k, v] of Object.entries(REF[state])) if (k.endsWith('@' + theme)) ref[base(k)] = v;
    const rep = report[theme][state] = {};
    let ok = 0, n = 0;
    for (const k of ALL) {
      const e = ref[k], g = got[k];
      if (!e) {
        if (g) { red++; line(`КРАСНОЕ ${tag}${theme} ${state} ${k}: виден, а в Figma его нет`); rep[k] = { extra: true, app: g, bad: true }; }
        continue;
      }
      n++;
      if (!g) { red++; line(`КРАСНОЕ ${tag}${theme} ${state} ${k}: элемента нет`); rep[k] = { missing: true, fig: e, bad: true }; continue; }
      const d = g.map((v, i) => +(v - e[i]).toFixed(2));
      const bad = d.some(v => Math.abs(v) > TOL);
      rep[k] = { fig: e, app: g.map(v => +v.toFixed(2)), d, bad };
      if (bad) { red++; line(`КРАСНОЕ ${tag}${theme} ${state} ${k}: figma ${e.join(',')} app ${g.map(v => v.toFixed(1)).join(',')} Δ ${d.join(',')}`); }
      else ok++;
    }
    // ⌫: в AR отражён по горизонтали (как во фреймах), в EN — нет
    if (ref.keydel) {
      const tf = await page.$eval('#phone [data-k="keydel"] svg', el => getComputedStyle(el).transform);
      const want = lang === 'ar' ? 'matrix(-1, 0, 0, 1, 0, 0)' : 'none';
      n++;
      if (tf === want) ok++; else { red++; line(`КРАСНОЕ ${tag}${theme} ${state} ⌫ transform ${tf}, ждали ${want}`); }
    }
    line(`${tag}${theme} ${state}: ${ok}/${n} в допуске ±${TOL}px`);
    await close();
  }
}
fs.writeFileSync(path.join(RUNS, lang === 'ar' ? 'sheet-ar-geometry.json' : 'sheet-geometry.json'), JSON.stringify(report, null, 1));
}
line(red ? `ИТОГ: КРАСНОЕ (${red})` : 'ИТОГ: зелёное');
process.exit(red ? 1 : 0);
