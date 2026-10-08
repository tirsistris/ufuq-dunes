// Поток 1 → 2 → 3 → 4 → Home и переходы — против прототипа Figma (reactions фреймов Page 2):
//   1→2 Continue, 2→1 Back, 3→4 через 1,5 с — Smart animate 240 мс ease-out;
//   2→3 Confirm — Dissolve 240 мс ease-out; клавиши 1↔5/6 — Smart animate 160 мс ease-out.
//   Home→1, крестик→Home, Done→Home — связей в Figma нет: без анимации (открытый вопрос в спеке).
// Каждый вызов Element.animate() пишется в window.__anims: длительность, кривая, анимируемые свойства.
// prefers-reduced-motion → только прозрачность. Любое расхождение — красное.
import { openState, line } from './_stand.mjs';

const REC = `window.__anims = [];
const _a = Element.prototype.animate;
Element.prototype.animate = function (kf, o) {
  const props = [...new Set((Array.isArray(kf) ? kf : [kf]).flatMap(f => Object.keys(f)).filter(p => !['offset', 'easing', 'composite'].includes(p)))];
  window.__anims.push({ d: typeof o === 'number' ? o : o?.duration, e: o?.easing || 'linear', props, k: this.dataset?.k || '' });
  return _a.call(this, kf, o);
};`;

