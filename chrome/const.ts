// @ts-ignore
import tesseractLangs from 'tesseract.js/src/constants/languages'

export enum Engines {
  GOOGLE_TRANSLATE = 'google',
  GOOGLE_TRANSLATE_EXT = 'google-ext',
  DICT_CC = 'dict',
  CUSTOM = 'custom',
}

export interface ITranslateEngine {
  readonly name: Engines,
  readonly label: string,
  readonly url: string,
  readonly autoread?: boolean,
  readonly selected: boolean,
}

export const defaultTranslateEngines: readonly ITranslateEngine[] = Object.freeze([
  {
    name: Engines.GOOGLE_TRANSLATE,
    label: "Google Translate",
    url: "https://translate.google.com/#auto/en/",
    autoread: false,
    selected: true,
  },
  {
    name: Engines.GOOGLE_TRANSLATE_EXT,
    label: "Google Translate Extension",
    url: "",
    autoread: false,
    selected: false,
  },
  {
    name: Engines.DICT_CC,
    label: "dict.cc",
    url: "http://pocket.dict.cc/?s=",
    selected: false,
  },
  {
    name: Engines.CUSTOM,
    label: "Custom",
    url: "",
    selected: false,
  },
]);

export interface IEngineOptionsProps {
  selectedEngine: ITranslateEngine,
  onEngineUpdate: (newEngineData: ITranslateEngine) => void,
}

// @ts-ignore
export const supportedOcrLangs: string[] = Object.values(tesseractLangs);

