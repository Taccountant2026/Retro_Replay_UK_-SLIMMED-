/* /js/analytics.js
   Loads GA4 ONLY after cookie consent is accepted.
   GA4 ID: G-PF6Q3TSMVL
*/
(() => {
  const GA_ID = "G-PF6Q3TSMVL";
  const CONSENT_KEY = "rr_cookie_consent"; // "accepted" | "rejected"

  const alreadyLoaded = () => !!window.__rrGaLoaded;

  const loadGA = () => {
    if (alreadyLoaded()) return;

    // Mark loaded
    window.__rrGaLoaded = true;

    // Inject gtag script
    const s = document.createElement("script");
    s.async = true;
    s.src = `https://www.googletagmanager.com/gtag/js?id=${encodeURIComponent(GA_ID)}`;
    document.head.appendChild(s);

    // Init gtag
    window.dataLayer = window.dataLayer || [];
    function gtag(){ window.dataLayer.push(arguments); }
    window.gtag = window.gtag || gtag;

    window.gtag("js", new Date());
    window.gtag("config", GA_ID, {
      anonymize_ip: true
    });
  };

  const consent = localStorage.getItem(CONSENT_KEY);
  if (consent === "accepted") loadGA();

  // Listen for banner consent event from main.js
  window.addEventListener("rr:consent", (e) => {
    if (e?.detail === "accepted") loadGA();
    // If rejected, do nothing (we never load GA in that case)
  });
})();
