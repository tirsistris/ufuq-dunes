// Цвета шторки (1, 2, 5, 6) против переменных Figma (ref/tokens.figma.json), обе темы.
// Вычисленный стиль против значения переменной; любое отличие канала — красное.
// Небо шторки и scrim — не переменные (см. «Расхождения» в спеке), здесь не сверяются.
import fs from 'node:fs';
import path from 'node:path';
import { ROOT, openState, line } from './_stand.mjs';

const TOK = JSON.parse(fs.readFileSync(path.join(ROOT, 'ref/tokens.figma.json'), 'utf8'));
const k = s => `#phone [data-k="${s}"]`;
// [состояния, селектор, css-свойство, переменная Figma]
const MAP = [
  ['1256', '.grabber', 'background-color', 'ufuq/on-sky-muted'],
  ['1256', k('sh-title'), 'color', 'ufuq/on-sky'],
  ['156', '.close30', 'background-color', 'accent'],
  ['156', '.close30', 'color', 'ufuq/on-sky'],
  ['1256', k('rcp-avatar'), 'background-color', 'accent'],
  ['1256', k('rcp-avatar'), 'color', 'ufuq/on-sky'],
  ['1256', k('rcp-name'), 'color', 'ufuq/on-sky'],
  ['1256', k('rcp-phone'), 'color', 'ufuq/on-sky-muted'],
  ['1256', k('amt-riyal'), 'color', 'ufuq/on-sky'],
  ['1256', k('amt'), 'color', 'ufuq/on-sky'],
  ['126', k('avail-line'), 'color', 'ufuq/on-sky-muted'],
  ['2', k('new-avail'), 'color', 'ufuq/on-sky-muted'],
  ['1256', '.sh-hz .edge', 'background-color', 'ufuq/horizon-edge'],
  ['1256', '.sh-hz .line', 'background-color', 'ufuq/horizon-line'],
  ['1256', '.sh-ground', 'background-color', 'card'],
  ['125', k('projected'), 'color', 'muted-foreground'],
  ['125', k('pm-spent'), 'background-color', 'seg/spent · HIG'],
  ['12', k('pm-avail'), 'background-color', 'ufuq/seg-available'],
  ['5', k('pm-short'), 'background-color', 'destructive'],
  ['125', k('pm-upc'), 'background-color', 'seg/upcoming · HIG'],
  ['125', k('pm-val-spent'), 'color', 'foreground'],
  ['2', k('preview'), 'color', 'muted-foreground'],
  ['5', k('err-icon'), 'color', 'destructive'],
  ['5', k('err-text'), 'color', 'destructive'],
  ['6', k('lim1'), 'color', 'foreground'],
  ['6', k('add'), 'background-color', 'tint'],
  ['6', k('add'), 'color', 'foreground'],
  ['156', k('key1'), 'background-color', 'tint'],
  ['156', k('key1'), 'color', 'foreground'],
  ['156', k('keydel'), 'color', 'foreground'],
  ['1', k('cont'), 'background-color', 'ios/tint'],
  ['1', k('cont'), 'color', 'on-primary'],
  ['56', k('cont'), 'background-color', 'tint'],
  ['56', k('cont'), 'color', 'muted-foreground'],
  ['2', k('confirm'), 'background-color', 'ios/tint'],
  ['2', k('confirm'), 'color', 'on-primary'],
  ['2', k('back'), 'color', 'foreground'],
];

function hexToRgba(h) {
  const n = h.replace('#', '');
  const a = n.length === 8 ? parseInt(n.slice(6, 8), 16) / 255 : 1;
  return [0, 2, 4].map(i => parseInt(n.slice(i, i + 2), 16)).concat(+a.toFixed(3));
}
function cssToRgba(s) {
  const m = s.match(/[\d.]+/g).map(Number);
  return [m[0], m[1], m[2], +(m[3] ?? 1).toFixed(3)];
}

let red = 0;
for (const theme of ['night', 'day']) {
  for (const state of ['1', '2', '5', '6']) {
    const { page, close } = await openState(theme, state);
    const rows = MAP.filter(r => r[0].includes(state));
    let ok = 0;
    for (const [, sel, prop, token] of rows) {
      const css = await page.$eval(sel, (el, prop) => getComputedStyle(el).getPropertyValue(prop), prop);
      const want = hexToRgba(TOK[theme][token]);
      const got = cssToRgba(css);
      const same = got.slice(0, 3).every((v, i) => v === want[i]) && Math.abs(got[3] - want[3]) < 0.004;
      if (same) ok++;
      else { red++; line(`КРАСНОЕ ${theme} ${state} ${sel} ${prop}: ${token} = ${TOK[theme][token]}, в приложении ${css}`); }
    }
    line(`${theme} ${state}: ${ok}/${rows.length} цветов = переменные Figma`);
    await close();
  }
}
line(red ? `ИТОГ: КРАСНОЕ (${red})` : 'ИТОГ: зелёное');
process.exit(red ? 1 : 0);
