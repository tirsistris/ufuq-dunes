// Ufuq v2 «Дюны» — витрина и состояние.
// s1: каркас, темы, Home. s2: шторка 1, 2, 5, 6 и сумма с клавиатуры. 3–4 — шаг s3.

const OPENING = 9000;           // since payday
const SPENT = 1400;
const UPCOMING = 1950;
const AVAILABLE = OPENING - SPENT - UPCOMING; // 5 650
const CHANNEL_LIMIT = 2500;     // quick transfer, за один платёж

// Полосы: ширина под сегменты = ширина фрейма Bar минус зазоры по 3.
// Home: Bar 326 → 320. Шторка: Bar 350 → 344.
const BAR_HOME_PX = 320;
const BAR_SHEET_PX = 344;

// Сумма, с которой открываются состояния (как во фреймах Figma).
const FRAME_AMOUNT = { 1: 1500, 2: 1500, 5: 6000, 6: 3000 };

const BUILT = new Set(['home', '1', '2', '5', '6']);  // какие состояния уже собраны
const SHEET = new Set(['1', '2', '5', '6']);

const phone = document.getElementById('phone');
const root = document.documentElement;
const media = matchMedia('(prefers-color-scheme: dark)');
const $ = k => phone.querySelector(`[data-k="${k}"]`);

const params = new URLSearchParams(location.search);
let themePick = ['light', 'dark', 'auto'].includes(params.get('theme')) ? params.get('theme') : 'auto';
let state = params.get('state');
if (!BUILT.has(state)) state = 'home';
let amount = FRAME_AMOUNT[state] ?? FRAME_AMOUNT[1];

const fmt = n => String(n).replace(/\B(?=(\d{3})+(?!\d))/g, ' ');

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

function syncUrl() {
  const p = new URLSearchParams(location.search);
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
  $('sh-title').textContent = state === '2' ? 'Review transfer' : 'Transfer by phone number';
  $('amt').textContent = fmt(amount);
  phone.querySelector('[data-v="available"]').textContent = fmt(AVAILABLE);
  $('new-avail').textContent = fmt(AVAILABLE - amount);
  $('pm-val-spent').textContent = fmt(SPENT + amount);
  $('pm-val-upc').textContent = fmt(UPCOMING);
  phone.querySelector('[data-v="limit-amount"]').textContent = `${fmt(amount)}.`;
  $('cont').disabled = state !== '1';

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

function applyState() {
  phone.dataset.state = state;
  for (const el of phone.querySelectorAll('[data-show]')) {
    el.toggleAttribute('hidden', !el.dataset.show.split(' ').includes(state)); // не .hidden: у <svg> его нет
  }
  phone.querySelector('.screen').inert = SHEET.has(state);
  if (SHEET.has(state)) renderSheet();
  for (const b of document.querySelectorAll('[data-state]')) {
    b.setAttribute('aria-current', String(b.dataset.state === state));
  }
  syncUrl();
}

function go(next) {
  state = next;
  applyState();
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
    amount = k === 'del' ? Math.floor(amount / 10) : amount * 10 + Number(k);
    go(stateForAmount(amount));
    return;
  }
  const k = e.target.closest('[data-k]')?.dataset.k;
  if (k === 'cta') { amount = FRAME_AMOUNT[1]; go('1'); }
  else if (k === 'sh-close') go('home');
  else if (k === 'cont' && state === '1') go('2');
  else if (k === 'back') go('1');
  // confirm → 3 и add recipient — см. спеку: 3 собирается в s3, экрана Add recipient нет
});

// ---------- панель витрины ----------

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
applyTheme();
applyState();
