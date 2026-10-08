// Ufuq v2 «Дюны» — витрина и состояние.
// s1: каркас, темы, Home. Состояния 1–6 — шаги s2/s3.

const OPENING = 9000;           // since payday
const SPENT = 1400;
const UPCOMING = 1950;
const AVAILABLE = OPENING - SPENT - UPCOMING; // 5 650

// Полоса: 322 px под три сегмента + два зазора по 3 = 328, как фрейм Bar в Figma.
const BAR_SEGMENTS_PX = 322;

const BUILT = new Set(['home']);  // какие состояния уже собраны

const phone = document.getElementById('phone');
const root = document.documentElement;
const media = matchMedia('(prefers-color-scheme: dark)');

const params = new URLSearchParams(location.search);
let themePick = ['light', 'dark', 'auto'].includes(params.get('theme')) ? params.get('theme') : 'auto';
let state = params.get('state');
if (!BUILT.has(state)) state = 'home';

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

function applyState() {
  for (const b of document.querySelectorAll('[data-state]')) {
    b.setAttribute('aria-current', String(b.dataset.state === state));
  }
}

function layoutBar() {
  const w = v => `${Math.round((v / OPENING) * BAR_SEGMENTS_PX)}px`;
  const bar = document.getElementById('bar');
  bar.querySelector('.s-spent').style.width = w(SPENT);
  bar.querySelector('.s-avail').style.width = w(AVAILABLE);
  bar.querySelector('.s-upcoming').style.width = w(UPCOMING);
}

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
  state = b.dataset.state;
  applyState();
  syncUrl();
});

media.addEventListener('change', () => { if (themePick === 'auto') applyTheme(); });

layoutBar();
applyTheme();
applyState();
syncUrl();
