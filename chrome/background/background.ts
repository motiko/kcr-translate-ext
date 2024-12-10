import MessageSender = chrome.runtime.MessageSender;
import { Commands } from "../const";
// import { Settings } from "../services/settings.ts";
import type { Message } from "../services/messaging.ts";

let creating: Promise<void> | null = null; // A global promise to avoid concurrency issues
async function setupOffscreenDocument(path: string) {
  // Check all windows controlled by the service worker to see if one
  // of them is the offscreen document with the given path
  const offscreenUrl = chrome.runtime.getURL(path);
  const existingContexts = await chrome.runtime.getContexts({
    contextTypes: ["OFFSCREEN_DOCUMENT"],
    documentUrls: [offscreenUrl],
  });

  if (existingContexts.length > 0) {
    return;
  }

  // create offscreen document
  if (creating) {
    await creating;
  } else {
    creating = chrome.offscreen.createDocument({
      url: path,
      reasons: [chrome.offscreen.Reason.WORKERS],
      justification: "Doing OCR",
    });
    await creating;
    creating = null;
  }
}

let lockId: number | null = null;

const requestListener = (
  request: Message,
  sender: MessageSender,
  sendResponse: (response: any) => void
) => {
  console.log(request.command);
  if (request.command === Commands.EXTENSION_MOUNTED) {
    const tabId = sender.tab?.id;
    if (tabId) {
      chrome.action.show(tabId);
    }
    // init worker
    // setUpWorker().then(() => {
    // sendResponse(true);
    // });
    return true; // Keep message channel open for async response
  }
  if (request.command === Commands.EXTENSION_UNMOUNTED) {
    if (lockId && sender.tab?.id === lockId) {
      lockId = null;
    }
  }
  if (request.command === Commands.SETTINGS_UPDATED) {
    // chrome.tabs.executeScript({
    //   target: { tabId: sender.tab?.id || 0 },
    //   files: ["index.js"],
    // });
    setTimeout(function () {
      sendResponse(true);
    }, 0);
    return true; // Keep message channel open for async response
  }
  if (request.command === Commands.START_RECOGNITION) {
    console.log("startRecognition", request.payload);
    setupOffscreenDocument("offscreen.html").then(() => {
      chrome.runtime.sendMessage({
        type: "startRecognition",
        target: "offscreen-doc",
        data: request.payload,
      });
    });
    // startRecognition(request, sender).then((result) => {
    // sendResponse(result);
    // });
    return true; // Keep message channel open for async response
  }
  if (request.command === "GET_SETTINGS") {
    chrome.storage.sync.get("translateEngines", ({ translateEngines }) => {
      const settings = translateEngines ? translateEngines.find((e) => e.selected) : null;
      sendResponse(settings);
    });
    return true; // Keep message channel open for async response
  }
};

// Add listeners when service worker starts
self.addEventListener("activate", (event) => {
  console.log("Service worker activated");
});

// Register message listeners
chrome.runtime.onMessageExternal.addListener(requestListener);
chrome.runtime.onMessage.addListener(requestListener);

// Clean up when service worker is about to be terminated
// chrome.runtime.onSuspend.addListener(() => {
//   void cleanupWorker();
// });
