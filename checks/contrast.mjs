// Контраст по токенам (WCAG 2.x), обе темы, EN и AR. Цвета берутся из живой страницы (CSS-переменные #phone),
// не из ref/tokens.figma.json — так ловится расхождение кода с Figma.
// Пороги из спеки: главное число на небе ≥ 7 (худшее место неба — самый «близкий» стоп градиента),
// сегменты ≥ 3, текст ≥ 4.5. Эталоны Figma (ночь/день) — совпасть до ±0,01.
import { openState, line } from './_stand.mjs';

const REF = {
  'число на небе': [9.77, 7.20],
  'Available (сегмент)': [14.82, 11.01],
  'Spent (сегмент)': [7.62, 4.65],
  'Upcoming (сегмент)': [4.20, 3.32],
  'CTA': [6.73, 4.81],
  'ошибка': [7.12, 6.42],
};

const lin = v => v <= 0.04045 ? v / 12.92 : ((v + 0.055) / 1.055) ** 2.4;
const rgb = c => {
  const h = c.trim().replace('#', '');
  if (h.length < 6) throw new Error(`не hex: ${c}`);
  return [0, 2, 4].map(i => parseInt(h.slice(i, i + 2), 16) / 255);
};
const L = c => { const [r, g, b] = rgb(c).map(lin); return 0.2126 * r + 0.7152 * g + 0.0722 * b; };
const cr = (a, b) => { const x = L(a), y = L(b); return (Math.max(x, y) + 0.05) / (Math.min(x, y) + 0.05); };
const worst = (fg, stops) => Math.min(...stops.map(s => cr(fg, s)));

let red = 0, n = 0;
for (const lang of ['en', 'ar']) for (const [ti, theme] of ['night', 'day'].entries()) {
  const tag = lang === 'ar' ? 'AR ' : '';
  const { page, close } = await openState(theme, 'home', { lang });
  const v = await page.$eval('#phone', el => {
    const cs = getComputedStyle(el), o = {};
    for (const k of ['on-sky', 'on-sky-muted', 'seg-available', 'seg-spent', 'seg-upcoming', 'card', 'on-primary', 'ios-tint', 'destructive', 'foreground', 'muted-foreground', 'sky', 'sheet-sky']) o[k] = cs.getPropertyValue('--' + k).trim();
    return o;
  });
  await close();
  const stops = g => (g.match(/#[0-9a-f]{6}/gi) || []);
  const sky = [...new Set([...stops(v.sky), ...stops(v['sheet-sky'])])];
  if (sky.length < 3) { red++; line(`КРАСНОЕ ${tag}${theme}: стопы неба не прочитаны (${v.sky})`); }

  // [имя, значение, порог]
  const pairs = [
    ['число на небе', worst(v['on-sky'], sky), 7],
    ['Available (сегмент)', cr(v['seg-available'], v.card), 3],
    ['Spent (сегмент)', cr(v['seg-spent'], v.card), 3],
    ['Upcoming (сегмент)', cr(v['seg-upcoming'], v.card), 3],
    ['CTA', cr(v['on-primary'], v['ios-tint']), 4.5],
    ['ошибка', cr(v.destructive, v.card), 4.5],
    ['текст на небе (muted)', worst(v['on-sky-muted'], sky), 4.5],
    ['текст foreground на card', cr(v.foreground, v.card), 4.5],
    ['текст muted на card', cr(v['muted-foreground'], v.card), 4.5],
  ];
  for (const [name, val, min] of pairs) {
    n++;
    const bad = [];
    if (val < min) bad.push(`ниже порога ${min}`);
    const ref = REF[name]?.[ti];
    if (ref != null && Math.abs(val - ref) > 0.01) bad.push(`Figma ${ref.toFixed(2)}`);
    const s = `${tag}${theme} ${name}: ${val.toFixed(2)} (порог ${min}${ref != null ? `, Figma ${ref.toFixed(2)}` : ''})`;
    if (bad.length) { red++; line(`КРАСНОЕ ${s} — ${bad.join('; ')}`); } else line(`ок ${s}`);
  }
}
line(red ? `ИТОГ: КРАСНОЕ (${red} из ${n})` : `ИТОГ: зелёное (${n}/${n})`);
process.exit(red ? 1 : 0);
