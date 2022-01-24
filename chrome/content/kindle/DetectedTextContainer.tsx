import React, { useContext, useEffect, useMemo, useRef } from "react";
import ReactDOM from "react-dom";
import { ContentContext } from "./ContentContext";
import { Engines } from "../../const";
import { detectedTextContainerId, IKindleCenterElements, TranslationStatus } from "./utils";

const getContainerPosition = (selectedAreas: HTMLSpanElement[]) => {
  if (!selectedAreas.length) {
    return {
      left: 0,
      top: 0,
    };
  }
  const { left, top } = selectedAreas[0].style;
  return {
    left,
    top,
  };
};

const triggerPageTranslationGTE = () => {
  const iframe = document.createElement("div");
  iframe.setAttribute(
    "style",
    `
      display:none;
    `
  );
  document.body.appendChild(iframe);
  iframe.remove();
};

/**
 * triggers google translate extension popover
 */
const triggerSelectionTranslationGTE = (
  kindleIframeDocument: Document,
  detectedTextContainer: HTMLSpanElement
) => {
  const range = new Range();
  range.setStart(detectedTextContainer, 0);
  range.setEnd(detectedTextContainer, 1);
  kindleIframeDocument.getSelection()?.removeAllRanges();
  kindleIframeDocument.getSelection()?.addRange(range);
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
};

function injectStylesToKindlePage({ kindleIframeDocument }: IKindleCenterElements): VoidFunction {
  const doc = kindleIframeDocument;
  const css = `
      #kcr-selection::selection, #kcr-selection ::selection { background: transparent; }
      #kcr-selection::-moz-selection, #kcr-selection ::-moz-selection { background: transparent; }
      #kcr-selection::-webkit-selection, #kcr-selection ::-webkit-selection { background: transparent; }
      .kg-full-page-img.translated { display: none !important; }
    `;
  const style = doc.createElement("style");
  style.appendChild(doc.createTextNode(css));
  doc.head.appendChild(style);
  return () => {
    doc.head.removeChild(style);
    style.remove();
  };
}

export const DetectedTextContainer: React.FC = () => {
  const {
    kindleElements,
    settings: { selectedEngine },
    detectedText,
    selectedAreas,
    isFullPageTranslationMode,
    translationStatus,
  } = useContext(ContentContext);
  const containerRef = useRef(document.createElement("div"));
  const spanRef = useRef<HTMLSpanElement>(null);
  const containerPosition = useMemo(() => getContainerPosition(selectedAreas), [selectedAreas]);
  useEffect(() => {
    const container = containerRef.current;
    const { kindleContentArea } = kindleElements;
    container.setAttribute("style", "color: transparent;");
    kindleContentArea.appendChild(container);
    const removeStyles = injectStylesToKindlePage(kindleElements);
    return () => {
      kindleContentArea.removeChild(container);
      removeStyles();
    };
  }, [kindleElements]);
  useEffect(() => {
    const detectedTextContainer = spanRef.current;
    if (!detectedText || !detectedTextContainer) {
      return;
    }
    if (selectedEngine.name === Engines.GOOGLE_TRANSLATE_EXT) {
      if (isFullPageTranslationMode) {
        triggerPageTranslationGTE();
      } else {
        triggerSelectionTranslationGTE(kindleElements.kindleIframeDocument, detectedTextContainer);
      }
    }
    if (selectedEngine.name === Engines.GOOGLE_TRANSLATE) {
      window.open(
        `${selectedEngine.url}${encodeURIComponent(detectedText)}`,
        selectedEngine.label,
        "height=400,width=776,location=0,menubar=0,scrollbars=1,toolbar=0"
      );
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [detectedText]);
  const shouldDisplayText =
    isFullPageTranslationMode && translationStatus === TranslationStatus.FINISHED;
  const containerVisible = selectedEngine.name === Engines.GOOGLE_TRANSLATE_EXT;
  useEffect(() => {
    const container = containerRef.current;
    const pageImage = kindleElements.kindleContentArea.querySelector(".kg-full-page-img");
    const setDefaultStyles = () => {
      container.setAttribute("style", "color: transparent;");
      pageImage?.classList.remove("translated");
    };
    if (shouldDisplayText) {
      container.setAttribute("style", "color: #000000 !important;");
      pageImage?.classList.add("translated");
    } else {
      setDefaultStyles();
    }
    return setDefaultStyles;
  }, [shouldDisplayText]);
  return ReactDOM.createPortal(
    <span
      ref={spanRef}
      id={detectedTextContainerId}
      style={{
        position: "absolute",
        zIndex: 9999,
        userSelect: "all",
        pointerEvents: "all",
        cursor: "default",
        fontSize: "18px",
        display: containerVisible ? "block" : "none",
        ...containerPosition,
      }}
    >
      {detectedText}
    </span>,
    containerRef.current,
    detectedTextContainerId
  );
};
