/* globals Tesseract */
import Tesseract from 'tesseract.js'

{
  let worker, workerReady;
  let origin;
  const initWorker = async () => {
    worker = Tesseract.createWorker({
      workerPath: chrome.runtime.getURL("lib/tesseract/worker.min.js"),
      corePath: chrome.runtime.getURL("lib/tesseract/tesseract-core.asm.js"),
      workerBlobURL: false,
      logger: (m) => {
        // console.info("tesseract progress:", m);
        if (m.status === "recognizing text") {
          const progress = m.progress === 0 ? 30 : Math.round(m.progress * 100);
          const progressElem = document.querySelector("progress");
          progressElem.value = progress;
          progressElem.innerText = progress;
          if (m.progress === 1) {
            requestAnimationFrame(() => {
              progressElem.value = 0;
              progressElem.innerText = 0;
            });
          }
        }
      },
    });
    chrome.storage.sync.get("ocrLangs", async function ({ ocrLangs }) {
      const lang = ocrLangs || "eng";
      // console.log(lang);
      await worker.load();
      await worker.loadLanguage(lang);
      await worker.initialize(lang);
      workerReady = true;
    });
  };

  const doOCR = async (base64, columns) => {
    if (!workerReady) await initWorker();
    const values = [];
    for (let i = 0; i < columns.length; i++) {
      const { data } = await worker.recognize(base64, { rectangle: columns[i] });
      values.push(data);
    }
    const result = values.map(data => {
      if (data.text?.trim?.() === "" || data.confidence < 60) {
        return "";
      }
      return data.text;
    }).join(" ");

    if (result.trim?.() === "") {
      document.getElementById("error").style.display = "block";
      document.getElementById("progress").style.display = "none";
      setTimeout(() => {
        document.getElementById("error").style.display = "none";
        document.getElementById("progress").style.display = "block";
      }, 950);
      parent.postMessage({ error: "No text was detected" }, origin);
    } else {
      parent.postMessage({ text: result }, origin);
    }
  };

  const initPage = async () => {
    initWorker();
    window.addEventListener("message", (e) => {
      origin = e.origin;
      document.getElementById("img").src = e.data.dataUrl;
      doOCR(e.data.dataUrl, e.data.columns);
    });
  };

  initPage();
}
