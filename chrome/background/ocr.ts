import Tesseract, { Worker } from "tesseract.js";
import { IDimensions, IOcrOutputData } from "../const";

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

export const doOCR = async (
  worker: Worker,
  base64: string,
  columns: IDimensions[]
): Promise<IOcrOutputData> => {
  const values = [];
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
