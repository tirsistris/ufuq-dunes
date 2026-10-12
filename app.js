// Ufuq v2 «Дюны» — витрина и состояние.
// s1: каркас, темы, Home. s2: шторка 1, 2, 5, 6 и сумма с клавиатуры. s3: 3, 4 и переходы.

const OPENING = 9000;           // since payday
const SPENT = 1400;
const UPCOMING = 1950;
const AVAILABLE = OPENING - SPENT - UPCOMING; // 5 650
const CHANNEL_LIMIT = 2500;     // quick transfer, за один платёж
const DAYS_TO_PAYDAY = 23;      // 4 Sep → 27 Sep (Home): 5 650 / 23 = 246, 4 150 / 23 = 180 — как в кадре 4
const MAX_DIGITS = 6;           // 999 999; седьмая цифра игнорируется (спека, «Поведение»)

// Полосы: ширина под сегменты = ширина фрейма Bar минус зазоры по 3.
// Home: Bar 326 → 320. Шторка: Bar 350 → 344.
const BAR_HOME_PX = 320;
const BAR_SHEET_PX = 344;
const BAR_IMPACT_PX = 320;      // 3, 4: Bar 326 → 320

// Сумма, с которой открываются состояния (как во фреймах Figma).
const FRAME_AMOUNT = { 1: 1500, 2: 1500, 3: 1500, 4: 1500, 5: 6000, 6: 3000 };

// Переходы — из прототипа Figma (reactions фреймов Page 2).
// Шторка с Home и обратно — решение Баатра (в Figma Dissolve, спека «Расхождения»).
const SMART = ms => ['smart', ms];
const DISSOLVE = ms => ['dissolve', ms];
const SHEET_IN = ms => ['sheet-in', ms];
const SHEET_OUT = ms => ['sheet-out', ms];
// закрытие шторки быстрее и с разгоном (решение Баатра): выезд 240 ease-out, уезд 160 ease-in
const SHEET_CLOSE = { duration: 160, easing: 'ease-in' };
const CALC_MS = 1500;           // 3 → 4: After delay 1,5 s

const BUILT = new Set(['home', '1', '2', '3', '4', '5', '6']);

// Тексты AR — дословно из фреймов Figma Page 2 «· AR» (Home: 119:4082 / 122:3172).
// Ключ — data-t в index.html. EN-тексты остаются в разметке и возвращаются как были.
const AR = {
  date1: '٤ سبتمبر ٢٠٢٦', date2: '٢٢ ربيع الأول ١٤٤٨ هـ',
  caption: 'الحساب الجاري  ••••  7742',
  display: '٥٬٦٥٠', availnow: 'متاح الآن', of: 'من', 'since-num': '٩٬٠٠٠', 'since-words': 'منذ يوم الراتب',
  'lbl-spent': 'مصروف', 'val-spent': '١٬٤٠٠', 'lbl-upcoming': 'الدفعات القادمة', 'val-upcoming': '١٬٩٥٠',
  around: 'حوالي', perday: '٢٤٦', aday: 'يوميًا', until: 'حتى يوم الراتب، ٢٧ سبتمبر',
  cta: 'تحويل برقم الجوال', 'title-upcoming': 'الدفعات القادمة',
  day1: '٨', day2: '١٥', day3: '٢٢', day4: '٢٨', sep: 'سبتمبر',
  pay1: 'مرزان لتمويل السيارات', 'pay1-desc': 'بعد ٤ أيام', sum1: '٨٥٠',
  pay2: 'تاليا للتأمين الصحي', sum2: '٦٢٠',
  pay3: 'مدارس خرزة العالمية', sum3: '٤٨٠',
  pay4: 'ترفين للبث', 'pay4-desc': 'الدورة القادمة', sum4: '٢٥٠',
  'title-send': 'إرسال سريع',
  'ini-a': 'ع', 'name-a': 'عبدالله', 'ini-n': 'ن', 'name-n': 'نورة', 'ini-f': 'ف', 'name-f': 'فيصل',
  'tab-month': 'الشهر', 'tab-transfers': 'التحويلات', 'tab-account': 'الحساب',
  // шторка 1, 2, 5, 6: 119:4317, 119:4630, 119:5037, 119:5352 / 122:3402, 122:3710, 122:4092, 122:4402
  'name-rcp': 'عبدالله', avail: 'المتاح', 'avail-now': ' الآن:', arrow: '←',
  projected: 'توقع الشهر', preview: 'معاينة فقط — لن يتم تحويل أي أموال',
  'err-text': 'المبلغ غير كافٍ — المتاح', 'err-text2': '٥٬٦٥٠',
  lim1: 'التحويل السريع محدود بـ', lim2: 'لكل عملية. خفّض المبلغ إلى',
  lim3: 'أو أقل، أو أضف عبدالله إلى قائمة المستفيدين', lim4: 'لتحويل', 'lim-2500': '٢٬٥٠٠',
  add: 'إضافة مستفيد', cont: 'متابعة', confirm: 'تأكيد', back: 'رجوع',
  // 3 и 4: 119:4917, 119:4963 / 122:3992, 122:4028
  'calc-title': 'جارٍ حساب الأثر…', 'imp-title': 'الأثر المتوقع', 'imp-sub': 'المتاح بعد التحويل',
  'imp-if': 'في حال تحويل', 'imp-to-name': 'إلى عبدالله', 'imp-perday': 'يوميًا حتى يوم الراتب',
  'imp-note': 'لم يتم تحويل أي أموال', done: 'إغلاق',
  k1: '١', k2: '٢', k3: '٣', k4: '٤', k5: '٥', k6: '٦', k7: '٧', k8: '٨', k9: '٩', k0: '٠',
};
const TITLE = {
  en: { transfer: 'Transfer by phone number', review: 'Review transfer' },
  ar: { transfer: 'تحويل برقم الجوال', review: 'مراجعة التحويل' },
};
const SHEET = new Set(['1', '2', '5', '6']);

