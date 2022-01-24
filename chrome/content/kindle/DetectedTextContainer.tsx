import React, { useContext, useEffect, useMemo, useRef } from "react";
import ReactDOM from "react-dom";
import { ProviderContext } from "./ProviderContext";
import { Engines } from "../../const";
import { detectedTextContainerId, TranslationStatus } from "./utils";

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

export const DetectedTextContainer: React.FC = () => {
  const {
    kindleElements: { kindleContentArea, kindleIframeDocument },
    settings: { selectedEngine },
    detectedText,
    selectedAreas,
    isFullPageTranslationMode,
    translationStatus,
  } = useContext(ProviderContext);
  const container = useRef(document.createElement("div"));
  const spanRef = useRef<HTMLSpanElement>(null);
  const containerPosition = useMemo(() => getContainerPosition(selectedAreas), [selectedAreas]);
  useEffect(() => {
    const detectedTextContainer = container.current;
    kindleContentArea.appendChild(detectedTextContainer);
    return () => {
      kindleContentArea.removeChild(detectedTextContainer);
      detectedTextContainer.remove();
    };
  }, [kindleContentArea]);
  useEffect(() => {
    const detectedTextContainer = spanRef.current;
    if (!detectedText || !detectedTextContainer) {
      return;
    }
    if (selectedEngine.name === Engines.GOOGLE_TRANSLATE_EXT && !isFullPageTranslationMode) {
      // trigger google translate extension popover
      console.log("trigger google translate ext");
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
    const pageImage = kindleContentArea.querySelector(".kg-full-page-img");
    if (shouldDisplayText) {
      container.current.setAttribute("style", "color: #000000 !important;");
      pageImage?.classList.add("translated");
    }
    return () => {
      // eslint-disable-next-line react-hooks/exhaustive-deps
      container.current.setAttribute("style", "color: transparent;");
      pageImage?.classList.remove("translated");
    };
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
      {detectedText || "Hi!"}
    </span>,
    container.current,
    detectedTextContainerId
  );
};
