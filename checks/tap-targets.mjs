// Зоны нажатия ≥ 44×44 — все видимые button: телефон и панель витрины, Home, шторка, 3 и 4; AR — Home и шторка.
import { openState, line } from './_stand.mjs';

let red = 0;
const RUNS_LIST = [
  ...['night', 'day'].flatMap(theme => ['home', '1', '2', '3', '4', '5', '6'].map(state => ({ theme, state, lang: 'en' }))),
  ...['night', 'day'].flatMap(theme => ['home', '1', '2', '5', '6'].map(state => ({ theme, state, lang: 'ar' }))),
];
for (const { theme, state, lang } of RUNS_LIST) {
  const { page, close } = await openState(theme, state, { lang });
  const tag = lang === 'ar' ? 'AR ' : '';
  const list = await page.$$eval('button', bs => bs.filter(b => b.offsetParent).map(b => {
    const r = b.getBoundingClientRect();
    return { name: b.getAttribute('aria-label') || b.textContent.trim().slice(0, 28), w: +r.width.toFixed(1), h: +r.height.toFixed(1) };
  }));
  const bad = list.filter(b => b.w < 44 || b.h < 44);
  for (const b of bad) { red++; line(`КРАСНОЕ ${tag}${theme} ${state} «${b.name}»: ${b.w}×${b.h}`); }
  line(`${tag}${theme} ${state}: ${list.length - bad.length}/${list.length} кнопок ≥ 44×44`);
  await close();
}
line(red ? `ИТОГ: КРАСНОЕ (${red})` : 'ИТОГ: зелёное');
process.exit(red ? 1 : 0);