const phone = document.getElementById('phone');
const root = document.documentElement;
const media = matchMedia('(prefers-color-scheme: dark)');
const reduced = matchMedia('(prefers-reduced-motion: reduce)');
const $ = k => phone.querySelector(`[data-k="${k}"]`);

const params = new URLSearchParams(location.search);
let themePick = ['light', 'dark', 'auto'].includes(params.get('theme')) ? params.get('theme') : 'auto';
let lang = params.get('lang') === 'ar' ? 'ar' : 'en';
let state = params.get('state');
if (!BUILT.has(state)) state = 'home';
let amount = FRAME_AMOUNT[state] ?? FRAME_AMOUNT[1];

// EN: тысячи через пробел. AR: восточно-арабские цифры, тысячи через «٬» — как во фреймах.
const fmt = n => {
  if (lang !== 'ar') return String(n).replace(/\B(?=(\d{3})+(?!\d))/g, ' ');
  return String(n).replace(/\B(?=(\d{3})+(?!\d))/g, '٬').replace(/\d/g, d => '٠١٢٣٤٥٦٧٨٩'[d]);
};

// Ширины сегментов: все, кроме последнего, округляются; последний — остаток,
// чтобы сумма совпала с полосой (так посчитаны бары в Figma: 111+159+74 = 344).
function segWidths(values, px) {
  const total = values.reduce((a, b) => a + b, 0);
  const out = values.slice(0, -1).map(v => Math.round((v / total) * px));
  out.push(px - out.reduce((a, b) => a + b, 0));
  return out;
}

function resolvedTheme() {
  if (themePick === 'light') return 'day';
  if (themePick === 'dark') return 'night';
  return media.matches ? 'night' : 'day';
}

function applyTheme() {
  const t = resolvedTheme();
  phone.dataset.theme = t;
  root.dataset.page = t;
  for (const b of document.querySelectorAll('[data-theme-pick]')) {
    b.setAttribute('aria-pressed', String(b.dataset.themePick === themePick));
  }
}

const EN = new Map(); // data-t → исходная разметка EN
function applyLang() {
  const ar = lang === 'ar';
  if (ar) { phone.lang = 'ar'; phone.dir = 'rtl'; } else { phone.removeAttribute('lang'); phone.removeAttribute('dir'); }
  for (const el of phone.querySelectorAll('[data-t]')) {
    if (!EN.has(el)) EN.set(el, el.innerHTML);
    if (ar) el.textContent = AR[el.dataset.t];
    else el.innerHTML = EN.get(el);
  }
  for (const b of document.querySelectorAll('[data-lang-pick]')) {
    b.setAttribute('aria-pressed', String(b.dataset.langPick === lang));
  }
}

function syncUrl() {
  const p = new URLSearchParams(location.search);
  p.set('lang', lang);
  p.set('theme', themePick);
  p.set('state', state);
  history.replaceState(null, '', `?${p}`);
}

