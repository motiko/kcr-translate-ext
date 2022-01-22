const kindleIframeId = "KindleReaderIFrame";
const kindleContentAreaId = "kindleReader_content";

let iframe;
let detectedTextContainer;
let isFullPageTranslationMode = false;
const extUrl = chrome.runtime.getURL("");
const extOrigin = extUrl.substring(0, extUrl.length - 1);
insertIframe();
listenToMessageEvents();
waitForKindleCenter();
chrome.runtime.sendMessage({ command: "ACTIVATE_PAGE_ACTION" });

function waitForKindleCenter() {
  const interval = setInterval(() => {
    const kindleIframe = document.getElementById(kindleIframeId)?.contentWindow
      ?.document;
    const interactionLayer = kindleIframe?.getElementById(kindleContentAreaId);
    if (interactionLayer) {
      clearInterval(interval);
      interactionLayer.addEventListener("mouseup", mouseUp, {
        capture: true,
      });
      interactionLayer.addEventListener("dblclick", dbClick, {
        capture: true,
      });
      kindleIframe?.addEventListener("mousedown", mouseDown, {
        capture: true,
      });
      insertContainerForDetectedText(interactionLayer);
    }
  }, 2000);
}

function observePageEvents() {
  const fullPageTranslationObserver = new MutationObserver(function (event) {
    const newValue = !!document.querySelector(
      "html.translated-ltr, head.translated-rtl, ya-tr-span, *[_msttexthash]"
    );
    if (isFullPageTranslationMode !== newValue) {
      isFullPageTranslationMode = newValue;
      handlePageTranslation();
    }
  });

  fullPageTranslationObserver.observe(document.documentElement, {
    attributes: true,
    attributeFilter: ["class"],
    childList: false,
    characterData: false,
  });
  const locationChangeObserver = new MutationObserver(function (event) {
    onLocationChange();
  });

  const interval = setInterval(() => {
    const locationDataContainer = document
      .getElementById(kindleIframeId)
      ?.contentWindow?.document?.getElementById(
        "kindleReader_locationPopup_labelDiv"
      );

    if (locationDataContainer) {
      clearInterval(interval);
      locationDataContainer.classList.add("skiptranslate");
      locationChangeObserver.observe(locationDataContainer, {
        characterData: true,
        childList: true,
      });
    }
  }, 2000);
}

function listenToMessageEvents() {
  chrome.storage.sync.get("translateEngines", function ({ translateEngines }) {
    const settings = translateEngines
      ? translateEngines.find((e) => e.selected)
      : {
          name: "google",
          label: "Google Translate",
          url: "https://translate.google.com/?hl=en#auto/en/",
          autoread: false,
        };
    if (settings.name === "google-ext") {
      observePageEvents();
    }
    console.log("translateengines: ", translateEngines);
    window.addEventListener("message", (e) => {
      if (!extUrl.match(e.origin)) return;
      setTimeout(() => (iframe.style.display = "none"), 750);
      let text = e.data.text;
      if (text) {
        text = text.replaceAll(/(?:\r\n|\r|\n)/g, " ");
        console.info("Detected text:", text);

        if (settings.name === "google-ext") {
          const kindleIframe = document.getElementById(kindleIframeId)
            ?.contentWindow?.document;

          detectedTextContainer.style.display = "block";
          detectedTextContainer.textContent = text;

          if (!isFullPageTranslationMode) {
            // trigger google translate extension popover
            const range = new Range();
            range.setStart(detectedTextContainer, 0);
            range.setEnd(detectedTextContainer, 1);
            kindleIframe.getSelection().removeAllRanges();
            kindleIframe.getSelection().addRange(range);
            const selectedTextBoundaries = detectedTextContainer.getBoundingClientRect();

            detectedTextContainer.dispatchEvent(
              new MouseEvent("mouseup", {
                view: window,
                bubbles: true,
                cancelable: true,
                clientX: selectedTextBoundaries.x,
                clientY: selectedTextBoundaries.y,
              })
            );
          }
        } else {
          window.open(
            `${settings.url}${encodeURIComponent(text)}`,
            settings.label,
            "height=400,width=776,location=0,menubar=0,scrollbars=1,toolbar=0"
          );
        }
      }
    });
  });
}

const strPxToFloat = (val) => Number(val.replace("px", ""));

