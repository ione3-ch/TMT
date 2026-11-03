(function () {
  'use strict';

  // ---- Intro splash: hides after the animation or on click ----
  var splash = document.getElementById('splash');
  if (splash) {
    var hide = function () { splash.classList.add('is-gone'); };
    var reduce = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    setTimeout(hide, reduce ? 400 : 3600);
    splash.addEventListener('click', hide);
  }

  // ---- FAQ accordion: one answer open at a time ----
  var faqButtons = Array.prototype.slice.call(document.querySelectorAll('.faq-q'));
  function setFaq(btn, open) {
    var answer = btn.parentNode.querySelector('.faq-a');
    var icon = btn.querySelector('.faq-ico');
    btn.setAttribute('aria-expanded', open ? 'true' : 'false');
    if (answer) answer.hidden = !open;
    if (icon) {
      icon.textContent = open ? '−' : '+';
      icon.style.background = open ? '#142A7F' : '#E6EBF9';
      icon.style.color = open ? '#FFFFFF' : '#142A7F';
    }
  }
  faqButtons.forEach(function (btn) {
    btn.addEventListener('click', function () {
      var wasOpen = btn.getAttribute('aria-expanded') === 'true';
      faqButtons.forEach(function (b) { setFaq(b, false); });
      if (!wasOpen) setFaq(btn, true);
    });
  });

  // ---- License lightbox ----
  var thumbs = Array.prototype.slice.call(document.querySelectorAll('[data-lic]'));
  var box = document.getElementById('lightbox');
  var boxImg = document.getElementById('lb-img');
  var counter = document.getElementById('lb-counter');
  var current = -1;
  function show(i) {
    var n = thumbs.length;
    current = (i + n) % n;
    var src = thumbs[current].querySelector('img').getAttribute('src');
    boxImg.src = src;
    boxImg.alt = 'Лицензия ' + (current + 1);
    counter.textContent = (current + 1) + ' из ' + n;
    box.hidden = false;
    document.body.classList.add('lb-open');
  }
  function close() {
    box.hidden = true;
    document.body.classList.remove('lb-open');
    if (thumbs[current]) thumbs[current].focus();
  }
  if (box) {
    thumbs.forEach(function (t, i) { t.addEventListener('click', function () { show(i); }); });
    document.getElementById('lb-prev').addEventListener('click', function () { show(current - 1); });
    document.getElementById('lb-next').addEventListener('click', function () { show(current + 1); });
    document.getElementById('lb-close').addEventListener('click', close);
    box.addEventListener('click', function (e) { if (e.target === box) close(); });
    document.addEventListener('keydown', function (e) {
      if (box.hidden) return;
      if (e.key === 'Escape') close();
      if (e.key === 'ArrowLeft') show(current - 1);
      if (e.key === 'ArrowRight') show(current + 1);
    });
  }

  // ---- Lead form ----
  // Без сервера заявка уходит письмом через почтовую программу посетителя.
  // Чтобы заявки приходили на почту напрямую, укажите адрес обработчика
  // (например, Formspree) в FORM_ENDPOINT — см. README.
  var FORM_ENDPOINT = '';
  var MAIL_TO = 'tmt@tmt-vost.ru';
  var form = document.getElementById('lead-form');
  if (form) {
    form.addEventListener('submit', function (e) {
      e.preventDefault();
      var d = new FormData(form);
      var btn = form.querySelector('button[type="submit"]');
      if (FORM_ENDPOINT) {
        btn.disabled = true;
        fetch(FORM_ENDPOINT, { method: 'POST', body: d, headers: { Accept: 'application/json' } })
          .then(function (r) {
            btn.textContent = r.ok ? 'Заявка отправлена' : 'Ошибка — позвоните нам';
            if (r.ok) form.reset();
          })
          .catch(function () { btn.textContent = 'Ошибка — позвоните нам'; })
          .finally(function () { btn.disabled = false; });
        return;
      }
      var body = 'Имя: ' + d.get('name') + '\nТелефон: ' + d.get('phone') +
        '\nE-mail: ' + (d.get('email') || '—') + '\n\n' + (d.get('comment') || '');
      window.location.href = 'mailto:' + MAIL_TO + '?subject=' +
        encodeURIComponent('Заявка с сайта') + '&body=' + encodeURIComponent(body);
    });
  }
})();