// Состояние шторки по сумме (спека, «Поведение»).
function stateForAmount(a) {
  if (a > AVAILABLE) return '5';
  if (a > CHANNEL_LIMIT) return '6';
  return '1';
}

function renderSheet() {
  $('sh-title').textContent = TITLE[lang][state === '2' ? 'review' : 'transfer'];
  $('amt').textContent = fmt(amount);
  phone.querySelector('[data-v="available"]').textContent = fmt(AVAILABLE);
  $('new-avail').textContent = fmt(AVAILABLE - amount);
  $('pm-val-spent').textContent = fmt(SPENT + amount);
  $('pm-val-upc').textContent = fmt(UPCOMING);
  // AR (a4): без точки — «لتحويل ⃁ ٣٬٠٠٠», как в 119:5481 / 122:4525
  phone.querySelector('[data-v="limit-amount"]').textContent = lang === 'ar' ? fmt(amount) : `${fmt(amount)}.`;
  $('cont').disabled = state !== '1' || amount === 0; // 0 → неактивна (спека, «Поведение»)

  const w = v => `${v}px`;
  if (state === '5') {
    // не хватает: покрыто всё доступное, нехватка — отдельный сегмент сверх 9 000
    const [cov, short, upc] = segWidths([SPENT + AVAILABLE, amount - AVAILABLE, UPCOMING], BAR_SHEET_PX);
    $('pm-spent').style.width = w(cov);
    $('pm-short').style.width = w(short);
    $('pm-upc').style.width = w(upc);
  } else {
    const [sp, av, upc] = segWidths([SPENT + amount, AVAILABLE - amount, UPCOMING], BAR_SHEET_PX);
    $('pm-spent').style.width = w(sp);
    $('pm-avail').style.width = w(av);
    $('pm-upc').style.width = w(upc);
  }
}

function renderImpact() {
  const left = AVAILABLE - amount;
  const perDay = v => Math.round(v / DAYS_TO_PAYDAY);
  const [sp, av, upc] = segWidths([SPENT + amount, left, UPCOMING], BAR_IMPACT_PX);
  for (const p of ['calc', 'imp']) {
    $(`${p}-spent`).style.width = `${sp}px`;
    $(`${p}-avail`).style.width = `${av}px`;
    $(`${p}-upc`).style.width = `${upc}px`;
    $(`${p}-val-spent`).textContent = fmt(SPENT + amount);
    $(`${p}-val-upc`).textContent = fmt(UPCOMING);
  }
  $('imp-amt').textContent = fmt(left);
  $('imp-sum').textContent = fmt(amount);
  $('imp-from').textContent = fmt(perDay(AVAILABLE));
  $('imp-to').textContent = fmt(perDay(left));
  // Figma: auto-width текст занимает целые пиксели (ширина слова = ceil), слова в строке
  // стоят по этим ширинам — 11, 45, 204 / 33, 17, 31, 146 в кадре 4. Повторяем.
  for (const t of phone.querySelectorAll('.imp-line > span')) {
    t.style.minWidth = '';
    t.style.minWidth = `${Math.ceil(t.getBoundingClientRect().width)}px`;
  }
}

const shown = (el, s) => el.dataset.show.split(' ').includes(s);
let calcTimer = 0;

function applyState() {
  phone.dataset.state = state;
  for (const el of phone.querySelectorAll('[data-show]')) {
    el.toggleAttribute('hidden', !shown(el, state)); // не .hidden: у <svg> его нет
  }
  phone.querySelector('.screen').inert = state !== 'home';
  phone.querySelector('.tabbar').inert = state !== 'home';
  if (SHEET.has(state)) renderSheet();
  if (state === '3' || state === '4') renderImpact();
  clearTimeout(calcTimer);
  if (state === '3') calcTimer = setTimeout(() => go('4', SMART(240)), CALC_MS);
  for (const b of document.querySelectorAll('[data-state]')) {
    b.setAttribute('aria-current', String(b.dataset.state === state));
  }
  syncUrl();
}

// ---------- переходы (только WAAPI) ----------
// Dissolve: снимок старого кадра поверх нового гаснет целиком.
// Smart animate: элементы с тем же data-k, видимые до и после, едут со старого места
// (FLIP, сдвиг считается от ближайшего такого же предка); сегменты полос ещё и тянутся
// (scaleX от левого края — без перекладки соседей);
// исчезающие (data-show) гаснут на снимке, появляющиеся проявляются.
// Тот же data-k на другом элементе (дюны 3 → 4) — старый гаснет поверх нового.
// Шторка: открытие — шторка выезжает снизу, затемнение проявляется;
// закрытие — снимок шторки уезжает вниз, затемнение гаснет, Home под ними уже живой.
// prefers-reduced-motion: только прозрачность.

