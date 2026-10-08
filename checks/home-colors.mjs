// Цвета Home против переменных Figma (ref/tokens.figma.json), обе темы.
// Сравнение — вычисленный стиль элемента против значения переменной; любое
// отличие канала — красное.
import fs from 'node:fs';
import path from 'node:path';
import { ROOT, openHome, line } from './_stand.mjs';

const TOK = JSON.parse(fs.readFileSync(path.join(ROOT, 'ref/tokens.figma.json'), 'utf8'));
// [data-k, css-свойство, переменная Figma, селектор вместо data-k]
const MAP = [
  ['phone', 'background-color', 'background', '#phone'],
  ['time', 'color', 'foreground'],
  ['avatar', 'background-color', 'accent'],
  ['avatar', 'color', 'foreground'],
  ['search', 'color', 'foreground'],
  ['date1', 'color', 'foreground'],
  ['date2', 'color', 'muted-foreground'],
  ['balance', 'background-color', 'card'],
  ['caption', 'color', 'ufuq/on-sky-muted'],
  ['riyal24', 'color', 'ufuq/on-sky'],
  ['display', 'color', 'ufuq/on-sky'],
  ['availnow', 'color', 'ufuq/on-sky-muted'],
  ['riyal10', 'color', 'ufuq/on-sky-muted'],
  ['since', 'color', 'ufuq/on-sky-muted'],
  ['hz-edge', 'background-color', 'ufuq/horizon-edge'],
  ['hz-line', 'background-color', 'ufuq/horizon-line'],
  ['seg-spent', 'background-color', 'seg/spent · HIG'],
  ['seg-avail', 'background-color', 'ufuq/seg-available'],
  ['seg-upcoming', 'background-color', 'seg/upcoming · HIG'],
  ['lbl-spent', 'color', 'muted-foreground'],
  ['val-spent', 'color', 'foreground'],
  ['around', 'color', 'foreground'],
  ['riyal14', 'color', 'foreground'],
  ['until', 'color', 'muted-foreground'],
  ['cta', 'background-color', 'ios/tint'],
  ['cta', 'color', 'on-primary'],
  ['title-upcoming', 'color', 'foreground'],
  ['group', 'background-color', 'card'],
  ['tile1', 'background-color', 'hover'],
  ['send', 'background-color', 'card'],
  ['tabbar', 'background-color', 'surface-2'],
  ['tabbar', 'border-top-color', 'border'],
  ['tab1', 'color', 'foreground'],
  ['tab2', 'color', 'muted-foreground'],
  ['home-ind', 'background-color', 'foreground'],
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
  const { page, close } = await openHome(theme);
  let ok = 0;
  for (const [k, prop, token, sel] of MAP) {
    const css = await page.$eval(sel || `#phone [data-k="${k}"]`, (el, prop) => getComputedStyle(el).getPropertyValue(prop), prop);
    const want = hexToRgba(TOK[theme][token]);
    const got = cssToRgba(css);
    const same = got.slice(0, 3).every((v, i) => v === want[i]) && Math.abs(got[3] - want[3]) < 0.004;
    if (same) ok++;
    else { red++; line(`КРАСНОЕ ${theme} ${k} ${prop}: ${token} = ${TOK[theme][token]}, в приложении ${css}`); }
  }
  line(`${theme}: ${ok}/${MAP.length} цветов = переменные Figma`);
  await close();
}
line(red ? `ИТОГ: КРАСНОЕ (${red})` : 'ИТОГ: зелёное');
process.exit(red ? 1 : 0);
