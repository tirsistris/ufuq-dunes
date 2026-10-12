// Ни один текст не выходит за свой контейнер — EN и AR, обе темы, все 7 состояний.
// Для каждого видимого элемента телефона с собственным текстом: рамка текста (Range по содержимому)
// по горизонтали внутри родителя и внутри #phone (допуск 0,5 px). По вертикали не сверяется:
// рамка глифов Readex Pro выше интерлиньяжа стилей AR/ (как и во Figma), это не выход за контейнер.
import { openState, line } from './_stand.mjs';

const TOL = 0.5;
let red = 0, total = 0;
for (const lang of ['en', 'ar']) for (const theme of ['night', 'day']) for (const state of ['home', '1', '2', '3', '4', '5', '6']) {
  const { page, close } = await openState(theme, state, { lang, reducedMotion: true });
  const res = await page.evaluate(TOL => {
    const phone = document.getElementById('phone'), P = phone.getBoundingClientRect();
    const out = [];
    let n = 0;
    for (const el of phone.querySelectorAll('*')) {
      if (el.closest('.ghost') || !el.getClientRects().length) continue;
      if (getComputedStyle(el).visibility === 'hidden') continue;
      const own = [...el.childNodes].some(c => c.nodeType === 3 && c.textContent.trim());
      if (!own) continue;
      n++;
      const r = document.createRange(); r.selectNodeContents(el);
      const t = r.getBoundingClientRect();
      let par = el.parentElement; // контейнер — ближайший предок с рамкой (display: contents её не имеет)
      while (par && getComputedStyle(par).display === 'contents') par = par.parentElement;
      const box = par.getBoundingClientRect();
      const name = (el.dataset.k || el.dataset.t || el.className || el.tagName) + ' «' + el.textContent.trim().slice(0, 24) + '»';
      if (t.left < box.left - TOL || t.right > box.right + TOL) out.push(`${name}: текст ${t.left.toFixed(1)}…${t.right.toFixed(1)}, родитель ${box.left.toFixed(1)}…${box.right.toFixed(1)}`);
      else if (t.left < P.left - TOL || t.right > P.right + TOL) out.push(`${name}: за краем телефона`);
    }
    return { n, out };
  }, TOL);
  total += res.n;
  const tag = `${lang === 'ar' ? 'AR' : 'EN'} ${theme} ${state}`;
  for (const o of res.out) { red++; line(`КРАСНОЕ ${tag} ${o}`); }
  line(`${tag}: ${res.n - res.out.length}/${res.n} текстов в своих контейнерах`);
  await close();
}
line(red ? `ИТОГ: КРАСНОЕ (${red})` : `ИТОГ: зелёное (${total} текстов)`);
process.exit(red ? 1 : 0);
