// Логика суммы и переходы шторки (спека, «Поведение»), тема ночь — логика от темы не зависит.
// Тот же сценарий в EN и AR: в AR суммы восточно-арабскими цифрами с «٬» (ожидания переводятся num()),
// клавиши те же (data-key), границы те же (> 5 650 → 5, > 2 500 → 6).
// Каждый шаг: действие → ожидаемое состояние телефона и текст суммы. Любое расхождение — красное.
import { openState, line } from './_stand.mjs';

const AR_D = '٠١٢٣٤٥٦٧٨٩';
const num = (lang, s) => lang === 'ar' ? s.replace(/(\d) (?=\d{3})/g, '$1٬').replace(/\d/g, d => AR_D[d]) : s;
let red = 0, n = 0;
for (const lang of ['en', 'ar']) {
const { page, close } = await openState('night', 'home', { lang });
const tag = lang === 'ar' ? 'AR ' : '';
const st = () => page.$eval('#phone', el => el.dataset.state);
const txt = k => page.$eval(`#phone [data-k="${k}"]`, el => el.innerText.replace(/\s+/g, ' ').trim()).catch(() => null);
const key = async s => { for (const c of (s === 'del' ? [s] : s)) await page.click(`#phone [data-key="${c}"]`); };
const tap = k => page.click(`#phone [data-k="${k}"]`);
const disabled = k => page.$eval(`#phone [data-k="${k}"]`, el => el.disabled);

async function expect(what, state, amt, extra) {
  n++;
  if (amt != null) amt = num(lang, amt);
  const s = await st(), a = state === 'home' ? null : await txt('amt');
  const bad = [];
  if (s !== state) bad.push(`состояние ${s}, ждали ${state}`);
  if (amt != null && a !== amt) bad.push(`сумма «${a}», ждали «${amt}»`);
  if (extra) for (let [k, v] of Object.entries(extra)) {
    if (v && typeof v === 'object') v = v[lang]; else if (typeof v === 'string') v = num(lang, v);
    const g = k.startsWith('disabled:') ? await disabled(k.slice(9)) : await txt(k);
    if (g !== v) bad.push(`${k} = ${JSON.stringify(g)}, ждали ${JSON.stringify(v)}`);
  }
  if (bad.length) { red++; line(`КРАСНОЕ ${tag}${what}: ${bad.join('; ')}`); }
  else line(`ок ${tag}${what}`);
}

await tap('cta');
await expect('Home → CTA → 1, сумма по умолчанию', '1', '1 500', { 'disabled:cont': false, 'avail-line': { en: 'Available now: 5 650', ar: 'المتاح الآن: ٥٬٦٥٠' } });
await expect('полоса прогноза на 1 500', '1', null, { 'pm-val-spent': '2 900', 'pm-val-upc': '1 950' });
await key('0');
await expect('1 500 → «0» → 15 000 > 5 650 → 5', '5', '15 000', { 'disabled:cont': true, 'pm-val-spent': '16 400' });
await key('del');
await expect('⌫ на 5 → 1 500 → 1', '1', '1 500');
await key('del'); await key('del'); await key('del'); await key('del');
await expect('⌫ до пустой → 0, Continue неактивна', '1', '0', { 'disabled:cont': true });
await key('0'); await key('0');
await expect('ноль первой цифрой игнорируется', '1', '0', { 'disabled:cont': true });
await key('7');
await expect('0 → «7» → 7, Continue активна', '1', '7', { 'disabled:cont': false });
await key('del');
await key('2500');
await expect('ровно 2 500 → 1 (лимит «больше»)', '1', '2 500', { 'disabled:cont': false });
await key('del'); await key('del'); await key('del'); await key('del');
await key('3000');
await expect('3 000 > 2 500 → 6', '6', '3 000', { 'disabled:cont': true, lim4: { en: 'to send 3 000.', ar: 'لتحويل ٣٬٠٠٠.' } });
await key('del');
await expect('⌫ на 6 → 300 → 1', '1', '300');
await key('del'); await key('del'); await key('del');
await key('5650');
await expect('ровно 5 650 → 6, не 5', '6', '5 650');
await key('1');
await expect('56 501 → 5', '5', '56 501', { 'err-text2': { en: '5 650 available.', ar: '٥٬٦٥٠' } });
await key('9999');
await expect('56 501 → «9999» → 565 019, цифры сверх 6 игнорируются', '5', '565 019');
await key('del'); await key('del'); await key('del'); await key('del'); await key('del'); await key('del');
await key('9999999');
await expect('седьмая цифра игнорируется → 999 999', '5', '999 999');
await key('del');
await expect('⌫ после лимита → 99 999', '5', '99 999');
await tap('sh-close');
await expect('крестик на 5 → Home', 'home');
await tap('cta');
await expect('снова Home → 1, сумма сброшена', '1', '1 500');
await key('del'); await key('del');
await expect('15 → 1', '1', '15');
await tap('cont');
await expect('Continue → 2, сумма та же', '2', '15', { 'new-avail': '5 635' });
await tap('back');
await expect('Back → 1, сумма сохранена', '1', '15');
await tap('sh-close');
await expect('крестик на 1 → Home', 'home');

await close();
}
line(red ? `ИТОГ: КРАСНОЕ (${red} из ${n})` : `ИТОГ: зелёное (${n}/${n})`);
process.exit(red ? 1 : 0);
