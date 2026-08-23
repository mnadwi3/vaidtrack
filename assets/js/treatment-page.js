/* VaidTrack.com treatment page interactions */
(function () {
  "use strict";

  var GAS_URL = "https://script.google.com/macros/s/AKfycbzTo3v4gxY1FmMrSFndbYSDaWRhjL58uUzkicjfDW7xS1xdoL_Rxsq69juo2PcT3g2q_Q/exec";
  var WA_NUMBER = "916395905054";

  /* Scroll progress */
  var bar = document.querySelector(".scroll-progress");
  function onScrollProgress() {
    if (!bar) return;
    var h = document.documentElement;
    var max = h.scrollHeight - h.clientHeight;
    var pct = max > 0 ? (h.scrollY / max) * 100 : 0;
    bar.style.width = pct + "%";
  }
  var progressTicking = false;
  window.addEventListener("scroll", function () {
    if (progressTicking) return;
    progressTicking = true;
    window.requestAnimationFrame(function () {
      progressTicking = false;
      onScrollProgress();
    });
  }, { passive: true });
  onScrollProgress();

  /* Reveal */
  var reveals = document.querySelectorAll(".reveal");
  if ("IntersectionObserver" in window) {
    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (e) {
        if (e.isIntersecting) {
          e.target.classList.add("visible");
          io.unobserve(e.target);
        }
      });
    }, { threshold: 0.12, rootMargin: "0px 0px -40px 0px" });
    reveals.forEach(function (n) { io.observe(n); });
  } else {
    reveals.forEach(function (n) { n.classList.add("visible"); });
  }

  /* Counters */
  function animateCounter(el) {
    var target = Number(el.getAttribute("data-count") || "0");
    var suffix = el.getAttribute("data-suffix") || "";
    var prefix = el.getAttribute("data-prefix") || "";
    var duration = 1400;
    var start = performance.now();
    function frame(now) {
      var t = Math.min(1, (now - start) / duration);
      var eased = 1 - Math.pow(1 - t, 3);
      var val = Math.round(target * eased);
      el.textContent = prefix + val.toLocaleString() + suffix;
      if (t < 1) requestAnimationFrame(frame);
    }
    requestAnimationFrame(frame);
  }
  var counters = document.querySelectorAll("[data-count]");
  if (counters.length && "IntersectionObserver" in window) {
    var cio = new IntersectionObserver(function (entries) {
      entries.forEach(function (e) {
        if (e.isIntersecting) {
          animateCounter(e.target);
          cio.unobserve(e.target);
        }
      });
    }, { threshold: 0.4 });
    counters.forEach(function (c) { cio.observe(c); });
  }

  /* FAQ */
  document.querySelectorAll(".faq-item").forEach(function (item) {
    var trigger = item.querySelector(".faq-trigger");
    if (!trigger) return;
    trigger.addEventListener("click", function () {
      var open = item.classList.contains("open");
      document.querySelectorAll(".faq-item.open").forEach(function (o) {
        o.classList.remove("open");
        var t = o.querySelector(".faq-trigger");
        if (t) t.setAttribute("aria-expanded", "false");
      });
      if (!open) {
        item.classList.add("open");
        trigger.setAttribute("aria-expanded", "true");
      }
    });
  });

  /* File input label - kept for optional future use */
  document.querySelectorAll(".file-box input[type=file]").forEach(function (input) {
    input.addEventListener("change", function () {
      var label = input.closest(".file-box").querySelector("[data-file-label]");
      if (!label) return;
      if (input.files && input.files.length) {
        label.textContent = input.files.length + " file(s) selected - we will confirm via WhatsApp";
      } else {
        label.textContent = "PDF, JPG or PNG up to 10MB";
      }
    });
  });

  /* Lead forms */
  function field(form, name) {
    var el = form.elements.namedItem(name);
    return el && el.value ? String(el.value).trim() : "";
  }

  function buildWa(payload) {
    var lines = [
      "New enquiry from treatment page:",
      "Name: " + payload.name,
      "Phone: " + payload.whatsapp,
      "Country: " + payload.country,
      "Email: " + (payload.email || "-"),
      "Cancer Type: " + (payload.cancerType || "-"),
      "Message: " + (payload.condition || "-"),
      payload.hasFiles ? "Reports: Patient selected files to share on WhatsApp" : "Reports: Not attached yet"
    ];
    return "https://wa.me/" + WA_NUMBER + "?text=" + encodeURIComponent(lines.join("\n"));
  }

  function submitSheet(payload) {
    var qs =
      "name=" + encodeURIComponent(payload.name) +
      "&whatsapp=" + encodeURIComponent(payload.whatsapp) +
      "&country=" + encodeURIComponent(payload.country) +
      "&condition=" + encodeURIComponent(
        [payload.cancerType, payload.email, payload.condition].filter(Boolean).join(" | ")
      );
    return new Promise(function (resolve, reject) {
      var xhr = new XMLHttpRequest();
      xhr.open("POST", GAS_URL + "?" + qs);
      xhr.setRequestHeader("Content-Type", "text/plain;charset=utf-8");
      xhr.onload = function () {
        if (xhr.status < 200 || xhr.status >= 300) return reject(new Error("HTTP"));
        try {
          var data = JSON.parse(xhr.responseText);
          if (!data || data.success !== true) return reject(new Error("fail"));
          resolve(data);
        } catch (e) {
          reject(e);
        }
      };
      xhr.onerror = function () { reject(new Error("net")); };
      xhr.send(JSON.stringify(payload));
    });
  }

  function fireLead(formId) {
    window.dataLayer = window.dataLayer || [];
    window.dataLayer.push({
      event: "generate_lead",
      form_id: formId,
      lead_source: "treatment_page"
    });
    if (typeof window.gtag !== "function") {
      window.gtag = function () { window.dataLayer.push(arguments); };
    }
    window.gtag("event", "generate_lead", {
      send_to: "G-5TBH8QQ2EQ",
      form_id: formId,
      lead_source: "treatment_page"
    });
  }

  function wireForm(formId) {
    var form = document.getElementById(formId);
    if (!form) return;
    form.addEventListener("submit", function (e) {
      e.preventDefault();
      var err = form.querySelector(".form-error");
      if (err) err.textContent = "";
      if (!form.checkValidity()) {
        form.reportValidity();
        return;
      }
      var fileInput = form.querySelector('input[type="file"]');
      var payload = {
        name: field(form, "name"),
        whatsapp: field(form, "phone") || field(form, "whatsapp"),
        country: field(form, "country"),
        email: field(form, "email"),
        cancerType: field(form, "cancerType"),
        condition: field(form, "message") || field(form, "condition"),
        hasFiles: !!(fileInput && fileInput.files && fileInput.files.length)
      };
      var btn = form.querySelector('[type="submit"]');
      if (btn) btn.disabled = true;
      var waUrl = buildWa(payload);

      submitSheet(payload)
        .then(function () {
          fireLead(formId);
          return new Promise(function (r) { setTimeout(r, 500); });
        })
        .then(function () {
          window.open(waUrl, "_blank");
          var panel = form.closest(".formcard") || form.closest(".lead-card");
          if (panel) {
            var success = panel.querySelector(".form-success");
            var fields = panel.querySelector(".form-fields");
            if (fields) fields.classList.add("is-hidden");
            if (success) success.classList.add("is-visible");
          }
        })
        .catch(function () {
          if (err) err.textContent = "Something went wrong. Please try again or WhatsApp us.";
        })
        .then(function () {
          if (btn) btn.disabled = false;
        });
    });
  }

  wireForm("lead-form-desktop");
  wireForm("lead-form-mobile");
  wireForm("lead-form-exit");

  /* Smooth scroll to form */
  document.querySelectorAll('[data-scroll-to="lead"]').forEach(function (el) {
    el.addEventListener("click", function (e) {
      var target =
        document.getElementById("lead") ||
        document.getElementById("lead-desktop") ||
        document.getElementById("lead-mobile");
      if (!target) return;
      e.preventDefault();
      target.scrollIntoView({ behavior: "smooth", block: "center" });
      var input = target.querySelector("input, select, textarea");
      if (input) setTimeout(function () { input.focus(); }, 400);
    });
  });

  /* Help widget -> form */
  var help = document.getElementById("help-fab");
  if (help) {
    help.addEventListener("click", function () {
      var btn = document.querySelector('[data-scroll-to="lead"]');
      if (btn) btn.click();
    });
  }

  /* Sticky bar absorbs footer copyright at page end */
  var stickyBar = document.querySelector(".sticky-bar");
  var siteFooter = document.querySelector(".tp-footer");
  if (stickyBar && siteFooter && "IntersectionObserver" in window) {
    var footerIo = new IntersectionObserver(
      function (entries) {
        entries.forEach(function (entry) {
          var atEnd = entry.isIntersecting;
          stickyBar.classList.toggle("is-at-end", atEnd);
          siteFooter.classList.toggle("is-covered", atEnd);
          document.body.classList.toggle("sticky-at-end", atEnd);
        });
      },
      { root: null, threshold: 0, rootMargin: "0px 0px -40px 0px" }
    );
    footerIo.observe(siteFooter);
  }

  /* Exit intent removed */
})();
