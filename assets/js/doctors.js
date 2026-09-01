/* ============================================
   VaidTrack.com - Dynamic doctor cards from JSON
   ============================================ */
(function () {
  // Same server as the site; adjust if the admin panel is mounted elsewhere.
  var DOCTORS_URL = '/adminpanel/api/doctors.json';
  var DOCTORS_FALLBACK_URL = '/data/doctors/doctors.json';
  var IMAGE_BASE = 'images/doctors-images/';
  var WA_NUMBER = '919871262293';

  var ICON_CLOCK =
    '<svg fill="none" stroke="currentColor" stroke-width="1.8" viewBox="0 0 24 24" aria-hidden="true"><path stroke-linecap="round" stroke-linejoin="round" d="M12 6v6l4 2"/><circle cx="12" cy="12" r="9"/></svg>';
  var ICON_EDU =
    '<svg fill="none" stroke="currentColor" stroke-width="1.8" viewBox="0 0 24 24" aria-hidden="true"><path stroke-linecap="round" stroke-linejoin="round" d="M12 14l9-5-9-5-9 5 9 5z"/><path stroke-linecap="round" stroke-linejoin="round" d="M12 14l6.16-3.422A12.083 12.083 0 0112 21.5a12.083 12.083 0 01-6.16-10.922L12 14z"/></svg>';
  var ICON_STAR =
    '<svg fill="none" stroke="currentColor" stroke-width="1.8" viewBox="0 0 24 24" aria-hidden="true"><path stroke-linecap="round" stroke-linejoin="round" d="M11.48 3.5l2.1 4.26 4.7.68-3.4 3.31.8 4.67-4.2-2.21-4.2 2.21.8-4.67-3.4-3.31 4.7-.68 2.1-4.26z"/></svg>';
  var ICON_CAL =
    '<svg fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24" aria-hidden="true"><path stroke-linecap="round" stroke-linejoin="round" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"/></svg>';
  var ICON_WA =
    '<svg fill="currentColor" viewBox="0 0 24 24" aria-hidden="true"><path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.435 9.884-9.85 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 6.045L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/></svg>';

  function escapeHtml(str) {
    return String(str == null ? '' : str)
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#39;');
  }

  function initialsFromName(name) {
    var parts = String(name || '')
      .replace(/^Dr\.?\s*/i, '')
      .trim()
      .split(/\s+/)
      .filter(Boolean);
    if (!parts.length) return 'DR';
    if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
    return (parts[0].charAt(0) + parts[parts.length - 1].charAt(0)).toUpperCase();
  }

  function doctorImagePath(doctor) {
    if (doctor.image) return String(doctor.image).replace(/^\//, '');
    if (doctor.slug) return IMAGE_BASE + doctor.slug + '.webp';
    return '';
  }

  function experienceLabel(experience) {
    var value = String(experience || '').trim();
    if (!value) return '';
    if (/experience/i.test(value)) return value;
    return value + ' Experience';
  }

  function expertiseLabel(expertise) {
    if (Array.isArray(expertise)) {
      return expertise.filter(Boolean).join(' \u2022 ');
    }
    return String(expertise || '').trim();
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

  function renderHomeCard(doctor) {
    var name = doctor.name || '';
    var specialty = doctor.specialty || '';
    var experience = experienceLabel(doctor.experience);
    var qualification = doctor.qualification || '';
    var expertise = expertiseLabel(doctor.expertise);
    var image = doctorImagePath(doctor);
    var initials = initialsFromName(name);
    var bookMsg = 'Hi, I want to book an appointment with ' + name;
    var chatMsg = 'Hi, I want to chat about ' + name;

    var photoHtml = image
      ? '<img src="' + escapeHtml(image) + '" alt="' + escapeHtml(name) + '" width="120" height="120" loading="lazy" decoding="async">'
      : '<span>' + escapeHtml(initials) + '</span>';

    return (
      '<article class="doc-card reveal" data-doctor-slug="' + escapeHtml(doctor.slug || '') + '">' +
        '<div class="doc-photo">' + photoHtml + '</div>' +
        '<h3>' + escapeHtml(name) + '</h3>' +
        '<p class="doc-role">' + escapeHtml(specialty) + '</p>' +
        '<ul class="doc-info">' +
          '<li>' + ICON_CLOCK + '<span>' + escapeHtml(experience) + '</span></li>' +
          '<li>' + ICON_EDU + '<span>' + escapeHtml(qualification) + '</span></li>' +
          '<li>' + ICON_STAR + '<span><strong>Expertise:</strong> ' + escapeHtml(expertise) + '</span></li>' +
        '</ul>' +
        '<div class="doc-actions">' +
          '<a class="doc-book" href="' + waUrl(bookMsg) + '" target="_blank" rel="noopener noreferrer">' +
            ICON_CAL + 'Book Appointment</a>' +
          '<a class="doc-wa" href="' + waUrl(chatMsg) + '" target="_blank" rel="noopener noreferrer">' +
            ICON_WA + 'WhatsApp</a>' +
        '</div>' +
      '</article>'
    );
  }

  function renderTreatmentCard(doctor, treatmentName) {
    var name = doctor.name || '';
    var specialty = doctor.specialty || '';
    var experience = experienceLabel(doctor.experience);
    var qualification = doctor.qualification || '';
    var initials = initialsFromName(name);
    var treatment = treatmentName ? (' for ' + treatmentName + ' treatment') : '';
    var bookMsg = 'Hi, I want to book an appointment with ' + name + treatment;

    return (
      '<article class="doccard" data-doctor-slug="' + escapeHtml(doctor.slug || '') + '">' +
        '<div class="avatar" aria-hidden="true">' + escapeHtml(initials) + '</div>' +
        '<div class="info">' +
          '<h3>' + escapeHtml(name) + '</h3>' +
          '<div class="role">' + escapeHtml(specialty) + '</div>' +
          '<div class="meta">' + escapeHtml(experience) + '<br>' + escapeHtml(qualification) + '</div>' +
          '<a class="link" href="' + waUrl(bookMsg) + '" target="_blank" rel="noopener">Book appointment</a>' +
        '</div>' +
      '</article>'
    );
  }

  var HOME_FEATURED_LIMIT = 8;

  function mountDoctors(doctors) {
    var homeGrid = document.querySelector('#doctors .doc-grid');
    if (homeGrid) {
      var featured = doctors.filter(function (d) { return d.is_featured; });
      var rest = doctors.filter(function (d) { return !d.is_featured; });
      var homeDoctors = featured.concat(rest).slice(0, HOME_FEATURED_LIMIT);
      var homeHtml = homeDoctors.map(renderHomeCard).join('');
      homeGrid.innerHTML = homeHtml;
      observeReveal(homeGrid.querySelectorAll('.reveal'));

      var viewAllBtn = document.querySelector('[data-view-all-doctors]');
      if (viewAllBtn) viewAllBtn.hidden = false;
    }

    var treatmentGrid = document.querySelector('#doctors .docgrid');
    if (treatmentGrid) {
      var treatmentName =
        treatmentGrid.getAttribute('data-treatment') ||
        (document.querySelector('meta[name="treatment-name"]') &&
          document.querySelector('meta[name="treatment-name"]').getAttribute('content')) ||
        '';
      treatmentGrid.innerHTML = doctors.length
        ? doctors.map(function (doctor) { return renderTreatmentCard(doctor, treatmentName); }).join('')
        : '<p class="muted">Doctor details for this treatment will be added soon. Contact us on WhatsApp for a recommendation.</p>';
    }

    var allGrid = document.querySelector('#all-doctors-grid');
    if (allGrid) {
      allGrid.innerHTML = doctors.length
        ? doctors.map(renderHomeCard).join('')
        : '<p class="muted">No doctors to show right now.</p>';
      observeReveal(allGrid.querySelectorAll('.reveal'));
    }
  }

  function fetchDoctorList(url) {
    return fetch(url, { credentials: 'omit', cache: 'no-store' })
      .then(function (res) {
        if (!res.ok) throw new Error('Failed to load ' + url + ' (' + res.status + ')');
        return res.json();
      })
      .then(function (data) {
        if (!Array.isArray(data)) throw new Error(url + ' must be an array');
        return data.filter(function (d) { return d && d.name; });
      });
  }

  // On a treatment page, scope the admin API request to doctors linked to
  // that treatment's specialty so unrelated specialists don't show up on
  // every treatment. The static fallback JSON has no specialty relationships,
  // so it is only usable for the unscoped home/all-doctors grids.
  function loadDoctors(specialtyId) {
    var url = DOCTORS_URL;
    if (specialtyId) {
      url += (url.indexOf('?') === -1 ? '?' : '&') + 'specialty_id=' + encodeURIComponent(specialtyId);
    }
    return fetchDoctorList(url).catch(function (err) {
      if (typeof console !== 'undefined' && console.warn) {
        console.warn('[doctors] admin API unavailable', err);
      }
      if (specialtyId) return [];
      return fetchDoctorList(DOCTORS_FALLBACK_URL);
    });
  }

  function init() {
    var homeGrid = document.querySelector('#doctors .doc-grid');
    var treatmentGrid = document.querySelector('#doctors .docgrid');
    var allGrid = document.querySelector('#all-doctors-grid');
    if (!homeGrid && !treatmentGrid && !allGrid) return;

    var specialtyId = treatmentGrid ? treatmentGrid.getAttribute('data-specialty-id') : '';

    loadDoctors(specialtyId)
      .then(mountDoctors)
      .catch(function (err) {
        if (typeof console !== 'undefined' && console.error) {
          console.error('[doctors]', err);
        }
      });
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();
