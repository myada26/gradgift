/**
 * Casual deterrent only. Blocks right-click and the common "open devtools /
 * view source" keyboard shortcuts so a curious friend doesn't casually poke
 * at the page. Anyone who opens devtools via the browser's own menu (or
 * disables JS) still sees everything — this isn't real protection.
 */
(function () {
  "use strict";

  document.addEventListener("contextmenu", function (event) {
    event.preventDefault();
  });

  document.addEventListener("keydown", function (event) {
    const key = (event.key || "").toUpperCase();
    const isDevtoolsCombo =
      key === "F12" ||
      ((event.ctrlKey || event.metaKey) && event.shiftKey && ["I", "J", "C"].includes(key)) ||
      ((event.ctrlKey || event.metaKey) && key === "U");

    if (isDevtoolsCombo) {
      event.preventDefault();
    }
  });
})();
