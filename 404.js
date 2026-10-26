/* يضبط رابط الصفحة الرئيسية والشعار مهما كان عمق العنوان الخاطئ.
   على GitHub Pages لمشروع (user.github.io/REPO/...) يكون أول جزء من المسار هو اسم المستودع. */
(function () {
  var base = '/';
  if (/\.github\.io$/i.test(location.hostname)) {
    var seg = location.pathname.split('/').filter(Boolean)[0];
    if (seg) base = '/' + seg + '/';
  }
  var home = document.getElementById('home'), logo = document.getElementById('logo');
  if (home) home.setAttribute('href', base);
  if (logo) logo.setAttribute('src', base + 'logo-sq.png');
})();
