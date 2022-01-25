import React, { useCallback, useContext, useEffect, useState } from "react";
import Progress from "./Progress";
import { ContentContext } from "./ContentContext";
import { getAllTexts, transformSelected, TranslationStatus } from "./utils";
import { Commands, IOcrInputData, IOcrOutputData } from "../../const";
import { Message, Messaging } from "../../services/messaging";
import MessageSender = chrome.runtime.MessageSender;

async function recognizeText(
  messagingService: Messaging,
  data: IOcrInputData
): Promise<IOcrOutputData> {
  return messagingService.sendMessageToExtension({
    command: Commands.START_RECOGNITION,
    payload: data,
  });
}

export const OCR: React.FC = () => {
  const {
    messagingService,
    selectedAreas,
    translationStatus,
    isFullPageTranslationMode,
    kindleElements,
    onTranslationFinish,
  } = useContext(ContentContext);
  const [progress, setProgress] = useState(0);
  const [error, setError] = useState("");
  const messageListener = useCallback(
    (request: Message, sender: MessageSender, sendResponse: (response: any) => void) => {
      if (request.command === Commands.SET_PROGRESS) {
        setProgress(request.payload);
      }
      setTimeout(function () {
        sendResponse(true);
      }, 0);
      return true;
    },
    []
  );
  useEffect(() => {
    chrome.runtime.onMessage.addListener(messageListener);
    return () => {
      chrome.runtime.onMessage.removeListener(messageListener);
    };
  }, [messageListener]);
  useEffect(() => {
    if (
      translationStatus === TranslationStatus.STARTED ||
      translationStatus === TranslationStatus.IDLE
    ) {
      setError("");
      setProgress(0);
    }
    if (translationStatus === TranslationStatus.STARTED) {
      let areas = selectedAreas;
      if (isFullPageTranslationMode) {
        areas = getAllTexts(kindleElements);
      }
      const data = transformSelected(kindleElements, areas);
      if (data) {
        recognizeText(messagingService, data)
          .then(({ error, text }) => {
            setError(error);
            onTranslationFinish(text);
          })
          .catch((error) => {
            console.log("recognition error:", error);
            setError(error);
            onTranslationFinish("");
          });
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [translationStatus]);
  return (
    <Progress
      progress={progress}
      show={translationStatus !== TranslationStatus.IDLE}
      error={error}
    />
  );
};
