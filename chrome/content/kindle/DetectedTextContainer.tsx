import React, { useContext, useEffect, useRef } from "react";
import ReactDOM from "react-dom";
import { ProviderContext } from "./ProviderContext";

export const DetectedTextContainer: React.FC = () => {
  const {
    kindleElements: { kindleContentArea },
    detectedText,
    isFullPageTranslationMode,
  } = useContext(ProviderContext);
  const container = useRef(document.createElement("div"));
  useEffect(() => {
    const detectedTextContainer = container.current;
    kindleContentArea.appendChild(detectedTextContainer);
    return () => {
      kindleContentArea.removeChild(detectedTextContainer);
      detectedTextContainer.remove();
    };
  }, [kindleContentArea]);
  const shouldDisplay = isFullPageTranslationMode && detectedText;
  return ReactDOM.createPortal(
    <span
      id="kcr-selection"
      style={{
        position: "absolute",
        zIndex: 9999,
        userSelect: "all",
        pointerEvents: "all",
        display: shouldDisplay ? "block" : "none",
        color: "transparent",
        cursor: shouldDisplay ? "#000000 !important" : "default",
        fontSize: "18px",
      }}
    >
      {detectedText}
    </span>,
    container.current
  );
};
