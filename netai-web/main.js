(function () {
  "use strict";

  var data = window.__BRAND__ || {};
  var $ = function (sel, scope) { return (scope || document).querySelector(sel); };
  var $$ = function (sel, scope) { return Array.prototype.slice.call((scope || document).querySelectorAll(sel)); };

  function safe(fn, name) {
    try { fn(); } catch (e) { console.warn("[" + name + "] failed:", e); }
  }

  function isHttp(url) { return typeof url === "string" && /^https?:\/\//i.test(url); }

  // Línea bajo la barra de navegación al bajar
  function initNav() {
    var nav = $("[data-nav]");
    if (!nav) return;
    var ticking = false;
    function update() { ticking = false; nav.classList.toggle("is-scrolled", (window.scrollY || 0) > 8); }
    window.addEventListener("scroll", function () {
      if (!ticking) { ticking = true; requestAnimationFrame(update); }
    }, { passive: true });
    update();
  }

  // Menú móvil a pantalla completa
  function initMenu() {
    var burger = $("[data-burger]");
    var menu = $("[data-menu]");
    if (!burger || !menu) return;
    function setOpen(open) {
      burger.setAttribute("aria-expanded", open ? "true" : "false");
      burger.setAttribute("aria-label", open ? "Cerrar menú" : "Abrir menú");
      menu.hidden = !open;
      document.body.classList.toggle("menu-open", open);
      if (open) { var first = $("a", menu); if (first) first.focus(); }
    }
    burger.addEventListener("click", function () { setOpen(burger.getAttribute("aria-expanded") !== "true"); });
    $$("a", menu).forEach(function (a) { a.addEventListener("click", function () { setOpen(false); }); });
    document.addEventListener("keydown", function (e) {
      if (e.key === "Escape" && !menu.hidden) { setOpen(false); burger.focus(); }
    });
    window.addEventListener("resize", function () { if (window.innerWidth > 960 && !menu.hidden) setOpen(false); });
  }

  // Un día: el paso que cruza el centro de la pantalla elige la pantalla del teléfono
  function initStory() {
    var steps = $$("[data-step]");
    var screens = $$("[data-screen]");
    if (!steps.length || !screens.length || !("IntersectionObserver" in window)) return;
    function activate(n) {
      steps.forEach(function (s) { s.classList.toggle("is-on", s.getAttribute("data-step") === n); });
      screens.forEach(function (s) { s.classList.toggle("is-on", s.getAttribute("data-screen") === n); });
    }
    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (en) { if (en.isIntersecting) activate(en.target.getAttribute("data-step")); });
    }, { rootMargin: "-45% 0px -45% 0px", threshold: 0 });
    steps.forEach(function (s) { io.observe(s); });
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


  function initYear() {
    var el = $("[data-year]");
    if (el) el.textContent = String(new Date().getFullYear());
  }


  // Pestañas Android / iPhone, con teclado. Elige la del dispositivo si se reconoce
  function initTabs() {
    var tabs = $$("[data-tab]");
    if (!tabs.length) return;
    function select(name, focus) {
      tabs.forEach(function (t) {
        var on = t.getAttribute("data-tab") === name;
        t.setAttribute("aria-selected", on ? "true" : "false");
        t.tabIndex = on ? 0 : -1;
        if (on && focus) t.focus();
        var panel = document.getElementById("panel-" + t.getAttribute("data-tab"));
        if (panel) panel.hidden = !on;
      });
    }
    tabs.forEach(function (t, idx) {
      t.addEventListener("click", function () { select(t.getAttribute("data-tab")); });
      t.addEventListener("keydown", function (e) {
        if (e.key !== "ArrowRight" && e.key !== "ArrowLeft") return;
        var next = tabs[(idx + (e.key === "ArrowRight" ? 1 : tabs.length - 1)) % tabs.length];
        select(next.getAttribute("data-tab"), true);
      });
    });
    var ua = navigator.userAgent || "";
    var isIos = /iPhone|iPad|iPod/i.test(ua) || (/Macintosh/i.test(ua) && navigator.maxTouchPoints > 1);
    select(isIos ? "ios" : "android");
  }


  // Solicitud de acceso: se envía al correo configurado en lib/manifest.js (requestEndpoint)
  function initRequest() {
    var form = $("[data-request]");
    var soon = $("[data-request-soon]");
    var endpoint = data.requestEndpoint;
    if (!form || !isHttp(endpoint)) return;
    form.hidden = false;
    if (soon) soon.hidden = true;

    var status = $(".form-status", form);
    var button = $("button[type=submit]", form);
    var say = function (msg, isError) {
      status.textContent = msg;
      status.classList.toggle("is-error", !!isError);
    };
    var val = function (name) {
      var el = form.elements[name];
      if (!el) return "";
      if (el.length && !el.tagName) { var c = $("input[name=" + name + "]:checked", form); return c ? c.value : ""; }
      return (el.value || "").trim();
    };

    form.addEventListener("submit", function (e) {
      e.preventDefault();
      if (button.disabled) return;
      if (val("_honey")) return; // trampa para robots
      var nombre = val("nombre");
      var email = val("email");
      if (!nombre) { say("Escribí tu nombre.", true); form.elements.nombre.focus(); return; }
      if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) { say("Revisá el correo, parece incompleto.", true); form.elements.email.focus(); return; }
      if (!val("telefono")) { say("Elegí si tu teléfono es Android o iPhone.", true); return; }
      if (!form.elements.consentimiento.checked) { say("Para enviar la solicitud, aceptá el uso de tus datos.", true); return; }

      button.disabled = true;
      say("Enviando…", false);
      fetch(endpoint, {
        method: "POST",
        headers: { "Content-Type": "application/json", "Accept": "application/json" },
        body: JSON.stringify({
          _subject: "Nueva solicitud de NetAI: " + nombre,
          _template: "table",
          _replyto: email,
          Nombre: nombre,
          Correo: email,
          WhatsApp: val("whatsapp") || "No lo dejó",
          Teléfono: val("telefono"),
          Modo: val("modo"),
          Mensaje: val("mensaje") || "Sin mensaje",
          Fecha: new Date().toLocaleString("es-AR")
        })
      }).then(function (res) {
        return res.json().catch(function () { return {}; }).then(function (body) {
          if (!res.ok || String(body.success) === "false") throw new Error("envío");
        });
      }).then(function () {
        form.reset();
        say("Listo, " + nombre + ". Recibimos tu solicitud y te escribimos a " + email + ".", false);
      }).catch(function () {
        say("No pudimos enviar la solicitud. Probá de nuevo en unos minutos.", true);
      }).then(function () { button.disabled = false; });
    });
  }

  function boot() {
    safe(initNav, "initNav");
    safe(initMenu, "initMenu");
    safe(initStory, "initStory");
    safe(initAppLinks, "initAppLinks");
    safe(initBetaDate, "initBetaDate");
    safe(initYear, "initYear");
    safe(initTabs, "initTabs");
    safe(initRequest, "initRequest");
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", boot);
  } else {
    boot();
  }
})();
