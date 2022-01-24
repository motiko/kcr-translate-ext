import MessageSender = chrome.runtime.MessageSender;
import { Commands, IOcrInputData } from "./const";
import { doOCR, initWorker } from "./background/ocr";
import { Worker } from "tesseract.js";
import { Settings } from "./services/settings";
import { Message, Messaging } from "./services/messaging";

let worker: Worker | null = null;
let workerReady = false;

const settingsService = new Settings();
const messagingService = new Messaging();

async function loadWorkerLanguage(ocrLangs: string) {
  await worker?.loadLanguage(ocrLangs);
  await worker?.initialize(ocrLangs);
}

const onOcrProgressUpdate = (progress: number) => {
  void messagingService.sendMessageToActiveTab({
    command: Commands.SET_PROGRESS,
    payload: progress,
  });
};

const requestListener = async (
  request: Message,
  sender: MessageSender,
  sendResponse: (response: any) => void
) => {
  if (request.command === Commands.EXTENSION_MOUNTED) {
    chrome.pageAction.show(sender.tab!.id!);
    // init worker
    if (!worker) {
      worker = await initWorker(onOcrProgressUpdate);
      const ocrLangs = await settingsService.getOcrLangs();
      await loadWorkerLanguage(ocrLangs);
      workerReady = true;
    }
    sendResponse(true);
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
    sendResponse(true);
  }
  if (request.command === Commands.START_RECOGNITION) {
    if (workerReady) {
      const data = request.payload as IOcrInputData;
      const result = await doOCR(worker!, data.dataUrl, data.columns);
      sendResponse(result);
    } else {
      sendResponse({ error: "worker is not initialized", text: "" });
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
