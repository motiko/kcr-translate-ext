{
  let iframe;
  const extUrl = chrome.runtime.getURL("");
  const extOrigin = extUrl.substring(0, extUrl.length - 1);
  insertIframe();
  listenToMessageEvents();
  waitForKindleCenter();

  function waitForKindleCenter() {
    const interval = setInterval(() => {
      const interactionLayer = document.getElementById("KindleReaderIFrame")
        ?.contentWindow?.document;
      if (interactionLayer) {
        clearInterval(interval);
        interactionLayer.addEventListener("mouseup", mouseUp, {
          capture: true,
        });
        const searchBox = document
          .getElementById("KindleReaderIFrame")
          ?.contentWindow?.document.getElementById("kindleReader_input_sitb");
        if (searchBox) {
          searchBox.style.backgroundColor = "white";
        }
        const doc = document.getElementById("KindleReaderIFrame")?.contentWindow
          ?.document;
        injectStyle(doc);
      }
    }, 2000);
  }

  function injectStyle(doc) {
    const css = `.ui-dialog.ui-widget.ui-widget-content.ui-corner-all.kindle_menu .ui-dialog-content.ui-widget-content{box-shadow: none;}`;
    const style = doc.createElement("style");
    style.appendChild(doc.createTextNode(css));
    doc.head.appendChild(style);
  }

  function listenToMessageEvents() {
    chrome.storage.sync.get("translateEngines", function ({
      translateEngines,
    }) {
      console.log("translateengines: ", translateEngines);
      window.addEventListener("message", (e) => {
        let settings = translateEngines
          ? translateEngines.find((e) => e.selected)
          : {
              name: "google",
              label: "Google Tranlsate",
              url: "https://translate.google.com/?hl=en#auto/en/",
              autoread: false,
            };
        if (!extUrl.match(e.orign)) return;
        setTimeout(() => (iframe.style.display = "none"), 750);
        let text = e.data.text;
        if (text) {
          text = text.replaceAll(/(?:\r\n|\r|\n)/g, ' ');
          console.info("Detected text:", text);
          window.open(
            `${settings.url}${encodeURIComponent(text)}`,
            settings.label,
            "height=400,width=776,location=0,menubar=0,scrollbars=1,toolbar=0"
          );
        }
      });
    });
  }

  function mouseUp(e) {
    console.log("mouseUp");
    chrome.runtime.sendMessage({ command: "grabRegion" }, (response) => {
      console.log(response);
      if (response.error) {
        console.log("no text detected");
      } else {
        iframe.style.display = "block";
        iframe.contentWindow.postMessage(
          {
            dataUrl: response.regionDataUrl,
            command: "parseImage",
          },
          extOrigin
        );
      }
    });
  }

  function insertIframe() {
    iframe = document.createElement("iframe");
    iframe.allowtransparency = "true";
    iframe.style = `
      border: none;
      width: 15vw;
      height: 5vh;
      position: fixed;
      right: 1em;
      bottom: 1em;
      z-index: 99999;
      display:none;
    `;
    iframe.src = chrome.runtime.getURL("/ocr.html");
    document.body.appendChild(iframe);
  }
}
