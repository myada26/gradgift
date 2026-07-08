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
 * and to have already loaded gsap, ScrollTrigger, codes.js, config.js,
 * scroll-reveal.js, sequence.js, and assets/<characterId>/content.js (which
 * sets window.FlowerRevealContent) before this script.
 *
 * Entry: each commission's QR points straight at ITS OWN page
 * (dawn.html?code=DAWN275), not at the portal — scanning it should land the
 * friend directly in their reveal, not on an "enter your code" screen. init()
 * redeems that ?code= locally (see tryDirectCodeRedeem) before falling back to
 * index.html, so a direct scan never touches the portal at all. Manual code
 * entry still goes through index.html as before.
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
  const DEFAULT_MUSIC = "assets/bg_music.mp3";

  /**
   * Redeems a `?code=` query param directly on this person's own page — the
   * path a scanned QR takes (dawn.html?code=DAWN275), skipping the portal
   * entirely. Only grants access when the code actually resolves to THIS
   * page (codes.js is shared across every person's page, so a code meant for
   * someone else is rejected here rather than silently granted). Returns true
   * once the gate is set.
   */
  function tryDirectCodeRedeem(characterId) {
    const code = new URLSearchParams(window.location.search).get("code");
    if (!code) return false;

    const codes = global.FlowerRevealCodes;
    const destination = codes && codes[code.trim().toUpperCase()];
    if (destination !== characterId + ".html") return false;

    sessionStorage.setItem(GATE_KEY, characterId);
    // Scrub the code out of the visible URL now that the gate is set — cosmetic
    // (see basic-guard.js), but keeps a screenshotted/shared link from
    // broadcasting the code in plain sight.
    window.history.replaceState(null, "", window.location.pathname + window.location.hash);
    return true;
  }

  /**
   * Background music. Defaults to the shared assets/bg_music.mp3, but a
   * commission can override it with its own track via `config.music` — the two
   * are independent of the background choice. `preload="none"` keeps it lazy:
   * the audio file isn't fetched until the first play attempt succeeds, so a
   * standard page never downloads a custom track it doesn't use.
   *
   * Plays automatically on load — no toggle/mute button by design. A
   * user-initiated portal navigation (form submit) usually satisfies the
   * browser's autoplay gesture requirement, but if it's still blocked, playback
   * silently starts on the first interaction (scrolling to reveal counts)
   * instead of showing a control.
   */
  function playBackgroundMusic(src) {
    const audio = new Audio();
    audio.preload = "none";
    audio.src = src || DEFAULT_MUSIC;
    audio.loop = true;
    audio.volume = 0.5;

    const attempt = () => audio.play();
    attempt().catch(() => {
      // Broad event set: some in-app browsers (QR-scanner previews, chat-app
      // webviews) don't fire every gesture type the same way a normal mobile
      // browser does, so cover click/touchend in addition to the originals.
      const resume = () => {
        attempt().catch((err) => {
          // Silent by design (no UI) — but log so it's visible via remote
          // devtools (Safari Web Inspector / chrome://inspect) instead of
          // being a total black box when a device still can't play audio
          // even after a real user gesture (e.g. iOS silent-switch, or an
          // in-app browser that blocks media outright).
          console.warn("[FlowerReveal] background music blocked even after user gesture:", err && err.name, err && err.message);
        });
      };
      ["pointerdown", "keydown", "touchstart", "touchend", "click", "scroll"].forEach((evt) =>
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

  /**
   * Optional add-on block rendered after the main reveal, only when a commission
   * config carries an `addon`. Kept out of the pinned full-bleed scene so it
   * scrolls in as normal document flow below it. Images are `loading="lazy"` and
   * `decoding="async"` so a gallery of photos costs nothing until the viewer
   * scrolls down to it — no impact on the reveal's scroll performance.
   */
  function renderAddon(addon, accentColor) {
    if (!addon || addon.type !== "gallery" || !Array.isArray(addon.photos) || !addon.photos.length) {
      return;
    }

    const section = document.createElement("section");
    section.className = "fr-addon fr-addon--gallery";
    if (accentColor) section.style.setProperty("--fr-accent", accentColor);

    if (addon.title) {
      const heading = document.createElement("h2");
      heading.className = "fr-addon__title";
      heading.textContent = addon.title;
      section.appendChild(heading);
    }

    const grid = document.createElement("div");
    grid.className = "fr-addon__grid";
    addon.photos.forEach((photo) => {
      if (!photo || !photo.src) return;
      const figure = document.createElement("figure");
      figure.className = "fr-addon__item";
      const img = document.createElement("img");
      img.className = "fr-addon__img";
      img.src = photo.src;
      img.alt = photo.caption || "";
      img.loading = "lazy";
      img.decoding = "async";
      figure.appendChild(img);
      if (photo.caption) {
        const cap = document.createElement("figcaption");
        cap.className = "fr-addon__caption";
        cap.textContent = photo.caption;
        figure.appendChild(cap);
      }
      grid.appendChild(figure);
    });
    section.appendChild(grid);

    document.body.appendChild(section);
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
    if (sessionStorage.getItem(GATE_KEY) !== characterId && !tryDirectCodeRedeem(characterId)) {
      // No valid gate and no code (or a code for a different page) — hand off
      // to the portal, forwarding whatever code was present so it can still
      // resolve (e.g. a mismatched/foreign code) instead of dead-ending here.
      const code = new URLSearchParams(window.location.search).get("code");
      window.location.replace(code ? `index.html?code=${encodeURIComponent(code)}` : "index.html");
      return null;
    }

    gsap.registerPlugin(ScrollTrigger);

    const sceneMount = document.getElementById("scene-mount");
    const spacer = document.querySelector(".fr-scroll-spacer");
    const config = window.FlowerRevealCharacters[characterId];
    if (!config) {
      throw new Error(`[FlowerReveal] no config for character "${characterId}" in window.FlowerRevealCharacters`);
    }

    // Per-commission track when set, shared default otherwise (see config.music).
    playBackgroundMusic(config.music);
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

    // Optional extra block (e.g. photo gallery) below the reveal, if this
    // commission ordered one. Lazy-loaded images — no cost until scrolled to.
    renderAddon(config.addon, config.accentColor);

    return controller;
  }

  global.FlowerRevealPage = { init };
})(window);
