// Launches Chrome Canary with the persistent debug profile and the unpacked extension from dist/.
// Keep this process running (it owns the CDP pipe that loaded the extension). It reinstalls the
// extension whenever dist/ changes and reloads the KCR tabs.
// Usage: node launch.mjs [repoDir] [startUrl]
import fs from "fs";
import path from "path";
import { puppeteer, PROFILE_DIR, CANARY, PORT } from "./puppeteer.mjs";

const repoDir = path.resolve(process.argv[2] ?? process.cwd());
const startUrl = process.argv[3] ?? "https://read.amazon.com/";
const distDir = path.join(repoDir, "dist");
if (!fs.existsSync(path.join(distDir, "manifest.json"))) {
  console.error(`${distDir}/manifest.json not found: run yarn build first`);
  process.exit(1);
}

const browser = await puppeteer.launch({
  executablePath: CANARY,
  headless: false,
  pipe: true,
  defaultViewport: null,
  userDataDir: PROFILE_DIR,
  enableExtensions: [distDir],
  args: [`--remote-debugging-port=${PORT}`],
});

// Unpacked extensions are disabled while developer mode is off (e.g. on a fresh profile).
async function ensureEnabled() {
  const page = await browser.newPage();
  await page.goto("chrome://extensions");
  const result = await page.evaluate(async (dir) => {
    await chrome.developerPrivate.updateProfileConfiguration({ inDeveloperMode: true });
    const exts = await chrome.developerPrivate.getExtensionsInfo();
    const ext = exts.find((e) => e.prettifiedPath === dir || e.path === dir) ?? exts.find((e) => e.location === "UNPACKED");
    if (!ext) return "extension not found";
    if (ext.state !== "ENABLED") await chrome.management.setEnabled(ext.id, true);
    return `${ext.name} (${ext.id}) enabled`;
  }, distDir);
  await page.close();
  return result;
}

async function reloadKcrTabs() {
  for (const p of await browser.pages()) {
    if (/read\.amazon\./.test(p.url())) await p.reload().catch(() => undefined);
  }
}

console.log(await ensureEnabled());
const [first] = await browser.pages();
await first.goto(startUrl);
console.log(`launched, CDP at http://localhost:${PORT}, watching ${distDir}`);

let timer;
fs.watch(distDir, { recursive: true }, () => {
  clearTimeout(timer);
  timer = setTimeout(async () => {
    try {
      // loading the same path again replaces the extension with the new build
      const id = await browser.installExtension(distDir);
      await reloadKcrTabs();
      console.log(`${new Date().toISOString()} reinstalled ${id}, KCR tabs reloaded`);
    } catch (e) {
      console.log(`reinstall failed: ${e.message}`);
    }
  }, 1500);
});

browser.on("disconnected", () => process.exit(0));
