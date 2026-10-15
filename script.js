document.documentElement.classList.add('js');

const T = {
  ar: {
    brand: 'دار الإحسان',
    navHome: 'الرئيسية',
    navAbout: 'من نحن',
    navCenters: 'مراكزنا',
    navNews: 'أخبارنا',
    navContact: 'اتصل بنا',
    heroTitle: 'مرحبًا بكم في المركز النفسي البيداغوجي دار الإحسان',
    heroTag: 'مركز متخصص في الرعاية النفسية والتربوية لأطفالنا ذوي الاحتياجات الخاصة',
    aboutTitle: 'من نحن؟',
    aboutText: 'جمعية أولياء الأطفال المعاقين ذهنياً هي جمعية ذات طابع اجتماعي وتضامني تأسست عام 1990 بمدينة العطف. نهدف إلى تقديم الدعم النفسي والبيداغوجي للأطفال ذوي الاحتياجات الخاصة، ومساعدة عائلاتهم في تخطي الصعاب ودمج أبنائهم في المجتمع.',
    statYears: 'سنة من العطاء',
    statCenters: 'مراكز متخصصة',
    statBeneficiaries: 'الأطفال المستفيدين',
    statYearsValue: '+30',
    statCentersValue: '3',
    statBeneficiariesValue: 'مئات',
    centersTitle: 'مراكزنا',
    map: 'الموقع على الخريطة',
    c1n: 'المركز النفسي البيداغوجي دار الإحسان',
    c1d: 'مركز متخصص يقدم رعاية نفسية وبيداغوجية للأطفال ذوي الإعاقة الذهنية، مع دعم تربوي واجتماعي للأسرة.',
    c2n: 'مركز المساعدة على العمل',
    c2d: 'مركز موجه للشباب ذوي الاحتياجات الخاصة لتأهيلهم مهنيًا ودمجهم في سوق العمل.',
    c3n: 'المزرعة البيداغوجية والزراعة المائية',
    c3d: 'منطقة تعليمية وطبيعية تساهم في التوازن النفسي للأطفال من خلال أنشطة زراعية ومائية علاجية.',
    newsTitle: 'آخر الأخبار والنشاطات',
    more: 'اقرأ المزيد',
    contactTitle: 'اتصل بنا',
    waText: 'تواصل عبر واتساب',
    f1: 'جمعية أولياء الأطفال المعاقين ذهنيًا',
    f2: 'المركز النفسي البيداغوجي دار الإحسان',
    h1: 'جمعية أولياء الأطفال المعاقين ذهنيًا'
  },
  fr: {
    brand: 'Dar El Ihssan',
    navHome: 'Accueil',
    navAbout: 'À propos',
    navCenters: 'Nos centres',
    navNews: 'Actualités',
    navContact: 'Contact',
    heroTitle: 'Bienvenue au Centre Médico-Pédagogique Dar El Ihssan',
    heroTag: 'Un centre spécialisé dans le soutien psychologique et pédagogique de nos enfants',
    aboutTitle: 'Qui sommes-nous ?',
    aboutText: 'L’association des parents d’enfants handicapés mentaux est une association à visée sociale et solidaire fondée en 1990 à El Atteuf. Nous visons à offrir un soutien psychologique et pédagogique aux enfants en situation de handicap, ainsi qu’à accompagner leurs familles dans leur parcours.',
    statYears: 'années d’engagement',
    statCenters: 'centres spécialisés',
    statBeneficiaries: 'enfants bénéficiaires',
    statYearsValue: '+30',
    statCentersValue: '3',
    statBeneficiariesValue: 'centaines',
    centersTitle: 'Nos centres',
    map: 'Voir sur la carte',
    c1n: 'Centre Médico-Pédagogique Dar El Ihssan',
    c1d: 'Centre spécialisé offrant un accompagnement psychologique et pédagogique aux enfants en situation de handicap mental, ainsi qu’un soutien familial.',
    c2n: "Centre d'Aide par le Travail (CAT)",
    c2d: 'Centre dédié à la préparation professionnelle des jeunes en situation de handicap pour leur insertion dans le monde du travail.',
    c3n: 'Ferme pédagogique et centre de formation en pisciculture et hydroponie',
    c3d: 'Espace éducatif et naturel qui favorise le bien-être des enfants à travers des activités agricoles et aquatiques thérapeutiques.',
    newsTitle: 'Dernières actualités et activités',
    more: 'Lire la suite',
    contactTitle: 'Contactez-nous',
    waText: 'Contacter via WhatsApp',
    f1: "Association des Parents d'Enfants Handicapés Mentaux",
    f2: 'Centre Médico-Pédagogique Dar El Ihssan',
    h1: "Association des Parents d'Enfants Handicapés Mentaux"
  }
};

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

  title.innerHTML = words.map((word, index) => `<span class="word" style="--i:${index}">${word}</span>`).join(' ');
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

  newsGrid.innerHTML = posts.map((p) => {
    const date = new Date(p.date).toLocaleDateString(L === 'ar' ? 'ar-DZ-u-nu-latn' : 'fr-FR', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });

    return `
      <article class="card in">
        <div class="ph"><img src="${p.image || ''}" alt="" loading="lazy" onerror="this.remove()"></div>
        <div class="body">
          <span class="date">${date}</span>
          <h3>${p.title[L]}</h3>
          <p>${p.text[L]}</p>
          <a class="btn" href="${p.url || '#'}"><span>${T[L].more}</span><i class="arr">${icon('arrow')}</i></a>
        </div>
      </article>
    `;
  }).join('');
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
  navToggle.addEventListener('click', () => {
    const isOpen = nav.classList.toggle('open');
    navToggle.setAttribute('aria-expanded', String(isOpen));
  });

  nav.querySelectorAll('a').forEach((link) => {
    link.addEventListener('click', () => {
      nav.classList.remove('open');
      navToggle.setAttribute('aria-expanded', 'false');
    });
  });
}

updateI18n();

fetch('news.json')
  .then((response) => response.json())
  .then((items) => {
    posts = items || [];
    renderNews();
  })
  .catch(() => {
    posts = [];
    renderNews();
  });
