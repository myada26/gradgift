/**
 * Config layer — Phase 1 + Phase 7.
 *
 * Everything project/character-specific lives here. Swapping a character means
 * copying the object below, pointing the asset paths at new art, and editing
 * the text fields. No files under /src beyond this one need to change.
 *
 * Schema
 * ------
 * {
 *   id: string,
 *   accentColor: string,               // CSS color, tints gradient/text per character
 *   reveal: {                          // optional — the standalone flower-reveal stage (Phases 1-6)
 *     background: string,              // path to the flower-reveal stage background
 *     frames: string[10],              // sequential reveal frames, frame1 -> frame10
 *     closeupFlower: string,           // final closeup image
 *     titles: [                        // exactly 3 mid-sequence titles + validated below
 *       { text: string, hold: number } // hold = seconds fully visible before exit
 *     ],
 *     finalTitle: { text: string },
 *     finalParagraph: string,
 *   },
 *   scenes: [                          // Phase 8 — full-bleed layered scenes (background / character / gradient+text)
 *     {
 *       id: string,
 *       background: string,             // full-bleed backdrop image (CSS background-size: cover), static — no animation
 *       character: string,              // static sprite — use this OR characterFrames, not both
 *       characterFrames: string[10],    // reveal sequence, crossfaded/cut in sync with the reveal text
 *       characterAspect: { width, height }, // intrinsic aspect ratio of the character art
 *       characterHeight: string,        // CSS length for the character's height, pinned to the viewport bottom (e.g. "78vh")
 *       characterLeft: string,          // CSS horizontal position of the character's center (recommend 65%-70%, e.g. "67%")
 *       frameTransition: "cut" | "crossfade",
 *       gradientColor: string,          // left-side gradient overlay color, solid -> transparent (default "#ffffff")
 *
 *       // The next four fields are person-specific copy. They're intentionally
 *       // left out of this file and instead loaded at runtime from
 *       // assets/<id>/content.json (see nicole.html), so each person's page can
 *       // have different copy without touching any code:
 *       //   { "header1": string, "header2": string, "header3": string, "paragraph": string }
 *       header1: string,                // biggest heading line
 *       header2: string,                // secondary heading line
 *       header3: string,                // smallest heading line
 *       revealText: string,             // the one-paragraph scroll-reveal text (auto-wraps, any length)
 *     }
 *   ]
 * }
 *
 * A config needs a "reveal" block, a "scenes" array, or both — whichever the
 * character's delivered art actually covers.
 *
 * Portal codes (which code routes to which person's page) live in
 * src/codes.js, separate from this file.
 */

