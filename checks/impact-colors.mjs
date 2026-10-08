// Цвета экранов 3 и 4 против переменных Figma (ref/tokens.figma.json), обе темы.
// Вычисленный стиль против значения переменной; любое отличие канала — красное.
// Дюны (SVG как есть) и дневная заливка карточки (не переменная) — отдельной строкой NOVAR.
import fs from 'node:fs';
import path from 'node:path';
import { ROOT, openState, line } from './_stand.mjs';

const TOK = JSON.parse(fs.readFileSync(path.join(ROOT, 'ref/tokens.figma.json'), 'utf8'));
const k = s => `#phone [data-k="${s}"]`;
// [состояния, селектор, css-свойство, переменная Figma]
const MAP = [
  ['34', k('time'), 'color', 'ufuq/on-sky'],
  ['3', k('calc-title'), 'color', 'ufuq/on-sky'],
  ['3', k('calc-spent'), 'background-color', 'seg/spent · HIG'],
  ['3', k('calc-avail'), 'background-color', 'ufuq/seg-available'],
  ['3', k('calc-upc'), 'background-color', 'seg/upcoming · HIG'],
  ['3', k('calc-val-spent'), 'color', 'foreground'],
  ['3', k('calc-lbl-spent'), 'color', 'muted-foreground'],
  ['4', k('imp-title'), 'color', 'ufuq/on-sky'],
  ['4', k('imp-riyal'), 'color', 'ufuq/on-sky'],
  ['4', k('imp-amt'), 'color', 'ufuq/on-sky'],
  ['4', k('imp-sub'), 'color', 'ufuq/on-sky-muted'],
  ['4', k('imp-spent'), 'background-color', 'seg/spent · HIG'],
  ['4', k('imp-avail'), 'background-color', 'ufuq/seg-available'],
  ['4', k('imp-upc'), 'background-color', 'seg/upcoming · HIG'],
  ['4', k('imp-val-upc'), 'color', 'foreground'],
  ['4', k('imp-lbl-upc'), 'color', 'muted-foreground'],
  ['4', k('imp-line1'), 'color', 'foreground'],
  ['4', k('imp-from'), 'color', 'foreground'],
  ['4', k('imp-note'), 'color', 'muted-foreground'],
  ['4', k('done'), 'background-color', 'ios/tint'],
  ['4', k('done'), 'color', 'on-primary'],
];
// Карточка: ночью — переменная card, днём — заливка без переменной rgba(255,255,255,.87).
const CARD = { night: TOK.night.card, day: '#ffffffde' };

function hexToRgba(h) {
  const n = h.replace('#', '');
  const a = n.length === 8 ? parseInt(n.slice(6, 8), 16) / 255 : 1;
  return [0, 2, 4].map(i => parseInt(n.slice(i, i + 2), 16)).concat(+a.toFixed(3));
}
function cssToRgba(s) {
  const m = s.match(/[\d.]+/g).map(Number);
  return [m[0], m[1], m[2], +(m[3] ?? 1).toFixed(3)];
}
const same = (css, hex) => { const g = cssToRgba(css), w = hexToRgba(hex); return g.slice(0, 3).every((v, i) => v === w[i]) && Math.abs(g[3] - w[3]) < 0.004; };

let red = 0;
for (const theme of ['night', 'day']) {
  for (const state of ['3', '4']) {
    const { page, close } = await openState(theme, state);
    const rows = MAP.filter(r => r[0].includes(state));
    let ok = 0;
    for (const [, sel, prop, token] of rows) {
      const css = await page.$eval(sel, (el, prop) => getComputedStyle(el).getPropertyValue(prop), prop);
      if (same(css, TOK[theme][token])) ok++;
      else { red++; line(`КРАСНОЕ ${theme} ${state} ${sel} ${prop}: ${token} = ${TOK[theme][token]}, в приложении ${css}`); }
    }
    const card = k(state === '3' ? 'calc-card' : 'imp-card');
    const [bg, blur] = await page.$eval(card, el => { const s = getComputedStyle(el); return [s.backgroundColor, s.backdropFilter]; });
    if (!same(bg, CARD[theme])) { red++; line(`КРАСНОЕ ${theme} ${state} карточка: ждали ${CARD[theme]}, в приложении ${bg}`); }
    // Background blur 24 в Figma = CSS blur(12px) (так его выводит сама Figma в get_design_context)
    if (blur !== 'blur(12px)') { red++; line(`КРАСНОЕ ${theme} ${state} карточка: backdrop-filter ${blur}, ждали blur(12px)`); }
    line(`${theme} ${state}: ${ok}/${rows.length} цветов = переменные Figma; карточка ${bg} ${blur}`);
    await close();
  }
}
line(red ? `ИТОГ: КРАСНОЕ (${red})` : 'ИТОГ: зелёное');
process.exit(red ? 1 : 0);
