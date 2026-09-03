/* ============================================
   VaidTrack.com - Dynamic specialities grid from JSON
   ============================================ */
(function () {
  var SPECIALTIES_URL = '/adminpanel/api/specialties.json';

  var ICON_GENERIC =
    '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" aria-hidden="true"><path stroke-linecap="round" stroke-linejoin="round" d="M12 3a3 3 0 013 3v2a5 5 0 01-5 5h-.5A2.5 2.5 0 007 15.5V17a4 4 0 004 4h2a4 4 0 004-4"/><circle cx="18.5" cy="17.5" r="2.5"/><path stroke-linecap="round" d="M9 3v3M15 3v3"/></svg>';

  // Home-page-only icon overrides, keyed by specialty slug. Only specialties
  // with a real matching illustration get one here -- the rest keep whatever
  // the API supplies (or ICON_GENERIC).
  var ICON_OVERRIDES = {
    'bone-marrow-transplant': 'assets/images/treatment-icons/bone-marrow-transplant.png',
    'cardiology': 'assets/images/treatment-icons/cardiology.png',
    'general-surgery': 'assets/images/treatment-icons/general-surgery.png',
    'gynecology': 'assets/images/treatment-icons/gynecology.png',
    'ivf': 'assets/images/treatment-icons/ivf.png',
    'kidney-transplant': 'assets/images/treatment-icons/kidney-transplant.png',
    'liver-transplant': 'assets/images/treatment-icons/liver-transplant.png',
    'neurology': 'assets/images/treatment-icons/neurology.png',
    'neurosurgery': 'assets/images/treatment-icons/neurosurgery.png',
    'oncology': 'assets/images/treatment-icons/oncology.png',
    'orthopedics': 'assets/images/treatment-icons/orthopedics.png',
    'spine-surgery': 'assets/images/treatment-icons/spine-surgery.png',
    'urology': 'assets/images/treatment-icons/urology.png',
    'weight-loss': 'assets/images/treatment-icons/weight-loss.png'
  };

  function escapeHtml(str) {
    return String(str == null ? '' : str)
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#39;');
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

  var ICON_CHEVRON =
    '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path stroke-linecap="round" stroke-linejoin="round" d="M6 9l6 6 6-6"/></svg>';
  var ICON_ARROW_RIGHT =
    '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path stroke-linecap="round" stroke-linejoin="round" d="M9 18l6-6-6-6"/></svg>';

  function renderCard(specialty, index) {
    var name = specialty.name || '';
    var description = specialty.description || '';
    var url = specialty.url || '#';
    var panelId = 'spec-panel-' + (specialty.slug || index);
    var overrideSrc = ICON_OVERRIDES[specialty.slug];
    var iconHtml = overrideSrc
      ? '<img src="' + escapeHtml(overrideSrc) + '" alt="" width="40" height="40" decoding="async">'
      : specialty.image
      ? '<img src="' + escapeHtml(specialty.image) + '" alt="" width="40" height="40" decoding="async">'
      : ICON_GENERIC;

    return (
      '<div class="spec-card reveal">' +
        '<button type="button" class="spec-toggle" aria-expanded="false" aria-controls="' + escapeHtml(panelId) + '">' +
          '<span class="spec-icon" aria-hidden="true">' + iconHtml + '</span>' +
          '<span class="spec-name">' + escapeHtml(name) + '</span>' +
          '<span class="spec-chevron" aria-hidden="true">' + ICON_CHEVRON + '</span>' +
        '</button>' +
        '<div class="spec-panel" id="' + escapeHtml(panelId) + '">' +
          '<div class="spec-panel-inner">' +
            (description ? '<p class="spec-desc">' + escapeHtml(description) + '</p>' : '') +
            '<a class="spec-readmore" href="' + escapeHtml(url) + '">Read More' + ICON_ARROW_RIGHT + '</a>' +
          '</div>' +
        '</div>' +
      '</div>'
    );
  }

  function bindAccordion(grid) {
    if (grid.dataset.accordionBound) return;
    grid.dataset.accordionBound = 'true';
    grid.addEventListener('click', function (e) {
      var toggle = e.target.closest('.spec-toggle');
      if (!toggle) return;
      var card = toggle.closest('.spec-card');
      var isOpen = card.classList.toggle('is-open');
      toggle.setAttribute('aria-expanded', isOpen ? 'true' : 'false');
    });
  }

  function mountSpecialties(specialties) {
    var section = document.querySelector('#specialties');
    var grid = document.querySelector('#specialties-grid');
    if (!grid) return;

    if (!specialties.length) {
      if (section) section.hidden = true;
      return;
    }

    if (section) section.hidden = false;
    grid.innerHTML = specialties.map(renderCard).join('');
    bindAccordion(grid);
    observeReveal(grid.querySelectorAll('.reveal'));
  }

  function fetchSpecialtyList() {
    return fetch(SPECIALTIES_URL, { credentials: 'omit', cache: 'no-store' })
      .then(function (res) {
        if (!res.ok) throw new Error('Failed to load ' + SPECIALTIES_URL + ' (' + res.status + ')');
        return res.json();
      })
      .then(function (data) {
        if (!Array.isArray(data)) throw new Error(SPECIALTIES_URL + ' must be an array');
        return data.filter(function (s) { return s && s.name; });
      });
  }

  function init() {
    if (!document.querySelector('#specialties-grid')) return;

    fetchSpecialtyList()
      .then(mountSpecialties)
      .catch(function (err) {
        var section = document.querySelector('#specialties');
        if (section) section.hidden = true;
        if (typeof console !== 'undefined' && console.error) {
          console.error('[specialties]', err);
        }
      });
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();