(function (global) {
  "use strict";

  const nicole = {
    id: "nicole",
    accentColor: "#ff6fae",
    scenes: [
      {
        id: "gate",
        background: "assets/shared/background-gate.webp",
        characterFrames: [
          "assets/nicole/Slice 11.webp",
          "assets/nicole/Slice 12.webp",
          "assets/nicole/Slice 13.webp",
          "assets/nicole/Slice 14.webp",
          "assets/nicole/Slice 15.webp",
          "assets/nicole/Slice 16.webp",
          "assets/nicole/Slice 17.webp",
          "assets/nicole/Slice 18.webp",
          "assets/nicole/Slice 19.webp",
          "assets/nicole/Slice 20.webp",
        ],
        characterAspect: { width: 595, height: 837 },
        characterHeight: "78vh",
        // between center and right, per the reference composition
        characterLeft: "67%",
        // hard-cut frame swaps instead of a crossfade — reads cleaner while scroll-scrubbing
        frameTransition: "cut",
        gradientColor: "#f4e4c1",
        // header1/header2/header3/revealText are loaded at runtime from
        // assets/nicole/content.json (see nicole.html) — not set here.
      },
    ],
  };

  const dj = {
    id: "dj",
    accentColor: "#ff6fae",
    scenes: [
      {
        id: "gate",
        background: "assets/shared/background-gate.webp",
        characterFrames: [
          "assets/dj/Slice 11.webp",
          "assets/dj/Slice 12.webp",
          "assets/dj/Slice 13.webp",
          "assets/dj/Slice 14.webp",
          "assets/dj/Slice 15.webp",
          "assets/dj/Slice 16.webp",
          "assets/dj/Slice 17.webp",
          "assets/dj/Slice 18.webp",
          "assets/dj/Slice 19.webp",
          "assets/dj/Slice 20.webp",
        ],
        // same 345x488 native art aspect as nicole's slices
        characterAspect: { width: 595, height: 837 },
        characterHeight: "78vh",
        characterLeft: "67%",
        frameTransition: "cut",
        gradientColor: "#f4e4c1",
        // header1/header2/header3/revealText are loaded at runtime from
        // assets/dj/content.json (see dj.html) — not set here.
      },
    ],
  };

  const kc = {
    id: "kc",
    accentColor: "#ff6fae",
    scenes: [
      {
        id: "gate",
        background: "assets/shared/background-gate.webp",
        characterFrames: [
          "assets/kc/Slice 11.webp",
          "assets/kc/Slice 12.webp",
          "assets/kc/Slice 13.webp",
          "assets/kc/Slice 14.webp",
          "assets/kc/Slice 15.webp",
          "assets/kc/Slice 16.webp",
          "assets/kc/Slice 17.webp",
          "assets/kc/Slice 18.webp",
          "assets/kc/Slice 19.webp",
          "assets/kc/Slice 20.webp",
        ],
        // same 345x488 native art aspect as nicole's/dj's slices
        characterAspect: { width: 595, height: 837 },
        characterHeight: "78vh",
        characterLeft: "67%",
        frameTransition: "cut",
        gradientColor: "#f4e4c1",
        // header1/header2/header3/revealText are loaded at runtime from
        // assets/kc/content.json (see kc.html) — not set here.
      },
    ],
  };

  const andrea = {
    id: "andrea",
    accentColor: "#ff6fae",
    scenes: [
      {
        id: "gate",
        background: "assets/shared/background-gate.webp",
        characterFrames: [
          "assets/andrea/Slice 11.webp",
          "assets/andrea/Slice 12.webp",
          "assets/andrea/Slice 13.webp",
          "assets/andrea/Slice 14.webp",
          "assets/andrea/Slice 15.webp",
          "assets/andrea/Slice 16.webp",
          "assets/andrea/Slice 17.webp",
          "assets/andrea/Slice 18.webp",
          "assets/andrea/Slice 19.webp",
          "assets/andrea/Slice 20.webp",
        ],
        // same 345x488 native art aspect as nicole's/dj's/kc's slices
        characterAspect: { width: 595, height: 837 },
        characterHeight: "78vh",
        characterLeft: "67%",
        frameTransition: "cut",
        gradientColor: "#f4e4c1",
        // header1/header2/header3/revealText are loaded at runtime from
        // assets/andrea/content.json (see andrea.html) — not set here.
      },
    ],
  };

  const cyrill = {
    id: "cyrill",
    accentColor: "#ff6fae",
    scenes: [
      {
        id: "gate",
        background: "assets/shared/background-gate.webp",
        characterFrames: [
          "assets/cyrill/Slice 11.webp",
          "assets/cyrill/Slice 12.webp",
          "assets/cyrill/Slice 13.webp",
          "assets/cyrill/Slice 14.webp",
          "assets/cyrill/Slice 15.webp",
          "assets/cyrill/Slice 16.webp",
          "assets/cyrill/Slice 17.webp",
          "assets/cyrill/Slice 18.webp",
          "assets/cyrill/Slice 19.webp",
          "assets/cyrill/Slice 20.webp",
        ],
        // same 345x488 native art aspect as the other characters' slices
        characterAspect: { width: 595, height: 837 },
        characterHeight: "78vh",
        characterLeft: "67%",
        frameTransition: "cut",
        gradientColor: "#f4e4c1",
        // header1/header2/header3/revealText are loaded at runtime from
        // assets/cyrill/content.json (see cyrill.html) — not set here.
      },
    ],
  };

  const arrianne = {
    id: "arrianne",
    accentColor: "#ff6fae",
    scenes: [
      {
        id: "gate",
        background: "assets/shared/background-gate.webp",
        characterFrames: [
          "assets/arrianne/Slice 11.webp",
          "assets/arrianne/Slice 12.webp",
          "assets/arrianne/Slice 13.webp",
          "assets/arrianne/Slice 14.webp",
          "assets/arrianne/Slice 15.webp",
          "assets/arrianne/Slice 16.webp",
          "assets/arrianne/Slice 17.webp",
          "assets/arrianne/Slice 18.webp",
          "assets/arrianne/Slice 19.webp",
          "assets/arrianne/Slice 20.webp",
        ],
        // same 345x488 native art aspect as the other characters' slices
        characterAspect: { width: 595, height: 837 },
        characterHeight: "78vh",
        characterLeft: "67%",
        frameTransition: "cut",
        gradientColor: "#f4e4c1",
        // header1/header2/header3/revealText are loaded at runtime from
        // assets/arrianne/content.json (see arrianne.html) — not set here.
      },
    ],
  };

  const sophia = {
    id: "sophia",
    accentColor: "#ff6fae",
    scenes: [
      {
        id: "gate",
        background: "assets/shared/background-gate.webp",
        characterFrames: [
          "assets/sophia/Slice 11.webp",
          "assets/sophia/Slice 12.webp",
          "assets/sophia/Slice 13.webp",
          "assets/sophia/Slice 14.webp",
          "assets/sophia/Slice 15.webp",
          "assets/sophia/Slice 16.webp",
          "assets/sophia/Slice 17.webp",
          "assets/sophia/Slice 18.webp",
          "assets/sophia/Slice 19.webp",
          "assets/sophia/Slice 20.webp",
        ],
        // same 345x488 native art aspect as the other characters' slices
        characterAspect: { width: 595, height: 837 },
        characterHeight: "78vh",
        characterLeft: "67%",
        frameTransition: "cut",
        gradientColor: "#f4e4c1",
        // header1/header2/header3/revealText are loaded at runtime from
        // assets/sophia/content.json (see sophia.html) — not set here.
      },
    ],
  };

  /**
   * Fails loud in the console rather than silently rendering a broken sequence,
   * since this config is meant to be edited by whoever onboards the next character.
   */
  function validateCharacterConfig(config) {
    const errors = [];
    const warnings = [];
    const label = config && config.id ? `"${config.id}"` : "(unnamed)";

    if (!config || typeof config !== "object") {
      console.error("[FlowerReveal] config " + label + " is missing or not an object.");
      return { errors: ["config missing"], warnings: [] };
    }

    const reveal = config.reveal;
    const hasScenes = Array.isArray(config.scenes) && config.scenes.length > 0;
    if (!reveal && !hasScenes) {
      errors.push(`config ${label}: needs a "reveal" block, a "scenes" array, or both — has neither`);
    } else if (reveal) {
      if (!reveal.background) warnings.push(`config ${label}: missing reveal.background`);
      if (!Array.isArray(reveal.frames) || reveal.frames.length < 10) {
        warnings.push(
          `config ${label}: expected 10 reveal.frames, got ${reveal.frames ? reveal.frames.length : 0}`
        );
      }
      if (!reveal.closeupFlower) warnings.push(`config ${label}: missing reveal.closeupFlower`);
      if (!Array.isArray(reveal.titles) || reveal.titles.length < 3) {
        warnings.push(
          `config ${label}: expected 3 mid-sequence titles, got ${reveal.titles ? reveal.titles.length : 0}`
        );
      }
      if (!reveal.finalTitle || !reveal.finalTitle.text) {
        warnings.push(`config ${label}: missing reveal.finalTitle.text`);
      }
      if (!reveal.finalParagraph) warnings.push(`config ${label}: missing reveal.finalParagraph`);

      const totalTitles = (reveal.titles ? reveal.titles.length : 0) + (reveal.finalTitle ? 1 : 0);
      if (totalTitles < 4) {
        warnings.push(`config ${label}: expected 4 total titles (3 mid + final), got ${totalTitles}`);
      }
    }

    if (config.scenes && !Array.isArray(config.scenes)) {
      errors.push(`config ${label}: "scenes" must be an array`);
    }
    (config.scenes || []).forEach((scene, i) => {
      const sceneLabel = `${label} scenes[${i}]${scene && scene.id ? ` ("${scene.id}")` : ""}`;
      if (!scene.background) errors.push(`${sceneLabel}: missing background`);
      const hasFrames = Array.isArray(scene.characterFrames) && scene.characterFrames.length > 0;
      if (!scene.character && !hasFrames) {
        errors.push(`${sceneLabel}: needs either "character" (static sprite) or "characterFrames" (reveal sequence)`);
      }
      if (!scene.characterAspect || !scene.characterAspect.width || !scene.characterAspect.height) {
        errors.push(`${sceneLabel}: missing characterAspect {width,height}`);
      }
      if (!scene.revealText) warnings.push(`${sceneLabel}: missing revealText`);
    });

    if (warnings.length) {
      console.warn(
        `[FlowerReveal] config ${label} has ${warnings.length} issue(s):\n  ` + warnings.join("\n  ")
      );
    }
    if (errors.length) {
      console.error(
        `[FlowerReveal] config ${label} has ${errors.length} blocking error(s):\n  ` + errors.join("\n  ")
      );
    }

    return { errors, warnings };
  }

  global.FlowerRevealCharacters = { nicole, dj, kc, andrea, cyrill, arrianne, sophia };
  global.validateCharacterConfig = validateCharacterConfig;
})(window);
