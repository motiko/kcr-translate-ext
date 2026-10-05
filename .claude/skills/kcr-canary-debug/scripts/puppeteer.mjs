// puppeteer-core is installed outside the repo (the repo pins an old version for Cypress that
// lacks enableExtensions/installExtension).
import { createRequire } from "module";
import os from "os";
import path from "path";
import fs from "fs";

export const DEBUG_HOME = path.join(os.homedir(), ".kcr-debug");
export const PROFILE_DIR = path.join(DEBUG_HOME, "canary-profile");
export const CANARY = "/Applications/Google Chrome Canary.app/Contents/MacOS/Google Chrome Canary";
export const PORT = 9333;
export const BROWSER_URL = `http://localhost:${PORT}`;

if (!fs.existsSync(path.join(DEBUG_HOME, "node_modules/puppeteer-core"))) {
  console.error(
    `puppeteer-core missing. Run:\n  mkdir -p ${DEBUG_HOME} && cd ${DEBUG_HOME} && ` +
      `echo '{"name":"kcr-debug","private":true}' > package.json && npm i puppeteer-core@latest`
  );
  process.exit(1);
}
export const puppeteer = createRequire(path.join(DEBUG_HOME, "package.json"))("puppeteer-core");
