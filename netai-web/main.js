(function () {
  "use strict";

  var data = window.__BRAND__ || {};
  var reduced = window.matchMedia && matchMedia("(prefers-reduced-motion: reduce)").matches;
  var canHover = window.matchMedia && matchMedia("(hover: hover) and (pointer: fine)").matches;
  var $ = function (sel, scope) { return (scope || document).querySelector(sel); };
  var $$ = function (sel, scope) { return Array.prototype.slice.call((scope || document).querySelectorAll(sel)); };

  function safe(fn, name) {
    try { fn(); } catch (e) { console.warn("[" + name + "] failed:", e); }
  }

  function isHttp(url) { return typeof url === "string" && /^https?:\/\//i.test(url); }

  // Un solo bucle de scroll para barra de progreso, nav y parallax
  function initScroll() {
    var nav = $("[data-nav]");
    var bar = $("[data-progress]");
    var phones = $("[data-parallax]");
    var hero = $("[data-hero]");
    var ticking = false;

    function update() {
      ticking = false;
      var y = window.scrollY || window.pageYOffset;
      var max = document.documentElement.scrollHeight - window.innerHeight;
      if (bar) bar.style.transform = "scaleX(" + (max > 0 ? Math.min(1, y / max) : 0) + ")";
      if (nav) nav.classList.toggle("is-solid", y > 24);
      if (phones && hero && !reduced) {
        var h = hero.offsetHeight || 1;
        if (y < h) phones.style.transform = "translate3d(0," + (y * -0.08).toFixed(1) + "px,0)";
      }
    }
    window.addEventListener("scroll", function () {
      if (!ticking) { ticking = true; requestAnimationFrame(update); }
    }, { passive: true });
    window.addEventListener("resize", update);
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
      menu.classList.toggle("is-open", open);
      document.body.classList.toggle("menu-open", open);
      if (open) { var first = $("a", menu); if (first) first.focus(); }
    }
    burger.addEventListener("click", function () {
      setOpen(burger.getAttribute("aria-expanded") !== "true");
    });
    $$("a", menu).forEach(function (a) {
      a.addEventListener("click", function () { setOpen(false); });
    });
    document.addEventListener("keydown", function (e) {
      if (e.key === "Escape" && !menu.hidden) { setOpen(false); burger.focus(); }
    });
    window.addEventListener("resize", function () {
      if (window.innerWidth > 960 && !menu.hidden) setOpen(false);
    });
  }

  // Divide el titular en palabras sin perder <br> ni <em>
  function initSplit() {
    $$("[data-split]").forEach(function (el) {
      if (el.querySelector(".w")) return;
      var i = 0;
      (function walk(node) {
        Array.prototype.slice.call(node.childNodes).forEach(function (child) {
          if (child.nodeType === 3) {
            var parts = child.textContent.split(/(\s+)/);
            var frag = document.createDocumentFragment();
            parts.forEach(function (part) {
              if (!part) return;
              if (/^\s+$/.test(part)) { frag.appendChild(document.createTextNode(part)); return; }
              var span = document.createElement("span");
              span.className = "w";
              span.style.setProperty("--i", i++);
              span.textContent = part;
              frag.appendChild(span);
            });
            node.replaceChild(frag, child);
          } else if (child.nodeType === 1 && child.tagName !== "BR") {
            walk(child);
          }
        });
      })(el);
      requestAnimationFrame(function () {
        requestAnimationFrame(function () { el.classList.add("is-in"); });
      });
    });
  }

  // Aparición suave. Umbral bajo y red de seguridad a los 6 s
  function initReveals() {
    var items = $$(".reveal");
    var show = function (el) {
      if (el.classList.contains("is-in")) return;
      el.classList.add("is-in");
      // Quita el escalonado al terminar, para que no retrase los efectos de hover
      setTimeout(function () { el.style.transitionDelay = ""; }, 1300);
    };
    if (!("IntersectionObserver" in window)) { items.forEach(show); return; }
    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (en) {
        if (en.isIntersecting) { show(en.target); io.unobserve(en.target); }
      });
    }, { threshold: 0.05, rootMargin: "0px 0px -6% 0px" });
    items.forEach(function (el) {
      // Pequeño escalonado entre hermanos
      var sib = el.parentNode ? Array.prototype.indexOf.call(el.parentNode.children, el) : 0;
      el.style.transitionDelay = Math.min(sib, 4) * 70 + "ms";
      io.observe(el);
    });
    setTimeout(function () { items.forEach(show); }, 6000);
  }

  // Botones magnéticos (solo con ratón)
  function initMagnetic() {
    if (!canHover || reduced) return;
    $$("[data-magnetic]").forEach(function (btn) {
      btn.addEventListener("mousemove", function (e) {
        var r = btn.getBoundingClientRect();
        var x = (e.clientX - r.left - r.width / 2) * 0.18;
        var y = (e.clientY - r.top - r.height / 2) * 0.28;
        btn.style.transform = "translate(" + x.toFixed(1) + "px," + y.toFixed(1) + "px)";
      });
      btn.addEventListener("mouseleave", function () { btn.style.transform = ""; });
    });
  }

  // Contadores
  function initCounters() {
    var els = $$("[data-count]");
    if (!els.length || reduced || !("IntersectionObserver" in window)) return;
    els.forEach(function (el) { el.textContent = "0"; });
    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (en) {
        if (!en.isIntersecting) return;
        io.unobserve(en.target);
        var el = en.target;
        var to = parseInt(el.getAttribute("data-count"), 10) || 0;
        var start = null;
        var dur = 1400;
        function frame(t) {
          if (start === null) start = t;
          var p = Math.min(1, (t - start) / dur);
          var eased = 1 - Math.pow(1 - p, 3);
          el.textContent = String(Math.round(to * eased));
          if (p < 1) requestAnimationFrame(frame);
        }
        requestAnimationFrame(frame);
      });
    }, { threshold: 0.05 });
    els.forEach(function (el) { io.observe(el); });
    // Red de seguridad: nunca dejar un contador en 0
    setTimeout(function () {
      els.forEach(function (el) { if (el.textContent === "0") el.textContent = el.getAttribute("data-count"); });
    }, 6000);
  }

  // Narrativa "Un día": el paso que cruza el centro de la pantalla cambia la pantalla del teléfono
  function initStory() {
    var steps = $$("[data-step]");
    var screens = $$("[data-screen]");
    if (!steps.length || !screens.length || !("IntersectionObserver" in window)) return;
    function activate(n) {
      steps.forEach(function (s) { s.classList.toggle("is-on", s.getAttribute("data-step") === n); });
      screens.forEach(function (s) { s.classList.toggle("is-on", s.getAttribute("data-screen") === n); });
    }
    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (en) {
        if (en.isIntersecting) activate(en.target.getAttribute("data-step"));
      });
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
      if (button.disabled) return;
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
    safe(initScroll, "initScroll");
    safe(initMenu, "initMenu");
    safe(initSplit, "initSplit");
    safe(initReveals, "initReveals");
    safe(initMagnetic, "initMagnetic");
    safe(initCounters, "initCounters");
    safe(initStory, "initStory");
    safe(initAppLinks, "initAppLinks");
    safe(initBetaDate, "initBetaDate");
    safe(initYear, "initYear");
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
