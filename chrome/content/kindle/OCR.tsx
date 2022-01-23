import React, { useContext, useEffect, useRef, useState } from "react";
import Tesseract, { Worker } from "tesseract.js";
import ProgressIFrame from "./ProgressIFrame";
import { ProviderContext } from "./ProviderContext";
import { getAllTexts, translateSelected, TranslationStatus } from "./utils";

const initWorker = async (onProgressUpdate: (progress: number) => void): Promise<Worker> => {
  const worker = Tesseract.createWorker({
    workerPath: chrome.runtime.getURL("lib/tesseract/worker.min.js"),
    corePath: chrome.runtime.getURL("lib/tesseract/tesseract-core.asm.js"),
    workerBlobURL: false,
    logger: (m) => {
      // console.info("tesseract progress:", m);
      if (m.status === "recognizing text") {
        const progress = m.progress === 0 ? 30 : Math.round(m.progress * 100);
        onProgressUpdate(progress);
        if (m.progress === 1) {
          onProgressUpdate(0);
          // requestAnimationFrame(() => {
          //   progressElem.value = 0;
          //   progressElem.innerText = 0;
          // });
        }
      }
    },
  });
  await worker.load();
  return worker;
};

interface IOcrResult {
  error: string;
  text: string;
}

// todo
const doOCR = async (worker: Worker, base64: string, columns: any): Promise<IOcrResult> => {
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
    text = result;
  }
  return {
    error,
    text,
  };
};

export const OCR: React.FC = () => {
  const {
    selectedAreas,
    translationStatus,
    isFullPageTranslationMode,
    settings: { ocrLangs },
    kindleElements,
    onTranslationFinish,
  } = useContext(ProviderContext);
  const [workerReady, setWorkerReady] = useState(false);
  const [progress, setProgress] = useState(0);
  const [error, setError] = useState("");
  const workerRef = useRef<Worker | null>(null);

  // const onProgressUpdate = (progress: number) => {
  //
  // }

  useEffect(() => {
    async function getWorker() {
      workerRef.current = await initWorker(setProgress);
    }
    void getWorker();
    return () => {
      workerRef.current?.terminate();
    };
  }, []);
  useEffect(() => {
    const worker = workerRef.current;
    async function loadLanguage() {
      await worker?.loadLanguage(ocrLangs);
      await worker?.initialize(ocrLangs);
      setWorkerReady(true);
    }
    void loadLanguage();
  }, [ocrLangs]);
  useEffect(() => {
    if (workerReady && translationStatus === TranslationStatus.STARTED) {
      let areas = selectedAreas;
      if (isFullPageTranslationMode) {
        areas = getAllTexts(kindleElements);
      }
      const data = translateSelected(kindleElements, areas);
      const worker = workerRef.current;
      if (data && worker) {
        doOCR(worker, data.dataUrl, data.columns).then(({ error, text }) => {
          setError(error);
          onTranslationFinish(text);
        });
      }
    }
  }, [workerReady, translationStatus]);
  return (
    <ProgressIFrame
      progress={progress}
      show={translationStatus !== TranslationStatus.IDLE}
      error={error}
    />
  );
};
