(() => {
  const $ = (sel, root = document) => root.querySelector(sel);

  // Footer year
  document.querySelectorAll("[data-year]").forEach(el => {
    el.textContent = String(new Date().getFullYear());
  });

  // Cookie consent UI (for analytics)
  const banner = $(".cookie");
  const acceptBtn = $("[data-cookie-accept]");
  const rejectBtn = $("[data-cookie-reject]");

  const CONSENT_KEY = "rr_cookie_consent"; // "accepted" | "rejected"
  const consent = localStorage.getItem(CONSENT_KEY);

  const showBanner = () => banner && (banner.hidden = false);
  const hideBanner = () => banner && (banner.hidden = true);

  const setConsent = (value) => {
    localStorage.setItem(CONSENT_KEY, value);
    hideBanner();
    window.dispatchEvent(new CustomEvent("rr:consent", { detail: value }));
  };

  if (banner) consent ? hideBanner() : showBanner();
  acceptBtn?.addEventListener("click", () => setConsent("accepted"));
  rejectBtn?.addEventListener("click", () => setConsent("rejected"));

  // Tracking helper (only works after consent + GA loaded)
  function track(eventName, params = {}) {
    if (typeof window.rrTrack === "function") return window.rrTrack(eventName, params);
    if (typeof window.gtag === "function") return window.gtag("event", eventName, params);
  }

  // Formspree AJAX submit + honeypot spam protection + GA events
  function wireFormspree(form) {
    form.addEventListener("submit", async (e) => {
      e.preventDefault();

      // Honeypot: bots fill it, humans won't
      const honeypot = form.querySelector('input[name="company"]');
      if (honeypot && String(honeypot.value || "").trim() !== "") {
        track("spam_blocked", { form_type: form.querySelector('input[name="form_type"]')?.value || "unknown" });
        form.reset();
        return;
      }

      const status = form.querySelector(".form-status") || form.querySelector("[aria-live]");
      if (status) {
        status.classList.remove("is-success", "is-error");
        status.textContent = "Sending…";
      }

      const formType = form.querySelector('input[name="form_type"]')?.value || "unknown";
      const page = form.querySelector('input[name="page"]')?.value || location.pathname;

      try {
        const res = await fetch(form.action, {
          method: "POST",
          headers: { Accept: "application/json" },
          body: new FormData(form),
        });

        if (res.ok) {
          if (status) {
            status.classList.add("is-success");
            status.textContent = "Thanks — sent.";
          }

          track("form_submit", { form_type: formType, page });

          if (formType === "lead_capture") {
            track("generate_lead", { page, method: "formspree" });
          }

          form.reset();
        } else {
          const data = await res.json().catch(() => ({}));
          if (status) {
            status.classList.add("is-error");
            status.textContent = data?.errors?.[0]?.message || "Something went wrong. Please try again.";
          }
          track("form_submit_error", { form_type: formType, page });
        }
      } catch {
        if (status) {
          status.classList.add("is-error");
          status.textContent = "Network error. Please try again or email us directly.";
        }
        track("form_submit_error", { form_type: formType, page });
      }
    });
  }

  document
    .querySelectorAll("form[action^='https://formspree.io']")
    .forEach(wireFormspree);

  // PayPal tracking: begin_checkout (fires once per page load)
  const paypalContainer = document.querySelector("#paypal-container-KZTTHJVUHAFZC");
  if (paypalContainer) {
    let fired = false;
    paypalContainer.addEventListener("click", () => {
      if (fired) return;
      fired = true;
      track("begin_checkout", {
        currency: "GBP",
        value: 193.0,
        items: [{ item_name: "PS2 Plug & Play HDD Mod Kit (500GB)", price: 193.0, quantity: 1 }],
      });
    }, { capture: true });
  }

  // Conversion tracking on return URL (set in PayPal button settings)
  // Return: https://retroreplay.uk/shop.html?success=1
  // Cancel: https://retroreplay.uk/shop.html?cancel=1
  const url = new URL(window.location.href);

  if (url.searchParams.get("success") === "1") {
    track("purchase", {
      currency: "GBP",
      value: 193.0,
      transaction_id: "paypal_unknown",
      items: [{ item_name: "PS2 Plug & Play HDD Mod Kit (500GB)", price: 193.0, quantity: 1 }],
    });
  }

  if (url.searchParams.get("cancel") === "1") {
    track("checkout_cancelled", { page: "shop.html" });
  }
})();
