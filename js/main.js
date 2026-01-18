/* -------------------------------------------------------------------------
   RetroReplay UK — /js/main.js (2026 premium build)
   Includes:
   • Footer year auto-update
   • Cookie consent banner + rr:consent dispatch
   • Formspree AJAX (lead/contact) + spam honeypot + GA4 tracking
   • PayPal conversion tracking (begin_checkout, purchase, cancel)
   • Scroll-reveal animations + GDPR-safe analytics
---------------------------------------------------------------------------*/
(() => {
  "use strict";

  const $ = (sel, root = document) => root.querySelector(sel);
  const $$ = (sel, root = document) => root.querySelectorAll(sel);

  /* ---------------------------
     Analytics queue safety
  --------------------------- */
  window.dataLayer = window.dataLayer || [];
  window.gtag = window.gtag || function () { window.dataLayer.push(arguments); };

  /* ---------------------------
     Footer year
  --------------------------- */
  document.querySelectorAll("[data-year]").forEach(el => {
    el.textContent = new Date().getFullYear();
  });

  /* ---------------------------
     Cookie Consent
  --------------------------- */
  const KEY = "rr_cookie_consent";
  const banner = $(".cookie");
  const accept = $("[data-cookie-accept]");
  const reject = $("[data-cookie-reject]");

  const safeGet = () => {
    try { return localStorage.getItem(KEY); } catch { return null; }
  };
  const safeSet = v => {
    try { localStorage.setItem(KEY, v); } catch { }
  };
  const show = () => banner && (banner.hidden = false);
  const hide = () => banner && (banner.hidden = true);
  const setConsent = v => {
    safeSet(v);
    hide();
    window.dispatchEvent(new CustomEvent("rr:consent", { detail: v }));
  };

  const current = safeGet();
  if (banner) (!current ? show() : hide());
  accept?.addEventListener("click", () => setConsent("accepted"));
  reject?.addEventListener("click", () => setConsent("rejected"));

  /* ---------------------------
     GA4 Helpers
  --------------------------- */
  const canTrack = () => safeGet() === "accepted" && typeof window.gtag === "function";
  const track = (name, params = {}) => {
    if (!canTrack()) return;
    try {
      gtag("event", name, params);
      window.dispatchEvent(new CustomEvent("rr:track", { detail: { name, params } }));
    } catch { }
  };

  /* ---------------------------
     Formspree AJAX Forms
  --------------------------- */
  const setStatus = (f, msg, ok = true) => {
    const el = f.querySelector(".form-status");
    if (!el) return;
    el.classList.remove("is-success", "is-error");
    el.classList.add(ok ? "is-success" : "is-error");
    el.textContent = msg;
  };
  const clearStatus = f => {
    const el = f.querySelector(".form-status");
    if (el) el.textContent = "";
  };
  const isSpam = f => !!(f.querySelector('input[name="company"]')?.value.trim());

  const wireForm = f => {
    const act = f.getAttribute("action")?.trim();
    if (!act?.startsWith("https://formspree.io/")) return;
    f.addEventListener("submit", async e => {
      e.preventDefault();
      clearStatus(f);
      if (isSpam(f)) return setStatus(f, "Thanks — message sent.", true);

      const fd = new FormData(f);
      try {
        const res = await fetch(act, {
          method: "POST",
          body: fd,
          headers: { Accept: "application/json" }
        });
        if (!res.ok) throw new Error();
        setStatus(f, "Thanks — message sent.", true);
        f.reset();
        const formType = fd.get("form_type") || "unknown";
        const page = fd.get("page") || location.pathname;
        track("form_submit", { form_type: formType, page_path: page });
        if (formType === "lead_capture")
          track("generate_lead", { method: "formspree", page_path: page });
      } catch {
        setStatus(f, "Something went wrong — please try again or email us.", false);
      }
    });
  };
  $$("form[data-lead-form], form[data-contact-form]").forEach(wireForm);

  /* ---------------------------
     PayPal Conversion Tracking
  --------------------------- */
  const PACKAGES = {
    p1: { id: "ps2-fat-p1", name: "PS2 FAT Console — Player 1 Plug & Play", price: 119.99 },
    p2: { id: "ps2-fat-p2", name: "PS2 FAT Console — Player 2 Plug & Play (Best Value)", price: 149.99 },
    ultimate: { id: "ps2-fat-ultimate", name: "PS2 FAT Console — Ultimate Modded Edition", price: 179.99 }
  };

  const priceFromText = () => {
    const t = ($("#price-text")?.textContent || "").replace(/,/g, "");
    const m = t.match(/£\s*([0-9]+(?:\.[0-9]{1,2})?)/);
    return m ? +m[1] : null;
  };

  const pkgKey = () => {
    try {
      const u = new URL(location.href);
      const p = (u.searchParams.get("package") || "").toLowerCase();
      if (PACKAGES[p]) return p;
    } catch { }
    const pressed = document.querySelector(".pkg[aria-pressed='true']")?.dataset.package?.toLowerCase();
    if (pressed && PACKAGES[pressed]) return pressed;
    const sid = $("#selection-details")?.dataset.selectedProductId || "";
    if (sid.includes("p1")) return "p1";
    if (sid.includes("p2")) return "p2";
    if (sid.includes("ultimate")) return "ultimate";
    return "p2";
  };

  const pkgName = () => $("#sel-title")?.textContent?.trim() || PACKAGES[pkgKey()].name;
  const pkgId = () => PACKAGES[pkgKey()].id;
  const pkgValue = () => priceFromText() ?? PACKAGES[pkgKey()].price;

  const paypal = $("#paypal-container-KZTTHJVUHAFZC");
  paypal?.addEventListener("click", () => {
    const k = pkgKey(), v = pkgValue();
    track("begin_checkout", {
      currency: "GBP",
      value: v,
      items: [{ item_id: PACKAGES[k].id, item_name: pkgName(), price: v, quantity: 1 }]
    });
  }, { passive: true });

  (() => {
    let u;
    try { u = new URL(location.href); } catch { return; }
    const success = u.searchParams.get("success");
    const cancel = u.searchParams.get("cancel");
    if (success === "1") {
      const k = pkgKey(), v = pkgValue();
      track("purchase", {
        transaction_id: `pp_${Date.now()}`,
        currency: "GBP",
        value: v,
        items: [{ item_id: pkgId(), item_name: pkgName(), price: v, quantity: 1 }]
      });
    } else if (cancel === "1") {
      track("checkout_cancelled", { method: "paypal" });
    }
  })();

  /* ---------------------------
     Scroll Reveal Animations
  --------------------------- */
  const revealEls = $$(".reveal, .card");
  if (revealEls.length) {
    const obs = new IntersectionObserver((entries, observer) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          entry.target.classList.add("visible");
          observer.unobserve(entry.target);
        }
      });
    }, { threshold: 0.15 });

    revealEls.forEach(el => obs.observe(el));
  }

})();
