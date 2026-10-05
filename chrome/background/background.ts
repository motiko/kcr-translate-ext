import MessageSender = chrome.runtime.MessageSender;
import { Commands, IOcrOutputData } from "../const";
import { Settings } from "../services/settings";
import { Message, Messaging } from "../services/messaging";

// MV3 service worker. It is terminated when idle, so it keeps no state: OCR runs in the
// offscreen document (chrome/offscreen), this script only routes messages to and from it.

const offscreenUrl = "offscreen.html";

const settingsService = new Settings();
const messagingService = new Messaging();

// only one offscreen document may exist, guards against concurrent createDocument calls
let creatingOffscreen: Promise<void> | null = null;

const hasOffscreenDocument = async (): Promise<boolean> => {
  const contexts = await chrome.runtime.getContexts({
    contextTypes: [chrome.runtime.ContextType.OFFSCREEN_DOCUMENT],
    documentUrls: [chrome.runtime.getURL(offscreenUrl)],
  });
  return contexts.length > 0;
};

const ensureOffscreenDocument = async () => {
  if (await hasOffscreenDocument()) {
    return;
  }
  if (!creatingOffscreen) {
    creatingOffscreen = chrome.offscreen
      .createDocument({
        url: offscreenUrl,
        reasons: [chrome.offscreen.Reason.WORKERS],
        justification: "Run the Tesseract OCR worker",
      })
      .finally(() => {
        creatingOffscreen = null;
      });
  }
  await creatingOffscreen;
};

const sendToOffscreen = async <T>(message: Message): Promise<T> => {
  await ensureOffscreenDocument();
  return messagingService.sendMessageToExtension<T>({ ...message, target: "offscreen" });
};

const reinjectContentScript = async () => {
  const [tab] = await chrome.tabs.query({ active: true, lastFocusedWindow: true });
  if (!tab?.id) {
    return;
  }
  try {
    await chrome.scripting.executeScript({ target: { tabId: tab.id }, files: ["index.js"] });
  } catch (e) {
    // the active tab is not a kindle cloud reader tab
  }
};

const requestListener = (
  request: Message,
  sender: MessageSender,
  sendResponse: (response: unknown) => void
) => {
  if (request.target === "offscreen") {
    return false;
  }
  if (request.command !== Commands.SET_PROGRESS) {
    console.log(request.command);
  }
  if (request.command === Commands.EXTENSION_MOUNTED) {
    // init worker
    (async () => {
      try {
        const ocrLangs = await settingsService.getOcrLangs();
        sendResponse(await sendToOffscreen({ command: Commands.EXTENSION_MOUNTED, ocrLangs }));
      } catch (e) {
        sendResponse(false);
      }
    })();
    return true;
  }
  if (request.command === Commands.EXTENSION_UNMOUNTED) {
    const tabId = sender.tab?.id;
    (async () => {
      // don't create the offscreen document just to release its lock
      if (tabId && (await hasOffscreenDocument())) {
        await sendToOffscreen({ command: Commands.EXTENSION_UNMOUNTED, tabId }).catch(
          () => undefined
        );
      }
      sendResponse(true);
    })();
    return true;
  }
  if (request.command === Commands.SETTINGS_UPDATED) {
    (async () => {
      await reinjectContentScript();
      sendResponse(true);
    })();
    return true;
  }
  if (request.command === Commands.START_RECOGNITION) {
    const tabId = sender.tab?.id;
    (async () => {
      let result: IOcrOutputData;
      try {
        if (!tabId) {
          throw new Error("recognition requested outside of a tab");
        }
        const ocrLangs = await settingsService.getOcrLangs();
        result = await sendToOffscreen<IOcrOutputData>({
          command: Commands.START_RECOGNITION,
          payload: request.payload,
          tabId,
          ocrLangs,
        });
      } catch (e) {
        result = { error: "worker is not initialized", text: "" };
      }
      sendResponse(result);
    })();
    return true;
  }
  if (request.command === Commands.SET_PROGRESS && request.target === "background") {
    // OCR progress from the offscreen document
    if (request.tabId) {
      messagingService
        .sendMessageToTab(request.tabId, {
          command: Commands.SET_PROGRESS,
          payload: request.payload,
        })
        .catch(() => undefined);
    }
    return false;
  }
  if (request.command === Commands.GET_SETTINGS) {
    // used by autoplay.js on translate.google.com
    (async () => {
      const translateEngines = await settingsService.getTranslateEngines();
      sendResponse(translateEngines.find((e) => e.selected));
    })();
    return true;
  }
  return false;
};

chrome.runtime.onMessageExternal.addListener(requestListener);
chrome.runtime.onMessage.addListener(requestListener);

export {};
