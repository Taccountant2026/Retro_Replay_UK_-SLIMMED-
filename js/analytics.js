/* ---------------------------------------------------------------------
   RetroReplay UK /js/analytics.js  (final production build)
   Loads GA4 only after explicit cookie consent.
   GA4 ID: G-PF6Q3TSMVL
------------------------------------------------------------------------*/
(() => {
  const GA_ID = "G-PF6Q3TSMVL";
  const CONSENT_KEY = "rr_cookie_consent"; // "accepted" | "rejected"
  const LOADED_FLAG = "__rrGaLoaded";

  const loadGA = () => {
    if (window[LOADED_FLAG]) return;
    window[LOADED_FLAG] = true;

    // Inject GA4 script securely
    const tag = document.createElement("script");
    tag.src = `https://www.googletagmanager.com/gtag/js?id=${encodeURIComponent(GA_ID)}`;
    tag.async = true;
    tag.crossOrigin = "anonymous";
    tag.referrerPolicy = "no-referrer-when-downgrade";
    document.head.appendChild(tag);

    // Initialize GA4
    window.dataLayer = window.dataLayer || [];
    function gtag(){ dataLayer.push(arguments); }
    window.gtag = window.gtag || gtag;

    gtag("js", new Date());
    gtag("config", GA_ID, {
      anonymize_ip: true,
      send_page_view: true
    });
  };

  // Load only if consented previously
  if (localStorage.getItem(CONSENT_KEY) === "accepted") loadGA();

  // Listen for consent updates from main.js
  window.addEventListener("rr:consent", (e) => {
    if (e?.detail === "accepted") loadGA();
  });

  // Optional: visibility safeguard (in case script injected late)
  document.addEventListener("DOMContentLoaded", () => {
    if (localStorage.getItem(CONSENT_KEY) === "accepted" && !window[LOADED_FLAG]) loadGA();
  });
})();
