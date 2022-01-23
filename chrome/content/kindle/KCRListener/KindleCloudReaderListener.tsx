import { getAllSelectedTexts, isKindleText } from "../utils";
import React, { useCallback, useEffect, useReducer } from "react";
import { Commands, Engines } from "../../../const";
import { injectStylesToKindlePage, observePageEvents } from "./utils";
import { ProviderContext } from "../ProviderContext";
import { IKindleCloudReaderListenerProps } from "./types";
import { actionCreators, createDefaultState, reducer } from "./reducer";

const listenersOptions: EventListenerOptions = {
  capture: true,
};

export const KindleCloudReaderListener: React.FC<IKindleCloudReaderListenerProps> = ({
  children,
  settings,
  kindleElements,
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
  const onMouseUp = useCallback(() => {
    // if (e.target.id === detectedTextContainer.id || isFullPageTranslationMode) {
    //   return;
    // }
    if (state.isFullPageTranslationMode) {
      return;
    }
    // find all selected areas
    // they will exist in dnd selection and will be empty in double click selection
    const selectedAreas = getAllSelectedTexts(kindleElements);
    dispatch(actionCreators.startTranslation(selectedAreas));
  }, [kindleElements, state.isFullPageTranslationMode]);
  const onTranslationFinish = useCallback((detectedText: string) => {
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
    const removeStyles = injectStylesToKindlePage(kindleElements);
    chrome.runtime.sendMessage({ command: Commands.EXTENSION_MOUNTED });
    return () => {
      console.log("removeListeners");
      kindleContentArea.removeEventListener("mouseup", onMouseUp, listenersOptions);
      kindleContentArea.removeEventListener("dblclick", onDoubleClick, listenersOptions);
      kindleIframeDocument.removeEventListener("mousedown", onMouseDown, listenersOptions);
      removeStyles();
      chrome.runtime.sendMessage({ command: Commands.EXTENSION_UNMOUNTED });
    };
  }, [kindleElements, onDoubleClick, onMouseDown, onMouseUp]);
  return (
    <ProviderContext.Provider
      value={{
        settings,
        kindleElements,
        ...state,
        onTranslationFinish,
      }}
    >
      {children}
    </ProviderContext.Provider>
  );
};
