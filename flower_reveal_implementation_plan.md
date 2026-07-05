# Flower Reveal Animation — Implementation Plan

## Goal
Turn the existing static HTML/CSS prototype (`flower_reveal_template.html`) into a
production-quality, reusable animation component with smooth, professional motion
— not just opacity toggles. This will be reused across 7+ character variants, so
config-driven architecture matters as much as the animation quality itself.

Starting point: `flower_reveal_template.html` (attached/in repo). Use it as the
reference for asset roles and sequence logic, but treat the animation layer as
a rebuild, not a patch.

---

## Phase 0 — Setup
- [ ] Confirm project type: static site, React component, or Flutter web export?
      (Affects whether we use vanilla JS + GSAP, or a React wrapper.)
- [ ] Add **GSAP** (`gsap` + `ScrollTrigger` not needed here, just core + `TextPlugin`
      if available) as the animation engine. Reason: CSS `@keyframes` can't easily
      do easing curves like `power4.out`, staggered character reveals, or timeline
      sequencing/scrubbing — GSAP handles all of this with far less code and
      better performance than manual `requestAnimationFrame` loops.
- [ ] Folder structure:
  ```
  /flower-reveal/
    index.html
    /assets/
      background.png
      frame1.png ... frame10.png
      closeup-flower.png
    /src/
      config.js        <- per-character swappable data
      sequence.js       <- GSAP timeline logic
      styles.css
  ```

---

## Phase 1 — Config layer (reusability foundation)
- [ ] Extract everything project-specific into `config.js`:
  - `background`, `frames[10]`, `closeupFlower`
  - `titles[4]` (3 mid-sequence + 1 final)
  - `finalParagraph`
  - Optional: `accentColor` (for gradient/text tinting per character theme)
- [ ] Validate config on load (warn in console if fewer than 10 frames or fewer
      than 4 titles are provided) — since this will be reused by others, fail
      loudly instead of silently breaking.

---

## Phase 2 — Character frame sequencing (GSAP timeline)
- [ ] Replace the manual `setTimeout` loop with a single `gsap.timeline()`.
- [ ] Cross-fade frames instead of hard opacity swaps:
  - Each frame: `gsap.to(frame, {opacity: 1, duration: 0.25, ease: "power2.out"})`
    while previous frame fades out simultaneously.
- [ ] Add a very subtle `scale` pulse (1 → 1.02 → 1) on the frame that reveals
      the bouquet most (frame 8–10) to give it a "pop" moment — small enough to
      not look like a bounce, just a soft emphasis.
- [ ] Timeline should expose `.play()`, `.pause()`, `.restart()` so this can be
      triggered by a scroll position, button, or auto-play on load, depending on
      where it's embedded.

---

## Phase 3 — Title text animation (the "smooth title" upgrade)
Replace the linear slide-in with a proper entrance/exit motion:
- [ ] **Entrance:** split into two motions layered together for a premium feel:
  - Position: `x: -60 → 0` with `ease: "power4.out"` (fast start, soft landing —
    reads as elegant, not mechanical linear)
  - Opacity: `0 → 1`, slightly faster than the position tween so it doesn't feel
    delayed
  - Optional: slight blur-to-sharp (`filter: blur(6px) → blur(0px)`) for a
    cinematic focus-pull feel — supported via CSS filter + GSAP tweening it
- [ ] **Hold:** stay fully visible for the configured duration.
- [ ] **Exit:** fade + small upward drift (`y: 0 → -20`, opacity `1 → 0`,
      `ease: "power2.in"`) rather than just disappearing — makes it feel like
      text is "lifting away" rather than cutting out.
- [ ] Stagger option (nice-to-have): if a title has multiple words, animate
      each word in with a small stagger (`0.05s` apart) instead of the whole
      string moving as one block — reads more dynamic without being gimmicky.

---

## Phase 4 — Closeup ending scene
- [ ] Flower/character image slides in from the right (`x: 40 → 0`, fade in)
      as the gradient overlay fades in from the left simultaneously.
