// js/analytics.js
(() => {
  const CONSENT_KEY = "rr_cookie_consent";
  const consent = localStorage.getItem(CONSENT_KEY);

  const MEASUREMENT_ID = "G-PF6Q3TSMVL";
  let loaded = false;

  function loadGtag() {
    if (loaded) return;
    loaded = true;

    // Load gtag library
    const s = document.createElement("script");
    s.async = true;
    s.src = `https://www.googletagmanager.com/gtag/js?id=${encodeURIComponent(MEASUREMENT_ID)}`;
    document.head.appendChild(s);

    // Your exact snippet (with a small privacy improvement)
    window.dataLayer = window.dataLayer || [];
    function gtag(){ window.dataLayer.push(arguments); }
    window.gtag = gtag;

    gtag("js", new Date());
    gtag("config", MEASUREMENT_ID, { anonymize_ip: true });
  }

  function maybeEnableAnalytics(currentConsent) {
    if (currentConsent === "accepted") loadGtag();
  }

  // Initial
  maybeEnableAnalytics(consent);

  // Listen for consent changes from cookie banner (js/main.js)
  window.addEventListener("rr:consent", (e) => {
    maybeEnableAnalytics(e.detail);
  });
})();
