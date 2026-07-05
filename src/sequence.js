/**
 * GSAP timeline engine — Phases 2 through 8.
 *
 * This file owns both DOM construction (render*) and motion (build*Timeline) for
 * a character. config.js supplies data only; nothing here is character-specific.
 *
 * Public API (window.FlowerReveal):
 *   create(mountEl, config, opts)                 -> controller   (Phases 2-5)
 *   createScene(mountEl, sceneConfig, config, opts) -> controller  (Phase 8 — layered full-bleed scene)
 *   chain(...controllers)                          -> controller  (one continuous timeline)
 *   play(mountEl, config, opts)                     -> controller  (create + autoplay, per the plan's literal API ask)
 *
 * controller = { timeline, play(), pause(), restart(), seekProgress(0..1), destroy() }
 */

(function (global) {
  "use strict";

  if (typeof global.gsap === "undefined") {
    console.error("[FlowerReveal] GSAP was not found on window. Load gsap before sequence.js.");
    return;
  }
  const gsap = global.gsap;

  function prefersReducedMotion() {
    return !!(global.matchMedia && global.matchMedia("(prefers-reduced-motion: reduce)").matches);
  }

  function splitWords(el) {
    const words = el.textContent.split(/\s+/).filter(Boolean);
    el.textContent = "";
    return words.map((word, i) => {
      const span = document.createElement("span");
      span.className = "fr-word";
      span.textContent = word + (i < words.length - 1 ? " " : "");
      el.appendChild(span);
      return span;
    });
  }

  /**
   * Entrance/hold/exit for a single title-like element (Phase 3), added onto an
   * existing timeline at an explicit position (usually a frame label).
   * opts: { hold, position, stagger, noExit }
   */
  function addTitleAnimation(tl, el, opts) {
    opts = opts || {};
    const reduced = prefersReducedMotion();
    const hold = opts.hold != null ? opts.hold : 1.2;
    const doStagger = !!opts.stagger && !reduced;
    const position = opts.position != null ? opts.position : "+=0";
    const noExit = !!opts.noExit;

    const targets = doStagger ? splitWords(el) : el;

    tl.set(el, { display: "block" }, position);
    gsap.set(targets, { opacity: 0 });

    if (reduced) {
      tl.to(targets, { opacity: 1, duration: 0.3, ease: "none", stagger: doStagger ? 0.04 : 0 }, position);
    } else {
      // position/blur settle in slightly slower than opacity so it doesn't read as "delayed"
      tl.fromTo(
        targets,
        { x: -60, filter: "blur(6px)" },
        { x: 0, filter: "blur(0px)", duration: 0.7, ease: "power4.out", stagger: doStagger ? 0.05 : 0 },
        position
      );
      tl.to(targets, { opacity: 1, duration: 0.45, ease: "power2.out", stagger: doStagger ? 0.05 : 0 }, position);
    }

    if (!noExit) {
      const exitPosition = `${position}+=${hold}`;
      if (reduced) {
        tl.to(targets, { opacity: 0, duration: 0.3, ease: "none" }, exitPosition);
      } else {
        tl.to(
          targets,
          { y: -20, opacity: 0, duration: 0.5, ease: "power2.in", stagger: doStagger ? 0.04 : 0 },
          exitPosition
        );
      }
      tl.set(el, { display: "none" }, `${exitPosition}+=0.6`);
    }

    return tl;
  }

  /**
   * Phase 2 — advances frameEls in sequence (crossfaded, or a hard cut when
   * opts.hardCut is set), adds a subtle scale "pop" on the last three frames,
   * and leaves labels frame1..frameN plus a trailing label (opts.endLabel,
   * default "closeup") for the rest of the timeline to hook into.
   * Reused as-is for the standalone flower-reveal stage (Phase 2-5) and for a
   * frame-sequence character composited directly inside a scene (Phase 7).
   */
  function buildFrameCrossfade(tl, frameEls, opts) {
    const reduced = opts.reduced;
    const holdDuration = opts.holdDuration;
    const endLabel = opts.endLabel || "closeup";
    // hardCut: swap frames instantly (no opacity fade) — reads better for scroll-scrubbing,
    // where a crossfade can look muddy when the user scrolls back and forth quickly.
    const fadeDuration = opts.hardCut ? 0 : reduced ? 0.25 : 0.4;

    gsap.set(frameEls, { opacity: 0, scale: 1 });
    gsap.set(frameEls[0], { opacity: 1 });
    tl.addLabel("frame1", 0);

    for (let i = 1; i < frameEls.length; i++) {
      const frameNum = i + 1;
      const label = `frame${frameNum}`;
      const prevLabel = `frame${frameNum - 1}`;
      tl.addLabel(label, `${prevLabel}+=${holdDuration}`);
      tl.to(frameEls[i - 1], { opacity: 0, duration: fadeDuration, ease: "power2.out" }, label);
      tl.to(frameEls[i], { opacity: 1, duration: fadeDuration, ease: "power2.out" }, label);

      if (!reduced && frameNum >= 8) {
        tl.to(frameEls[i], { scale: 1.02, duration: 0.3, ease: "power1.out" }, label);
        tl.to(frameEls[i], { scale: 1, duration: 0.35, ease: "power1.inOut" }, `${label}+=0.3`);
      }
    }

    tl.addLabel(endLabel, `frame${frameEls.length}+=${holdDuration}`);
  }

  function renderReveal(mountEl, config) {
    mountEl.innerHTML = "";
    mountEl.classList.add("fr-stage");
    mountEl.style.setProperty("--fr-accent", config.accentColor || "#ff6fae");

    const bg = document.createElement("img");
    bg.className = "fr-bg";
    bg.src = config.reveal.background;
    bg.alt = "";
    mountEl.appendChild(bg);

    const frameLayer = document.createElement("div");
    frameLayer.className = "fr-frame-layer";
    const frameEls = config.reveal.frames.map((src) => {
      const img = document.createElement("img");
      img.className = "fr-frame";
      img.src = src;
      img.alt = "";
      frameLayer.appendChild(img);
      return img;
    });
    mountEl.appendChild(frameLayer);

    const titleLayer = document.createElement("div");
    titleLayer.className = "fr-title-layer";
    const titleEls = config.reveal.titles.slice(0, 3).map((title) => {
      const h2 = document.createElement("h2");
      h2.className = "fr-title";
      h2.textContent = title.text;
      titleLayer.appendChild(h2);
      return h2;
    });
    mountEl.appendChild(titleLayer);

    const closeupEl = document.createElement("div");
    closeupEl.className = "fr-closeup";

    const gradientEl = document.createElement("div");
    gradientEl.className = "fr-closeup-gradient";

    const textWrap = document.createElement("div");
    textWrap.className = "fr-closeup-text";
    const finalTitleEl = document.createElement("h2");
    finalTitleEl.className = "fr-final-title";
    finalTitleEl.textContent = config.reveal.finalTitle.text;
    const finalParagraphEl = document.createElement("p");
    finalParagraphEl.className = "fr-final-paragraph";
    finalParagraphEl.textContent = config.reveal.finalParagraph;
    textWrap.appendChild(finalTitleEl);
    textWrap.appendChild(finalParagraphEl);
    gradientEl.appendChild(textWrap);

    const closeupImageEl = document.createElement("img");
    closeupImageEl.className = "fr-closeup-image";
    closeupImageEl.src = config.reveal.closeupFlower;
    closeupImageEl.alt = "";

    closeupEl.appendChild(gradientEl);
    closeupEl.appendChild(closeupImageEl);
    mountEl.appendChild(closeupEl);

    return { bg, frameEls, titleEls, closeupEl, gradientEl, closeupImageEl, finalTitleEl, finalParagraphEl };
  }

  function buildRevealTimeline(elements, config) {
    const { frameEls, titleEls, closeupEl, gradientEl, closeupImageEl, finalTitleEl, finalParagraphEl } = elements;
    const reduced = prefersReducedMotion();
    const tl = gsap.timeline({ paused: true });

    buildFrameCrossfade(tl, frameEls, { holdDuration: reduced ? 0.35 : 0.6, reduced });

    const midTitlePositions = ["frame3", "frame6", "frame9"];
    config.reveal.titles.slice(0, 3).forEach((title, i) => {
      addTitleAnimation(tl, titleEls[i], {
        hold: title.hold != null ? title.hold : 1.2,
        position: midTitlePositions[i] || "closeup",
        stagger: !!title.stagger,
      });
    });

    tl.set(closeupEl, { display: "flex" }, "closeup");
    if (reduced) {
      tl.fromTo([gradientEl, closeupImageEl], { opacity: 0 }, { opacity: 1, duration: 0.4, ease: "none" }, "closeup");
    } else {
      tl.fromTo(closeupImageEl, { x: 40, opacity: 0 }, { x: 0, opacity: 1, duration: 0.8, ease: "power3.out" }, "closeup");
      tl.fromTo(
        gradientEl,
        { xPercent: -100, opacity: 0 },
        { xPercent: 0, opacity: 1, duration: 0.8, ease: "power3.out" },
        "closeup"
      );
    }

    addTitleAnimation(tl, finalTitleEl, { position: "closeup+=0.3", noExit: true, stagger: true });
    addTitleAnimation(tl, finalParagraphEl, { position: "closeup+=0.6", noExit: true });

    return tl;
  }

  /**
   * Phase 8 — full-bleed layered scene: a static background backdrop, a
   * character pinned to the viewport bottom, and a left-side gradient panel
   * holding the scroll-reveal text. All three are positioned directly in
   * viewport units (vh/vw/%), so there's no canvas-fitting/letterboxing step —
   * they scale with the viewport on their own via CSS.
   */
  function renderScene(mountEl, sceneConfig, config) {
    mountEl.innerHTML = "";
    mountEl.classList.add("fr-scene");
    mountEl.style.setProperty("--fr-accent", (config && config.accentColor) || "#ff6fae");
    mountEl.style.setProperty("--gradient-color", sceneConfig.gradientColor || "#ffffff");
    mountEl.style.setProperty("--fr-char-left", sceneConfig.characterLeft || "67%");
    mountEl.style.setProperty("--fr-char-height", sceneConfig.characterHeight || "78vh");
    if (sceneConfig.characterAspect) {
      mountEl.style.setProperty(
        "--fr-char-aspect",
        `${sceneConfig.characterAspect.width} / ${sceneConfig.characterAspect.height}`
      );
    }

    // Layer 1 — background: pure static backdrop, no animation, no text tied to it
    const bgLayer = document.createElement("div");
    bgLayer.className = "fr-bg-layer";
    bgLayer.style.backgroundImage = `url("${sceneConfig.background}")`;
    mountEl.appendChild(bgLayer);

    // Layer 2 — character: pinned to the bottom, ~65-70% from the left
    const charLayer = document.createElement("div");
    charLayer.className = "fr-char-layer";
    let characterEl = null;
    let characterEls = null;
    if (Array.isArray(sceneConfig.characterFrames) && sceneConfig.characterFrames.length) {
      characterEls = sceneConfig.characterFrames.map((src) => {
        const img = document.createElement("img");
        img.className = "fr-char-frame";
        img.src = src;
        img.alt = "";
        charLayer.appendChild(img);
        return img;
      });
    } else if (sceneConfig.character) {
      characterEl = document.createElement("img");
      characterEl.className = "fr-char-frame";
      characterEl.src = sceneConfig.character;
      characterEl.alt = "";
      charLayer.appendChild(characterEl);
    }
    mountEl.appendChild(charLayer);

    // Layer 3 — left gradient overlay: an optional header stack (header1 is the
    // largest) plus the scroll-reveal paragraph, above the character. Hidden
    // until buildSceneTimeline reveals it (in lockstep with header1/2/3 and the
    // reveal text) once the character animation finishes.
    let reveal = null;
    let gradientLayer = null;
    let h1El = null;
    let h2El = null;
    let h3El = null;
    const hasHeaders = sceneConfig.header1 || sceneConfig.header2 || sceneConfig.header3;
    if (hasHeaders || sceneConfig.revealText) {
      gradientLayer = document.createElement("div");
      gradientLayer.className = "fr-gradient-layer";

      const panel = document.createElement("div");
      panel.className = "fr-gradient-panel";
      gradientLayer.appendChild(panel);

      if (sceneConfig.header1) {
        h1El = document.createElement("h1");
        h1El.className = "fr-header-1";
        h1El.textContent = sceneConfig.header1;
        panel.appendChild(h1El);
      }
      if (sceneConfig.header2) {
        h2El = document.createElement("h2");
        h2El.className = "fr-header-2";
        h2El.textContent = sceneConfig.header2;
        panel.appendChild(h2El);
      }
      if (sceneConfig.header3) {
        h3El = document.createElement("h3");
        h3El.className = "fr-header-3";
        h3El.textContent = sceneConfig.header3;
        panel.appendChild(h3El);
      }

      if (sceneConfig.revealText) {
        if (!global.ScrollReveal) {
          console.error("[FlowerReveal] sceneConfig.revealText set but window.ScrollReveal is missing. Load scroll-reveal.js before sequence.js.");
        } else {
          const textMount = document.createElement("div");
          panel.appendChild(textMount);
          reveal = global.ScrollReveal.buildWordElements(textMount, sceneConfig.revealText, {
            textClassName: "fr-gradient-text",
          });
        }
      }

      mountEl.appendChild(gradientLayer);
    }

    return { characterEl, characterEls, reveal, gradientLayer, h1El, h2El, h3El };
  }

  /**
   * Entrance-only fade+slide+blur (no exit — these are terminal/closing
   * elements). Same visual language as addTitleAnimation but lets the caller
   * pick the resting opacity, since header3 is intentionally dimmer (0.85).
   */
  function animateEntrance(tl, el, opts) {
    const reduced = prefersReducedMotion();
    const position = opts.position;
    const finalOpacity = opts.finalOpacity != null ? opts.finalOpacity : 1;

    tl.set(el, { display: "block" }, position);
    if (reduced) {
      tl.fromTo(el, { opacity: 0 }, { opacity: finalOpacity, duration: 0.3, ease: "none" }, position);
    } else {
      tl.fromTo(el, { x: -60, filter: "blur(6px)" }, { x: 0, filter: "blur(0px)", duration: 0.7, ease: "power4.out" }, position);
      tl.fromTo(el, { opacity: 0 }, { opacity: finalOpacity, duration: 0.45, ease: "power2.out" }, position);
    }
  }

  /**
   * One combined timeline, staged sequentially: the character's frame
   * crossfade finishes first, then the reveal text's rotation/opacity/blur
   * tweens start at the "end" label — a single ScrollTrigger still scrubs
   * the whole thing, but scrolling through the character phase doesn't
   * simultaneously animate the text (and vice versa).
   */
  function buildSceneTimeline(elements, sceneConfig) {
    const reduced = prefersReducedMotion();
    const tl = gsap.timeline({ paused: true });
    const { characterEl, characterEls, reveal, gradientLayer, h1El, h2El, h3El } = elements;

    tl.addLabel("start", 0);

    if (characterEls) {
      buildFrameCrossfade(tl, characterEls, {
        holdDuration: reduced ? 0.35 : 0.6,
        reduced,
        endLabel: "end",
        hardCut: sceneConfig.frameTransition === "cut",
      });
    } else if (characterEl) {
      const duration = reduced ? 0.4 : 0.8;
      tl.fromTo(
        characterEl,
        { opacity: 0 },
        { opacity: 1, duration, ease: reduced ? "none" : "power3.out" },
        "start"
      );
      tl.addLabel("end", duration);
    } else {
      tl.addLabel("end", 0);
    }

    // Gradient panel + headers come in together, all at "end" — same moment the
    // reveal text below starts, so nothing in the text panel appears early.
    if (gradientLayer) {
      if (reduced) {
        tl.fromTo(gradientLayer, { opacity: 0 }, { opacity: 1, duration: 0.4, ease: "none" }, "end");
      } else {
        tl.fromTo(
          gradientLayer,
          { xPercent: -100, opacity: 0 },
          { xPercent: 0, opacity: 1, duration: 0.8, ease: "power3.out" },
          "end"
        );
      }
    }
    if (h1El) animateEntrance(tl, h1El, { position: "end", finalOpacity: 1 });
    if (h2El) animateEntrance(tl, h2El, { position: "end", finalOpacity: 1 });
    if (h3El) animateEntrance(tl, h3El, { position: "end", finalOpacity: 0.85 });

    if (reveal) {
      const totalDuration = tl.labels.end || 1;
      global.ScrollReveal.addToTimeline(
        tl,
        reveal,
        { duration: totalDuration, enableBlur: !reduced, baseRotation: reduced ? 0 : 5, blurStrength: 10 },
        "end"
      );
    }

    return tl;
  }

  /** Wraps a raw gsap.timeline() with the play/pause/restart/seek/destroy surface and lifecycle pausing. */
  function makeController(tl, opts) {
    opts = opts || {};
    function onVisibilityChange() {
      if (document.hidden) tl.pause();
      else if (opts.autoResume) tl.play();
    }
    document.addEventListener("visibilitychange", onVisibilityChange);

    return {
      timeline: tl,
      play: () => tl.play(),
      pause: () => tl.pause(),
      restart: () => tl.restart(),
      seekProgress: (p) => tl.progress(Math.min(1, Math.max(0, p))).pause(),
      destroy: () => {
        document.removeEventListener("visibilitychange", onVisibilityChange);
        tl.kill();
      },
    };
  }

  function create(mountEl, config, opts) {
    const { errors } = global.validateCharacterConfig ? global.validateCharacterConfig(config) : { errors: [] };
    if (errors && errors.length) {
      console.error(`[FlowerReveal] rendering "${config && config.id}" despite config errors above — expect visual bugs.`);
    }
    const elements = renderReveal(mountEl, config);
    const tl = buildRevealTimeline(elements, config);
    const controller = makeController(tl, opts);
    if (opts && opts.autoplay) controller.play();
    return controller;
  }

  function createScene(mountEl, sceneConfig, config, opts) {
    const elements = renderScene(mountEl, sceneConfig, config);
    const tl = buildSceneTimeline(elements, sceneConfig);
    const controller = makeController(tl, opts);
    if (opts && opts.autoplay) controller.play();
    return controller;
  }

  /** Sequences multiple controllers' timelines back-to-back into one continuous, scrubbable timeline. */
  function chain(...controllers) {
    const tl = gsap.timeline({ paused: true });
    controllers.forEach((c) => tl.add(c.timeline));
    return makeController(tl, {});
  }

  /** Convenience wrapper matching the plan's literal `FlowerReveal.play(config)` API ask. */
  function play(mountEl, config, opts) {
    return create(mountEl, config, Object.assign({ autoplay: true }, opts));
  }

  global.FlowerReveal = { create, createScene, chain, play };
})(window);
