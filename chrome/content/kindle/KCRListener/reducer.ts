import { IKindleCloudReaderListenerState } from "./types";
import { TranslationStatus } from "../utils";
import { isFullPageTranslation } from "./utils";

enum Actions {
  START_TRANSLATION = "START_TRANSLATION",
  FINISH_TRANSLATION = "FINISH_TRANSLATION",
  UNSELECT = "UNSELECT",
  SET_FULL_PAGE_TRANSLATION = "SET_FULL_PAGE_TRANSLATION",
}

interface IStartTranslationAction {
  payload: HTMLSpanElement[];
  type: Actions.START_TRANSLATION;
}

interface IFinishTranslationAction {
  payload: string;
  type: Actions.FINISH_TRANSLATION;
}

interface IUnselectAction {
  type: Actions.UNSELECT;
}

interface ISetFullPageTranslationAction {
  payload: boolean;
  type: Actions.SET_FULL_PAGE_TRANSLATION;
}

type Action =
  | IStartTranslationAction
  | IFinishTranslationAction
  | ISetFullPageTranslationAction
  | IUnselectAction;

const startTranslation = (selectedAreas: HTMLSpanElement[]): IStartTranslationAction => ({
  payload: selectedAreas,
  type: Actions.START_TRANSLATION,
});

const finishTranslation = (text: string): IFinishTranslationAction => ({
  payload: text,
  type: Actions.FINISH_TRANSLATION,
});

const unselect = (): IUnselectAction => ({
  type: Actions.UNSELECT,
});

const setFullPageTranslationMode = (enabled: boolean): ISetFullPageTranslationAction => ({
  payload: enabled,
  type: Actions.SET_FULL_PAGE_TRANSLATION,
});

export const actionCreators = {
  startTranslation,
  finishTranslation,
  unselect,
  setFullPageTranslationMode,
};

export const createDefaultState = (): IKindleCloudReaderListenerState => ({
  translationStatus: TranslationStatus.IDLE,
  detectedText: "",
  selectedAreas: [],
  isFullPageTranslationMode: isFullPageTranslation(),
});

export function reducer(
  state: IKindleCloudReaderListenerState,
  action: Action
): IKindleCloudReaderListenerState {
  switch (action.type) {
    case Actions.UNSELECT:
      return {
        isFullPageTranslationMode: state.isFullPageTranslationMode,
        detectedText: "",
        selectedAreas: [],
        translationStatus: TranslationStatus.IDLE,
      };
    case Actions.SET_FULL_PAGE_TRANSLATION:
      if (state.isFullPageTranslationMode === action.payload) {
        // do nothing
        return state;
      }
      return {
        isFullPageTranslationMode: action.payload,
        detectedText: "",
        selectedAreas: [],
        translationStatus: action.payload ? TranslationStatus.STARTED : TranslationStatus.IDLE,
      };
    case Actions.START_TRANSLATION:
      return {
        ...state,
        translationStatus: TranslationStatus.STARTED,
        detectedText: "",
        selectedAreas: action.payload,
      };
    case Actions.FINISH_TRANSLATION:
      // since this can be called ina async way
      // we need to check if the translation still required
      if (state.translationStatus !== TranslationStatus.STARTED) {
        // do nothing
        return state;
      }
      return {
        ...state,
        translationStatus: TranslationStatus.FINISHED,
        detectedText: action.payload,
      };
    default:
      throw new Error();
  }
}
