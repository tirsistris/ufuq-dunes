// a5 — фон витрины вокруг телефона (решение Баатра, в Figma витрины нет):
// светлая #CFD1DB, тёмная #1B2236; смена темы — background-color за 240 мс ease-out (html, body, .seg);
// при загрузке перехода нет (фон сразу нужный); prefers-reduced-motion — без перехода.
import { serve, line } from './_stand.mjs';
import { chromium } from 'file:///C:/Users/ADMIN/AppData/Local/npm-cache/_npx/705bc6b22212b352/node_modules/playwright/index.mjs';

const WANT = { light: 'rgb(207, 209, 219)', dark: 'rgb(27, 34, 54)' };
let red = 0, n = 0;
const check = (what, ok, detail) => { n++; if (ok) line(`ок ${what}`); else { red++; line(`КРАСНОЕ ${what}: ${detail}`); } };

const srv = await serve();
const browser = await chromium.launch();
for (const reduced of [false, true]) {
  const tag = reduced ? 'reduce' : 'motion';
  for (const [from, to] of [['light', 'dark'], ['dark', 'light']]) {
    const page = await browser.newPage({ viewport: { width: 900, height: 920 }, reducedMotion: reduced ? 'reduce' : 'no-preference' });
    await page.goto(`${srv.url}?theme=${from}&state=home`);
    await page.waitForTimeout(100);
    const bg = () => page.evaluate(() => [getComputedStyle(document.documentElement).backgroundColor, getComputedStyle(document.body).backgroundColor]);
    const trans = () => page.evaluate(() => document.getAnimations().filter(a => a.transitionProperty === 'background-color')
      .map(a => ({ t: a.effect.target === document.documentElement ? 'html' : a.effect.target.tagName === 'BODY' ? 'body' : a.effect.target.className, d: a.effect.getTiming().duration, e: a.effect.getTiming().easing })));
    const [h0, b0] = await bg();
    check(`[${tag}] загрузка ${from}: фон ${WANT[from]}`, h0 === WANT[from] && b0 === WANT[from], `html ${h0}, body ${b0}`);
    // переход при загрузке: если бы он был, фон в первые кадры шёл бы со старого значения
    check(`[${tag}] загрузка ${from}: без перехода`, (await trans()).length === 0, JSON.stringify(await trans()));
    await page.click(`[data-theme-pick="${to}"]`);
    const t = await trans();
    if (reduced) {
      check(`[${tag}] ${from} → ${to}: без перехода`, t.length === 0, JSON.stringify(t));
      const [h1, b1] = await bg();
      check(`[${tag}] ${from} → ${to}: фон сразу ${WANT[to]}`, h1 === WANT[to] && b1 === WANT[to], `html ${h1}, body ${b1}`);
    } else {
      const who = new Set(t.map(x => x.t));
      const bad = t.filter(x => x.d !== 240 || x.e !== 'ease-out');
      check(`[${tag}] ${from} → ${to}: переход html, body, .seg — 240 мс ease-out`, ['html', 'body', 'seg'].every(w => who.has(w)) && !bad.length, JSON.stringify(t));
      await page.evaluate(() => document.getAnimations().forEach(a => a.finish()));
      const [h1, b1] = await bg();
      check(`[${tag}] ${from} → ${to}: в конце ${WANT[to]}`, h1 === WANT[to] && b1 === WANT[to], `html ${h1}, body ${b1}`);
    }
    await page.close();
  }
}
await browser.close(); srv.close();
line(red ? `ИТОГ: КРАСНОЕ (${red} из ${n})` : `ИТОГ: зелёное (${n}/${n})`);
process.exit(red ? 1 : 0);