let red = 0, n = 0;
async function run(reduced) {
  const tag = reduced ? 'reduce' : 'motion';
  const { page, close } = await openState('night', 'home', { clock: true, init: REC, reducedMotion: reduced });
  const st = () => page.$eval('#phone', el => el.dataset.state);
  const txt = k => page.$eval(`#phone [data-k="${k}"]`, el => el.innerText.replace(/\s+/g, ' ').trim());
  const w = k => page.$eval(`#phone [data-k="${k}"]`, el => Math.round(el.getBoundingClientRect().width));
  const tap = async k => { await page.evaluate(() => { window.__anims = []; }); await page.click(`#phone [data-k="${k}"]`); };
  const key = async c => { await page.evaluate(() => { window.__anims = []; }); await page.click(`#phone [data-key="${c}"]`); };
  const anims = () => page.evaluate(() => window.__anims);

  // Smart animate: в момент 0 каждый общий для двух кадров элемент стоит на старом месте,
  // после перехода — на новом (±0,5 px). Так ловится двойной учёт сдвига предка.
  const POS = () => page.evaluate(() => {
    const p = document.getElementById('phone').getBoundingClientRect(), o = {};
    for (const el of document.querySelectorAll('#phone [data-k]')) if (el.getClientRects().length) { const r = el.getBoundingClientRect(); o[el.dataset.k] = [r.x - p.x, r.y - p.y]; }
    return o;
  });
  async function flip(what, act) {
    n++;
    await page.evaluate(() => { for (const x of document.getAnimations()) x.finish(); });
    const a = await POS();
    await act();
    await page.evaluate(() => { for (const x of document.getAnimations()) { x.pause(); x.currentTime = 0; } });
    const s0 = await POS();
    await page.evaluate(() => { for (const x of document.getAnimations()) x.finish(); });
    const b = await POS();
    const bad = [];
    for (const k of Object.keys(b)) {
      if (!a[k] || !s0[k] || k === 'scene') continue;
      const d0 = Math.max(Math.abs(s0[k][0] - a[k][0]), Math.abs(s0[k][1] - a[k][1]));
      if (d0 > 0.5) bad.push(`${k} в момент 0: ${s0[k].map(v => v.toFixed(1))}, было ${a[k].map(v => v.toFixed(1))}`);
    }
    if (bad.length) { red++; line(`КРАСНОЕ [${tag}] ${what}: ${bad.slice(0, 4).join('; ')}${bad.length > 4 ? ` … ещё ${bad.length - 4}` : ''}`); }
    else line(`ок [${tag}] ${what}`);
  }

  async function expect(what, state, motion, extra = {}) {
    n++;
    const bad = [];
    const s = await st();
    if (s !== state) bad.push(`состояние ${s}, ждали ${state}`);
    const a = await anims();
    if (motion === 'none') { if (a.length) bad.push(`анимаций ${a.length}, ждали 0`); }
    else if (motion) {
      const [kind, ms] = motion;
      if (!a.length) bad.push('анимаций нет');
      for (const x of a) {
        if (x.d !== ms) bad.push(`длительность ${x.d}, ждали ${ms}`);
        if (x.e !== 'ease-out') bad.push(`кривая ${x.e}, ждали ease-out`);
      }
      const props = new Set(a.flatMap(x => x.props));
      // Dissolve — гаснет один снимок всего старого кадра; Smart — ещё и проявляются новые слои
      if (kind === 'dissolve' && a.length !== 1) bad.push(`анимаций ${a.length}, у Dissolve ждали 1 (снимок кадра)`);
      if (kind !== 'dissolve' && a.length < 2) bad.push(`анимаций ${a.length}, у Smart ждали больше 1`);
      if (kind === 'dissolve' || kind === 'smart-fade' || reduced) { for (const p of props) if (p !== 'opacity') bad.push(`анимируется ${p}, ждали только opacity`); }
      if (kind === 'smart' && !reduced && !props.has('transform')) bad.push('smart animate без движения (нет transform)');
    }
    for (const [k, v] of Object.entries(extra)) {
      const g = k.startsWith('w:') ? await w(k.slice(2)) : await txt(k);
      if (g !== v) bad.push(`${k} = ${JSON.stringify(g)}, ждали ${JSON.stringify(v)}`);
    }
    const uniq = [...new Set(bad)];
    if (uniq.length) { red++; line(`КРАСНОЕ [${tag}] ${what}: ${uniq.join('; ')}`); } else line(`ок [${tag}] ${what}`);
  }

  await tap('cta');
  await expect('Home → 1: связи в Figma нет — без анимации', '1', 'none');
  await key('0');
  await expect('1 → «0» → 5: smart 160', '5', ['smart', 160]);
  await key('del');
  await expect('5 → ⌫ → 1: smart 160', '1', ['smart', 160]);
  await tap('cont');
  await expect('1 → Continue → 2: smart 240', '2', ['smart', 240]);
  await tap('back');
  await expect('2 → Back → 1: smart 240', '1', ['smart', 240]);
  if (!reduced) {
    await flip('1 → 2: в момент 0 всё на старых местах', () => tap('cont'));
    await flip('2 → 1: в момент 0 всё на старых местах', () => tap('back'));
    await flip('1 → 5: в момент 0 всё на старых местах', () => key('9'));
    await key('del');
  }
  await tap('cont'); await tap('confirm');
  await expect('2 → Confirm → 3: dissolve 240', '3', ['dissolve', 240]);
  n++;
  const btns = await page.$$eval('#phone button', bs => bs.filter(b => b.getClientRects().length && !b.closest('[inert]')).length);
  if (btns) { red++; line(`КРАСНОЕ [${tag}] на 3 видно кнопок: ${btns}, ждали 0`); } else line(`ок [${tag}] на 3 кнопок нет`);
  await page.evaluate(() => { window.__anims = []; });
  await page.clock.runFor(1490);
  await expect('3 через 1 490 мс — ещё 3', '3', 'none');
  await page.clock.runFor(20);
  // Smart animate 3→4: пар слоёв нет (Frame 1 › Ground ≠ Ground, Frame 1 › Title ≠ Sky › Title),
  // Figma такие слои растворяет — значит, только прозрачность.
  await expect('3 через 1 510 мс → 4: smart 240 без пар — только прозрачность, цифры кадра', '4', ['smart-fade', 240], {
    'imp-amt': '4 150', 'imp-sum': '1 500', 'imp-from': '246', 'imp-to': '180',
    'imp-val-spent': '2 900', 'imp-val-upc': '1 950', 'w:imp-spent': 103, 'w:imp-avail': 148, 'w:imp-upc': 69,
  });
  n++;
  if ((await anims()).some(x => x.k === 'scene')) { red++; line(`КРАСНОЕ [${tag}] 3 → 4: дюны проявляются с нуля — «Scene · vector» один слой, должен стоять под гаснущим`); }
  else line(`ок [${tag}] 3 → 4: дюны не проявляются с нуля`);
  await tap('done');
  await expect('4 → Done → Home: связи в Figma нет — без анимации', 'home', 'none');

  if (!reduced) {
    await tap('cta'); await key('del'); await key('del');
    await tap('cont'); await tap('confirm');
    await expect('сумма 15 → 3: полоса пересчитана', '3', null, { 'calc-val-spent': '1 415', 'w:calc-spent': 50, 'w:calc-avail': 200, 'w:calc-upc': 70 });
    await page.clock.runFor(1510);
    await expect('сумма 15 → 4: 5 635, 246 → 245', '4', null, { 'imp-amt': '5 635', 'imp-sum': '15', 'imp-from': '246', 'imp-to': '245' });
    await tap('done');
    // уход с 3 через витрину до таймера — таймер снят
    await page.click('#states [data-state="3"]');
    await page.click('#states [data-state="home"]');
    await page.evaluate(() => { window.__anims = []; });
    await page.clock.runFor(2000);
    await expect('3 → Home через витрину: таймер снят, остаёмся на Home', 'home', 'none');
  }
  await close();
}

await run(false);
await run(true);
line(red ? `ИТОГ: КРАСНОЕ (${red} из ${n})` : `ИТОГ: зелёное (${n}/${n})`);
process.exit(red ? 1 : 0);
