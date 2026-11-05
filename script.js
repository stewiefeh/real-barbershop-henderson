/* The Real Barbershop — motion system.
   Performance rules: transform/opacity/clip-path by default (compositor),
   rAF writes batched, one will-change layer for the pole, blur kept at 6px
   (under the 10px budget), everything degrades under prefers-reduced-motion. */
(function () {
  "use strict";
  var reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  if (window.location.search.indexOf("nomotion") !== -1) {
    document.documentElement.classList.add("no-anim");
    reduced = true;
  }
  var finePointer = window.matchMedia("(hover: hover) and (pointer: fine)").matches;

  /* ---- barber pole: scroll-linked diagonal shimmer (rAF transform, A-tier) ---- */
  var stripes = document.querySelector(".pole-stripes");
  if (stripes) {
    var tile = 200, ticking = false;
    var movePole = function () {
      stripes.style.transform = "translate3d(0," + (-((window.scrollY * 0.5) % tile)) + "px,0)";
      ticking = false;
    };
    window.addEventListener("scroll", function () {
      if (!ticking) { ticking = true; requestAnimationFrame(movePole); }
    }, { passive: true });
    movePole();
  }

  /* ---- parallax layers (rAF batched, A-tier) ---- */
  var pxEls = Array.prototype.slice.call(document.querySelectorAll("[data-parallax]"));
  if (pxEls.length && !reduced) {
    var pTick = false;
    var movePx = function () {
      pTick = false;
      var y = window.scrollY;
      pxEls.forEach(function (el) {
        var f = parseFloat(el.getAttribute("data-parallax")) || 0.1;
        el.style.transform = "translate3d(0," + (y * f).toFixed(1) + "px,0)";
      });
    };
    window.addEventListener("scroll", function () {
      if (!pTick) { pTick = true; requestAnimationFrame(movePx); }
    }, { passive: true });
  }

  /* ---- razor-cut reveals (clip-path transitions, S-tier) ---- */
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

  /* ---- clipper toggle: mechanical slide between categories ---- */
  var cBtns = Array.prototype.slice.call(document.querySelectorAll(".clipper-btn"));
  var thumb = document.querySelector(".clipper-thumb");
  var cats = Array.prototype.slice.call(document.querySelectorAll(".svc-cat"));
  var pickCat = function (btn) {
    cBtns.forEach(function (b) {
      var on = b === btn;
      b.classList.toggle("is-on", on);
      b.setAttribute("aria-pressed", on ? "true" : "false");
    });
    if (thumb) {
      thumb.style.width = btn.offsetWidth + "px";
      thumb.style.transform = "translateX(" + (btn.offsetLeft - 4) + "px)";
    }
    cats.forEach(function (c) {
      var on = c.getAttribute("data-cat") === btn.getAttribute("data-cat");
      c.classList.toggle("is-on", on);
      c.setAttribute("aria-hidden", on ? "false" : "true");
    });
  };
  if (cBtns.length) {
    cBtns.forEach(function (b) { b.addEventListener("click", function () { pickCat(b); }); });
    pickCat(cBtns[0]);
    window.addEventListener("resize", function () {
      var on = document.querySelector(".clipper-btn.is-on");
      if (on) pickCat(on);
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
    });
    mClose.addEventListener("click", closeModal);
    modal.addEventListener("click", function (e) { if (e.target === modal) closeModal(); });
    document.addEventListener("keydown", function (e) {
      if (e.key === "Escape" && !modal.hidden) closeModal();
    });
  }

  /* ---- testimonial marquee: WAAPI loop, decelerates on hover ---- */
  var track = document.getElementById("revTrack");
  if (track && !reduced) {
    var anim = track.animate(
      [{ transform: "translateX(0)" }, { transform: "translateX(-50%)" }],
      { duration: 46000, iterations: Infinity }
    );
    var rate = 1, target = 1;
    var lerp = function () {
      rate += (target - rate) * 0.08;
      anim.playbackRate = rate;
      if (Math.abs(target - rate) > 0.004) requestAnimationFrame(lerp);
    };
    track.addEventListener("mouseenter", function () { target = 0.25; requestAnimationFrame(lerp); });
    track.addEventListener("mouseleave", function () { target = 1; requestAnimationFrame(lerp); });
  }

  /* ---- magnetic buttons ---- */
  if (finePointer && !reduced) {
    document.querySelectorAll(".btn-solid, .btn-ghost, .clipper-btn").forEach(function (btn) {
      btn.addEventListener("pointermove", function (e) {
        var r = btn.getBoundingClientRect();
        var dx = (e.clientX - r.left - r.width / 2) * 0.22;
        var dy = (e.clientY - r.top - r.height / 2) * 0.28;
        btn.style.transform = "translate3d(" + dx.toFixed(1) + "px," + dy.toFixed(1) + "px,0)";
      });
      btn.addEventListener("pointerleave", function () {
        btn.style.transition = "transform .5s cubic-bezier(0.16, 1, 0.3, 1)";
        btn.style.transform = "";
        window.setTimeout(function () { btn.style.transition = ""; }, 520);
      });
    });
  }

  /* ---- mobile floating call bar ---- */
  var hero = document.querySelector(".hero");
  var floatCall = document.getElementById("floatCall");
  if (hero && floatCall) {
    if ("IntersectionObserver" in window) {
      new IntersectionObserver(function (entries) {
        entries.forEach(function (e) {
          floatCall.classList.toggle("up", !e.isIntersecting);
        });
      }, { rootMargin: "-60px 0px 0px 0px" }).observe(hero);
    }
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
