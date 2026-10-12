// Версия Readex Pro против Figma: ширины строк Home AR (живая страница, элементы по data-t)
// против ширин текстовых слоёв get_metadata 119:4082. Figma округляет ширину auto-width текста
// вверх до целого, поэтому сравнение — |app − figma| ≤ 1 px; больше — красное.
// Так подбирали и Inter 3.19 для EN. Выбранная версия — fonts/ReadexPro-1.205.woff2.
import { openHome, line } from './_stand.mjs';

// [data-t, ширина в Figma, слой]
const FIG = [
  ['date1', 80, '119:4090'], ['date2', 111, '119:4091'], ['caption', 149, '119:4104'],
  ['availnow', 57, '119:4108'], ['display', 79, '119:4107'], ['since-num', 25, '119:4112'], ['since-words', 93, '148:3467'], ['of', 21, '119:4110'],
  ['lbl-spent', 49, '119:4123'], ['val-spent', 30, '119:4124'], ['lbl-upcoming', 90, '119:4126'], ['val-upcoming', 36, '119:4127'],
  ['aday', 44, '119:4132'], ['perday', 30, '119:4131'], ['around', 53, '119:4129'], ['until', 174, '119:4133'],
  ['title-upcoming', 123, '119:4137'], ['title-send', 94, '119:4147'],
  ['pay1-desc', 64, '119:4265'], ['pay4-desc', 91, '119:4295'],
  ['sum1', 26, '119:4268'], ['sum2', 22, '119:4278'], ['sum3', 25, '119:4288'], ['sum4', 24, '119:4298'],
];

const { page, close } = await openHome('night', { lang: 'ar' });
const got = await page.evaluate(keys => keys.map(k => {
  const el = document.querySelector(`#phone [data-t="${k}"]`);
  const r = document.createRange(); r.selectNodeContents(el); // ширина самого текста, без паддингов контейнера
  return { w: r.getBoundingClientRect().width, font: getComputedStyle(el).fontFamily };
}), FIG.map(f => f[0]));
const loaded = await page.evaluate(() => [...document.fonts].filter(f => f.family === 'Readex Pro').map(f => f.status));
await close();

let red = 0;
if (!loaded.includes('loaded')) { red++; line(`КРАСНОЕ: Readex Pro не загружен (${loaded.join()})`); }
FIG.forEach(([k, fig, node], i) => {
  const { w, font } = got[i];
  const d = w - fig;
  const bad = Math.abs(d) > 1 || !font.includes('Readex Pro');
  if (bad) red++;
  line(`${bad ? 'КРАСНОЕ' : 'ок'} ${k} (${node}): figma ${fig}, app ${w.toFixed(2)}, Δ ${d.toFixed(2)}${font.includes('Readex Pro') ? '' : ` — шрифт ${font}`}`);
});
line(red ? `ИТОГ: КРАСНОЕ (${red})` : `ИТОГ: зелёное (${FIG.length}/${FIG.length}, Readex Pro 1.205)`);
process.exit(red ? 1 : 0);
