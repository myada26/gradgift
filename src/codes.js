/**
 * Portal code -> destination page lookup.
 *
 * Plain client-side table — this is routing a friend to the right person's
 * page, not real access control, so codes are visible in the page source.
 * Matched case-insensitively (the portal upper-cases input before lookup).
 * Add a new entry here for each person's page.
 */
(function (global) {
  "use strict";

  global.FlowerRevealCodes = {
    NICOLE583: "nicole.html",
    DJ847: "dj.html",
    KC392: "kc.html",
    ANDREA614: "andrea.html",
    CYRIL258: "cyrill.html",
    ARRIANNE731: "arrianne.html",
    SOPHIA469: "sophia.html",
    DAWN275: "dawn.html",
  };
})(window);
