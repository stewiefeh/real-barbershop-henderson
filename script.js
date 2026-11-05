/* The Real Barbershop — motion engine v2.
   Rules: compositor work by default (transform, opacity, filter, clip-path via
   CSS/WAAPI); scroll motion rides view() timelines where supported with a
   rAF-throttled viewport-relative fallback (never scrollTop reads in handlers);
   pointer effects are the one justified rAF exception; blur capped at 6px;
   everything collapses gracefully under prefers-reduced-motion. */
(function () {
  "use strict";
  var reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  if (window.location.search.indexOf("nomotion") !== -1) {
    document.documentElement.classList.add("no-anim");
    reduced = true;
  }
  var finePointer = window.matchMedia("(hover: hover) and (pointer: fine)").matches;
  var scrollTimelines = !reduced && window.CSS &&
    CSS.supports && CSS.supports("animation-timeline: view()");

  /* ---- barber pole: scroll-linked diagonal shimmer ----
     Modulo tile cycling isn't expressible as a scroll timeline without page
     height math, so this stays a rAF-throttled write to one promoted layer. */
  var stripes = document.querySelector(".pole-stripes");
  if (stripes && !reduced) {
    var tile = 200, poleTick = false;
    var movePole = function () {
      poleTick = false;
      stripes.style.transform = "translate3d(0," + (-((window.scrollY * 0.5) % tile)) + "px,0)";
    };
    window.addEventListener("scroll", function () {
      if (!poleTick) { poleTick = true; requestAnimationFrame(movePole); }
    }, { passive: true });
    movePole();
  }

  /* ---- parallax: view()-driven in CSS; only browsers without scroll
     timelines fall back here. Offset is viewport-relative and clamped. */
  var pxEls = Array.prototype.slice.call(document.querySelectorAll("[data-parallax]"));
  if (pxEls.length && !scrollTimelines && !reduced) {
    document.documentElement.classList.add("px-js");
    var pxTick = false;
    var movePx = function () {
      pxTick = false;
      var vh = window.innerHeight;
      pxEls.forEach(function (el) {
        if (!el.isConnected) return;
        var r = el.getBoundingClientRect();
        var p = (r.top + r.height / 2 - vh / 2) / vh;   /* -0.5 .. 0.5-ish */
        var span = parseFloat(getComputedStyle(el).getPropertyValue("--px")) || 40;
        var off = Math.max(-span, Math.min(span, p * span * 2));
        el.style.transform = "translate3d(0," + off.toFixed(1) + "px,0)";
      });
    };
    window.addEventListener("scroll", function () {
      if (!pxTick) { pxTick = true; requestAnimationFrame(movePx); }
    }, { passive: true });
    window.addEventListener("resize", function () { requestAnimationFrame(movePx); });
    movePx();
  }

  /* ---- razor-cut reveals ---- */
  var revealEls = document.querySelectorAll("[data-reveal]");
  if ("IntersectionObserver" in window && !reduced) {
    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (e) {
        if (e.isIntersecting) { e.target.classList.add("in"); io.unobserve(e.target); }
      });
    }, { threshold: 0.15, rootMargin: "0px 0px -40px 0px" });
    revealEls.forEach(function (el) { io.observe(el); });
  } else {
    revealEls.forEach(function (el) { el.classList.add("in"); });
  }

  /* ---- clipper toggle: mechanical slide, crossfade both directions ---- */
  var cBtns = Array.prototype.slice.call(document.querySelectorAll(".clipper-btn"));
  var thumb = document.querySelector(".clipper-thumb");
  var cats = Array.prototype.slice.call(document.querySelectorAll(".svc-cat"));
  var placeThumb = function (btn) {
    if (!thumb) return;
    thumb.style.width = btn.offsetWidth + "px";
    thumb.style.transform = "translateX(" + (btn.offsetLeft - 4) + "px)";
  };
  var pickCat = function (btn) {
    cBtns.forEach(function (b) {
      var on = b === btn;
      b.classList.toggle("is-on", on);
      b.setAttribute("aria-pressed", on ? "true" : "false");
    });
    placeThumb(btn);
    cats.forEach(function (catEl) {
      var on = catEl.getAttribute("data-cat") === btn.getAttribute("data-cat");
      catEl.classList.toggle("is-on", on);
      if (on) catEl.removeAttribute("hidden"); else catEl.setAttribute("hidden", "");
    });
  };
  if (cBtns.length) {
    cBtns.forEach(function (b) { b.addEventListener("click", function () { pickCat(b); }); });
    var first = document.querySelector(".clipper-btn.is-on") || cBtns[0];
    pickCat(first);
    window.addEventListener("resize", function () {
      placeThumb(document.querySelector(".clipper-btn.is-on") || cBtns[0]);
    });
  }

  /* ---- scissors-split modal ---- */
  var modal = document.getElementById("lightbox");
  if (modal) {
    var mImg = document.getElementById("modalImg");
    var mCap = document.getElementById("modalCap");
    var mClose = document.getElementById("modalClose");
    var lastTrigger = null;
    var openModal = function (item) {
      lastTrigger = item;
      mImg.src = item.getAttribute("data-full");
      mImg.alt = item.querySelector("img").alt;
      mCap.textContent = item.getAttribute("data-cap");
      modal.hidden = false;
      requestAnimationFrame(function () { modal.classList.add("open"); });
      document.body.style.overflow = "hidden";
      mClose.focus();
    };
    var closeModal = function () {
      modal.classList.remove("open");
      document.body.style.overflow = "";
      window.setTimeout(function () {
        modal.hidden = true;
        mImg.src = "";
        if (lastTrigger) lastTrigger.focus();
      }, reduced ? 0 : 700);
    };
    Array.prototype.forEach.call(document.querySelectorAll(".gal-item"), function (item) {
      item.addEventListener("click", function () { openModal(item); });
      /* warm the full image so the modal never opens on a blank frame */
      item.addEventListener("pointerenter", function () {
        var pre = new Image();
        pre.src = item.getAttribute("data-full");
      });
    });
    mClose.addEventListener("click", closeModal);
    modal.addEventListener("click", function (e) { if (e.target === modal) closeModal(); });
    document.addEventListener("keydown", function (e) {
      if (e.key === "Escape" && !modal.hidden) closeModal();
    });
  }

  /* ---- testimonial marquee: WAAPI loop, decelerates on hover ----
     The duplicated track is one wide layer by design; noted in build notes. */
  var track = document.getElementById("revTrack");
  if (track && !reduced) {
    var anim = track.animate(
      [{ transform: "translateX(0)" }, { transform: "translateX(-50%)" }],
      { duration: 46000, iterations: Infinity }
    );
    var rate = 1, targetRate = 1, rateRaf = null;
    var lerpRate = function () {
      rate += (targetRate - rate) * 0.08;
      anim.playbackRate = rate;
      if (Math.abs(targetRate - rate) > 0.004) rateRaf = requestAnimationFrame(lerpRate);
      else rateRaf = null;
    };
    track.addEventListener("mouseenter", function () {
      targetRate = 0.25;
      if (!rateRaf) rateRaf = requestAnimationFrame(lerpRate);
    });
    track.addEventListener("mouseleave", function () {
      targetRate = 1;
      if (!rateRaf) rateRaf = requestAnimationFrame(lerpRate);
    });
  }

  /* ---- magnetic buttons: lerped pull, eased release ----
     Pointer-driven, so this is the one justified rAF-write exception. */
  if (finePointer && !reduced) {
    document.querySelectorAll(".btn-solid, .btn-ghost, .clipper-btn").forEach(function (btn) {
      var tx = 0, ty = 0, cx = 0, cy = 0, raf = null, base = null;
      var step = function () {
        cx += (tx - cx) * 0.18;
        cy += (ty - cy) * 0.18;
        btn.style.transform = "translate3d(" + cx.toFixed(2) + "px," + cy.toFixed(2) + "px,0)";
        if (Math.abs(tx - cx) > 0.15 || Math.abs(ty - cy) > 0.15) {
          raf = requestAnimationFrame(step);
        } else {
          raf = null;
          if (tx === 0 && ty === 0) btn.style.transform = "";
        }
      };
      btn.addEventListener("pointerenter", function (e) {
        base = btn.getBoundingClientRect();
        base.cx = base.left + base.width / 2 - cx;   /* anchor center, not shifted rect */
        base.cy = base.top + base.height / 2 - cy;
      });
      btn.addEventListener("pointermove", function (e) {
        if (!base) return;
        var dx = (e.clientX - base.cx) * 0.3;
        var dy = (e.clientY - base.cy) * 0.36;
        var m = Math.max(Math.abs(dx), Math.abs(dy)), cap = 10;
        if (m > cap) { dx *= cap / m; dy *= cap / m; }
        tx = dx; ty = dy;
        if (!raf) raf = requestAnimationFrame(step);
      });
      btn.addEventListener("pointerleave", function () {
        base = null; tx = 0; ty = 0;
        if (!raf) raf = requestAnimationFrame(step);
      });
    });
  }

  /* ---- mobile floating call bar ---- */
  var hero = document.querySelector(".hero");
  var floatCall = document.getElementById("floatCall");
  if (hero && floatCall && "IntersectionObserver" in window) {
    new IntersectionObserver(function (entries) {
      entries.forEach(function (e) {
        floatCall.classList.toggle("up", !e.isIntersecting);
      });
    }, { rootMargin: "-60px 0px 0px 0px" }).observe(hero);
  }

  /* ---- today's hours ---- */
  var day = new Date().getDay();
  var today = document.querySelector('.hours li[data-day="' + day + '"]');
  if (today) today.classList.add("today");
  var line = document.querySelector("[data-hours-line]");
  if (line) {
    var spans = today ? today.querySelectorAll("span") : null;
    line.textContent = spans ? spans[1].textContent : "closed";
  }
})();
