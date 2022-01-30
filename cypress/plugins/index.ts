// ***********************************************************
// This example plugins/index.js can be used to load plugins
//
// You can change the location of this file or turn off loading
// the plugins file with the 'pluginsFile' configuration option.
//
// You can read more here:
// https://on.cypress.io/plugins-guide
// ***********************************************************
import path from "path";
import * as puppeteer from "./puppeteer";
import Browser = Cypress.Browser;
import BrowserLaunchOptions = Cypress.BrowserLaunchOptions;
import PluginEvents = Cypress.PluginEvents;
import PluginConfigOptions = Cypress.PluginConfigOptions;

let debuggingPort: number;

// This function is called when a project is opened or re-opened (e.g. due to
// the project's config changing)

/**
 * @type {Cypress.PluginConfig}
 */
// eslint-disable-next-line @typescript-eslint/no-unused-vars
module.exports = (on: PluginEvents, config: PluginConfigOptions) => {
  // `on` is used to hook into various events Cypress emits
  // `config` is the resolved Cypress config

  on("before:browser:launch", (browser: Browser, launchOptions: BrowserLaunchOptions) => {
    // auto open devtools
    // launchOptions.args.push("--auto-open-devtools-for-tabs");
    // todo: probably we should load from sources using webpack ?
    launchOptions.extensions.push(path.resolve("./dist"));
    debuggingPort = ensureRdpPort(launchOptions.args);
    console.log(`port: ${debuggingPort}`);
    return launchOptions;
  });

  on("task", {
    initPuppeteer: async () => {
      return puppeteer.initPuppeteer(debuggingPort);
    },
    clearPuppeteer: puppeteer.clearPuppeteer,
    switchToCypressWindow: puppeteer.switchToCypressWindow,
    switchToOptionsWindow: puppeteer.switchToOptionsWindow,
    setExtensionSettings: puppeteer.setExtensionSettings,
    restoreDefaultSettings: puppeteer.restoreDefaultSettings,
  });
};

function ensureRdpPort(args: string[]) {
  const existing = args.find((arg) => arg.slice(0, 23) === "--remote-debugging-port");

  if (existing) {
    return Number(existing.split("=")[1]);
  }

  const port = 40000 + Math.round(Math.random() * 25000);

  args.push(`--remote-debugging-port=${port}`);

  return port;
}
