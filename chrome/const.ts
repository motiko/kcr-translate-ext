export const tesseractLangs = {
  afr: "Afrikaans",
  amh: "Amharic",
  ara: "Arabic",
  asm: "Assamese",
  aze: "Azerbaijani",
  aze_cyrl: "Azerbaijani - Cyrillic",
  bel: "Belarusian",
  ben: "Bengali",
  bod: "Tibetan",
  bos: "Bosnian",
  bul: "Bulgarian",
  cat: "Catalan; Valencian",
  ceb: "Cebuano",
  ces: "Czech",
  chi_sim: "Chinese - Simplified",
  chi_tra: "Chinese - Traditional",
  chr: "Cherokee",
  cym: "Welsh",
  dan: "Danish",
  deu: "German",
  dzo: "Dzongkha",
  ell: "Greek, Modern (1453-)",
  eng: "English",
  enm: "English, Middle (1100-1500)",
  epo: "Esperanto",
  est: "Estonian",
  eus: "Basque",
  fas: "Persian",
  fin: "Finnish",
  fra: "French",
  frk: "German Fraktur",
  frm: "French, Middle (ca. 1400-1600)",
  gle: "Irish",
  glg: "Galician",
  grc: "Greek, Ancient (-1453)",
  guj: "Gujarati",
  hat: "Haitian; Haitian Creole",
  heb: "Hebrew",
  hin: "Hindi",
  hrv: "Croatian",
  hun: "Hungarian",
  iku: "Inuktitut",
  ind: "Indonesian",
  isl: "Icelandic",
  ita: "Italian",
  ita_old: "Italian - Old",
  jav: "Javanese",
  jpn: "Japanese",
  kan: "Kannada",
  kat: "Georgian",
  kat_old: "Georgian - Old",
  kaz: "Kazakh",
  khm: "Central Khmer",
  kir: "Kirghiz; Kyrgyz",
  kor: "Korean",
  kur: "Kurdish",
  lao: "Lao",
  lat: "Latin",
  lav: "Latvian",
  lit: "Lithuanian",
  mal: "Malayalam",
  mar: "Marathi",
  mkd: "Macedonian",
  mlt: "Maltese",
  msa: "Malay",
  mya: "Burmese",
  nep: "Nepali",
  nld: "Dutch; Flemish",
  nor: "Norwegian",
  ori: "Oriya",
  pan: "Panjabi; Punjabi",
  pol: "Polish",
  por: "Portuguese",
  pus: "Pushto; Pashto",
  ron: "Romanian; Moldavian; Moldovan",
  rus: "Russian",
  san: "Sanskrit",
  sin: "Sinhala; Sinhalese",
  slk: "Slovak",
  slv: "Slovenian",
  spa: "Spanish; Castilian",
  spa_old: "Spanish; Castilian - Old",
  sqi: "Albanian",
  srp: "Serbian",
  srp_latn: "Serbian - Latin",
  swa: "Swahili",
  swe: "Swedish",
  syr: "Syriac",
  tam: "Tamil",
  tel: "Telugu",
  tgk: "Tajik",
  tgl: "Tagalog",
  tha: "Thai",
  tir: "Tigrinya",
  tur: "Turkish",
  uig: "Uighur; Uyghur",
  ukr: "Ukrainian",
  urd: "Urdu",
  uzb: "Uzbek",
  uzb_cyrL: "Uzbek - Cyrillic",
  vie: "Vietnamese",
  yid: "Yiddish",
};

export enum Commands {
  SETTINGS_UPDATED = "SETTINGS_UPDATED",
  EXTENSION_MOUNTED = "ACTIVATE_PAGE_ACTION",
  EXTENSION_UNMOUNTED = "EXTENSION_UNMOUNTED",
  SET_PROGRESS = "SET_PROGRESS",
  START_RECOGNITION = "START_RECOGNITION",
}

export enum Engines {
  GOOGLE_TRANSLATE = "google",
  GOOGLE_TRANSLATE_EXT = "google-ext",
  DICT_CC = "dict",
  CUSTOM = "custom",
}

export interface ITranslateEngine {
  readonly name: Engines;
  readonly label: string;
  readonly url: string;
  readonly autoread?: boolean;
  readonly selected: boolean;
}

export const defaultTranslateEngines: readonly ITranslateEngine[] =
  Object.freeze([
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
  selectedEngine: ITranslateEngine;
  onEngineUpdate: (newEngineData: ITranslateEngine) => void;
}

export interface IDimensions {
  left: number;
  top: number;
  width: number;
  height: number;
}

export interface IOcrInputData {
  dataUrl: string;
  columns: IDimensions[];
}

export interface IOcrOutputData {
  error: string;
  text: string;
}

export const kindleContentScriptMountId = "kindleContentScript";
export const chromeExtensionId = "ipalacjfeejceeogpnfaijpadginmfhk";