- [ ] Final title and paragraph animate in sequentially (title first, ~0.3s
      delay, then paragraph) using the same entrance style as Phase 3, so the
      whole piece feels consistent rather than having two different animation
      languages.
- [ ] This scene should be the last item in the master timeline, not a separate
      trigger — keeps everything scrubbable as one continuous timeline.

---

## Phase 5 — Master timeline assembly
- [ ] Combine Phases 2–4 into one `gsap.timeline()` so the whole sequence can be:
  - scrubbed by scroll position (if embedded in a landing page)
  - replayed on demand (e.g. tapping the animation again)
  - paused/resumed cleanly (important if this lives inside a Flutter WebView,
    since app lifecycle pauses may need to pause the timeline too)
- [ ] Add a small public API: `window.FlowerReveal.play(config)` so this can be
      dropped into any page and initialized with a different character's config
      without touching the animation code.

---

## Phase 6 — Polish & QA pass
- [ ] Test with at least 2 different character configs to confirm nothing is
      hardcoded (image sizes, text length, aspect ratio assumptions).
- [ ] Confirm long paragraph text doesn't overflow the gradient panel — add
      `overflow-wrap` and a max line count fallback.
- [ ] Test on mobile viewport width — gradient panel and image proportions
      likely need a stacked (top/bottom) layout below ~600px instead of
      left/right.
- [ ] Reduce motion: respect `prefers-reduced-motion` — fall back to simple
      opacity crossfades, skip the blur/scale flourishes, for accessibility.

---

## Phase 7 — Scene/background compositing system
New requirement: the character also needs to be composited into **standalone
background scenes** (e.g. the "Congratulations, Class of 2026" CMU gate
background), not just the flower-reveal sequence. Reference assets:
- `background-gate.jpg` — full scene background (gate, banner, courtyard)
- `character-position-reference.png` — shows the character already composited
  into that scene, used purely as a positioning guide (right side, standing on
  the walkway, roughly mid-to-lower-right third of frame)
- `Slice_1.svg` — defines the character's bounding box for this scene at
  **384×540** within a **1935×1080** canvas (i.e. the character occupies
  roughly 20% width / 50% height of the full background, anchored right side)

This confirms the system needs to support **multiple background scenes**, each
with its own character position, not just one fixed flower-reveal layout.

- [ ] Extend `config.js` to support a `scene` object per background:
  ```js
  scene: {
    background: "background-gate.jpg",
    canvasSize: { width: 1935, height: 1080 },   // reference resolution
    characterBox: { width: 384, height: 540 },    // from Slice_1.svg
    characterAnchor: { x: "right", y: "bottom" }, // matches reference image
    characterOffset: { x: -80, y: 0 }             // fine-tune px from anchor edge
  }
  ```
- [ ] Character position should be calculated as a **percentage of canvas size**,
      not fixed pixels, so the layout stays correct if the background is
      displayed at a different resolution/viewport than the 1935×1080 reference.
- [ ] Support N scenes per project (e.g. flower-reveal scene + graduation-gate
      scene) inside one config, so a single character can move through multiple
      backgrounds in one continuous timeline, or be used standalone per scene.
- [ ] Each scene entry should be able to reuse the Phase 3 title/paragraph
      animation system — e.g. the gate scene likely also wants a title or
      caption ("Congratulations, [Name]!") using the same entrance/exit motion
      already built for the flower sequence, for visual consistency across
      scenes.
- [ ] Verify pixel-art scaling: since these are pixel-art assets, ensure
      `image-rendering: pixelated` is applied so the character and background
      don't get blurred when scaled to different container sizes.

---

## Deliverable
A `/flower-reveal/` folder that:
1. Runs standalone via `index.html`
2. Takes a new character in under 2 minutes by editing only `config.js`
3. Uses GSAP timelines for all motion (no raw `setTimeout` chains)
4. Has consistent entrance/exit language across every text element
5. Degrades gracefully on mobile and for reduced-motion users
6. Supports multiple background scenes (flower-reveal, graduation-gate, and
   future scenes) with per-scene character positioning defined in config,
   reusing the same title/paragraph animation system across all of them
