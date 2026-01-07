(() => {
  const $ = (sel, root = document) => root.querySelector(sel);

  // Footer year
  const yearEl = document.querySelectorAll("[data-year]");
  yearEl.forEach(el => (el.textContent = String(new Date().getFullYear())));

  // Cookie consent UI
  const banner = $(".cookie");
  const acceptBtn = $("[data-cookie-accept]");
  const rejectBtn = $("[data-cookie-reject]");

  const CONSENT_KEY = "rr_cookie_consent"; // "accepted" | "rejected"
  const consent = localStorage.getItem(CONSENT_KEY);

  const showBanner = () => {
    if (!banner) return;
    banner.hidden = false;
  };

  const hideBanner = () => {
    if (!banner) return;
    banner.hidden = true;
  };

  const setConsent = (value) => {
    localStorage.setItem(CONSENT_KEY, value);
    hideBanner();
    // Notify analytics loader
    window.dispatchEvent(new CustomEvent("rr:consent", { detail: value }));
  };

  if (banner) {
    if (!consent) showBanner();
    else hideBanner();
  }

  acceptBtn?.addEventListener("click", () => setConsent("accepted"));
  rejectBtn?.addEventListener("click", () => setConsent("rejected"));

  // Lightweight lead/contact form handling (prevents dead submit if action="#")
  const wireForm = (form) => {
    form.addEventListener("submit", (e) => {
      const action = form.getAttribute("action") || "";
      if (action === "#" || action.trim() === "") {
        e.preventDefault();
        const email = form.querySelector('input[type="email"]')?.value?.trim();
        if (email) alert("Saved locally for now. Connect this form to Mailchimp/Formspree when ready.");
        else alert("Form ready. Connect it to your email provider endpoint.");
        form.reset();
      }
    });
  };

  document.querySelectorAll("[data-lead-form]").forEach(wireForm);
  document.querySelectorAll("[data-contact-form]").forEach(wireForm);
})();
