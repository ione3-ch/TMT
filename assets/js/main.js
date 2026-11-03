(function () {
  'use strict';

  var $ = function (s, r) { return (r || document).querySelector(s); };
  var $$ = function (s, r) { return Array.prototype.slice.call((r || document).querySelectorAll(s)); };

  // ---- Intro splash: hides after the animation or on click ----
  var splash = $('#splash');
  if (splash) {
    var hideSplash = function () { splash.classList.add('is-gone'); };
    var reduce = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    setTimeout(hideSplash, reduce ? 400 : 3600);
    splash.addEventListener('click', hideSplash);
  }

  // ---- FAQ accordion: one answer open at a time ----
  var faqButtons = $$('.faq-q');
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

  // ---- Lightbox: two galleries — photos (services + fleet) and licenses ----
  function collect(selector, attr) {
    return $$(selector)
      .sort(function (a, b) { return +a.getAttribute(attr) - +b.getAttribute(attr); })
      .map(function (el) {
        var img = el.querySelector('img');
        var cap = el.querySelector('.cap');
        var label = img.getAttribute('alt') || '';
        if (cap) label += ' · ' + cap.textContent;
        return { el: el, src: img.getAttribute('src'), label: label };
      });
  }
  var galleries = { photos: collect('[data-zoom]', 'data-zoom'), lic: collect('[data-lic]', 'data-lic') };
  galleries.lic.forEach(function (g, i) { g.label = 'Лицензия ' + (i + 1); });

  var box = $('#lightbox'), boxImg = $('#lb-img'), caption = $('#lb-caption'), counter = $('#lb-counter');
  var cur = null;
  function show(name, i) {
    var list = galleries[name], n = list.length;
    i = (i + n) % n;
    cur = { name: name, i: i };
    boxImg.src = list[i].src;
    boxImg.alt = list[i].label;
    caption.textContent = list[i].label;
    counter.textContent = (i + 1) + ' из ' + n;
    box.hidden = false;
    document.body.classList.add('lb-open');
    $('#lb-close').focus();
  }
  function closeBox() {
    box.hidden = true;
    document.body.classList.remove('lb-open');
    if (cur) galleries[cur.name][cur.i].el.focus();
    cur = null;
  }
  if (box) {
    Object.keys(galleries).forEach(function (name) {
      galleries[name].forEach(function (g, i) { g.el.addEventListener('click', function () { show(name, i); }); });
    });
    $('#lb-prev').addEventListener('click', function () { if (cur) show(cur.name, cur.i - 1); });
    $('#lb-next').addEventListener('click', function () { if (cur) show(cur.name, cur.i + 1); });
    $('#lb-close').addEventListener('click', closeBox);
    box.addEventListener('click', function (e) { if (e.target === box) closeBox(); });
  }

  // ---- Callback modal ----
  var modal = $('#call-modal'), opener = $('#call-open');
  function openCall() { modal.hidden = false; document.body.classList.add('lb-open'); $('input[name="phone"]', modal).focus(); }
  function closeCall() { modal.hidden = true; document.body.classList.remove('lb-open'); if (opener) opener.focus(); }
  if (modal && opener) {
    opener.addEventListener('click', openCall);
    $('#call-close').addEventListener('click', closeCall);
    modal.addEventListener('click', function (e) { if (e.target === modal) closeCall(); });
  }

  // ---- «Узнать больше» о компании ----
  var about = $('#about-modal'), aboutOpener = $('#about-open');
  function openAbout() { about.hidden = false; document.body.classList.add('lb-open'); $('#about-close').focus(); }
  function closeAbout() { about.hidden = true; document.body.classList.remove('lb-open'); if (aboutOpener) aboutOpener.focus(); }
  if (about && aboutOpener) {
    aboutOpener.addEventListener('click', openAbout);
    $('#about-close').addEventListener('click', closeAbout);
    about.addEventListener('click', function (e) { if (e.target === about) closeAbout(); });
  }

  document.addEventListener('keydown', function (e) {
    if (about && !about.hidden && e.key === 'Escape') return closeAbout();
    if (modal && !modal.hidden && e.key === 'Escape') return closeCall();
    if (!box || box.hidden) return;
    if (e.key === 'Escape') closeBox();
    if (e.key === 'ArrowLeft' && cur) show(cur.name, cur.i - 1);
    if (e.key === 'ArrowRight' && cur) show(cur.name, cur.i + 1);
  });

  // ---- Sending requests (form + callback) ----
  // Без сервера заявка уходит письмом через почтовую программу посетителя.
  // Чтобы заявки приходили на почту напрямую, укажите адрес обработчика
  // (например, Formspree) в FORM_ENDPOINT — см. README.
  var FORM_ENDPOINT = '';
  var MAIL_TO = 'tmt@tmt-vost.ru';

  function send(form, subject, onDone) {
    var d = new FormData(form);
    var btn = form.querySelector('button[type="submit"]');
    if (FORM_ENDPOINT) {
      d.append('_subject', subject);
      btn.disabled = true;
      fetch(FORM_ENDPOINT, { method: 'POST', body: d, headers: { Accept: 'application/json' } })
        .then(function (r) { if (r.ok) { form.reset(); onDone(true); } else onDone(false); })
        .catch(function () { onDone(false); })
        .finally(function () { btn.disabled = false; });
      return;
    }
    var lines = [];
    d.forEach(function (v, k) {
      var names = { name: 'Имя', phone: 'Телефон', email: 'E-mail', comment: 'Комментарий' };
      if (names[k] && v) lines.push(names[k] + ': ' + v);
    });
    window.location.href = 'mailto:' + MAIL_TO + '?subject=' + encodeURIComponent(subject) +
      '&body=' + encodeURIComponent(lines.join('\n'));
    onDone(true);
  }

  var lead = $('#lead-form');
  if (lead) {
    lead.addEventListener('submit', function (e) {
      e.preventDefault();
      var btn = lead.querySelector('button[type="submit"]');
      send(lead, 'Заявка с сайта', function (ok) {
        btn.textContent = ok ? 'Заявка отправлена' : 'Ошибка — позвоните нам';
      });
    });
  }

  var callForm = $('#call-form');
  if (callForm) {
    callForm.addEventListener('submit', function (e) {
      e.preventDefault();
      send(callForm, 'Заказ звонка с сайта', function (ok) {
        var note = callForm.querySelector('.call-done') || document.createElement('p');
        note.className = 'call-done';
        note.textContent = ok ? 'Спасибо! Мы скоро перезвоним.' : 'Не удалось отправить — позвоните нам: 8 (4236) 668-085';
        callForm.appendChild(note);
      });
    });
  }
})();
