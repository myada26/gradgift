/**
 * Minifies/mangles src/*.js into dist/*.js so the shipped code isn't a clean
 * read in view-source. The HTML pages load from dist/, not src/ — run this
 * (`npm run build`) after editing anything under src/.
 *
 * assets/<character>/content.js is intentionally left alone: it's plain
 * per-person copy, not logic, and each page already loads it as a separate
 * <script> tag.
 */
"use strict";

const fs = require("fs");
const path = require("path");
const { minify } = require("terser");

const SRC_DIR = path.join(__dirname, "..", "src");
const DIST_DIR = path.join(__dirname, "..", "dist");

const FILES = [
  "codes.js",
  "config.js",
  "basic-guard.js",
  "scroll-reveal.js",
  "sequence.js",
  "page-bootstrap.js",
];

async function build() {
  fs.mkdirSync(DIST_DIR, { recursive: true });

  for (const file of FILES) {
    const code = fs.readFileSync(path.join(SRC_DIR, file), "utf8");
    const result = await minify(code, {
      mangle: { toplevel: true },
      compress: true,
      format: { comments: false },
    });
    if (result.error) throw result.error;
    fs.writeFileSync(path.join(DIST_DIR, file), result.code, "utf8");
    console.log(`built dist/${file}`);
  }
}

build().catch((err) => {
  console.error(err);
  process.exit(1);
});
