// Геометрия экранов 3 и 4 против Figma (ref/impact.rects.json), обе темы.
// Красное: отклонение x/y/w/h > 2 px; элемента из эталона нет или он скрыт;
// виден элемент 3/4, которого в этом состоянии в Figma нет.
import fs from 'node:fs';
import path from 'node:path';
import { ROOT, RUNS, openState, line } from './_stand.mjs';

const REF = JSON.parse(fs.readFileSync(path.join(ROOT, 'ref/impact.rects.json'), 'utf8'));
const STATES = Object.keys(REF).filter(k => !k.startsWith('_'));
const ALL = [...new Set(STATES.flatMap(s => Object.keys(REF[s])))];
const TOL = 2;
let red = 0;
const report = {};

for (const theme of ['night', 'day']) {
  report[theme] = {};
  for (const state of STATES) {
    const { page, close } = await openState(theme, state);
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
    const ref = REF[state];
    const rep = report[theme][state] = {};
    let ok = 0, n = 0;
    for (const k of ALL) {
      const e = ref[k], g = got[k];
      if (!e) {
        if (g) { red++; line(`КРАСНОЕ ${theme} ${state} ${k}: виден, а в Figma его нет`); rep[k] = { extra: true, app: g, bad: true }; }
        continue;
      }
      n++;
      if (!g) { red++; line(`КРАСНОЕ ${theme} ${state} ${k}: элемента нет`); rep[k] = { missing: true, fig: e, bad: true }; continue; }
      const d = g.map((v, i) => e[i] == null ? 0 : +(v - e[i]).toFixed(2)); // null — не сверяется
      const bad = d.some(v => Math.abs(v) > TOL);
      rep[k] = { fig: e.map((v, i) => v ?? +g[i].toFixed(2)), app: g.map(v => +v.toFixed(2)), d, bad };
      if (bad) { red++; line(`КРАСНОЕ ${theme} ${state} ${k}: figma ${e.join(',')} app ${g.map(v => v.toFixed(1)).join(',')} Δ ${d.join(',')}`); }
      else ok++;
    }
    line(`${theme} ${state}: ${ok}/${n} в допуске ±${TOL}px`);
    await close();
  }
}
fs.writeFileSync(path.join(RUNS, 'impact-geometry.json'), JSON.stringify(report, null, 1));
line(red ? `ИТОГ: КРАСНОЕ (${red})` : 'ИТОГ: зелёное');
process.exit(red ? 1 : 0);
