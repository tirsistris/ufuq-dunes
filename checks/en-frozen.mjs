// EN после a0 не меняется ни на пиксель (спека ufuq-dunes-ar.md, приёмка 3).
// 14 состояний EN (#phone 390×844 @1x, reduced motion) против ref/en-frozen/<состояние>-<тема>.png,
// снятых до начала AR-работы (HEAD adabc34). Любой отличающийся пиксель кадра телефона — красное.
// Сравнивается только сам телефон: углы за скруглением 44 px (там фон витрины, a5) и полоса 2 px сглаживания по краю скругления не сверяются.
// Пересъёмка эталона — только по решению Баатра: `node checks/en-frozen.mjs --write`.
import fs from 'node:fs';
import path from 'node:path';
import { ROOT, RUNS, openState, line } from './_stand.mjs';

const DIR = path.join(ROOT, 'ref/en-frozen');
const WRITE = process.argv.includes('--write');
let red = 0, n = 0;
for (const theme of ['night', 'day']) for (const state of ['home', '1', '2', '3', '4', '5', '6']) {
  n++;
  const { page, close } = await openState(theme, state, { reducedMotion: true });
  await page.waitForTimeout(400);
  const name = `${state}-${theme}.png`;
  const shot = await page.locator('#phone').screenshot({ path: path.join(RUNS, `en-frozen-${name}`) });
  if (WRITE) { fs.writeFileSync(path.join(DIR, name), shot); line(`записан ${name}`); await close(); continue; }
  // сравнение пикселей — в браузере (без зависимостей): обе картинки на canvas
  const diff = await page.evaluate(async ([a, b]) => {
    const load = src => new Promise(r => { const i = new Image(); i.onload = () => r(i); i.src = src; });
    const [A, B] = await Promise.all([load(a), load(b)]);
    if (A.width !== B.width || A.height !== B.height) return { size: `${A.width}×${A.height} ≠ ${B.width}×${B.height}` };
    const c = document.createElement('canvas'); c.width = A.width; c.height = A.height;
    const x = c.getContext('2d', { willReadFrequently: true });
    x.drawImage(A, 0, 0); const da = x.getImageData(0, 0, c.width, c.height).data;
    x.clearRect(0, 0, c.width, c.height); x.drawImage(B, 0, 0); const db = x.getImageData(0, 0, c.width, c.height).data;
    const R = 44, W = c.width, H = c.height;
    const inPhone = (X, Y) => { // внутри скругления с запасом 2 px
      const cx = X < R ? R : X >= W - R ? W - R - 1 : X, cy = Y < R ? R : Y >= H - R ? H - R - 1 : Y;
      return Math.hypot(X - cx, Y - cy) <= R - 2;
    };
    let px = 0, x0 = 1e9, y0 = 1e9, x1 = -1, y1 = -1;
    for (let i = 0; i < da.length; i += 4) if (da[i] !== db[i] || da[i + 1] !== db[i + 1] || da[i + 2] !== db[i + 2] || da[i + 3] !== db[i + 3]) {
      const p = i / 4, X = p % c.width, Y = (p / c.width) | 0;
      if (!inPhone(X, Y)) continue;
      px++;
      x0 = Math.min(x0, X); y0 = Math.min(y0, Y); x1 = Math.max(x1, X); y1 = Math.max(y1, Y);
    }
    return { px, box: px ? [x0, y0, x1, y1] : null };
  }, ['data:image/png;base64,' + fs.readFileSync(path.join(DIR, name)).toString('base64'), 'data:image/png;base64,' + shot.toString('base64')]);
  await close();
  if (diff.size) { red++; line(`КРАСНОЕ ${name}: размер ${diff.size}`); }
  else if (diff.px) { red++; line(`КРАСНОЕ ${name}: отличается ${diff.px} px, рамка ${diff.box.join(',')}`); }
  else line(`ок ${name}: попиксельно как эталон`);
}
if (!WRITE) line(red ? `ИТОГ: КРАСНОЕ (${red} из ${n})` : `ИТОГ: зелёное (${n}/${n}, EN не изменился)`);
process.exit(red ? 1 : 0);
