// import { restoreDefaultSettings } from "./../../cypress/plugins/puppeteer";
import Tesseract from "tesseract.js";
import type { IDimensions, IOcrOutputData } from "../const";
import type { Worker } from "tesseract.js";
import { IStartRecognitionMessage } from "../services/messaging";
import { Settings } from "../services/settings";
import { Messaging } from "../services/messaging";

let worker: Worker | null = null;
let workerReady = false;
// id of the tab that is currently using worker
let lockId: number | null = null;

const settingsService = new Settings();
const messagingService = new Messaging();

chrome.runtime.onMessage.addListener(handleMessages);

// This function performs basic filtering and error checking on messages before
// dispatching the
// message to a more specific message handler.
async function handleMessages(message : any) {
  // Return early if this message isn't meant for the offscreen document.
  if (message.target !== 'offscreen-doc') {
    return;
  }

  // Dispatch the message to an appropriate handler.
  switch (message.type) {
    case 'startRecognition':
      console.log("startRecognition", message);
      // startRecognition();
      break;
    default:
      console.warn(`Unexpected message type received: '${message.type}'.`);
  }
}


async function loadWorkerLanguage(ocrLangs: string) {
  await worker?.loadLanguage(ocrLangs);
  await worker?.initialize(ocrLangs);
}

const setUpWorker = async () => {
  if (!workerReady) {
    worker = await initWorker(onOcrProgressUpdate);
    const ocrLangs = await settingsService.getOcrLangs();
    await loadWorkerLanguage(ocrLangs);
    workerReady = true;
  }
};


const onOcrProgressUpdate = (progress: number) => {
  if (!lockId) {
    return;
  }
  void messagingService.sendMessageToTab(lockId, {
    command: Commands.SET_PROGRESS,
    payload: progress,
  });
};



const cleanupWorker = async () => {
  await worker?.terminate();
  worker = null;
  workerReady = false;
  lockId = null;
};

export const initWorker = async (onProgressUpdate: (progress: number) => void): Promise<Worker> => {
  const worker = Tesseract.createWorker({
    workerPath: chrome.runtime.getURL("lib/tesseract/worker.min.js"),
    corePath: chrome.runtime.getURL("lib/tesseract/tesseract-core.asm.js"),
    workerBlobURL: false,
    logger: (m) => {
      // console.info("tesseract progress:", m);
      if (m.status === "recognizing text") {
        const progress = m.progress === 0 ? 30 : Math.round(m.progress * 100);
        // todo: we have a problem with the progress value for multiple columns,
        // e.g. for the two columns `progress` will run from 0 to 1 twice
        onProgressUpdate(progress);
      }
    },
  });
  await worker.load();
  return worker;
};

const startRecognition = async (request: IStartRecognitionMessage, sender: MessageSender) => {
  let result;
  if (lockId) {
    // cancel previous request
    await cleanupWorker();
  }
  if (!workerReady) {
    await setUpWorker();
  }
  const tabId = sender.tab?.id;
  console.log(workerReady, tabId);
  if (workerReady && tabId) {
    lockId = tabId;
    const data = request.payload as IOcrInputData;
    try {
      result = {}//= await doOCR(worker!, data.dataUrl, data.columns);
    } catch (e) {
      result = { error: "recognition error", text: "" };
    }
    lockId = null;
  } else {
    result = { error: "worker is not initialized", text: "" };
  }
  return result;
};

export const doOCR = async (
  worker: Worker,
  base64: string,
  columns: IDimensions[]
): Promise<IOcrOutputData> => {
  const values = [];
  if (!columns?.length) {
    const { data } = await worker.recognize(base64);
    const result = data.text;
    if (data.confidence > 0.6) {
      return { text: result.replaceAll(/(?:\r\n|\r|\n)/g, " "), error: "" };
    } else {
      return { error: "Not enough confidence", text: "" };
    }
  }
  for (let i = 0; i < columns.length; i++) {
    const { data } = await worker.recognize(base64, {
      rectangle: columns[i],
    });
    values.push(data);
  }
  const result = values
    .map((data) => {
      if (data.text?.trim?.() === "" || data.confidence < 60) {
        return "";
      }
      return data.text;
    })
    .join(" ");

  let error = "";
  let text = "";
  if (result.trim?.() === "") {
    error = "No text was detected";
  } else {
    text = result.replaceAll(/(?:\r\n|\r|\n)/g, " ");
  }
  return {
    error,
    text,
  };
};
