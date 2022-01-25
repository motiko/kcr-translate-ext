import { detectedTextContainerId, getAllSelectedTexts, isKindleText } from "../utils";
import React, { useCallback, useEffect, useReducer } from "react";
import { Commands, Engines } from "../../../const";
import { observePageEvents } from "./utils";
import { ContentContext } from "../ContentContext";
import { IKindleCloudReaderListenerProps } from "./types";
import { actionCreators, createDefaultState, reducer } from "./reducer";

const listenersOptions: EventListenerOptions = {
  capture: true,
};

export const KindleCloudReaderListener: React.FC<IKindleCloudReaderListenerProps> = ({
  children,
  settings,
  kindleElements,
  messagingService,
}) => {
  const [state, dispatch] = useReducer(reducer, undefined, createDefaultState);
  const setFullPageTranslationMode = useCallback((enabled: boolean) => {
    dispatch(actionCreators.setFullPageTranslationMode(enabled));
  }, []);
  const onLocationChange = useCallback(() => {
    if (state.isFullPageTranslationMode) {
      // if we in full page translation mode,
      // we need to translate new page

      // [] for selectedAreas will be replaced with the full text in OCR
      dispatch(actionCreators.startTranslation([]));
    } else {
      dispatch(actionCreators.unselect());
    }
  }, [state.isFullPageTranslationMode]);
  const onDoubleClick = useCallback(
    (e: MouseEvent) => {
      const target = e.target as HTMLSpanElement | null;
      if (state.isFullPageTranslationMode || !target) {
        return;
      }
      // check if target is a text in kindle
      if (!isKindleText(target)) {
        return;
      }
      // trigger word translation
      dispatch(actionCreators.startTranslation([target]));
    },
    [state.isFullPageTranslationMode]
  );
  const onMouseDown = useCallback(() => {
    if (!state.isFullPageTranslationMode) {
      dispatch(actionCreators.unselect());
    }
  }, [state.isFullPageTranslationMode]);
  const onMouseUp = useCallback(
    (e: MouseEvent) => {
      console.log("mouseUp");
      const target = e.target as HTMLElement | null;
      if (target?.id === detectedTextContainerId || state.isFullPageTranslationMode) {
        return;
      }
      // find all selected areas
      // they will exist in dnd selection and will be empty in double click selection
      const selectedAreas = getAllSelectedTexts(kindleElements);
      if (selectedAreas.length === 0) {
        return;
      }
      dispatch(actionCreators.startTranslation(selectedAreas));
    },
    [kindleElements, state.isFullPageTranslationMode]
  );
  const onTranslationFinish = useCallback((detectedText: string) => {
    console.info("Detected text:", detectedText);
    dispatch(actionCreators.finishTranslation(detectedText));
  }, []);
  useEffect(() => {
    let removeObservers: VoidFunction | null;
    if (settings.selectedEngine.name === Engines.GOOGLE_TRANSLATE_EXT) {
      removeObservers = observePageEvents(
        kindleElements,
        setFullPageTranslationMode,
        onLocationChange
      );
    }
    return () => removeObservers?.();
  }, [kindleElements, onLocationChange, setFullPageTranslationMode, settings.selectedEngine.name]);
  useEffect(() => {
    const { kindleIframeDocument, kindleContentArea } = kindleElements;
    kindleContentArea.addEventListener("mouseup", onMouseUp, listenersOptions);
    kindleContentArea.addEventListener("dblclick", onDoubleClick, listenersOptions);
    kindleIframeDocument.addEventListener("mousedown", onMouseDown, listenersOptions);
    void messagingService.sendMessageToExtension({ command: Commands.EXTENSION_MOUNTED });
    return () => {
      console.log("removeListeners");
      kindleContentArea.removeEventListener("mouseup", onMouseUp, listenersOptions);
      kindleContentArea.removeEventListener("dblclick", onDoubleClick, listenersOptions);
      kindleIframeDocument.removeEventListener("mousedown", onMouseDown, listenersOptions);
      void chrome.runtime.sendMessage({ command: Commands.EXTENSION_UNMOUNTED });
    };
  }, [kindleElements, messagingService, onDoubleClick, onMouseDown, onMouseUp]);
  return (
    <ContentContext.Provider
      value={{
        settings,
        messagingService,
        kindleElements,
        ...state,
        onTranslationFinish,
      }}
    >
      {children}
    </ContentContext.Provider>
  );
};
