import { chromeExtensionId } from "../../chrome/const";
import { Browser, connect, Page } from "puppeteer-core";
import { ISettingsPuppeteer } from "./types";

let puppeteerBrowser: Browser | null = null;

export const initPuppeteer = async (debuggingPort: number): Promise<boolean> => {
  puppeteerBrowser = await connect({
    browserURL: `http://127.0.0.1:${debuggingPort}`,
    ignoreHTTPSErrors: true,
    defaultViewport: null,
  });
  return puppeteerBrowser.isConnected();
};

export const switchToCypressWindow = async (): Promise<boolean> => {
  const { mainWindow } = await assignWindows();
  await mainWindow?.bringToFront();
  return true;
};

export const switchToOptionsWindow = async (): Promise<Page> => {
  let { optionsWindow } = await assignWindows();
  if (!optionsWindow) {
    optionsWindow = await puppeteerBrowser!.newPage();
    const extensionUrl = `chrome-extension://${chromeExtensionId}/options.html`;
    await optionsWindow.goto(extensionUrl, { waitUntil: "load" });
    await optionsWindow.waitForTimeout(4000);
  } else {
    await optionsWindow.bringToFront();
  }
  return optionsWindow;
};

export const setExtensionSettings = async (settings: ISettingsPuppeteer): Promise<boolean> => {
  const optionsWindow = await switchToOptionsWindow();
  // translationEnabled
  if ("boolean" === typeof settings.translationEnabled) {
    const enableBtn = await optionsWindow.$("[data-cy=kcrt-options-toggle-translation]");
    const enableBtnText = await enableBtn?.evaluate((e) => e.textContent);
    const currentTranslationEnabled = enableBtnText !== "Enable Translation";
    if (currentTranslationEnabled !== settings.translationEnabled) {
      await enableBtn?.click();
    }
  }
  // engine
  if (settings?.selectedEngine?.name) {
    await optionsWindow.select("#translate_engine", settings.selectedEngine.name);
  }
  // todo: support another settings
  // save
  const btn = await optionsWindow.$("[data-cy=kcrt-options-save]");
  await btn?.click();
  await switchToCypressWindow();
  return true;
};

export const restoreDefaultSettings = async (): Promise<boolean> => {
  const optionsWindow = await switchToOptionsWindow();
  const btn = await optionsWindow.$("[data-cy=kcrt-options-defaults]");
  await btn?.click();
  await switchToCypressWindow();
  return true;
};

const assignWindows = async (): Promise<{
  optionsWindow: Page | null;
  mainWindow: Page | null;
}> => {
  let mainWindow: Page | null = null;
  let optionsWindow: Page | null = null;
  const pages = await puppeteerBrowser!.pages();
  for (const page of pages) {
    if (page.url().includes("integration")) {
      mainWindow = page;
    } else if (page.url().includes("tests")) {
      mainWindow = page;
    } else if (page.url().includes("extension")) {
      optionsWindow = page;
    }
  }
  return { mainWindow, optionsWindow };
};

export const clearPuppeteer = async (): Promise<boolean> => {
  // todo: find right place to call this function
  puppeteerBrowser?.disconnect();
  puppeteerBrowser = null;
  return true;
};
