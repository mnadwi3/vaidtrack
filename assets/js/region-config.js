/**
 * Single source of truth for the country list shown in treatment-card copy
 * on the hip/knee/spine landing pages (the "VaidTrack helps patients from
 * ... with doctor consultation, hospital coordination, ..." sentence).
 *
 * To point a campaign at a different region, add "?region=<key>" to the
 * page URL, e.g. ?region=gulf. No param (or an unrecognized value) falls
 * back to DEFAULT_REGION, which reproduces the current live copy exactly.
 *
 * To change or add a region, edit REGIONS below - nothing else needs to
 * change on any page.
 */
(function () {
  var DEFAULT_REGION = 'africa';

  var REGIONS = {
    // Current live copy - keep this in sync with DEFAULT_REGION above.
    'africa': 'Kenya, Tanzania, Ghana, and Nigeria',
    'gulf': 'the UAE, Saudi Arabia, Qatar, and Oman'
  };

  function getRequestedRegion() {
    try {
      var params = new URLSearchParams(window.location.search);
      var region = params.get('region');
      return region ? region.toLowerCase() : null;
    } catch (e) {
      return null;
    }
  }

  function applyRegionCopy() {
    var requested = getRequestedRegion();
    var countryList = (requested && REGIONS[requested]) || REGIONS[DEFAULT_REGION];

    var targets = document.querySelectorAll('.vt-country-list');
    for (var i = 0; i < targets.length; i++) {
      targets[i].textContent = countryList;
    }
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', applyRegionCopy);
  } else {
    applyRegionCopy();
  }
})();