function cleanupDetectedText() {
  detectedTextContainer.style.display = "none";
  detectedTextContainer.textContent = "";
  detectedTextContainer.classList.remove("gte-full");
}

function mouseDown(e) {
  if (!isFullPageTranslationMode) {
    cleanupDetectedText();
  }
}

function onLocationChange() {
  cleanupDetectedText();
  handlePageTranslation();
}

function mouseUp(e) {
  console.log("mouseUp");
  if (e.target.id === detectedTextContainer.id || isFullPageTranslationMode) {
    return;
  }
  // find all selected areas
  const interactionLayer = document
    .getElementById(kindleIframeId)
    ?.contentWindow?.document?.getElementById(kindleContentAreaId);
  const selectedAreas = interactionLayer.querySelectorAll(
    ".kg-client-selection"
  );
  // selectedAreas will exists in dnd selection and will be empty in double click selection
  translateSelected(selectedAreas);
}

function dbClick(e) {
  if (isFullPageTranslationMode) {
    return;
  }
  // check if target is a text in kindle
  if (!e.target.classList.contains("kg-client-dictionary")) {
    return;
  }
  translateSelected([e.target]);
}

function translateSelected(selectedAreas = []) {
  if (!selectedAreas.length) {
    return;
  }

  const interactionLayer = document
    .getElementById(kindleIframeId)
    ?.contentWindow?.document?.getElementById(kindleContentAreaId);

  const pageImage = interactionLayer.querySelector(".kg-full-page-img");
  const canvas = document.createElement("canvas");
  const ctx = canvas.getContext("2d");
  canvas.width = pageImage.clientWidth;
  canvas.height = pageImage.clientHeight;

  const columnElements = interactionLayer.querySelectorAll(
    ".kg-client-interaction-layer > div"
  );
  const columns = Array.from(columnElements).map((el) => {
    const { left, width } = el.style;
    const leftNum = strPxToFloat(left);
    const widthNum = strPxToFloat(width);
    return {
      left: leftNum,
      top: 0,
      width: widthNum - leftNum,
      height: pageImage.clientHeight,
    };
  });

  const region = new Path2D();
  selectedAreas.forEach((selection, index) => {
    const { left, width, top, height } = selection.style;
    region.rect(...[left, top, width, height].map((px) => strPxToFloat(px)));
    if (index === 0) {
      detectedTextContainer.style.left = left;
      detectedTextContainer.style.top = top;
    }
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

function handlePageTranslation() {
  const interactionLayer = document
    .getElementById(kindleIframeId)
    ?.contentWindow?.document?.getElementById(kindleContentAreaId);
  const pageImage = interactionLayer.querySelector(".kg-full-page-img");
  const isPageTranslated = pageImage.classList.contains("translated");
  if (isFullPageTranslationMode && !isPageTranslated) {
    // remove previous translation
    cleanupDetectedText();
    // google translate extension translates whole page
    detectedTextContainer.classList.add("gte-full");
    const selectedAreas = interactionLayer.querySelectorAll(
      ".kg-client-dictionary"
    );
    translateSelected(selectedAreas);
    pageImage.classList.add("translated");
  } else if (!isFullPageTranslationMode) {
    cleanupDetectedText();
    pageImage.classList.remove("translated");
  }
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

function insertContainerForDetectedText(interactionLayer) {
  detectedTextContainer = document.createElement("span");
  detectedTextContainer.id = "kcr-selection";
  detectedTextContainer.style = `
      position: absolute;
      z-index: 9999;
      user-select: all;
      pointer-events: all;
      display: none;
      color: transparent;
      cursor: default;
      font-size: 18px;
    `;
  interactionLayer.appendChild(detectedTextContainer);
  injectStyle();
}

function injectStyle() {
  const doc = document.getElementById(kindleIframeId)?.contentWindow?.document;
  const css = `
      #kcr-selection::selection, #kcr-selection ::selection { background: transparent; }
      #kcr-selection::-moz-selection, #kcr-selection ::-moz-selection { background: transparent; }
      #kcr-selection::-webkit-selection, #kcr-selection ::-webkit-selection { background: transparent; }
      #kcr-selection.gte-full { color: #000000 !important; }
      .kg-full-page-img.translated { display: none !important; }
    `;
  const style = doc.createElement("style");
  style.appendChild(doc.createTextNode(css));
  doc.head.appendChild(style);
}
