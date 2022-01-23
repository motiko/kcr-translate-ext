import { TSettings } from "../../../services/settings";
import { IKindleCenterElements, TranslationStatus } from "../utils";

export interface IKindleCloudReaderListenerProps {
  settings: TSettings;
  kindleElements: IKindleCenterElements;
}

export interface IKindleCloudReaderListenerState {
  detectedText: string;
  selectedAreas: HTMLSpanElement[];
  translationStatus: TranslationStatus;
  isFullPageTranslationMode: boolean;
}
