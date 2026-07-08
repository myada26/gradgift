/**
 * ScrollReveal — scroll-scrubbed text reveal (container rotation settle +
 * per-word opacity/blur), ported from the React Bits ScrollReveal component
 * to this project's plain window-global module style. Depends on gsap +
 * ScrollTrigger (already loaded via CDN in index.html).
 *
 * Public API (window.ScrollReveal):
 *   buildWordElements(mountEl, text, opts) -> refs   refs = { container, textEl, words }
 *     Builds the DOM only (container + word spans) — no animation, no
 *     ScrollTrigger. Use this when another timeline (e.g. a scene's
 *     character-frame crossfade) needs to drive this reveal in lockstep.
 *
 *   addToTimeline(tl, refs, opts, position) -> tl
 *     Adds the rotation/opacity/blur tweens for `refs` onto an existing gsap
 *     timeline at `position`, so its progress is driven by whatever single
 *     ScrollTrigger controls `tl` — no separate trigger of its own.
 *
 *   create(mountEl, text, opts) -> controller   controller = { element, destroy() }
 *     Standalone convenience: builds the words and wires up its own
 *     ScrollTrigger-scrubbed tweens, for use outside of a shared timeline.
 *
 * opts (buildWordElements): { containerClassName, textClassName }
 * opts (addToTimeline / create): {
 *   scrollContainer,    // create() only — DOM element to scroll within, defaults to window
 *   enableBlur,         // default true
 *   baseOpacity,        // default 0.1
 *   baseRotation,       // default 3
 *   blurStrength,       // default 4
 *   duration,           // addToTimeline only — tween duration in timeline seconds, default 1
 *   rotationEnd,        // create() only — default "bottom bottom"
 *   wordAnimationEnd,   // create() only — default "bottom bottom"
 * }
 */

