// Drives the KCR tab of a Canary started by launch.mjs.
// Usage: node kcr.mjs <command> [args]
//   status                          open pages, whether the content script mounted, KCR DOM hooks
//   screenshot <file.png>           screenshot of the KCR tab
//   theme <White|Dark|Sepia|Green>  switch the KCR reading theme
//   select <x1> <y1> <x2> <y2> [ms] drag-select text, wait (default 10000ms), print OCR text/error
//   capture <file.png>              save the current selection as transformSelected clips it
//                                   (before normalizeForOcr), cropped to the selection
//   settings [json]                 print chrome.storage.sync, or merge json into it
//   eval <js>                       evaluate an expression in the KCR tab and print the result
//   close-popups                    close every tab except KCR (e.g. Google Translate popups)
import fs from "fs";
import { puppeteer, BROWSER_URL } from "./puppeteer.mjs";

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
const [cmd, ...args] = process.argv.slice(2);

const browser = await puppeteer.connect({ browserURL: BROWSER_URL, defaultViewport: null }).catch(() => {
  console.error(`no browser at ${BROWSER_URL}: start launch.mjs first`);
  process.exit(1);
});
const kcrPage = async () => {
  const page = (await browser.pages()).find((p) => /read\.amazon\./.test(p.url()));
  if (!page) throw new Error("no KCR tab open");
  return page;
};
const extensionId = async () => {
  const page = await browser.newPage();
  await page.goto("chrome://extensions");
  const id = await page.evaluate(async () => {
    const exts = await chrome.developerPrivate.getExtensionsInfo();
    return exts.find((e) => e.location === "UNPACKED")?.id;
  });
  await page.close();
  return id;
};

const commands = {
  async status() {
    console.log((await browser.pages()).map((p) => p.url()).join("\n"));
    const page = await kcrPage();
    console.log(
      await page.evaluate(() => ({
        contentScriptMounted: !!document.getElementById("kindleContentScript"),
        pageImage: !!document.querySelector(".kg-full-page-img img"),
        selections: document.querySelectorAll(".kg-selection").length,
        interactionColumns: document.querySelectorAll(".kg-client-interaction-layer > div").length,
        error: document.querySelector("[data-cy=kcrt-progress-error]")?.textContent,
      }))
    );
  },
  async screenshot(file = "kcr.png") {
    await (await kcrPage()).screenshot({ path: file });
    console.log(file);
  },
  async theme(name) {
    const page = await kcrPage();
    await page.evaluate(() => {
      if (!document.querySelector(".theme-selector"))
        document.querySelector('ion-button[aria-label="Reader settings"]').click();
    });
    await sleep(1000);
    await page.evaluate((t) => {
      const span = document.getElementById("theme-" + t);
      if (!span) throw new Error("unknown theme " + t);
      (span.closest(".theme-item")?.querySelector("label") ?? span).click();
    }, name);
    await sleep(1000);
    // close the settings panel
    await page.keyboard.press("Escape");
    await page.mouse.click(600, 820);
    await sleep(1000);
    console.log("theme", name);
  },
  async select(x1, y1, x2, y2, ms = "10000") {
    const page = await kcrPage();
    await page.bringToFront();
    await page.evaluate(() => {
      const span = document.getElementById("kcr-selection");
      if (span) span.textContent = "";
    });
    await page.mouse.move(+x1, +y1);
    await page.mouse.down();
    await page.mouse.move((+x1 + +x2) / 2, (+y1 + +y2) / 2, { steps: 5 });
    await page.mouse.move(+x2, +y2, { steps: 5 });
    await page.mouse.up();
    await sleep(+ms);
    console.log(
      await page.evaluate(() => ({
        text: document.getElementById("kcr-selection")?.textContent,
        error: document.querySelector("[data-cy=kcrt-progress-error]")?.textContent,
      }))
    );
  },
  async capture(file = "selection.png") {
    const dataUrl = await (await kcrPage()).evaluate(() => {
      const px = (v) => Number(v.replace("px", ""));
      const rects = [...document.querySelectorAll(".kg-selection")].map((s) =>
        [s.style.left, s.style.top, s.style.width, s.style.height].map(px)
      );
      if (!rects.length) throw new Error("nothing selected");
      const img = document.querySelector(".kg-full-page-img img");
      const canvas = document.createElement("canvas");
      canvas.width = img.clientWidth;
      canvas.height = img.clientHeight;
      const ctx = canvas.getContext("2d");
      const region = new Path2D();
      rects.forEach((r) => region.rect(...r));
      ctx.clip(region);
      ctx.drawImage(img, 0, 0, img.clientWidth, img.clientHeight);
      const x0 = Math.floor(Math.min(...rects.map((r) => r[0])));
      const y0 = Math.floor(Math.min(...rects.map((r) => r[1])));
      const x1 = Math.ceil(Math.max(...rects.map((r) => r[0] + r[2])));
      const y1 = Math.ceil(Math.max(...rects.map((r) => r[1] + r[3])));
      const out = document.createElement("canvas");
      out.width = x1 - x0 + 20;
      out.height = y1 - y0 + 20;
      out.getContext("2d").drawImage(canvas, x0, y0, x1 - x0, y1 - y0, 10, 10, x1 - x0, y1 - y0);
      return out.toDataURL();
    });
    fs.writeFileSync(file, Buffer.from(dataUrl.split(",")[1], "base64"));
    console.log(file);
  },
  async settings(json) {
    const page = await browser.newPage();
    await page.goto(`chrome-extension://${await extensionId()}/options.html`);
    if (json) await page.evaluate((v) => chrome.storage.sync.set(JSON.parse(v)), json);
    console.log(JSON.stringify(await page.evaluate(() => chrome.storage.sync.get(null)), null, 2));
    await page.close();
  },
  async eval(expr) {
    console.log(await (await kcrPage()).evaluate(expr));
  },
  async "close-popups"() {
    for (const p of await browser.pages()) if (!/read\.amazon\./.test(p.url())) await p.close();
  },
};

if (!commands[cmd]) {
  console.error("commands: " + Object.keys(commands).join(", "));
  process.exitCode = 1;
} else {
  try {
    await commands[cmd](...args);
  } catch (e) {
    console.error(e.message);
    process.exitCode = 1;
  }
}
browser.disconnect();
