/* /js/main.js
   - Footer year
   - Cookie banner accept/reject + dispatch rr:consent event
   - Formspree AJAX submits + honeypot spam block
   - GA event tracking (form submits + leads)
   - PayPal conversion tracking (begin_checkout + purchase on return)
     UPDATED: supports package selection + PayPal dropdown pricing (Black/Silver)
     Works with shop.html that sets:
       - #selection-details[data-selected-product-id]
       - #sel-title text
       - #price-text like "From £119.99"
       - URL param ?package=p1|p2|ultimate
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
  const canTrack = () =>
    localStorage.getItem(CONSENT_KEY) === "accepted" && typeof window.gtag === "function";

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
        setStatus(form, "Thanks — message sent.", true);
        form.reset();
        return;
      }

      const fd = new FormData(form);

      try {
        const res = await fetch(action, {
          method: "POST",
          body: fd,
          headers: { "Accept": "application/json" }
        });

        if (res.ok) {
          setStatus(form, "Thanks — message sent.", true);
          form.reset();

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

  document
    .querySelectorAll("form[data-lead-form], form[data-contact-form]")
    .forEach(wireFormspree);

  // ---------- PayPal conversion tracking (UPDATED) ----------
  // Package catalog (base/from price only — PayPal dropdown may change final amount)
  const PACKAGE_MAP = {
    p1: {
      product_id: "ps2-fat-p1",
      item_name: "PS2 FAT Console — Player 1 Plug & Play",
      from_price: 119.99
    },
    p2: {
      product_id: "ps2-fat-p2",
      item_name: "PS2 FAT Console — Player 2 Plug & Play (Best Value)",
      from_price: 149.99
    },
    ultimate: {
      product_id: "ps2-fat-ultimate",
      item_name: "PS2 FAT Console — Ultimate Modded Edition (Serious-Player Build)",
      from_price: 179.99
    }
  };

  const parseFromPrice = () => {
    // Reads "From £119.99" or "£119.99" and returns number
    const t = ($("#price-text")?.textContent || "").replace(/,/g, "");
    const m = t.match(/£\s*([0-9]+(?:\.[0-9]{1,2})?)/i);
    return m ? Number(m[1]) : null;
  };

  const getSelectedPackageKey = () => {
    // 1) URL param ?package=
    try {
      const u = new URL(window.location.href);
      const p = (u.searchParams.get("package") || "").toLowerCase();
      if (p && PACKAGE_MAP[p]) return p;
    } catch {}

    // 2) DOM pressed package buttons
    const pressed = document.querySelector(".pkg[aria-pressed='true']");
    if (pressed) {
      const p = (pressed.getAttribute("data-package") || "").toLowerCase();
      if (p && PACKAGE_MAP[p]) return p;
    }

    // 3) selection-details data-selected-product-id
    const sid = document.getElementById("selection-details")?.getAttribute("data-selected-product-id") || "";
    if (sid.includes("ps2-fat-p1")) return "p1";
    if (sid.includes("ps2-fat-p2")) return "p2";
    if (sid.includes("ps2-fat-ultimate")) return "ultimate";

    // default
    return "p2";
  };

  const getSelectedItemName = () => {
    // Prefer visible selection title if present
    const title = ($("#sel-title")?.textContent || "").trim();
    if (title) return title.replace(/\s+/g, " ");
    const key = getSelectedPackageKey();
    return PACKAGE_MAP[key].item_name;
  };

  const getSelectedProductId = () => {
    const key = getSelectedPackageKey();
    return PACKAGE_MAP[key].product_id;
  };

  const getValueForTracking = () => {
    // We can only reliably know the "from" price on-site; PayPal dropdown may change final value.
    // Use displayed "From £X" if present, else from PACKAGE_MAP.
    const p = parseFromPrice();
    if (typeof p === "number" && Number.isFinite(p)) return Number(p.toFixed(2));
    const key = getSelectedPackageKey();
    return Number(PACKAGE_MAP[key].from_price.toFixed(2));
  };

  // 1) begin_checkout when PayPal container is clicked (best-effort)
  const paypalContainer = document.getElementById("paypal-container-KZTTHJVUHAFZC");
  if (paypalContainer) {
    paypalContainer.addEventListener("click", () => {
      const key = getSelectedPackageKey();
      const value = getValueForTracking();

      trackEvent("begin_checkout", {
        currency: "GBP",
        value,
        items: [{
          item_id: PACKAGE_MAP[key].product_id,
          item_name: getSelectedItemName(),
          price: value,
          quantity: 1
        }]
      });
    }, { passive: true });
  }

  // 2) purchase / cancel on return URLs
  (() => {
    let u;
    try { u = new URL(window.location.href); } catch { return; }

    const success = u.searchParams.get("success");
    const cancel = u.searchParams.get("cancel");

    if (success === "1") {
      const key = getSelectedPackageKey();
      const value = getValueForTracking();

      // Note: true PayPal final amount (Black/Silver) isn't available client-side reliably.
      // This logs the selected package + from-price as the purchase value for attribution.
      trackEvent("purchase", {
        transaction_id: `pp_${Date.now()}`,
        currency: "GBP",
        value,
        items: [{
          item_id: PACKAGE_MAP[key].product_id,
          item_name: getSelectedItemName(),
          price: value,
          quantity: 1
        }]
      });
    } else if (cancel === "1") {
      trackEvent("checkout_cancelled", { method: "paypal" });
    }
  })();
})();
