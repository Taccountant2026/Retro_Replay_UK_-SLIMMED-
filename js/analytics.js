(() => {
  const CONSENT_KEY = "rr_cookie_consent";
  const consent = localStorage.getItem(CONSENT_KEY);

  // OPTION 1: Use gtag.js with your Measurement ID
  const MEASUREMENT_ID = "G-XXXXXXXXXX"; // <-- replace with your real ID

  function loadGtag() {
    if (!MEASUREMENT_ID || MEASUREMENT_ID.includes("XXXX")) return;

    // Load gtag library
    const s = document.createElement("script");
    s.async = true;
    s.src = `https://www.googletagmanager.com/gtag/js?id=${encodeURIComponent(MEASUREMENT_ID)}`;
    document.head.appendChild(s);

    // Configure
    window.dataLayer = window.dataLayer || [];
    function gtag(){ window.dataLayer.push(arguments); }
    window.gtag = gtag;

    gtag("js", new Date());
    gtag("config", MEASUREMENT_ID, { anonymize_ip: true });

    // Optional: basic event example
    // gtag("event", "page_view");
  }

  // OPTION 2: If you have an old Google tag snippet, paste it here
  // function loadOldTagSnippet() {
  //   // Paste your old code content here (script creation/config), but keep it inside this function
  // }

  function maybeEnableAnalytics(currentConsent) {
    if (currentConsent === "accepted") {
      loadGtag();
      // or loadOldTagSnippet();
    }
  }

  // Initial
  maybeEnableAnalytics(consent);

  // Listen for changes
  window.addEventListener("rr:consent", (e) => {
    maybeEnableAnalytics(e.detail);
  });
})();
