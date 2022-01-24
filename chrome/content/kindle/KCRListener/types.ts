import { TSettings } from "../../../services/settings";
import { IKindleCenterElements, TranslationStatus } from "../utils";
import { Messaging } from "../../../services/messaging";

export interface IKindleCloudReaderListenerProps {
  settings: TSettings;
  kindleElements: IKindleCenterElements;
  messagingService: Messaging;
}

export interface IKindleCloudReaderListenerState {
  detectedText: string;
  selectedAreas: HTMLSpanElement[];
  translationStatus: TranslationStatus;
  isFullPageTranslationMode: boolean;
}
