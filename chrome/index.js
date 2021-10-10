const kindleIframeId = "KindleReaderIFrame";
const kindleContentAreaId = "kindleReader_content";

{
  let iframe;
  const extUrl = chrome.runtime.getURL("");
  const extOrigin = extUrl.substring(0, extUrl.length - 1);
  insertIframe();
  listenToMessageEvents();
  waitForKindleCenter();

  function waitForKindleCenter() {
    const interval = setInterval(() => {
      const interactionLayer = document.getElementById(kindleIframeId)
        ?.contentWindow?.document?.getElementById(kindleContentAreaId);
      if (interactionLayer) {
        clearInterval(interval);
        interactionLayer.addEventListener("mouseup", mouseUp, {
          capture: true,
        });
      }
    }, 2000);
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
        if (!extUrl.match(e.origin)) return;
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

  const strPxToFloat = val => Number(val.replace("px", ""));

  function mouseUp(e) {
    console.log("mouseUp");
    const interactionLayer = document.getElementById(kindleIframeId)
      ?.contentWindow?.document?.getElementById(kindleContentAreaId);

    // find all selected areas
    const selectedAreas = interactionLayer.querySelectorAll('.kg-client-selection');
    if (!selectedAreas.length) {
      return;
    }

    const pageImage = interactionLayer.querySelector('.kg-full-page-img');
    const canvas = document.createElement("canvas");
    const ctx = canvas.getContext("2d");
    canvas.width = pageImage.clientWidth;
    canvas.height = pageImage.clientHeight;

    const columnElements = interactionLayer.querySelectorAll('.kg-client-interaction-layer > div');
    const columns = Array.from(columnElements).map(el => {
      const { left, width } = el.style;
      const leftNum = strPxToFloat(left);
      const widthNum = strPxToFloat(width);
      return {
        left: leftNum,
        top: 0,
        width: widthNum - leftNum,
        height: pageImage.clientHeight,
      }
    })

    const region = new Path2D();
    selectedAreas.forEach(selection => {
      const { left, width, top, height } = selection.style;
      region.rect(...[left, top, width, height].map(px => strPxToFloat(px)));
    });
    ctx.clip(region);
    ctx.drawImage(pageImage, 0, 0, pageImage.clientWidth, pageImage.clientHeight);
    const dataUrl = canvas.toDataURL();

    iframe.style.display = "block";
    iframe.contentWindow.postMessage(
      {
        dataUrl,
        columns,
        command: "parseImage",
      },
      extOrigin
    );
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
