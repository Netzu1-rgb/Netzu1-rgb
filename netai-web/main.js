(function () {
  "use strict";

  var data = window.__BRAND__ || {};
  var $ = function (sel, scope) { return (scope || document).querySelector(sel); };
  var $$ = function (sel, scope) { return Array.prototype.slice.call((scope || document).querySelectorAll(sel)); };

  function safe(fn, name) {
    try { fn(); } catch (e) { console.warn("[" + name + "] failed:", e); }
  }

  function isHttp(url) { return typeof url === "string" && /^https?:\/\//i.test(url); }

  // Barra de navegación: se vuelve sólida al bajar
  function initNav() {
    var nav = $("[data-nav]");
    if (!nav) return;
    var update = function () { nav.classList.toggle("is-solid", window.scrollY > 24); };
    update();
    window.addEventListener("scroll", update, { passive: true });
  }

  // Aparición suave. Umbral bajo y red de seguridad a los 6 s para que nunca quede texto oculto
  function initReveals() {
    var items = $$(".reveal");
    var show = function (el) { el.classList.add("is-in"); };
    if (!("IntersectionObserver" in window)) { items.forEach(show); return; }
    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (en) {
        if (en.isIntersecting) { show(en.target); io.unobserve(en.target); }
      });
    }, { threshold: 0.05 });
    items.forEach(function (el) { io.observe(el); });
    setTimeout(function () { items.forEach(show); }, 6000);
  }

  // Botones de las apps: se activan solo cuando hay una dirección real
  function initAppLinks() {
    var apps = data.apps || {};
    var labels = { netai: "Abrir NetAI", fit: "Abrir NetAI Fit" };
    $$("[data-app-link]").forEach(function (a) {
      var key = a.getAttribute("data-app-link");
      var url = apps[key] && apps[key].url;
      if (!isHttp(url)) return;
      a.href = url;
      a.target = "_blank";
      a.rel = "noopener";
      a.textContent = labels[key] || "Abrir";
      a.classList.remove("is-disabled");
      a.removeAttribute("aria-disabled");
    });
    var stores = data.stores || {};
    $$("[data-store]").forEach(function (a) {
      var url = stores[a.getAttribute("data-store")];
      if (!isHttp(url)) return;
      a.href = url;
      a.target = "_blank";
      a.rel = "noopener";
      a.classList.remove("is-disabled");
      a.removeAttribute("aria-disabled");
      var small = $("small", a);
      if (small) small.textContent = "Descargala en";
    });
  }

  function initBetaDate() {
    var el = $("[data-beta-date]");
    if (el && data.betaDate) el.textContent = "Beta prevista: " + data.betaDate + ".";
  }

  // Pestañas Android / iPhone. Elige la del dispositivo si se reconoce
  function initTabs() {
    var tabs = $$("[data-tab]");
    if (!tabs.length) return;
    function select(name) {
      tabs.forEach(function (t) {
        var on = t.getAttribute("data-tab") === name;
        t.setAttribute("aria-selected", on ? "true" : "false");
        var panel = document.getElementById("panel-" + t.getAttribute("data-tab"));
        if (panel) panel.hidden = !on;
      });
    }
    tabs.forEach(function (t) {
      t.addEventListener("click", function () { select(t.getAttribute("data-tab")); });
    });
    var ua = navigator.userAgent || "";
    var isIos = /iPhone|iPad|iPod/i.test(ua) || (/Macintosh/i.test(ua) && navigator.maxTouchPoints > 1);
    select(isIos ? "ios" : "android");
  }

  // Lista de espera: solo se muestra si hay un servicio de formularios configurado
  function initWaitlist() {
    var form = $("[data-waitlist]");
    var soon = $("[data-waitlist-soon]");
    var endpoint = data.waitlistEndpoint;
    if (!form || !isHttp(endpoint)) return;
    form.hidden = false;
    if (soon) soon.hidden = true;

    var status = $(".form-status", form);
    var button = $("button[type=submit]", form);
    var say = function (msg, isError) {
      status.textContent = msg;
      status.classList.toggle("is-error", !!isError);
    };

    form.addEventListener("submit", function (e) {
      e.preventDefault();
      var email = form.elements.email.value.trim();
      if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
        say("Revisá el correo, parece incompleto.", true);
        form.elements.email.focus();
        return;
      }
      var chosen = $("input[name=app]:checked", form);
      button.disabled = true;
      say("Enviando…", false);
      fetch(endpoint, {
        method: "POST",
        headers: { "Content-Type": "application/json", "Accept": "application/json" },
        body: JSON.stringify({ email: email, app: chosen ? chosen.value : "ambas" })
      }).then(function (res) {
        if (!res.ok) throw new Error("http " + res.status);
        form.reset();
        say("Listo, te avisamos. Gracias por sumarte.", false);
      }).catch(function () {
        say("No pudimos anotarte. Probá de nuevo en unos minutos.", true);
      }).then(function () { button.disabled = false; });
    });
  }

  function boot() {
    safe(initNav, "initNav");
    safe(initReveals, "initReveals");
    safe(initAppLinks, "initAppLinks");
    safe(initBetaDate, "initBetaDate");
    safe(initTabs, "initTabs");
    safe(initWaitlist, "initWaitlist");
    document.documentElement.classList.add("is-ready");
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", boot);
  } else {
    boot();
  }
})();
