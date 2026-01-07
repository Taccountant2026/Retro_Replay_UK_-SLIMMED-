/* /js/main.js
   - Footer year
   - Cookie banner accept/reject + dispatch rr:consent event
   - Formspree AJAX submits + honeypot spam block
   - GA event tracking (form submits + leads)
   - PayPal conversion tracking (begin_checkout + purchase on return)
*/
(() => {
  const $ = (sel, root = document) => root.querySelector(sel);

  // Footer year
  document.querySelectorAll("[data-year]").forEach(el => {
    el.textContent = String(new Date().getFullYear());
  });

  // Cookie consent UI
  const banner = $(".cookie");
  const acceptBtn = $("[data-cookie-accept]");
  const rejectBtn = $("[data-cookie-reject]");

  const CONSENT_KEY = "rr_cookie_consent"; // "accepted" | "rejected"
  const consent = localStorage.getItem(CONSENT_KEY);

  const showBanner = () => { if (banner) banner.hidden = false; };
  const hideBanner = () => { if (banner) banner.hidden = true; };

  const setConsent = (value) => {
    localStorage.setItem(CONSENT_KEY, value);
    hideBanner();
    window.dispatchEvent(new CustomEvent("rr:consent", { detail: value }));
  };

  if (banner) {
    if (!consent) showBanner();
    else hideBanner();
  }

  acceptBtn?.addEventListener("click", () => setConsent("accepted"));
  rejectBtn?.addEventListener("click", () => setConsent("rejected"));

  // ---------- GA helpers ----------
  const canTrack = () => localStorage.getItem(CONSENT_KEY) === "accepted" && typeof window.gtag === "function";

  const trackEvent = (name, params = {}) => {
    if (!canTrack()) return;
    try { window.gtag("event", name, params); } catch {}
  };

  // ---------- Formspree AJAX submit (lead + contact) ----------
  const setStatus = (form, msg, ok = true) => {
    const el = form.querySelector(".form-status");
    if (!el) return;
    el.classList.remove("is-success", "is-error");
    el.classList.add(ok ? "is-success" : "is-error");
    el.textContent = msg;
  };

  const clearStatus = (form) => {
    const el = form.querySelector(".form-status");
    if (!el) return;
    el.classList.remove("is-success", "is-error");
    el.textContent = "";
  };

  const isSpam = (form) => {
    // Honeypot: any input named "company" filled = spam
    const hp = form.querySelector('input[name="company"]');
    if (!hp) return false;
    return String(hp.value || "").trim().length > 0;
  };

  const wireFormspree = (form) => {
    const action = (form.getAttribute("action") || "").trim();
    if (!action.startsWith("https://formspree.io/")) return;

    form.addEventListener("submit", async (e) => {
      e.preventDefault();
      clearStatus(form);

      if (isSpam(form)) {
        // Silently pretend success
        setStatus(form, "Thanks — message sent.", true);
        form.reset();
        return;
      }

      const fd = new FormData(form);

      // Ensure required fields exist for lead capture
      // (Formspree is fine without name, but email is required by your markup)
      try {
        const res = await fetch(action, {
          method: "POST",
          body: fd,
          headers: { "Accept": "application/json" }
        });

        if (res.ok) {
          setStatus(form, "Thanks — message sent.", true);
          form.reset();

          // GA events
          const formType = (fd.get("form_type") || "").toString();
          const page = (fd.get("page") || window.location.pathname || "").toString();

          trackEvent("form_submit", { form_type: formType || "unknown", page_path: page });
          if (formType === "lead_capture") {
            trackEvent("generate_lead", { method: "formspree", page_path: page });
          }
        } else {
          setStatus(form, "Something went wrong. Please try again or email us.", false);
        }
      } catch {
        setStatus(form, "Network error. Please try again or email us.", false);
      }
    });
  };

  document.querySelectorAll("form[data-lead-form], form[data-contact-form]").forEach(wireFormspree);

  // ---------- PayPal conversion tracking ----------
  // 1) begin_checkout when PayPal button container is clicked (best-effort)
  const paypalContainer = document.getElementById("paypal-container-KZTTHJVUHAFZC");
  if (paypalContainer) {
    paypalContainer.addEventListener("click", () => {
      trackEvent("begin_checkout", {
        currency: "GBP",
        value: 193.00,
        items: [{ item_name: "PS2 Plug & Play HDD Mod Kit (500GB)", price: 193.00, quantity: 1 }]
      });
    }, { passive: true });
  }

  // 2) purchase on return URLs (shop.html?success=1)
  // Also allow cancel tracking (shop.html?cancel=1)
  (() => {
    const u = new URL(window.location.href);
    const success = u.searchParams.get("success");
    const cancel = u.searchParams.get("cancel");

    if (success === "1") {
      trackEvent("purchase", {
        transaction_id: `pp_${Date.now()}`,
        currency: "GBP",
        value: 193.00,
        items: [{ item_name: "PS2 Plug & Play HDD Mod Kit (500GB)", price: 193.00, quantity: 1 }]
      });
    } else if (cancel === "1") {
      trackEvent("checkout_cancelled", { method: "paypal" });
    }
  })();
})();
