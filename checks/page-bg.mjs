// a5 — фон витрины вокруг телефона (решение Баатра, в Figma витрины нет):
// светлая #CFD1DB, тёмная #1B2236; смена темы — background-color за 240 мс ease-out (html, body, .seg);
// при загрузке перехода нет (фон сразу нужный); prefers-reduced-motion — без перехода.
// Контраст панели витрины (подписи, невыбранные и выбранные кнопки) к их фону — текст ≥ 4,5 в обеих темах.
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
// контраст панели: цвет текста к первому непрозрачному фону вверх по дереву (живые стили)
for (const theme of ['light', 'dark']) {
  const page = await browser.newPage({ viewport: { width: 900, height: 920 }, reducedMotion: 'reduce' });
  await page.goto(`${srv.url}?theme=${theme}&state=home`);
  const rows = await page.evaluate(() => {
    const rgb = s => s.match(/[\d.]+/g).map(Number);
    const lin = v => (v /= 255) <= 0.04045 ? v / 12.92 : ((v + 0.055) / 1.055) ** 2.4;
    const L = c => 0.2126 * lin(c[0]) + 0.7152 * lin(c[1]) + 0.0722 * lin(c[2]);
    const bgOf = el => { for (let x = el; x; x = x.parentElement) { const c = rgb(getComputedStyle(x).backgroundColor); if (c.length < 4 || c[3] > 0) return c; } return [255, 255, 255]; };
    const pick = [
      ['подпись (Theme)', '.rail-label'],
      ['невыбранная кнопка Theme', '#theme-seg button[aria-pressed="false"]'],
      ['выбранная кнопка Theme', '#theme-seg button[aria-pressed="true"]'],
      ['невыбранная кнопка States', '#states button[aria-current="false"]'],
      ['выбранная кнопка States', '#states button[aria-current="true"]'],
    ];
    return pick.map(([name, sel]) => {
      const el = document.querySelector(sel);
      const fg = rgb(getComputedStyle(el).color), bg = bgOf(el);
      const a = L(fg), b = L(bg);
      return { name, cr: (Math.max(a, b) + 0.05) / (Math.min(a, b) + 0.05), fg: getComputedStyle(el).color, bg: `rgb(${bg.slice(0, 3).join(', ')})` };
    });
  });
  for (const r of rows) check(`контраст ${theme}: ${r.name} ${r.cr.toFixed(2)}:1 (порог 4,5)`, r.cr >= 4.5, `${r.fg} на ${r.bg}`);
  await page.close();
}
await browser.close(); srv.close();
line(red ? `ИТОГ: КРАСНОЕ (${red} из ${n})` : `ИТОГ: зелёное (${n}/${n})`);
process.exit(red ? 1 : 0);
