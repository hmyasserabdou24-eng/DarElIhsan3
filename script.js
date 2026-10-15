document.documentElement.classList.add('js');
const T={
ar:{brand:'دار الإحسان',nav1:'الرئيسية',nav2:'مراكزنا',nav3:'اتصل بنا',
h1:'جمعية أولياء الأطفال المعاقين ذهنيًا',tag:'من أجل رعاية وتكفل أفضل بأطفالنا',
centers:'مراكزنا',map:'عرض الموقع على الخريطة',
c1n:'المركز النفسي البيداغوجي دار الإحسان',
c1d:'جمعية أولياء الأطفال المعاقين ذهنيًا، المركز النفسي البيداغوجي دار الإحسان وملحقاته، ببلدية العطف، ولاية غرداية. تأسست سنة 1990 بافتتاح أول قسم مكيف خاص بالأشخاص ذوي الإعاقة الذهنية، وأعيد تأسيس الجمعية سنة 2016 تحت اسم المركز النفسي البيداغوجي دار الإحسان.',
c2n:'مركز المساعدة على العمل (CAT)',
c2d:'مركز المساعدة على العمل (CAT) للشباب ذوي الإعاقة الذهنية واضطراب طيف التوحد بعد سن 18 سنة. افتتح سنة 2024 بحي أجماضين، بلدية العطف، ولاية غرداية.',
c3n:'المزرعة البيداغوجية ومركز التكوين في تربية الأسماك والزراعة المائية',
c3d:'المزرعة البيداغوجية ومركز التكوين المهني والتمهين للأشخاص ذوي الاحتياجات الخاصة في مجال تربية الأسماك والزراعة المائية. افتتح سنة 2023 بحي أسجلاف، بلدية العطف، ولاية غرداية.',
news:'آخر الأخبار والأنشطة',more:'اقرأ المزيد',contact:'تواصل معنا',wa:'تواصل عبر واتساب',
f1:'جمعية أولياء الأطفال المعاقين ذهنيًا',f2:'المركز النفسي البيداغوجي دار الإحسان'},
fr:{brand:'Dar El Ihssan',nav1:'Accueil',nav2:'Nos centres',nav3:'Contact',
h1:"Association des Parents d'Enfants Handicapés Mentaux",tag:'Pour une meilleure prise en charge de nos enfants',
centers:'Nos centres',map:'Voir sur la carte',
c1n:'Centre Médico-Pédagogique Dar El Ihssan',
c1d:"Association des Parents d'Enfants Handicapés Mentaux, Centre Médico-Pédagogique Dar El Ihssan et ses annexes, à El Atteuf, wilaya de Ghardaïa. Fondée en 1990 avec l'ouverture de la première classe adaptée aux personnes en situation de handicap mental, l'association a été refondée en 2016 sous le nom de Centre Médico-Pédagogique Dar El Ihssan.",
c2n:"Centre d'Aide par le Travail (CAT)",
c2d:"Centre d'Aide par le Travail (CAT) pour les jeunes de plus de 18 ans en situation de handicap mental ou avec un trouble du spectre de l'autisme. Ouvert en 2024 au quartier Ajmadhine, El Atteuf, wilaya de Ghardaïa.",
c3n:'Ferme pédagogique et centre de formation en pisciculture et hydroponie',
c3d:"Ferme pédagogique et centre de formation professionnelle et d'apprentissage pour les personnes à besoins spécifiques dans les domaines de la pisciculture et de l'hydroponie. Ouvert en 2023 au quartier Asjlaf, El Atteuf, wilaya de Ghardaïa.",
news:'Dernières actualités et activités',more:'Lire la suite',contact:'Contactez-nous',wa:'Contacter via WhatsApp',
f1:"Association des Parents d'Enfants Handicapés Mentaux",f2:'Centre Médico-Pédagogique Dar El Ihssan'}};

let L='ar',posts=[];
try{L=localStorage.getItem('lang')==='fr'?'fr':'ar'}catch(e){}

const io=new IntersectionObserver(es=>es.forEach(e=>{if(e.isIntersecting){e.target.classList.add('in');io.unobserve(e.target)}}),{threshold:.12});
const icon=n=>`<svg class="i"><use href="#i-${n}"/></svg>`;
document.querySelectorAll('[data-i]').forEach(e=>e.innerHTML=icon(e.dataset.i));
document.querySelectorAll('.reveal').forEach(e=>io.observe(e));

function renderNews(){
  const s=document.getElementById('news');
  s.hidden=!posts.length;
  document.getElementById('newsGrid').innerHTML=posts.map(p=>{
    const d=new Date(p.date).toLocaleDateString(L==='ar'?'ar-DZ-u-nu-latn':'fr-FR',{year:'numeric',month:'long',day:'numeric'});
    return `<article class="card in"><div class="ph"><img src="${p.image||''}" alt="" loading="lazy" onerror="this.remove()"></div>
    <div class="body"><span class="date">${d}</span><h3>${p.title[L]}</h3><p>${p.text[L]}</p>
    <a class="btn" href="${p.url||'#'}"><span>${T[L].more}</span><i class="arr">${icon('arrow')}</i></a></div></article>`}).join('');
}

function setLang(l){
  L=l;const d=document.documentElement;
  d.lang=l;d.dir=l==='ar'?'rtl':'ltr';
  document.querySelectorAll('[data-t]').forEach(e=>e.textContent=T[l][e.dataset.t]);
  document.getElementById('langTxt').textContent=l==='ar'?'Français':'العربية';
  document.title=T[l].h1+' – '+T[l].f2;
  try{localStorage.setItem('lang',l)}catch(e){}
  renderNews();
}

document.getElementById('lang').onclick=()=>setLang(L==='ar'?'fr':'ar');

const navToggle=document.querySelector('.nav-toggle');
const nav=document.querySelector('nav');
if(navToggle && nav){
  navToggle.addEventListener('click',()=>{
    const isOpen=nav.classList.toggle('open');
    navToggle.setAttribute('aria-expanded',String(isOpen));
  });
  nav.querySelectorAll('a').forEach(link=>{
    link.addEventListener('click',()=>{
      nav.classList.remove('open');
      navToggle.setAttribute('aria-expanded','false');
    });
  });
}

setLang(L);
fetch('news.json').then(r=>r.json()).then(j=>{posts=j;renderNews()}).catch(()=>{});
