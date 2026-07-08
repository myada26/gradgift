/**
 * Generates a scannable QR code per commission code. Each QR encodes
 *   <baseUrl>/<person>.html?code=<CODE>
 * pointing straight at that person's OWN page — page-bootstrap.js redeems the
 * code locally on load (see tryDirectCodeRedeem in src/page-bootstrap.js), so
 * scanning never touches the "enter your code" portal. Typing the same code
 * into index.html still works and lands in the same place.
 *
 * Codes are read from src/codes.js (the single source of truth), so adding a
 * person there and re-running this is all it takes. Output goes to
 * assets/<id>/qr.png (+ qr.svg) next to that person's other art.
 *
 * Usage:
 *   node scripts/generate-qr.js                       # uses the default base URL
 *   node scripts/generate-qr.js --base https://host   # custom base (e.g. a domain)
 *   QR_BASE_URL=https://host node scripts/generate-qr.js
 */
"use strict";

const fs = require("fs");
const path = require("path");
const vm = require("vm");
const QRCode = require("qrcode");

const ROOT = path.join(__dirname, "..");
const CODES_FILE = path.join(ROOT, "src", "codes.js");
const ASSETS_DIR = path.join(ROOT, "assets");

// GitHub Pages default for github.com/myada26/gradgift. Override with --base or
// QR_BASE_URL when serving from a custom domain.
const DEFAULT_BASE = "https://myada26.github.io/gradgift";

function resolveBaseUrl() {
  const argIdx = process.argv.indexOf("--base");
  if (argIdx !== -1 && process.argv[argIdx + 1]) return process.argv[argIdx + 1];
  if (process.env.QR_BASE_URL) return process.env.QR_BASE_URL;
  return DEFAULT_BASE;
}

/** Loads src/codes.js in a sandbox with a fake `window` and returns its code map. */
function loadCodes() {
  const source = fs.readFileSync(CODES_FILE, "utf8");
  const sandboxWindow = {};
  const context = vm.createContext({ window: sandboxWindow });
  vm.runInContext(source, context, { filename: "codes.js" });
  const codes = sandboxWindow.FlowerRevealCodes;
  if (!codes || typeof codes !== "object") {
    throw new Error("Could not read FlowerRevealCodes from src/codes.js");
  }
  return codes;
}

async function generate() {
  const base = resolveBaseUrl().replace(/\/+$/, "");
  const codes = loadCodes();
  const entries = Object.keys(codes);

  if (!entries.length) {
    console.warn("[qr] no codes found in src/codes.js — nothing to generate");
    return;
  }

  console.log(`[qr] base URL: ${base}`);
  for (const code of entries) {
    const destination = codes[code]; // e.g. "dawn.html"
    const id = destination.replace(/\.html$/i, "");
    const url = `${base}/${destination}?code=${encodeURIComponent(code)}`;

    const outDir = path.join(ASSETS_DIR, id);
    fs.mkdirSync(outDir, { recursive: true });

    const opts = { errorCorrectionLevel: "M", margin: 2, scale: 10 };
    await QRCode.toFile(path.join(outDir, "qr.png"), url, opts);
    const svg = await QRCode.toString(url, Object.assign({ type: "svg" }, opts));
    fs.writeFileSync(path.join(outDir, "qr.svg"), svg, "utf8");

    console.log(`[qr] ${code.padEnd(12)} -> assets/${id}/qr.{png,svg}  (${url})`);
  }
  console.log(`[qr] done — ${entries.length} code(s)`);
}

generate().catch((err) => {
  console.error(err);
  process.exit(1);
});
