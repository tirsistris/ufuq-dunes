// Кадры шторки для глаз: открытие Home → 1 (240 ease-out) и закрытие крестиком 1 → Home (160 ease-in),
// по три кадра внутри каждого перехода, время останавливается через WAAPI currentTime.
// Пишет transitions-sheet-night.png и transitions-sheet-day.png в корень репо. Не страж — машиной
// кривая проверяется в checks/flow.mjs.
import fs from 'node:fs';
import path from 'node:path';
import { ROOT, openState, line } from './_stand.mjs';

const OPEN = [60, 120, 180], CLOSE = [40, 80, 120];

async function frames(theme) {
  const { page, close } = await openState(theme, 'home', { clock: true });
  const phone = await page.$('#phone');
  const shots = [];
  async function at(label, ms) {
    await page.evaluate(m => { for (const a of document.getAnimations()) { a.pause(); a.currentTime = m; } }, ms);
    const y = await page.evaluate(() => {
      const p = document.getElementById('phone').getBoundingClientRect();
      const sh = document.querySelector('.ghost .sheet') || document.querySelector('#phone > .sheet');
      return Math.round(sh.getBoundingClientRect().y - p.y);
    });
    shots.push({ label: `${label} · ${ms} мс · верх шторки y ${y}`, png: (await phone.screenshot()).toString('base64') });
  }
  for (const ms of OPEN) {
    await page.evaluate(() => { for (const a of document.getAnimations()) a.finish(); });
    if (ms !== OPEN[0]) { await page.click('#states [data-state="home"]'); }
    await page.click('#phone [data-k="cta"]');
    await at('открытие 240 ease-out', ms);
  }
  for (const ms of CLOSE) {
    await page.evaluate(() => { for (const a of document.getAnimations()) a.finish(); });
    await page.click('#states [data-state="1"]');
    await page.click('#phone [data-k="sh-close"]');
    await at('закрытие 160 ease-in', ms);
  }
  await page.evaluate(() => { for (const a of document.getAnimations()) a.finish(); });

  const bg = theme === 'night' ? '#0b0f1c' : '#f3eee9', fg = theme === 'night' ? '#c9cfdd' : '#3a3440';
  const html = `<body style="margin:0;background:${bg};font:13px/1.3 Inter,system-ui,sans-serif;color:${fg}">
    <div style="display:flex;gap:10px;padding:10px">${shots.map(s => `<figure style="margin:0;width:390px">
      <figcaption style="height:22px">${s.label}</figcaption><img src="data:image/png;base64,${s.png}" width="390" height="844" style="display:block"></figure>`).join('')}</div></body>`;
  const board = page; // тот же page: у browser.newPage() второй вкладки нет
  await board.setViewportSize({ width: shots.length * 400 + 10, height: 844 + 22 + 20 });
  await board.setContent(html);
  await board.waitForFunction(() => [...document.images].every(i => i.complete));
  const out = path.join(ROOT, `transitions-sheet-${theme}.png`);
  fs.writeFileSync(out, await board.screenshot());
  line(`${path.basename(out)}: ${shots.map(s => s.label).join('; ')}`);
  await close();
}

for (const theme of ['night', 'day']) await frames(theme);
