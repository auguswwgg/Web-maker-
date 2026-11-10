(function () {
  "use strict";
  /* Taquería El Fogón — interacciones (IIFE, sin módulos) */

  var BRAND = window.__BRAND__ || {};
  var WA = BRAND.whatsapp || "5215512345678";
  var DAYS = ["domingo", "lunes", "martes", "miércoles", "jueves", "viernes", "sábado"];
  var hoverable = window.matchMedia("(hover: hover) and (pointer: fine)").matches;
  var reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  function safe(fn, name) {
    try { fn(); } catch (err) { if (window.console) console.warn("[fogon] " + name + " falló:", err); }
  }
  function $(sel, root) { return (root || document).querySelector(sel); }
  function $$(sel, root) { return Array.prototype.slice.call((root || document).querySelectorAll(sel)); }
  function waLink(text) { return "https://wa.me/" + WA + (text ? "?text=" + encodeURIComponent(text) : ""); }
  function money(n) { return "$" + n.toLocaleString("es-MX"); }

  document.documentElement.classList.remove("no-js");

  /* ---------- Splash ---------- */
  function initSplash() {
    var splash = $("[data-splash]");
    if (!splash) return;
    var hide = function () { splash.classList.add("is-out"); };
    if (document.readyState === "complete") setTimeout(hide, 500);
    else window.addEventListener("load", function () { setTimeout(hide, 350); });
    setTimeout(hide, 2500);
  }

  /* ---------- Enlaces de WhatsApp (por si cambian el número en manifest.js) ---------- */
  function initWaLinks() {
    $$("[data-wa]").forEach(function (a) { a.href = waLink("Hola El Fogón, quiero hacer un pedido"); });
    $$("[data-wa-plain]").forEach(function (a) { a.href = waLink(""); });
  }

  /* ---------- Navegación ---------- */
  function initNav() {
    var nav = $("[data-nav]");
    var toggle = $("[data-nav-toggle]");
    if (!nav) return;
    var onScroll = function () { nav.classList.toggle("is-scrolled", window.scrollY > 40); };
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });

    if (toggle) {
      toggle.addEventListener("click", function () {
        var open = nav.classList.toggle("is-open");
        toggle.setAttribute("aria-expanded", open ? "true" : "false");
        toggle.setAttribute("aria-label", open ? "Cerrar menú" : "Abrir menú");
      });
      $$(".nav-links a", nav).forEach(function (a) {
        a.addEventListener("click", function () {
          nav.classList.remove("is-open");
          toggle.setAttribute("aria-expanded", "false");
        });
      });
    }
  }

  /* ---------- Scroll suave con offset ---------- */
  function initAnchors() {
    document.addEventListener("click", function (e) {
      var a = e.target.closest && e.target.closest('a[href^="#"]');
      if (!a) return;
      var id = a.getAttribute("href");
      if (!id || id === "#") return;
      var el = document.querySelector(id);
      if (!el) return;
      e.preventDefault();
      window.scrollTo({ top: el.getBoundingClientRect().top + window.scrollY - 70, behavior: reduced ? "auto" : "smooth" });
    });
  }

  /* ---------- Reveal al hacer scroll ---------- */
  function initReveal() {
    var items = $$(".reveal");
    if (!("IntersectionObserver" in window)) {
      items.forEach(function (el) { el.classList.add("is-visible"); });
      return;
    }
    // Escalonar elementos hermanos
    items.forEach(function (el) {
      var sibs = $$(":scope > .reveal", el.parentElement);
      var i = sibs.indexOf(el);
      if (i > 0) el.style.setProperty("--rd", Math.min(i, 4) * 0.09 + "s");
    });
    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (en) {
        if (en.isIntersecting) { en.target.classList.add("is-visible"); io.unobserve(en.target); }
      });
    }, { threshold: 0.01, rootMargin: "0px 0px -6% 0px" });
    items.forEach(function (el) { io.observe(el); });

    // Red de seguridad: a los 6 s muestra lo que siga oculto en pantalla
    setTimeout(function () {
      $$(".reveal:not(.is-visible)").forEach(function (el) {
        if (el.getBoundingClientRect().top < window.innerHeight) el.classList.add("is-visible");
      });
    }, 6000);
  }

  /* ---------- Horario: hoy + abierto/cerrado ---------- */
  function toMin(hhmm) { var p = hhmm.split(":"); return (+p[0]) * 60 + (+p[1]); }
  function fmt(hhmm) {
    var p = hhmm.split(":"), h = +p[0], m = p[1];
    var suf = h >= 12 ? "pm" : "am"; h = h % 12 || 12;
    return h + (m !== "00" ? ":" + m : "") + " " + suf;
  }
  function initHours() {
    var hours = BRAND.hours;
    if (!hours) return;
    var now = new Date();
    var day = now.getDay();
    var mins = now.getHours() * 60 + now.getMinutes();
    var status = null; // {open:bool, text:string}

    // ¿Seguimos abiertos desde ayer (después de medianoche)?
    var yest = hours[(day + 6) % 7];
    if (yest && toMin(yest[1]) < toMin(yest[0]) && mins < toMin(yest[1])) {
      status = { open: true, text: "Abierto ahora · cerramos a las " + fmt(yest[1]) };
    }
    var today = hours[day];
    if (!status && today) {
      var o = toMin(today[0]), c = toMin(today[1]);
      var overnight = c < o;
      if (mins >= o && (overnight || mins < c)) status = { open: true, text: "Abierto ahora · cerramos a las " + fmt(today[1]) };
      else if (mins < o) status = { open: false, text: "Hoy abrimos a las " + fmt(today[0]) };
    }
    if (!status) {
      for (var k = 1; k <= 7; k++) {
        var d = (day + k) % 7;
        if (hours[d]) {
          status = { open: false, text: "Cerrado · abrimos " + (k === 1 ? "mañana" : "el " + DAYS[d]) + " a las " + fmt(hours[d][0]) };
          break;
        }
      }
    }
    if (!status) return;

    var pill = $("[data-status]");
    var pillText = $("[data-status-text]");
    if (pill && pillText) {
      pillText.textContent = status.text;
      pill.classList.add(status.open ? "is-open" : "is-closed-now");
    }
    var big = $("[data-status-big]");
    if (big) {
      big.textContent = status.open ? "Estamos abiertos" : status.text;
      big.classList.toggle("is-open", status.open);
    }
    var row = $('[data-hours] li[data-day="' + day + '"]');
    if (row) row.classList.add("is-today");
  }

  /* ---------- Contador ---------- */
  function initCountUp() {
    var els = $$("[data-count-to]");
    if (!els.length || !("IntersectionObserver" in window)) return;
    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (en) {
        if (!en.isIntersecting) return;
        io.unobserve(en.target);
        var el = en.target, to = +el.getAttribute("data-count-to"), t0 = null, dur = 1400;
        var step = function (t) {
          if (!t0) t0 = t;
          var p = Math.min((t - t0) / dur, 1);
          el.textContent = Math.round(to * (1 - Math.pow(1 - p, 3)));
          if (p < 1) requestAnimationFrame(step);
        };
        setTimeout(function () { requestAnimationFrame(step); }, 1200);
      });
    }, { threshold: 0.01 });
    els.forEach(function (el) { io.observe(el); });
  }

  /* ---------- Pedido por WhatsApp ---------- */
  function initOrder() {
    var bar = $("[data-order]");
    var items = $$(".menu-item[data-item]");
    if (!bar || !items.length) return;
    bar.hidden = false;
    var cart = {};
    var countEl = $("[data-order-count]", bar);
    var totalEl = $("[data-order-total]", bar);
    var sendEl = $("[data-order-send]", bar);
    var floatBtn = $("[data-wa-float]");

    function render() {
      var n = 0, total = 0, lines = [];
      items.forEach(function (li) {
        var name = li.getAttribute("data-item");
        var q = cart[name] || 0;
        var price = +li.getAttribute("data-price");
        li.classList.toggle("has-qty", q > 0);
        $(".qty-n", li).textContent = q;
        $(".qty-n", li).hidden = q === 0;
        $(".qty-btn.minus", li).hidden = q === 0;
        if (q > 0) { n += q; total += q * price; lines.push("• " + q + " × " + name + " (" + money(q * price) + ")"); }
      });
      countEl.textContent = n + (n === 1 ? " producto" : " productos");
      totalEl.textContent = money(total);
      var msg = "Hola El Fogón 👋, quiero pedir:\n" + lines.join("\n") + "\n\nTotal aprox.: " + money(total) + "\nNombre: \nPara llevar / a domicilio: ";
      sendEl.href = waLink(msg);
      bar.classList.toggle("is-on", n > 0);
      if (floatBtn) floatBtn.classList.toggle("is-hidden", n > 0);
    }

    items.forEach(function (li) {
      var box = $("[data-qty]", li);
      if (!box || box.children.length > 0) return; // idempotente
      var name = li.getAttribute("data-item");
      box.innerHTML =
        '<button type="button" class="qty-btn minus" aria-label="Quitar ' + name + '" hidden>−</button>' +
        '<span class="qty-n" aria-live="polite" hidden>0</span>' +
        '<button type="button" class="qty-btn plus" aria-label="Agregar ' + name + '">+</button>';
      box.hidden = false;
      $(".plus", box).addEventListener("click", function () { cart[name] = (cart[name] || 0) + 1; render(); });
      $(".minus", box).addEventListener("click", function () { cart[name] = Math.max(0, (cart[name] || 0) - 1); render(); });
    });
    $("[data-order-clear]", bar).addEventListener("click", function () { cart = {}; render(); });
    render();
  }

  /* ---------- Tilt 3D en tarjetas (solo con mouse) ---------- */
  function initTilt() {
    if (!hoverable) return;
    $$("[data-tilt]").forEach(function (card) {
      if (card.dataset.tiltBound) return;
      card.dataset.tiltBound = "1";
      card.addEventListener("mousemove", function (e) {
        var r = card.getBoundingClientRect();
        var x = (e.clientX - r.left) / r.width, y = (e.clientY - r.top) / r.height;
        card.style.setProperty("--ry", ((x - 0.5) * 12).toFixed(2) + "deg");
        card.style.setProperty("--rx", ((0.5 - y) * 10).toFixed(2) + "deg");
        card.style.setProperty("--mx", (x * 100).toFixed(1) + "%");
        card.style.setProperty("--my", (y * 100).toFixed(1) + "%");
      });
      card.addEventListener("mouseout", function (e) {
        if (card.contains(e.relatedTarget)) return;
        card.style.setProperty("--rx", "0deg");
        card.style.setProperty("--ry", "0deg");
      });
    });
  }

  /* ---------- Botones magnéticos ---------- */
  function initMagnetic() {
    if (!hoverable) return;
    $$("[data-magnetic]").forEach(function (btn) {
      btn.addEventListener("mousemove", function (e) {
        var r = btn.getBoundingClientRect();
        btn.style.setProperty("--bx", ((e.clientX - r.left - r.width / 2) * 0.25).toFixed(1) + "px");
        btn.style.setProperty("--by", ((e.clientY - r.top - r.height / 2) * 0.35).toFixed(1) + "px");
      });
      btn.addEventListener("mouseout", function (e) {
        if (btn.contains(e.relatedTarget)) return;
        btn.style.setProperty("--bx", "0px");
        btn.style.setProperty("--by", "0px");
      });
    });
  }

  /* ---------- Parallax suave del hero ---------- */
  function initParallax() {
    var bg = $("[data-parallax]");
    if (!bg || reduced) return;
    var ticking = false;
    window.addEventListener("scroll", function () {
      if (ticking) return;
      ticking = true;
      requestAnimationFrame(function () {
        var y = window.scrollY;
        if (y < window.innerHeight * 1.2) bg.style.transform = "translate3d(0," + (y * 0.25).toFixed(1) + "px,0)";
        ticking = false;
      });
    }, { passive: true });
  }

  /* ---------- Galería arrastrable (mouse) ---------- */
  function initDrag() {
    var track = $("[data-drag]");
    if (!track || !hoverable) return;
    var down = false, startX = 0, startScroll = 0, moved = false;
    track.addEventListener("pointerdown", function (e) {
      if (e.pointerType !== "mouse") return;
      down = true; moved = false; startX = e.clientX; startScroll = track.scrollLeft;
    });
    window.addEventListener("pointermove", function (e) {
      if (!down) return;
      var dx = e.clientX - startX;
      if (Math.abs(dx) > 4) { moved = true; track.classList.add("is-dragging"); }
      track.scrollLeft = startScroll - dx;
    });
    window.addEventListener("pointerup", function () {
      if (!down) return;
      down = false;
      track.classList.remove("is-dragging");
    });
    track.addEventListener("click", function (e) { if (moved) e.preventDefault(); }, true);
  }

  function initYear() {
    $$("[data-year]").forEach(function (el) { el.textContent = new Date().getFullYear(); });
  }

  function boot() {
    safe(initSplash, "splash");
    safe(initWaLinks, "wa");
    safe(initNav, "nav");
    safe(initAnchors, "anchors");
    safe(initReveal, "reveal");
    safe(initHours, "hours");
    safe(initCountUp, "countup");
    safe(initOrder, "order");
    safe(initTilt, "tilt");
    safe(initMagnetic, "magnetic");
    safe(initParallax, "parallax");
    safe(initDrag, "drag");
    safe(initYear, "year");
  }

  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", boot);
  else boot();
})();