function visibleKeyed() {
  const m = new Map();
  for (const el of phone.querySelectorAll('[data-k]')) {
    if (el.getClientRects().length && !el.closest('.ghost')) m.set(el.dataset.k, el);
  }
  return m;
}

function settle() {
  for (const a of phone.getAnimations({ subtree: true })) a.finish();
  for (const g of phone.querySelectorAll('.ghost')) g.remove();
}

function go(next, motion) {
  settle();
  const prev = state;
  if (!motion) { state = next; applyState(); return; }
  const [kind, ms] = motion;
  const opt = kind === 'sheet-out' ? SHEET_CLOSE : { duration: ms, easing: 'ease-out' };
  if (kind === 'sheet-in' || kind === 'sheet-out') { moveSheet(kind, next, opt); return; }

  const ghost = phone.cloneNode(true);
  const pr = phone.getBoundingClientRect();
  const rect = el => { const r = el.getBoundingClientRect(); return { x: r.x - pr.x, y: r.y - pr.y, w: r.width }; };
  const before = visibleKeyed();
  const old = new Map([...before].map(([k, el]) => [k, rect(el)]));

  state = next;
  applyState();
  const after = visibleKeyed();
  const now = new Map([...after].map(([k, el]) => [k, rect(el)])); // до любой анимации

  ghost.removeAttribute('id');
  ghost.classList.add('ghost');
  ghost.inert = true;
  ghost.setAttribute('aria-hidden', 'true');
  if (kind === 'smart') {
    // на снимке видно только то, что исчезает
    ghost.style.visibility = 'hidden';
    for (const el of ghost.querySelectorAll('[data-show]')) {
      if (!el.hasAttribute('hidden') && !shown(el, next)) el.style.visibility = 'visible';
    }
    for (const el of ghost.querySelectorAll('[data-k]')) {
      const twin = after.get(el.dataset.k);
      if (twin && before.get(el.dataset.k) !== twin && !el.hasAttribute('hidden')) el.style.visibility = 'visible';
    }
  }
  for (const el of ghost.querySelectorAll('[id],[data-k],[data-key]')) {
    el.removeAttribute('id'); el.removeAttribute('data-k'); el.removeAttribute('data-key');
  }
  phone.append(ghost);
  ghost.animate([{ opacity: 1 }, { opacity: 0 }], opt).finished.then(() => ghost.remove(), () => {});

  if (kind !== 'smart') return;
  // появляются: верхний из появившихся data-show (вложенные проявляются вместе с ним);
  // слой с тем же data-k, что был до (дюны 3 → 4), не проявляется — старый гаснет поверх него
  for (const el of phone.querySelectorAll('[data-show]')) {
    if (el.hasAttribute('hidden') || shown(el, prev) || el.closest('.ghost')) continue;
    if (el.dataset.k && before.has(el.dataset.k)) continue;
    const up = el.parentElement.closest('[data-show]');
    if (up && !shown(up, prev)) continue;
    el.animate([{ opacity: 0 }, { opacity: 1 }], opt);
  }
  if (reduced.matches) return;
  // едут и меняют ширину
  const moved = new Map();
  for (const [k, el] of after) {
    if (before.get(k) !== el) continue;
    const o = old.get(k), n = now.get(k);
    let anc = el.parentElement;
    while (anc && anc !== phone && !(anc.dataset.k && before.get(anc.dataset.k) === anc)) anc = anc.parentElement;
    const ad = (anc && anc !== phone && moved.get(anc.dataset.k)) || { dx: 0, dy: 0 };
    const dx = o.x - n.x - ad.dx;
    const dy = o.y - n.y - ad.dy;
    moved.set(k, { dx: dx + ad.dx, dy: dy + ad.dy });
    const sx = el.matches('.pm-bar > i') && n.w > 0 ? o.w / n.w : 1;
    if (Math.abs(dx) > 0.5 || Math.abs(dy) > 0.5 || Math.abs(sx - 1) > 0.002) {
      el.animate([
        { transformOrigin: '0 0', transform: `translate(${dx}px, ${dy}px) scaleX(${sx})` },
        { transformOrigin: '0 0', transform: 'none' },
      ], opt);
    }
  }
}

