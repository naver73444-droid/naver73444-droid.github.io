'use strict';
document.documentElement.classList.add('js');
const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

/* ---------- 공개 프로필 ---------- */
const profile = window.PORTFOLIO_PROFILE || {};
if (typeof profile.name === 'string' && profile.name.trim()) {
  document.querySelector('[data-profile-name]').textContent = profile.name.trim();
  document.title = `${profile.name.trim()} | 전기공학 포트폴리오`;
}
let githubReady = false;
try {
  const url = new URL(profile.github);
  if (url.protocol === 'https:' && url.hostname === 'github.com' && !url.username && !url.password && url.pathname !== '/') {
    const link = document.getElementById('github-link');
    link.href = url.href;
    link.hidden = false;
    document.getElementById('github-empty').hidden = true;
    githubReady = true;
  }
} catch { /* No public profile configured. */ }
/* ---------- RC 응답 도식 ---------- */
// 플롯 영역: x 48→448 (0→5τ, τ당 80), y 260→40 (0→1)
const X0 = 48, PX_PER_TAU = 80, Y0 = 260, H = 220;
const V = t => 1 - Math.exp(-t);
const I = t => Math.exp(-t);
const px = t => X0 + PX_PER_TAU * t;
const py = v => Y0 - H * v;

for (const [id, fn] of [['voltage-curve', V], ['current-curve', I]]) {
  const path = document.getElementById(id);
  const d = Array.from({length: 201}, (_, i) => {
    const t = i / 40;
    return `${i ? 'L' : 'M'}${px(t).toFixed(2)} ${py(fn(t)).toFixed(2)}`;
  }).join(' ');
  path.setAttribute('d', d);
  if (!reduceMotion) {
    path.style.setProperty('--len', path.getTotalLength().toFixed(1));
    path.classList.add('draw');
  }
}

const svg = document.getElementById('scope-svg');
const hit = document.getElementById('scope-hit');
const cursorLine = document.getElementById('cursor-line');
const dotV = document.getElementById('cursor-v');
const dotI = document.getElementById('cursor-i');
const label = document.getElementById('cursor-label');
const readT = document.getElementById('scope-read');
const readV = document.getElementById('read-v');
const readI = document.getElementById('read-i');
const pct = x => `${(x * 100).toFixed(1)}%`;

function setCursor(t) {
  t = Math.min(5, Math.max(0, t));
  const x = px(t), v = V(t), i = I(t);
  cursorLine.setAttribute('x1', x); cursorLine.setAttribute('x2', x);
  dotV.setAttribute('cx', x); dotV.setAttribute('cy', py(v));
  dotI.setAttribute('cx', x); dotI.setAttribute('cy', py(i));
  label.textContent = pct(v);
  const flip = x > 380;
  label.setAttribute('x', flip ? x - 10 : x + 10);
  label.setAttribute('text-anchor', flip ? 'end' : 'start');
  label.setAttribute('y', Math.max(56, py(v) - 9));
  readT.textContent = `t = ${t.toFixed(2)}τ`;
  readV.textContent = pct(v);
  readI.textContent = pct(i);
}

function pointerToT(e) {
  const pt = svg.createSVGPoint();
  pt.x = e.clientX; pt.y = e.clientY;
  const p = pt.matrixTransform(svg.getScreenCTM().inverse());
  return (p.x - X0) / PX_PER_TAU;
}
hit.addEventListener('pointermove', e => setCursor(pointerToT(e)));
hit.addEventListener('pointerdown', e => setCursor(pointerToT(e)));
hit.addEventListener('pointerleave', () => setCursor(1));
setCursor(1);

/* ---------- 헤더 상태 & 현재 섹션 ---------- */
const header = document.querySelector('.header');
const onScroll = () => header.classList.toggle('scrolled', window.scrollY > 8);
window.addEventListener('scroll', onScroll, {passive: true});
onScroll();

const navLinks = [...document.querySelectorAll('.header nav a')];
if ('IntersectionObserver' in window) {
  const sections = navLinks.map(a => document.querySelector(a.getAttribute('href')));
  const spy = new IntersectionObserver(entries => {
    for (const entry of entries) {
      if (!entry.isIntersecting) continue;
      navLinks.forEach(a => a.classList.toggle('active', a.getAttribute('href') === `#${entry.target.id}`));
    }
  }, {rootMargin: '-45% 0px -50% 0px'});
  sections.forEach(s => s && spy.observe(s));
  const top = new IntersectionObserver(([entry]) => {
    if (entry.isIntersecting) navLinks.forEach(a => a.classList.remove('active'));
  }, {rootMargin: '-45% 0px -50% 0px'});
  top.observe(document.getElementById('home'));

  /* ---------- 등장 효과 ---------- */
  const reveal = new IntersectionObserver(entries => {
    for (const entry of entries) {
      if (entry.isIntersecting) { entry.target.classList.add('in'); reveal.unobserve(entry.target); }
    }
  }, {rootMargin: '0px 0px -8% 0px'});
  document.querySelectorAll('.reveal').forEach((el, i) => {
    el.style.transitionDelay = `${(i % 3) * 70}ms`;
    reveal.observe(el);
  });
} else {
  document.querySelectorAll('.reveal').forEach(el => el.classList.add('in'));
}
