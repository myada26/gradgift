/**
 * Shared bootstrap for each person's page (nicole.html, dj.html, kc.html,
 * andrea.html, cyrill.html, arrianne.html, ...). These were identical copies
 * of the same inline script — this is that logic in one place, parameterized
 * by character id, so a fix here applies to every page instead of needing to
 * be repeated.
 *
 * Public API (window.FlowerRevealPage):
 *   init(characterId) -> Promise<controller>
 *
 * Expects the page to provide:
 *   <div id="scene-mount" class="fr-scene fr-scene--fullbleed"></div>
 *   <div class="fr-scroll-spacer"></div>
 * and to have already loaded gsap, ScrollTrigger, config.js, scroll-reveal.js,
 * sequence.js, and assets/<characterId>/content.js (which sets
 * window.FlowerRevealContent) before this script.
 *
 * Content used to be fetched from content.json at runtime, but fetch() of a
 * file:// URL is blocked by the browser — opening one of these pages by
 * double-clicking it (instead of through a local server) silently dropped the
 * whole header/reveal-text layer. content.js is a plain <script> include, so
 * it works identically under file:// and http(s)://, no server required.
 */

(function (global) {
  "use strict";

  // Basic client-side gate: index.html sets this in sessionStorage once a
  // valid code is submitted. It only stops someone from guessing/bookmarking
  // a person's URL directly — the destinations are still visible in
  // src/codes.js, so this isn't real access control, just a speed bump.
  const GATE_KEY = "frGrantedCharacter";

  /**
   * Background music, shared across every character page. Plays automatically
   * on load — no toggle/mute button by design. A user-initiated portal
   * navigation (form submit) usually satisfies the browser's autoplay gesture
   * requirement, but if it's still blocked, playback silently starts on the
   * first interaction (scrolling to reveal counts) instead of showing a control.
   */
  function playBackgroundMusic() {
    const audio = new Audio("assets/bg_music.mp3");
    audio.loop = true;
    audio.volume = 0.5;

    const attempt = () => audio.play();
    attempt().catch(() => {
      const resume = () => {
        attempt().catch(() => {});
      };
      ["pointerdown", "keydown", "touchstart", "scroll"].forEach((evt) =>
        document.addEventListener(evt, resume, { once: true, passive: true })
      );
    });

    return audio;
  }

  // Replaces the native scrollbar with a pixel-styled progress rail, since the
  // fixed full-bleed scene would otherwise leave the OS scrollbar floating
  // unstyled over the art. Driven by the same ScrollTrigger as the reveal.
  function createScrollRail() {
    document.documentElement.classList.add("fr-scroll-rail-active");

    const rail = document.createElement("div");
    rail.className = "fr-scroll-rail";

    const fill = document.createElement("div");
    fill.className = "fr-scroll-rail__fill";

    const thumb = document.createElement("div");
    thumb.className = "fr-scroll-rail__thumb";

    const label = document.createElement("div");
    label.className = "fr-scroll-rail__label";
    label.textContent = "0%";

    rail.append(fill, thumb, label);
    document.body.appendChild(rail);

    let lastPercent = -1;
    return {
      update(progress) {
        rail.style.setProperty("--fr-scroll-progress", progress);
        const percent = Math.round(progress * 100);
        if (percent !== lastPercent) {
          lastPercent = percent;
          label.textContent = `${percent}%`;
        }
      },
    };
  }

  function showLoadWarning(characterId, detail) {
    const banner = document.createElement("div");
    banner.textContent =
      `Couldn't find window.FlowerRevealContent, so the headline and reveal text are missing ` +
      `(the character animation still works). Make sure assets/${characterId}/content.js is present ` +
      `and included with a <script> tag before page-bootstrap.js. (${detail})`;
    Object.assign(banner.style, {
      position: "fixed",
      top: "0",
      left: "0",
      right: "0",
      zIndex: "9999",
      background: "#7a1f1f",
      color: "#fff",
      font: "13px/1.4 -apple-system, Segoe UI, Roboto, sans-serif",
      padding: "10px 16px",
      textAlign: "center",
    });
    document.body.appendChild(banner);
  }

  async function init(characterId) {
    if (sessionStorage.getItem(GATE_KEY) !== characterId) {
      window.location.replace("index.html");
      return null;
    }

    gsap.registerPlugin(ScrollTrigger);
    playBackgroundMusic();

    const sceneMount = document.getElementById("scene-mount");
    const spacer = document.querySelector(".fr-scroll-spacer");
    const config = window.FlowerRevealCharacters[characterId];
    if (!config) {
      throw new Error(`[FlowerReveal] no config for character "${characterId}" in window.FlowerRevealCharacters`);
    }
    const sceneConfig = Object.assign({}, config.scenes[0]);

    // Per-person content (headers + the one-paragraph scroll-reveal text) lives
    // in its own script so it can be edited without touching any other code.
    const content = global.FlowerRevealContent;
    if (content) {
      sceneConfig.header1 = content.header1;
      sceneConfig.header2 = content.header2;
      sceneConfig.header3 = content.header3;
      sceneConfig.revealText = content.paragraph;
    } else {
      console.error(`[FlowerReveal] window.FlowerRevealContent is missing for "${characterId}"`);
      showLoadWarning(characterId, "window.FlowerRevealContent is undefined");
    }

    // Single combined timeline (character frame crossfade + reveal text) driven
    // by one ScrollTrigger — both animations progress together, not staged.
    const controller = window.FlowerReveal.createScene(sceneMount, sceneConfig, config, { autoplay: false });
    const scrollRail = createScrollRail();

    ScrollTrigger.create({
      animation: controller.timeline,
      trigger: spacer,
      start: "top top",
      end: "bottom bottom",
      scrub: 0.5,
      onUpdate: (self) => scrollRail.update(self.progress),
    });

    return controller;
  }

  global.FlowerRevealPage = { init };
})(window);
