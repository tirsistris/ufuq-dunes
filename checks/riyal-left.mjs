// Знак риала левее своего числа — правило SAMA («the symbol should always appear to the left of the numeric value
// in all languages»). EN и AR, обе темы, все 7 состояний. Для каждого видимого знака (#i-riyal) в строке с суммой
// ближайшее по горизонтали число (текст начинается с цифры, латинской или восточно-арабской) должно стоять
// справа от знака, вплотную: зазор 0…12 px. Число слева от знака или далеко — красное.
import { openState, line } from './_stand.mjs';

const ROWS = '.amount, .of-total, .phrase, .pay-sum, .amt-row, .avail-line, .err-line, .lim-line, .imp-line';
let red = 0, total = 0;
for (const lang of ['en', 'ar']) for (const theme of ['night', 'day']) for (const state of ['home', '1', '2', '3', '4', '5', '6']) {
  const { page, close } = await openState(theme, state, { lang, reducedMotion: true });
  const res = await page.evaluate(([ROWS]) => {
    const vis = el => el.getClientRects().length && !el.closest('.ghost') && getComputedStyle(el).visibility !== 'hidden';
    const out = []; let n = 0;
    for (const use of document.querySelectorAll('#phone use[href="#i-riyal"]')) {
      const svg = use.closest('svg');
      if (!vis(svg)) continue;
      const row = svg.closest(ROWS);
      if (!row) { out.push(`знак вне строки с суммой: ${svg.outerHTML.slice(0, 60)}`); continue; }
      n++;
      const s = svg.getBoundingClientRect();
      const nums = [...row.querySelectorAll('*')].filter(el => vis(el) && [...el.childNodes].some(c => c.nodeType === 3 && /^[\d٠-٩]/.test(c.textContent.trim())));
      const name = svg.dataset.k || row.dataset.k || row.className;
      if (!nums.length) { out.push(`${name}: у знака нет числа в строке`); continue; }
      const gap = el => { const r = el.getBoundingClientRect(); return r.left >= s.right - 0.5 ? r.left - s.right : -(s.left - r.right); };
      const best = nums.map(el => ({ el, g: gap(el) })).sort((a, b) => Math.abs(a.g) - Math.abs(b.g))[0];
      const t = best.el.textContent.trim();
      if (best.g < -0.5) out.push(`${name}: число «${t}» слева от знака (на ${(-best.g).toFixed(1)} px)`);
      else if (best.g > 12) out.push(`${name}: число «${t}» в ${best.g.toFixed(1)} px от знака`);
    }
    return { n, out };
  }, [ROWS]);
  total += res.n;
  const tag = `${lang === 'ar' ? 'AR' : 'EN'} ${theme} ${state}`;
  for (const o of res.out) { red++; line(`КРАСНОЕ ${tag} ${o}`); }
  line(`${tag}: ${res.n - res.out.length}/${res.n} знаков левее своего числа`);
  await close();
}
line(red ? `ИТОГ: КРАСНОЕ (${red})` : `ИТОГ: зелёное (${total} знаков)`);
process.exit(red ? 1 : 0);