(function (global) {
  "use strict";

  if (typeof global.gsap === "undefined") {
    console.error("[ScrollReveal] GSAP was not found on window. Load gsap before scroll-reveal.js.");
    return;
  }
  const gsap = global.gsap;

  if (typeof global.ScrollTrigger === "undefined") {
    console.error("[ScrollReveal] ScrollTrigger was not found on window. Load gsap/ScrollTrigger before scroll-reveal.js.");
    return;
  }
  gsap.registerPlugin(global.ScrollTrigger);

  /**
   * Splits a message into lyric lines. Accepts an array (used verbatim), a
   * string with explicit newlines (split on them — this is how a commission
   * controls its own phrasing), or a single run of prose (split into sentences
   * as a sensible fallback). Empty lines are dropped.
   */
  function splitTextToLines(text) {
    if (Array.isArray(text)) {
      return text.map((s) => String(s).trim()).filter(Boolean);
    }
    const raw = String(text == null ? "" : text);
    if (raw.indexOf("\n") !== -1) {
      return raw.split(/\n+/).map((s) => s.trim()).filter(Boolean);
    }
    const sentences = raw.match(/[^.!?]+[.!?]*/g);
    return (sentences || [raw]).map((s) => s.trim()).filter(Boolean);
  }

  /**
   * Builds the lyrics DOM: a fixed-height viewport (.fr-lyrics) clipping a
   * translated stack (.fr-lyrics-track) of per-line elements. No animation or
   * measurement here — addLyricsToTimeline drives it. Returns
   * { container, track, lineEls }.
   */
  function buildLyricElements(mountEl, text, opts) {
    opts = opts || {};
    mountEl.innerHTML = "";
    mountEl.classList.add("fr-lyrics");
    if (opts.containerClassName) {
      opts.containerClassName.split(/\s+/).filter(Boolean).forEach((c) => mountEl.classList.add(c));
    }

    const track = document.createElement("div");
    track.className = "fr-lyrics-track";
    mountEl.appendChild(track);

    const lineEls = splitTextToLines(text).map((line) => {
      const p = document.createElement("p");
      p.className = ["fr-lyric-line", opts.lineClassName].filter(Boolean).join(" ");
      p.textContent = line;
      track.appendChild(p);
      return p;
    });

    return { container: mountEl, track, lineEls };
  }

  /**
   * Drives a Spotify-style synced lyric reveal onto an existing scrubbed
   * timeline. One proxy tween spans a FIXED number of timeline-seconds (`span`,
   * independent of how many lines there are — long messages don't lengthen the
   * scroll), and a single onUpdate does all the work: translate the stack so the
   * active line sits at the viewport's focal point, and set each line's
   * opacity/blur by its distance from active. Only transform/opacity/filter are
   * touched (compositor-friendly); offsets are measured once and cached,
   * re-measured only on resize / font load — never during scrub — so scrubbing
   * stays allocation- and layout-free for 60fps.
   */
  function addLyricsToTimeline(tl, refs, opts, position, span) {
    opts = opts || {};
    position = position != null ? position : 0;
    span = span != null && span > 0 ? span : 1;
    const { container, track, lineEls } = refs;
    const N = lineEls.length;
    if (!N) return tl;

    const dimOpacity = opts.dimOpacity != null ? opts.dimOpacity : 0.22;
    const enableBlur = opts.enableBlur !== false;
    const blurStrength = opts.blurStrength != null ? opts.blurStrength : 5;

    let centers = null;
    let dirty = true;

    function measure() {
      centers = lineEls.map((el) => el.offsetTop + el.offsetHeight / 2);
      dirty = false;
    }

    function render(p) {
      if (dirty || !centers) measure();
      const active = N > 1 ? p * (N - 1) : 0;

      // Keep the active line centered in the fixed viewport.
      const focal = container.clientHeight / 2;
      const i0 = Math.floor(active);
      const i1 = Math.min(N - 1, i0 + 1);
      const frac = active - i0;
      const center = centers[i0] + (centers[i1] - centers[i0]) * frac;
      track.style.transform = `translate3d(0, ${(focal - center).toFixed(2)}px, 0)`;

      for (let i = 0; i < N; i++) {
        const d = Math.abs(i - active);
        let opacity;
        let blur;
        if (d < 1) {
          opacity = dimOpacity + (1 - dimOpacity) * (1 - d);
          blur = enableBlur ? blurStrength * d : 0;
        } else {
          opacity = dimOpacity;
          blur = enableBlur ? blurStrength : 0;
        }
        const el = lineEls[i];
        el.style.opacity = opacity.toFixed(3);
        if (enableBlur) el.style.filter = blur > 0.05 ? `blur(${blur.toFixed(2)}px)` : "none";
      }
    }

    const invalidate = () => {
      dirty = true;
    };
    global.addEventListener("resize", invalidate, { passive: true });
    if (global.ScrollTrigger && global.ScrollTrigger.addEventListener) {
      global.ScrollTrigger.addEventListener("refresh", invalidate);
    }
    if (global.document && global.document.fonts && global.document.fonts.ready) {
      global.document.fonts.ready.then(() => {
        invalidate();
        render(0);
      });
    }

    render(0);
    const proxy = { p: 0 };
    tl.to(proxy, { p: 1, duration: span, ease: "none", onUpdate: () => render(proxy.p) }, position);

    return tl;
  }

  function buildWordNodes(text) {
    return text.split(/(\s+)/).map((chunk) => {
      if (/^\s+$/.test(chunk)) return document.createTextNode(chunk);
      const span = document.createElement("span");
      span.className = "word";
      span.textContent = chunk;
      return span;
    });
  }

  function buildWordElements(mountEl, text, opts) {
    opts = opts || {};

    mountEl.innerHTML = "";
    mountEl.classList.add("scroll-reveal");
    if (opts.containerClassName) {
      opts.containerClassName.split(/\s+/).filter(Boolean).forEach((c) => mountEl.classList.add(c));
    }

    const textEl = document.createElement("p");
    textEl.className = ["scroll-reveal-text", opts.textClassName].filter(Boolean).join(" ");
    buildWordNodes(text).forEach((node) => textEl.appendChild(node));
    mountEl.appendChild(textEl);

    return { container: mountEl, textEl, words: textEl.querySelectorAll(".word") };
  }

  function addToTimeline(tl, refs, opts, position) {
    opts = opts || {};
    position = position != null ? position : 0;
    const enableBlur = opts.enableBlur !== false;
    const baseOpacity = opts.baseOpacity != null ? opts.baseOpacity : 0.1;
    const baseRotation = opts.baseRotation != null ? opts.baseRotation : 3;
    const blurStrength = opts.blurStrength != null ? opts.blurStrength : 4;
    const duration = opts.duration != null ? opts.duration : 1;
    const { container, words } = refs;

    gsap.set(container, { transformOrigin: "0% 50%" });
    tl.fromTo(container, { rotate: baseRotation }, { rotate: 0, duration, ease: "none" }, position);
    tl.fromTo(
      words,
      { opacity: baseOpacity, willChange: "opacity" },
      { opacity: 1, duration, ease: "none", stagger: 0.05 },
      position
    );
    if (enableBlur) {
      tl.fromTo(
        words,
        { filter: `blur(${blurStrength}px)` },
        { filter: "blur(0px)", duration, ease: "none", stagger: 0.05 },
        position
      );
    }

    return tl;
  }

  function create(mountEl, text, opts) {
    opts = opts || {};
    const rotationEnd = opts.rotationEnd || "bottom bottom";
    const wordAnimationEnd = opts.wordAnimationEnd || "bottom bottom";
    const scroller = opts.scrollContainer || global;

    const refs = buildWordElements(mountEl, text, opts);
    const { container, words } = refs;
    const baseRotation = opts.baseRotation != null ? opts.baseRotation : 3;
    const baseOpacity = opts.baseOpacity != null ? opts.baseOpacity : 0.1;
    const blurStrength = opts.blurStrength != null ? opts.blurStrength : 4;
    const enableBlur = opts.enableBlur !== false;

    gsap.fromTo(
      container,
      { transformOrigin: "0% 50%", rotate: baseRotation },
      {
        ease: "none",
        rotate: 0,
        scrollTrigger: { trigger: container, scroller, start: "top bottom", end: rotationEnd, scrub: true },
      }
    );

    gsap.fromTo(
      words,
      { opacity: baseOpacity, willChange: "opacity" },
      {
        ease: "none",
        opacity: 1,
        stagger: 0.05,
        scrollTrigger: { trigger: container, scroller, start: "top bottom-=20%", end: wordAnimationEnd, scrub: true },
      }
    );

    if (enableBlur) {
      gsap.fromTo(
        words,
        { filter: `blur(${blurStrength}px)` },
        {
          ease: "none",
          filter: "blur(0px)",
          stagger: 0.05,
          scrollTrigger: { trigger: container, scroller, start: "top bottom-=20%", end: wordAnimationEnd, scrub: true },
        }
      );
    }

    return {
      element: container,
      // Scoped to this instance's own triggers only — killing ScrollTrigger.getAll()
      // globally would tear down any other scene's ScrollTrigger sharing the page.
      destroy: () => {
        global.ScrollTrigger.getAll().forEach((trigger) => {
          if (trigger.trigger === container) trigger.kill();
        });
      },
    };
  }

  global.ScrollReveal = {
    buildWordElements,
    addToTimeline,
    create,
    // Spotify-style synced lyric reveal (fixed scroll-length, long-message safe)
    splitTextToLines,
    buildLyricElements,
    addLyricsToTimeline,
  };
})(window);
