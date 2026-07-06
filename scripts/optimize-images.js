/**
 * One-time fix for a Figma export bug: every assets/<id>/Slice NN.svg embeds
 * the entire original composite canvas as a base64 PNG (identical bytes
 * across all 10 frames of a character) and only differs in the viewBox/rect
 * crop window. That means each character page was shipping the same ~4.3MB
 * blob 10 times (~43MB/character, ~301MB total) instead of ~10 small crops.
 *
 * This decodes the embedded PNG once per character, crops each frame's own
 * visible window out of it (same math Figma's SVG pattern/viewBox uses —
 * see _test-crop.js for the derivation), and re-encodes each crop as WebP.
 * Run with: node scripts/optimize-images.js
 */
"use strict";

const fs = require("fs");
const path = require("path");
const sharp = require("sharp");

const ASSETS_DIR = path.join(__dirname, "..", "assets");
const CHARACTERS = ["nicole", "dj", "kc", "andrea", "cyrill", "arrianne", "sophia", "dawn"];
const FRAME_NUMBERS = Array.from({ length: 10 }, (_, i) => i + 11); // 11..20
const WEBP_QUALITY = 85;

function parseSlice(svgPath) {
  const content = fs.readFileSync(svgPath, "utf8");
  const vb = content.match(/viewBox="([-\d.]+) ([-\d.]+) ([\d.]+) ([\d.]+)"/);
  const rect = content.match(/<rect x="([-\d.]+)" y="([-\d.]+)" width="([\d.]+)" height="([\d.]+)"/);
  const img = content.match(
    /<image id="[^"]+" width="(\d+)" height="(\d+)"[^>]*xlink:href="(data:image\/png;base64,[^"]+)"/
  );

  if (!vb || !rect || !img) {
    throw new Error(`${svgPath}: couldn't find expected viewBox/rect/image structure`);
  }

  const viewBoxW = parseFloat(vb[3]);
  const viewBoxH = parseFloat(vb[4]);
  const rectX = parseFloat(rect[1]);
  const rectY = parseFloat(rect[2]);
  const rectW = parseFloat(rect[3]);
  const rectH = parseFloat(rect[4]);
  const imgW = parseInt(img[1], 10);
  const imgH = parseInt(img[2], 10);

  const scaleX = rectW / imgW;
  const scaleY = rectH / imgH;

  return {
    base64: img[3],
    imgW,
    imgH,
    cropX: Math.round(-rectX / scaleX),
    cropY: Math.round(-rectY / scaleY),
    cropW: Math.round(viewBoxW / scaleX),
    cropH: Math.round(viewBoxH / scaleY),
  };
}

async function optimizeCharacter(id) {
  let totalBefore = 0;
  let totalAfter = 0;

  for (const n of FRAME_NUMBERS) {
    const svgPath = path.join(ASSETS_DIR, id, `Slice ${n}.svg`);
    const webpPath = path.join(ASSETS_DIR, id, `Slice ${n}.webp`);

    const before = fs.statSync(svgPath).size;
    const info = parseSlice(svgPath);
    const buffer = Buffer.from(info.base64.split(",")[1], "base64");

    const left = Math.max(0, Math.min(info.cropX, info.imgW - 1));
    const top = Math.max(0, Math.min(info.cropY, info.imgH - 1));
    const width = Math.max(1, Math.min(info.cropW, info.imgW - left));
    const height = Math.max(1, Math.min(info.cropH, info.imgH - top));

    await sharp(buffer).extract({ left, top, width, height }).webp({ quality: WEBP_QUALITY }).toFile(webpPath);

    const after = fs.statSync(webpPath).size;
    totalBefore += before;
    totalAfter += after;
  }

  console.log(
    `${id}: ${(totalBefore / 1024 / 1024).toFixed(1)}MB -> ${(totalAfter / 1024 / 1024).toFixed(1)}MB`
  );
}

async function main() {
  for (const id of CHARACTERS) {
    await optimizeCharacter(id);
  }
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
