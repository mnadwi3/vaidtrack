/* ============================================
   VaidTrack.com - Dynamic treatment cards from JSON
   ============================================ */
(function () {
  var TREATMENTS_URL = '/adminpanel/api/treatments.json';
  var TREATMENTS_FALLBACK_URL = '/data/treatments/treatments.json';
  var WA_NUMBER = '919818377518';

  var ICON_ARROW =
    '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" aria-hidden="true"><path stroke-linecap="round" stroke-linejoin="round" d="M7 17L17 7M10 7h7v7"/></svg>';

  function escapeHtml(str) {
    return String(str == null ? '' : str)
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#39;');
  }

  function waUrl(message) {
    return 'https://wa.me/' + WA_NUMBER + '?text=' + encodeURIComponent(message);
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

  function renderCard(treatment) {
    var name = treatment.name || '';
    var url = treatment.url || '#';
    var overview = treatment.overview || '';
    var image = treatment.image || '';
    var priceFrom = treatment.price_from || '';
    var bookMsg = 'Hi, I want a free consultation for ' + name + ' treatment';

    // No reserved icon slot when there's no image -- an empty fixed-height
    // placeholder was leaving a blank gap above the title on cards for
    // treatments without one.
    var iconHtml = image
      ? '<div class="tx-icon tx-icon--svg" style="--tx-color:var(--primary)" aria-hidden="true"><img src="' + escapeHtml(image) + '" alt="" width="128" height="128" decoding="async"></div>'
      : '';

    var priceHtml = priceFrom
      ? '<span class="tx-price">From ' + escapeHtml(priceFrom) + '</span>'
      : '';

    return (
      '<article class="tx-card reveal">' +
        '<a class="tx-page-link" href="' + escapeHtml(url) + '" aria-label="Open ' + escapeHtml(name) + ' details page">' + ICON_ARROW + '</a>' +
        iconHtml +
        '<div class="tx-body">' +
          '<h3><a href="' + escapeHtml(url) + '">' + escapeHtml(name) + '</a></h3>' +
          priceHtml +
          '<p>' + escapeHtml(overview) + '</p>' +
        '</div>' +
        '<a class="tx-book" href="' + waUrl(bookMsg) + '" target="_blank" rel="noopener noreferrer">' +
          '<span class="tx-book-short">Consult for Free</span><span class="tx-book-full">Consult for Free</span> ' + ICON_ARROW +
        '</a>' +
      '</article>'
    );
  }

  var HOME_LIMIT = 12;

  function mountHome(treatments) {
    var grid = document.querySelector('#tx-grid');
    if (!grid) return;

    var featured = treatments.filter(function (t) { return t.is_featured; });
    var list = (featured.length ? featured : treatments).slice(0, HOME_LIMIT);

    grid.innerHTML = list.length
      ? list.map(renderCard).join('')
      : '<p class="muted">No treatments to show right now.</p>';

    observeReveal(grid.querySelectorAll('.reveal'));

    var viewAllBtn = document.querySelector('[data-view-all-treatments]');
    if (viewAllBtn) viewAllBtn.hidden = false;
  }

  function groupBySpecialty(treatments) {
    var groups = [];
    var index = {};
    treatments.forEach(function (t) {
      var label = t.specialty || t.category || 'Other Treatments';
      if (!index[label]) {
        index[label] = { label: label, items: [] };
        groups.push(index[label]);
      }
      index[label].items.push(t);
    });
    groups.sort(function (a, b) { return a.label.localeCompare(b.label); });
    return groups;
  }

  function renderGroup(group) {
    return (
      '<div class="tx-group">' +
        '<h3 class="tx-group-title">' + escapeHtml(group.label) + '</h3>' +
        '<div class="tx-grid">' + group.items.map(renderCard).join('') + '</div>' +
      '</div>'
    );
  }

  function mountAll(treatments) {
    var container = document.querySelector('#all-treatments-groups');
    if (!container) return;

    if (!treatments.length) {
      container.innerHTML = '<p class="muted">No treatments to show right now.</p>';
      return;
    }

    var groups = groupBySpecialty(treatments);
    container.innerHTML = groups.map(renderGroup).join('');
    observeReveal(container.querySelectorAll('.reveal'));
  }

  function mountTreatments(treatments) {
    mountHome(treatments);
    mountAll(treatments);
  }

  function fetchTreatmentList(url) {
    return fetch(url, { credentials: 'omit', cache: 'no-store' })
      .then(function (res) {
        if (!res.ok) throw new Error('Failed to load ' + url + ' (' + res.status + ')');
        return res.json();
      })
      .then(function (data) {
        if (!Array.isArray(data)) throw new Error(url + ' must be an array');
        return data.filter(function (t) { return t && t.name; });
      });
  }

  function loadTreatments() {
    return fetchTreatmentList(TREATMENTS_URL).then(function (data) {
      if (!data.length) {
        return fetchTreatmentList(TREATMENTS_FALLBACK_URL);
      }
      return data;
    }).catch(function (err) {
      if (typeof console !== 'undefined' && console.warn) {
        console.warn('[treatments] admin API unavailable, falling back to static JSON', err);
      }
      return fetchTreatmentList(TREATMENTS_FALLBACK_URL);
    });
  }

  function init() {
    if (!document.querySelector('#tx-grid') && !document.querySelector('#all-treatments-groups')) return;

    loadTreatments()
      .then(mountTreatments)
      .catch(function (err) {
        if (typeof console !== 'undefined' && console.error) {
          console.error('[treatments]', err);
        }
      });
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();