function moveSheet(kind, next, opt) {
  const down = sh => `translateY(${sh.getBoundingClientRect().height}px)`; // bottom: 0 → целиком за нижним краем
  if (kind === 'sheet-in') {
    state = next;
    applyState();
    const sh = phone.querySelector(':scope > .sheet');
    phone.querySelector(':scope > .scrim').animate([{ opacity: 0 }, { opacity: 1 }], opt);
    if (reduced.matches) sh.animate([{ opacity: 0 }, { opacity: 1 }], opt);
    else sh.animate([{ transform: down(sh) }, { transform: 'none' }], opt);
    return;
  }
  const ghost = phone.cloneNode(true);
  state = next;
  applyState();
  ghost.removeAttribute('id');
  ghost.classList.add('ghost');
  ghost.inert = true;
  ghost.setAttribute('aria-hidden', 'true');
  ghost.style.visibility = 'hidden';
  const sh = ghost.querySelector(':scope > .sheet'), sc = ghost.querySelector(':scope > .scrim');
  sh.style.visibility = sc.style.visibility = 'visible';
  for (const el of ghost.querySelectorAll('[id],[data-k],[data-key]')) {
    el.removeAttribute('id'); el.removeAttribute('data-k'); el.removeAttribute('data-key');
  }
  phone.append(ghost);
  const done = [
    sc.animate([{ opacity: 1 }, { opacity: 0 }], opt).finished,
    reduced.matches
      ? sh.animate([{ opacity: 1 }, { opacity: 0 }], opt).finished
      : sh.animate([{ transform: 'none' }, { transform: down(sh) }], opt).finished,
  ];
  Promise.all(done).then(() => ghost.remove(), () => {});
}

function layoutBar() {
  const [sp, av, upc] = segWidths([SPENT, AVAILABLE, UPCOMING], BAR_HOME_PX);
  const bar = document.getElementById('bar');
  bar.querySelector('.s-spent').style.width = `${sp}px`;
  bar.querySelector('.s-avail').style.width = `${av}px`;
  bar.querySelector('.s-upcoming').style.width = `${upc}px`;
}

// ---------- телефон ----------

phone.addEventListener('click', e => {
  const key = e.target.closest('[data-key]');
  if (key && ['1', '5', '6'].includes(state)) {
    const k = key.dataset.key;
    if (k === 'del') amount = Math.floor(amount / 10);
    else if (String(amount).length < MAX_DIGITS || amount === 0) amount = amount * 10 + Number(k); // ведущий 0 даёт 0
    go(stateForAmount(amount), SMART(160));
    return;
  }
  const k = e.target.closest('[data-k]')?.dataset.k;
  if (k === 'cta') { amount = FRAME_AMOUNT[1]; go('1', SHEET_IN(240)); }
  else if (k === 'sh-close') go('home', SHEET_OUT(SHEET_CLOSE.duration));
  else if (k === 'cont' && state === '1' && amount > 0) go('2', SMART(240));
  else if (k === 'back') go('1', SMART(240));
  else if (k === 'confirm') go('3', DISSOLVE(240));
  else if (k === 'done') go('home', DISSOLVE(240));
  // add recipient — экрана нет (вне объёма v2)
});

// ---------- панель витрины ----------

document.getElementById('lang-seg').addEventListener('click', e => {
  const b = e.target.closest('[data-lang-pick]');
  if (!b || b.dataset.langPick === lang) return;
  settle();
  lang = b.dataset.langPick;
  applyLang();
  applyState(); // тема и состояние сохраняются
  // ширины слов на 4 (ceil) снимаются по Readex Pro / Inter, а не по запасному шрифту
  document.fonts.ready.then(() => { if (state === '4') renderImpact(); });
});

document.getElementById('theme-seg').addEventListener('click', e => {
  const b = e.target.closest('[data-theme-pick]');
  if (!b) return;
  themePick = b.dataset.themePick;
  applyTheme();
  syncUrl();
});

document.getElementById('states').addEventListener('click', e => {
  const b = e.target.closest('[data-state]');
  if (!b || b.disabled) return;
  if (FRAME_AMOUNT[b.dataset.state]) amount = FRAME_AMOUNT[b.dataset.state];
  go(b.dataset.state);
});

media.addEventListener('change', () => { if (themePick === 'auto') applyTheme(); });

layoutBar();
applyLang();
applyTheme();
applyState();
// ширины слов на 4 (ceil) снимаются по Inter, а не по запасному шрифту
document.fonts.ready.then(() => { if (state === '4') renderImpact(); });
