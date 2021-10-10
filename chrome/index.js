const kindleIframeId = "KindleReaderIFrame";
const kindleContentAreaId = "kindleReader_content";

{
  let iframe;
  let selectedText;
  let isFullPageTranslation = false;
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
        interactionLayer.addEventListener("dblclick", dbClick, {
          capture: true,
        });
        interactionLayer.addEventListener("mousedown", mouseDown, {
          capture: true,
        });
        interactionLayer.appendChild(selectedText);
        injectStyle();

        const observer = new MutationObserver(function (event) {
          isFullPageTranslation = !!document.querySelector("html.translated-ltr, head.translated-rtl, ya-tr-span, *[_msttexthash]");
          translatePage();
        });

        observer.observe(document.documentElement, {
          attributes: true,
          attributeFilter: ['class'],
          childList: false,
          characterData: false
        });
      }
    }, 2000);
  }

  function injectStyle() {
    const doc = document.getElementById(kindleIframeId)?.contentWindow?.document;
    const css = `
      #kcr-selection::selection, #kcr-selection ::selection { background: transparent; }
      #kcr-selection::-moz-selection, #kcr-selection ::-moz-selection { background: transparent; }
      #kcr-selection::-webkit-selection, #kcr-selection ::-webkit-selection { background: transparent; }
      #kcr-selection.gte-fp { color: #000000 !important; }
    `;
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
              label: "Google Translate",
              url: "https://translate.google.com/?hl=en#auto/en/",
              autoread: false,
            };
        if (!extUrl.match(e.origin)) return;
        setTimeout(() => (iframe.style.display = "none"), 750);
        let text = e.data.text;
        if (text) {
          text = text.replaceAll(/(?:\r\n|\r|\n)/g, ' ');
          console.info("Detected text:", text);

          if (settings.name === 'google-ext') {
            const kindleIframe = document.getElementById(kindleIframeId)
              ?.contentWindow?.document;

            selectedText.style.display = "block";
            selectedText.textContent = text;

            const range = new Range();
            range.setStart(selectedText, 0);
            range.setEnd(selectedText, 1);
            kindleIframe.getSelection().removeAllRanges();
            // trigger google translate extension
            kindleIframe.getSelection().addRange(range);
            const selectedTextBoundaries = selectedText.getBoundingClientRect();

            selectedText.dispatchEvent(new MouseEvent('mouseup', {
              view: window,
              bubbles: true,
              cancelable: true,
              clientX: selectedTextBoundaries.x,
              clientY: selectedTextBoundaries.y,
            }));
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

  const strPxToFloat = val => Number(val.replace("px", ""));

  function mouseDown(e) {
    if (!isFullPageTranslation) {
      selectedText.style.display = "none";
      selectedText.textContent = "";
    }
  }

  function mouseUp(e) {
    console.log("mouseUp");
    if (e.target.id === selectedText.id || isFullPageTranslation) {
      return;
    }
    // find all selected areas
    const interactionLayer = document.getElementById(kindleIframeId)
      ?.contentWindow?.document?.getElementById(kindleContentAreaId);
    const selectedAreas = interactionLayer.querySelectorAll('.kg-client-selection');
    // selectedAreas will exists in dnd selection and will be empty in double click selection
    translateSelected(selectedAreas);
  }

  function dbClick(e) {
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

    const interactionLayer = document.getElementById(kindleIframeId)
      ?.contentWindow?.document?.getElementById(kindleContentAreaId);

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
    selectedAreas.forEach((selection, index) => {
      const { left, width, top, height } = selection.style;
      region.rect(...[left, top, width, height].map(px => strPxToFloat(px)));
      if (index === 0) {
        selectedText.style.left = left;
        selectedText.style.top = top;
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

  function translatePage() {
    const interactionLayer = document.getElementById(kindleIframeId)
      ?.contentWindow?.document?.getElementById(kindleContentAreaId);
    const pageImage = interactionLayer.querySelector('.kg-full-page-img');
    if (isFullPageTranslation) {
      // google translate extension translates whole page
      selectedText.classList.add("gte-fp");
      translateSelected('.kg-client-dictionary');
      pageImage.style.display = "none";
    } else {
      selectedText.classList.remove("gte-fp");
      pageImage.style.display = "block";
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

    selectedText = document.createElement('span');
    selectedText.id = 'kcr-selection';
    selectedText.style = `
      position: absolute;
      z-index: 9999;
      user-select: all;
      pointer-events: all;
      display: none;
      color: transparent;
      cursor: default;
      font-size: 18px;
    `
  }
}
