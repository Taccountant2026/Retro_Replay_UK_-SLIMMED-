(() => {
  const $ = (sel, root = document) => root.querySelector(sel);

  /* =========================
     Footer year
  ========================= */
  document.querySelectorAll("[data-year]").forEach(el => {
    el.textContent = String(new Date().getFullYear());
  });

  /* =========================
     Cookie consent
  ========================= */
  const banner = $(".cookie");
  const acceptBtn = $("[data-cookie-accept]");
  const rejectBtn = $("[data-cookie-reject]");

  const CONSENT_KEY = "rr_cookie_consent";
  const consent = localStorage.getItem(CONSENT_KEY);

  const showBanner = () => banner && (banner.hidden = false);
  const hideBanner = () => banner && (banner.hidden = true);

  const setConsent = (value) => {
    localStorage.setItem(CONSENT_KEY, value);
    hideBanner();
    window.dispatchEvent(new CustomEvent("rr:consent", { detail: value }));
  };

  if (banner) {
    consent ? hideBanner() : showBanner();
  }

  acceptBtn?.addEventListener("click", () => setConsent("accepted"));
  rejectBtn?.addEventListener("click", () => setConsent("rejected"));

  /* =========================
     Formspree handler (AJAX)
  ========================= */
  function wireFormspree(form) {
    form.addEventListener("submit", async (e) => {
      e.preventDefault();

      const status =
        form.querySelector("[aria-live]") ||
        (() => {
          const p = document.createElement("p");
          p.className = "fineprint";
          p.setAttribute("aria-live", "polite");
          form.appendChild(p);
          return p;
        })();

      status.textContent = "Sending…";

      try {
        const res = await fetch(form.action, {
          method: "POST",
          headers: { Accept: "application/json" },
          body: new FormData(form),
        });

        if (res.ok) {
          status.textContent = "Thanks — your message has been sent.";
          form.reset();
        } else {
          const data = await res.json();
          status.textContent =
            data?.errors?.[0]?.message ||
            "Something went wrong. Please try again.";
        }
      } catch (err) {
        status.textContent =
          "Network error. Please try again or email us directly.";
      }
    });
  }

  /* =========================
     Activate forms
  ========================= */
  document
    .querySelectorAll("form[action^='https://formspree.io']")
    .forEach(wireFormspree);
})();
