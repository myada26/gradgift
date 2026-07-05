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

  global.ScrollReveal = { buildWordElements, addToTimeline, create };
})(window);
