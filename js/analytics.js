/* ---------------------------------------------------------------------
   RetroReplay UK — /js/analytics.js (2026 hardened build)
   Loads Google Analytics 4 only after explicit cookie consent.
   GA4 ID: G-PF6Q3TSMVL
------------------------------------------------------------------------*/
(() => {
  const GA_ID = "G-PF6Q3TSMVL";
  const CONSENT_KEY = "rr_cookie_consent"; // accepted | rejected
  const LOADED_FLAG = "__rrGaLoaded";

  const safeGet = () => {
    try { return localStorage.getItem(CONSENT_KEY); } catch { return null; }
  };

  const loadGA = () => {
    if (window[LOADED_FLAG]) return;
    window[LOADED_FLAG] = true;

    // Inject GA4 script securely
    const tag = document.createElement("script");
    tag.type = "text/javascript";
    tag.async = true;
    tag.crossOrigin = "anonymous";
    tag.referrerPolicy = "no-referrer-when-downgrade";
    tag.src = `https://www.googletagmanager.com/gtag/js?id=${encodeURIComponent(GA_ID)}`;
    document.head.appendChild(tag);

    // Initialize gtag queue
    window.dataLayer = window.dataLayer || [];
    function gtag(){ window.dataLayer.push(arguments); }
    window.gtag = window.gtag || gtag;

    gtag("js", new Date());
    gtag("config", GA_ID, {
      anonymize_ip: true,
      send_page_view: true
    });
  };

  // Load GA if already accepted
  if (safeGet() === "accepted") loadGA();

  // Listen for consent events
  window.addEventListener("rr:consent", (e) => {
    if (e?.detail === "accepted") loadGA();
  });

  // Fallback check after DOM ready (handles late injection)
  document.addEventListener("DOMContentLoaded", () => {
    if (safeGet() === "accepted" && !window[LOADED_FLAG]) loadGA();
  });
})();
