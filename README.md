# The Real Barbershop — sample website

A concept rebuild of therealbarbershophenderson.com (Henderson, NV) for a client pitch.

**Design direction: "The Pole."** The identity comes from the striped barber pole outside
their own storefront at 259 N Pecos Rd: carbon chrome, bone paper, pole crimson and slate
blue, a scroll-linked barber pole running down the page edge, and oversized American
poster typography (Big Shoulders Display + Instrument Sans).

- Static HTML/CSS/JS, zero frameworks, zero third-party scripts
- Real Google listing photos, WebP-optimized, lazy-loaded below the fold
- Real reviews, real hours, real map, LocalBusiness schema markup
- Respects prefers-reduced-motion, keyboard-focus styles, responsive to mobile
- Page weight budget: fonts + 4 images + markup, no autoplay media

Deployed on GitHub Pages.

## Budgets (recorded 2026-11-05, first deploy)

- Page weight, first view: about 485 KB total (HTML 10, CSS 12, JS 2, favicon 1,
  hero image 185, web fonts ~276). Full scroll with all images: about 750 KB.
  Below-fold images lazy-loaded. No autoplay media, no third-party tags.
- Carbon baseline (Sustainable Web Design Model v4 estimate, from bytes transferred):
  well under 0.1 g CO2e per first view. Estimate from bytes, not audit-grade.
  Re-measure at next major deploy.
- Host: GitHub Pages, served through Fastly; listed green in the Green Web
  Foundation directory (greencheck 2026-11-05: green = true).

## Motion engine v2 build notes
- Parallax rides the browser's view() scroll timeline (viewport-relative, compositor thread); rAF fallback only where scroll timelines are missing, offset clamped, never scrollTop in a handler.
- Pole shimmer: rAF-throttled translate3d on one promoted layer. Reason: modulo tile cycling needs JS math; the layer is promoted by the 3D transform, no will-change used.
- Magnetic buttons: rAF lerped writes to transform. Reason: pointer-driven, no CSS equivalent; offsets capped at 10px, eased release.
- Card hot-towel blur is 6px (under the 10px blur budget), one small image layer per card.
- Review marquee: WAAPI on the compositor; the duplicated track is one wide layer (~3,600px), accepted trade-off; playbackRate hover easing silently loses acceleration on Safari (hover only).
- Modal, reveals, category crossfades and the floating call bar are pure CSS transitions on transform/opacity/clip-path.
- All photos are distinct: no image appears twice on the page. Pricing was removed entirely at the owner's request.
