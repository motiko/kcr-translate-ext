import { Worker } from "tesseract.js";
import { Commands, FALLBACK_OCR_LANG, IOcrOutputData } from "../const";
import { doOCR, initWorker } from "./ocr";
import { IStartRecognitionMessage, Message, Messaging } from "../services/messaging";

// The MV3 service worker can't spawn web workers, so the tesseract worker lives here.
// Offscreen documents only have chrome.runtime: progress is routed back to the tab through
// the service worker.

// free the tesseract worker's memory after this long without a recognition request
const IDLE_TIMEOUT_MS = 5 * 60 * 1000;

let workerPromise: Promise<Worker> | null = null;
let workerLangs: string | null = null;
// the request that is currently using worker
let lock: { tabId: number; requestId: number } | null = null;
let lastRequestId = 0;
let idleTimer: number | undefined;

const messagingService = new Messaging();

const onOcrProgressUpdate = (progress: number) => {
  if (!lock) {
    return;
  }
  messagingService
    .sendMessageToExtension({
      command: Commands.SET_PROGRESS,
      target: "background",
      tabId: lock.tabId,
      payload: progress,
    })
    .catch(() => undefined);
};

const createWorker = async (ocrLangs: string): Promise<Worker> => {
  const worker = await initWorker(onOcrProgressUpdate);
  await worker.loadLanguage(ocrLangs);
  await worker.initialize(ocrLangs);
  return worker;
};

const cleanupWorker = async () => {
  const pendingWorker = workerPromise;
  workerPromise = null;
  workerLangs = null;
  lock = null;
  try {
    await (await pendingWorker)?.terminate();
  } catch (e) {
    // worker failed to start or is already terminated
  }
};

const getWorker = async (ocrLangs: string): Promise<Worker> => {
  if (workerPromise && workerLangs !== ocrLangs) {
    // OCR languages were changed in the options
    await cleanupWorker();
  }
  if (!workerPromise) {
    workerLangs = ocrLangs;
    workerPromise = createWorker(ocrLangs);
  }
  try {
    return await workerPromise;
  } catch (e) {
    workerPromise = null;
    workerLangs = null;
    throw e;
  }
};

const resetIdleTimer = () => {
  clearTimeout(idleTimer);
  idleTimer = window.setTimeout(() => {
    if (!lock) {
      void cleanupWorker();
    }
  }, IDLE_TIMEOUT_MS);
};

const startRecognition = async ({
  payload,
  tabId,
  ocrLangs = FALLBACK_OCR_LANG,
}: IStartRecognitionMessage): Promise<IOcrOutputData> => {
  if (lock) {
    // cancel previous request
    await cleanupWorker();
  }
  resetIdleTimer();
  let worker: Worker;
  try {
    worker = await getWorker(ocrLangs);
  } catch (e) {
    return { error: "worker is not initialized", text: "" };
  }
  const requestId = ++lastRequestId;
  lock = { tabId: tabId!, requestId };
  try {
    return await doOCR(worker, payload.dataUrl, payload.columns);
  } catch (e) {
    return { error: "recognition error", text: "" };
  } finally {
    if (lock?.requestId === requestId) {
      lock = null;
    }
  }
};

chrome.runtime.onMessage.addListener(
  (request: Message, sender, sendResponse: (response: unknown) => void) => {
    if (request.target !== "offscreen") {
      // let the service worker answer
      return false;
    }
    if (request.command === Commands.START_RECOGNITION) {
      (async () => {
        sendResponse(await startRecognition(request));
      })();
      return true;
    }
    if (request.command === Commands.EXTENSION_MOUNTED) {
      // preload the worker so the first recognition is faster
      (async () => {
        resetIdleTimer();
        try {
          await getWorker(request.ocrLangs ?? FALLBACK_OCR_LANG);
          sendResponse(true);
        } catch (e) {
          sendResponse(false);
        }
      })();
      return true;
    }
    if (request.command === Commands.EXTENSION_UNMOUNTED) {
      if (lock && lock.tabId === request.tabId) {
        lock = null;
      }
      sendResponse(true);
    }
    return false;
  }
);

export {};
