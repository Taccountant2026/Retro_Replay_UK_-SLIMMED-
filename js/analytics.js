(() => {
  const CONSENT_KEY = "rr_cookie_consent";
  const consent = localStorage.getItem(CONSENT_KEY);

  const MEASUREMENT_ID = "G-PF6Q3TSMVL";
  let loaded = false;

  // Public helper: only tracks if GA is loaded (after consent)
  window.rrTrack = function (eventName, params = {}) {
    if (typeof window.gtag === "function") {
      window.gtag("event", eventName, params);
    }
  };

  function loadGtag() {
    if (loaded) return;
    loaded = true;

    const s = document.createElement("script");
    s.async = true;
    s.src = `https://www.googletagmanager.com/gtag/js?id=${encodeURIComponent(MEASUREMENT_ID)}`;
    document.head.appendChild(s);

    window.dataLayer = window.dataLayer || [];
    function gtag(){ window.dataLayer.push(arguments); }
    window.gtag = gtag;

    gtag("js", new Date());
    gtag("config", MEASUREMENT_ID, { anonymize_ip: true });
  }

  function maybeEnableAnalytics(currentConsent) {
    if (currentConsent === "accepted") loadGtag();
  }

  maybeEnableAnalytics(consent);

  window.addEventListener("rr:consent", (e) => {
    maybeEnableAnalytics(e.detail);
  });
})();
