const { chromium } = require("playwright");

(async () => {
  const browser = await chromium.launch();
  const page = await browser.newPage({ viewport: { width: 1200, height: 800 } });
  const pageErrors = [];
  const consoleErrors = [];
  page.on("pageerror", (e) => pageErrors.push(e.message));
  page.on("console", (m) => { if (m.type() === "error") consoleErrors.push(m.text()); });

  await page.goto("http://localhost:8934/index.html", { waitUntil: "networkidle", timeout: 30000 });
  await page.waitForFunction(() => window.FlowerReveal && window.gsap && window.ScrollTrigger && window.ScrollReveal, { timeout: 10000 });
  await page.waitForTimeout(300);

  const state = await page.evaluate(() => {
    const words = document.querySelectorAll(".scroll-reveal-text .word");
    return {
      wordCount: words.length,
      firstWordOpacityAtLoad: words[0] ? getComputedStyle(words[0]).opacity : null,
      scrollHeight: document.documentElement.scrollHeight,
    };
  });
  console.log("SCROLL-REVEAL SETUP:", JSON.stringify(state));

  // scroll to the reveal-text section (well past the hero) and check words lit up
  await page.evaluate((h) => window.scrollTo(0, h), state.scrollHeight);
  await page.waitForTimeout(300);
  const afterScroll = await page.evaluate(() => {
    const words = document.querySelectorAll(".scroll-reveal-text .word");
    return Array.from(words).map((w) => Number(getComputedStyle(w).opacity));
  });
  console.log("WORD OPACITIES AT BOTTOM:", JSON.stringify(afterScroll));

  console.log("PAGE ERRORS:", pageErrors);
  console.log("CONSOLE ERRORS:", consoleErrors);
  await browser.close();
})().catch((e) => {
  console.error("VERIFY FAILED:", e);
  process.exit(1);
});
