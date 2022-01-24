import MessageSender = chrome.runtime.MessageSender;
import { Commands, IOcrInputData } from "../const";
import { doOCR, initWorker } from "./ocr";
import { Worker } from "tesseract.js";
import { Settings } from "../services/settings";
import { Message, Messaging } from "../services/messaging";

let worker: Worker | null = null;
let workerReady = false;
// id of the tab that is currently using worker
let lockId: number | null = null;

const settingsService = new Settings();
const messagingService = new Messaging();

async function loadWorkerLanguage(ocrLangs: string) {
  await worker?.loadLanguage(ocrLangs);
  await worker?.initialize(ocrLangs);
}

const onOcrProgressUpdate = (progress: number) => {
  if (!lockId) {
    return;
  }
  void messagingService.sendMessageToTab(lockId, {
    command: Commands.SET_PROGRESS,
    payload: progress,
  });
};

const setUpWorker = async () => {
  if (!worker) {
    worker = await initWorker(onOcrProgressUpdate);
    const ocrLangs = await settingsService.getOcrLangs();
    await loadWorkerLanguage(ocrLangs);
    workerReady = true;
  }
};

const requestListener = (
  request: Message,
  sender: MessageSender,
  sendResponse: (response: any) => void
) => {
  console.log(request.command);
  if (request.command === Commands.EXTENSION_MOUNTED) {
    const tabId = sender.tab?.id;
    if (tabId) {
      chrome.pageAction.show(tabId);
    }
    // init worker
    setUpWorker().then(() => {
      sendResponse(true);
    });
  }
  if (request.command === Commands.EXTENSION_UNMOUNTED) {
    if (lockId && sender.tab?.id === lockId) {
      lockId = null;
    }
  }
  if (request.command === Commands.SETTINGS_UPDATED) {
    chrome.tabs.executeScript({
      file: "index.js",
    });
    // chrome.tabs.query({active: true, currentWindow: true}, function(tabs){
    //   chrome.tabs.sendMessage(tabs[0].id, { command: "SETTINGS_UPDATED" }, function(response) {
    //     if (!chrome.runtime.lastError) {
    //       // if you have any response
    //     } else {
    //       // if you don't have any response it's ok but you should actually handle
    //       // it and we are doing this when we are examining chrome.runtime.lastError
    //     }
    //   });
    // });
    setTimeout(function () {
      sendResponse(true);
    }, 1);
  }
  if (request.command === Commands.START_RECOGNITION) {
    const tabId = sender.tab?.id;
    // todo: handle tabId === lockId case,
    // we should handle latest request
    if (workerReady && tabId && !lockId) {
      lockId = tabId;
      const data = request.payload as IOcrInputData;
      doOCR(worker!, data.dataUrl, data.columns)
        .then((result) => {
          sendResponse(result);
        })
        .finally(() => {
          lockId = null;
        });
    } else if (lockId) {
      setTimeout(function () {
        sendResponse({ error: "worker is busy", text: "" });
      }, 1);
    } else {
      setTimeout(function () {
        sendResponse({ error: "worker is not initialized", text: "" });
      }, 1);
    }
  }
  if (request.command === "GET_SETTINGS") {
    // todo: refactor
    chrome.storage.sync.get("translateEngines", ({ translateEngines }) => {
      const settings = translateEngines
        ? translateEngines.find((e) => e.selected)
        : {
            name: "google",
            label: "Google Translate",
            url: "https://translate.google.com/?hl=en#auto/en/",
            autoread: false,
          };
      sendResponse(settings);
    });
  }
  return true;
};

chrome.runtime.onMessageExternal.addListener(requestListener);
chrome.runtime.onMessage.addListener(requestListener);

chrome.runtime.onSuspend.addListener(() => {
  console.log("Unloading.");
  worker?.terminate();
});

export {};
