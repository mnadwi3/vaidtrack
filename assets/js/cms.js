/* ============================================
   VaidTrack.com - CMS sync (hospitals, testimonials,
   FAQs, hero) from the admin panel API.
   Treatment cards are handled by treatments.js.

   Same pattern as doctors.js: fetch JSON, render into
   existing mount points, keep hardcoded markup as a
   fallback if the API is unreachable.
   ============================================ */
(function () {
  // Same server as the site; adjust if the admin panel is mounted elsewhere.
  var API_BASE = '/adminpanel';
  var WA_NUMBER = '919818377518';

  var ICON_HOSPITAL =
    '<svg viewBox="0 0 24 24" fill="currentColor" aria-hidden="true"><rect x="2" y="2" width="20" height="20" rx="5"/><path fill="#fff" d="M13 6h-2v5H6v2h5v5h2v-5h5v-2h-5z"/></svg>';
  var ICON_PIN =
    '<svg fill="none" stroke="currentColor" stroke-width="1.8" viewBox="0 0 24 24" aria-hidden="true"><path stroke-linecap="round" stroke-linejoin="round" d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0118 0z"/><circle cx="12" cy="10" r="3"/></svg>';
  var ICON_ARROW =
    '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" aria-hidden="true"><path stroke-linecap="round" stroke-linejoin="round" d="M7 17L17 7M10 7h7v7"/></svg>';
  var ICON_CHAT =
    '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" aria-hidden="true"><path stroke-linecap="round" stroke-linejoin="round" d="M21 11.5a8.38 8.38 0 01-.9 3.8 8.5 8.5 0 01-7.6 4.7 8.38 8.38 0 01-3.8-.9L3 21l1.9-5.7a8.38 8.38 0 01-.9-3.8 8.5 8.5 0 014.7-7.6 8.38 8.38 0 013.8-.9h.5a8.48 8.48 0 018 8v.5z"/></svg>';

  function waUrl(message) {
    return 'https://wa.me/' + WA_NUMBER + '?text=' + encodeURIComponent(message);
  }

  function escapeHtml(str) {
    return String(str == null ? '' : str)
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#39;');
  }

  function fetchJson(path) {
    return fetch(API_BASE + path, { credentials: 'omit' }).then(function (res) {
      if (!res.ok) throw new Error(path + ' failed (' + res.status + ')');
      return res.json();
    });
  }

  function observeReveal(nodes) {
    if (!nodes || !nodes.length) return;
    if (!('IntersectionObserver' in window)) {
      nodes.forEach(function (n) { n.classList.add('visible'); });
      return;
    }
    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (entry) {
        if (entry.isIntersecting) {
          entry.target.classList.add('visible');
          io.unobserve(entry.target);
        }
      });
    }, { threshold: 0.12, rootMargin: '0px 0px -40px 0px' });
    nodes.forEach(function (n) { io.observe(n); });
  }

  /* ---------- Hero ---------- */
  function renderHero(hero) {
    if (!hero) return;
    var sub = document.getElementById('hero-subheadline');
    if (sub && hero.subheadline) sub.textContent = hero.subheadline;

    var list = document.getElementById('hero-trust-list');
    if (list && Array.isArray(hero.trust_points) && hero.trust_points.length) {
      var items = list.querySelectorAll('li span:last-child');
      hero.trust_points.forEach(function (text, i) {
        if (items[i]) items[i].textContent = text;
      });
    }
  }

  /* ---------- Hospitals ----------
     Photo-top bordered card with a city badge, matching the hospital-card
     style used on the landing microsites (e.g. /knee-replacement-in-india).
     Renders into a static grid (#hospitals-grid) — no carousel/auto-slide. */
  function renderHospitalCard(h) {
    var name = h.name || '';
    var img = h.cover_image || h.logo || '';
    var imgHtml = img
      ? '<img src="' + escapeHtml(img) + '" alt="' + escapeHtml(name) + '" class="hcard-img" width="500" height="375" loading="lazy" decoding="async">'
      : '';

    var addressLines = [h.address_line1, h.address_line2].filter(Boolean).join(', ');
    var addressText = addressLines || [h.city, h.pincode, h.country].filter(Boolean).join(', ');
    var addressHtml = addressText
      ? '<p class="hcard-address">' + ICON_PIN + '<span>' + escapeHtml(addressText) + '</span></p>'
      : '';

    var href = h.url || '';
    var linkHtml = href
      ? '<a class="hcard-link" href="' + escapeHtml(href) + '" aria-label="Open ' + escapeHtml(name) + ' details page">' + ICON_ARROW + '</a>'
      : '';

    var waMsg = "I'd like a free treatment plan from " + name;

    return (
      '<article class="hcard reveal">' +
        '<div class="hcard-photo">' + imgHtml + linkHtml + '</div>' +
        '<div class="hcard-info">' +
          (h.city ? '<span class="hcard-badge">' + escapeHtml(h.city) + '</span>' : '') +
          '<h3 class="hcard-name">' + ICON_HOSPITAL + '<span>' + escapeHtml(name) + '</span></h3>' +
          addressHtml +
          '<div class="hcard-actions">' +
            '<a class="hcard-cta" href="' + waUrl(waMsg) + '" target="_blank" rel="noopener noreferrer">' +
              ICON_CHAT + 'Get Free Treatment Plan</a>' +
          '</div>' +
        '</div>' +
      '</article>'
    );
  }

  function renderHospitals(list) {
    var grid = document.getElementById('hospitals-grid');
    if (!grid || !Array.isArray(list) || !list.length) return;
    grid.innerHTML = list.map(renderHospitalCard).join('');
    observeReveal(grid.querySelectorAll('.reveal'));
  }

  /* ---------- Testimonials ---------- */
  function renderTestimonialCard(t, i) {
    var ytId = t.youtube_id || '';
    var thumb = t.thumbnail || (ytId ? 'https://i.ytimg.com/vi_webp/' + ytId + '/hqdefault.webp' : '');

    return (
      '<div class="reveal aspect-video rounded-2xl overflow-hidden bg-secondary border border-slate-200 shadow-soft">' +
        '<button type="button" class="yt-facade" data-youtube-id="' + escapeHtml(ytId) + '" aria-label="Play ' + escapeHtml(t.patient_name || 'patient story video ' + (i + 1)) + '">' +
          (thumb ? '<img src="' + escapeHtml(thumb) + '" alt="" width="480" height="360" loading="lazy" decoding="async">' : '') +
          '<span class="yt-facade-play" aria-hidden="true"></span>' +
        '</button>' +
      '</div>'
    );
  }

  function renderTestimonials(list) {
    var grid = document.getElementById('testimonials-grid');
    if (!grid || !Array.isArray(list) || !list.length) return;
    grid.innerHTML = list.map(renderTestimonialCard).join('');
    observeReveal(grid.querySelectorAll('.reveal'));
  }

  /* ---------- FAQs ---------- */
  function renderFaqItem(f) {
    return (
      '<div class="faq-item group border border-slate-200 rounded-2xl bg-white overflow-hidden transition-all duration-300 hover:border-primary/30 hover:shadow-xl hover:shadow-primary/5">' +
        '<button type="button" class="faq-trigger w-full flex items-center justify-between gap-4 text-left px-5 sm:px-7 py-5 sm:py-6 font-semibold text-secondary transition-colors duration-200 group-hover:text-primary" aria-expanded="false">' +
          '<span>' + escapeHtml(f.question) + '</span>' +
          '<span class="faq-chevron-wrap shrink-0 flex items-center justify-center w-9 h-9 rounded-full bg-slate-50 text-primary transition-colors duration-300 group-hover:bg-primary/10">' +
            '<svg class="faq-chevron w-4 h-4 transition-transform duration-300 ease-out" fill="none" stroke="currentColor" stroke-width="2.25" viewBox="0 0 24 24">' +
              '<path stroke-linecap="round" stroke-linejoin="round" d="M19 9l-7 7-7-7" /></svg>' +
          '</span>' +
        '</button>' +
        '<div class="faq-answer"><div class="faq-answer-inner px-5 sm:px-7 pb-5 sm:pb-6 text-sm sm:text-base text-slate-600 leading-relaxed border-t border-slate-100 pt-4">' +
          '<p>' + escapeHtml(f.answer || '') + '</p>' +
        '</div></div>' +
      '</div>'
    );
  }

  function bindFaqAccordion(container) {
    var items = container.querySelectorAll('.faq-item');
    items.forEach(function (item) {
      var trigger = item.querySelector('.faq-trigger');
      if (!trigger) return;
      trigger.addEventListener('click', function () {
        var isOpen = item.classList.contains('open');
        items.forEach(function (other) {
          other.classList.remove('open');
          var t = other.querySelector('.faq-trigger');
          if (t) t.setAttribute('aria-expanded', 'false');
        });
        if (!isOpen) {
          item.classList.add('open');
          trigger.setAttribute('aria-expanded', 'true');
        }
      });
    });
  }

  function renderFaqs(list) {
    var container = document.getElementById('faq-list');
    if (!container || !Array.isArray(list) || !list.length) return;
    container.innerHTML = list.map(renderFaqItem).join('');
    bindFaqAccordion(container);
  }

  function init() {
    fetchJson('/api/hero.json').then(renderHero).catch(function () {});
    fetchJson('/api/hospitals.json').then(function (data) {
      renderHospitals(Array.isArray(data) ? data : (data.items || []));
    }).catch(function () {});
    fetchJson('/api/testimonials.json').then(renderTestimonials).catch(function () {});
    fetchJson('/api/faqs.json').then(renderFaqs).catch(function () {});
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();
