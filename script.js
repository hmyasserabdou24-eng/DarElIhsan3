document.documentElement.classList.add('js');

/* T (نصوص الموقع) انتقلت إلى i18n-data.js وتُحمَّل قبل هذا الملف */

let L = 'ar';
let posts = [];

try {
  localStorage.setItem('lang', 'ar');
} catch (error) {
  // ignore storage errors in restricted contexts
}

const icon = (name) => `<svg class="i"><use href="#i-${name}"/></svg>`;

function splitWelcomeWords() {
  const title = document.querySelector('.welcome-title');
  if (!title) return;

  const text = title.textContent.trim();
  const words = text.split(/\s+/).filter(Boolean);
  if (!words.length) return;

  const esc = (t) => String(t).replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
  title.innerHTML = words.map((word, index) => `<span class="word" style="--i:${index}">${esc(word)}</span>`).join(' ');
}

function updateI18n() {
  document.documentElement.lang = L;
  document.documentElement.dir = L === 'ar' ? 'rtl' : 'ltr';

  document.querySelectorAll('[data-i18n]').forEach((el) => {
    const key = el.dataset.i18n;
    if (T[L] && T[L][key]) {
      el.textContent = T[L][key];
    }
  });

  splitWelcomeWords();

  const langLabel = L === 'ar' ? 'Français' : 'العربية';
  const langButton = document.getElementById('langTxt');
  if (langButton) langButton.textContent = langLabel;

  document.title = (T[L].h1 || T[L].heroTitle) + ' – ' + (T[L].f2 || T[L].brand);

  try {
    localStorage.setItem('lang', L);
  } catch (error) {
    // ignore storage errors in restricted contexts
  }
}

function renderNews() {
  const newsGrid = document.getElementById('newsGrid');
  if (!newsGrid) return;

  if (!posts.length) {
    newsGrid.innerHTML = '';
    return;
  }

  // بناء آمن: لا innerHTML ولا إدراج نصوص/روابط قادمة من مصدر خارجي (حماية من XSS)
  const safeHttps = (u) => { try { const x = new URL(u, location.href); return x.protocol === 'https:' ? x.href : ''; } catch (e) { return ''; } };
  newsGrid.textContent = '';
  posts.forEach((p) => {
    const date = new Date(p.date).toLocaleDateString(L === 'ar' ? 'ar-DZ-u-nu-latn' : 'fr-FR', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
    const card = document.createElement('article');
    card.className = 'card in';
    const ph = document.createElement('div');
    ph.className = 'ph';
    const imgSrc = safeHttps(p.image);
    if (imgSrc) {
      const img = document.createElement('img');
      img.src = imgSrc; img.alt = ''; img.loading = 'lazy';
      img.addEventListener('error', () => img.remove());
      ph.appendChild(img);
    }
    const body = document.createElement('div');
    body.className = 'body';
    const d = document.createElement('span'); d.className = 'date'; d.textContent = date;
    const t = document.createElement('h3'); t.textContent = (p.title && p.title[L]) || '';
    const tx = document.createElement('p'); tx.textContent = (p.text && p.text[L]) || '';
    const a = document.createElement('a'); a.className = 'btn'; a.href = safeHttps(p.url) || '#';
    const sp = document.createElement('span'); sp.textContent = T[L].more;
    const ar = document.createElement('i'); ar.className = 'arr'; ar.innerHTML = icon('arrow');
    a.append(sp, ar);
    body.append(d, t, tx, a);
    card.append(ph, body);
    newsGrid.appendChild(card);
  });
}

function setLang(lang) {
  L = lang;
  updateI18n();
  renderNews();
}

const io = new IntersectionObserver((entries) => {
  entries.forEach((entry) => {
    if (entry.isIntersecting) {
      entry.target.classList.add('in');
      io.unobserve(entry.target);
    }
  });
}, { threshold: 0.12 });

document.querySelectorAll('[data-i]').forEach((el) => {
  el.innerHTML = icon(el.dataset.i);
});

document.querySelectorAll('.reveal').forEach((el) => io.observe(el));

document.getElementById('lang')?.addEventListener('click', () => {
  setLang(L === 'ar' ? 'fr' : 'ar');
});

const navToggle = document.querySelector('.nav-toggle');
const nav = document.querySelector('.main-nav');

if (navToggle && nav) {
  navToggle.addEventListener('click', (e) => {
    e.stopPropagation();
    const isOpen = nav.classList.toggle('open');
    navToggle.setAttribute('aria-expanded', String(isOpen));
  });

  nav.querySelectorAll('a').forEach((link) => {
    link.addEventListener('click', () => {
      nav.classList.remove('open');
      navToggle.setAttribute('aria-expanded', 'false');
    });
  });

  document.addEventListener('click', (e) => {
    if (nav.classList.contains('open') && !nav.contains(e.target) && !navToggle.contains(e.target)) {
      nav.classList.remove('open');
      navToggle.setAttribute('aria-expanded', 'false');
    }
  });
}

updateI18n();

