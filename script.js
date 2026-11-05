/* The Real Barbershop — interactions. No frameworks, no dependencies. */
(function () {
  "use strict";
  var reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  if (window.location.search.indexOf("nomotion") !== -1) {
    document.documentElement.classList.add("no-anim");
    reduced = true;
  }

  /* ---- scroll-linked barber pole ---- */
  var pole = document.querySelector(".pole");
  if (pole && !reduced) {
    var ticking = false;
    var move = function () {
      pole.style.backgroundPosition = "0 " + (-window.scrollY * 0.35 % 200) + "px";
      ticking = false;
    };
    window.addEventListener("scroll", function () {
      if (!ticking) { ticking = true; requestAnimationFrame(move); }
    }, { passive: true });
    move();
  }

  /* ---- reveal on scroll ---- */
  var revealEls = document.querySelectorAll("[data-reveal]");
  if ("IntersectionObserver" in window && !reduced) {
    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (e) {
        if (e.isIntersecting) { e.target.classList.add("in"); io.unobserve(e.target); }
      });
    }, { threshold: 0.18, rootMargin: "0px 0px -40px 0px" });
    revealEls.forEach(function (el) { io.observe(el); });
  } else {
    revealEls.forEach(function (el) { el.classList.add("in"); });
  }

  /* ---- service rows: hover on desktop expands + swaps photo, tap on mobile ---- */
  var rows = Array.prototype.slice.call(document.querySelectorAll(".svc"));
  var imgs = Array.prototype.slice.call(document.querySelectorAll(".svc-panel img"));
  var desktop = window.matchMedia("(min-width: 901px)");

  var openRow = function (row) {
    rows.forEach(function (r) {
      var on = r === row;
      r.classList.toggle("open", on);
      r.querySelector(".svc-head").setAttribute("aria-expanded", on ? "true" : "false");
    });
    var idx = row.getAttribute("data-img");
    imgs.forEach(function (img, i) { img.classList.toggle("on", String(i) === idx); });
  };

  rows.forEach(function (row) {
    row.addEventListener(desktop.matches ? "mouseenter" : "click", function () { openRow(row); });
    row.querySelector(".svc-head").addEventListener("click", function () { openRow(row); });
  });
  /* default: first photo shows, no row pre-opened */
  if (imgs[0]) imgs[0].classList.add("on");

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
