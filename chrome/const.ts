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

// used when the book language is unknown or has no tesseract model
export const FALLBACK_OCR_LANG = "eng";

// BCP 47 primary language subtag (as KCR reports the book language) -> tesseract language code
const isoToTesseractLangs: Record<string, string> = {
  af: "afr",
  am: "amh",
  ar: "ara",
  as: "asm",
  az: "aze",
  be: "bel",
  bg: "bul",
  bn: "ben",
  bo: "bod",
  bs: "bos",
  ca: "cat",
  cs: "ces",
  cy: "cym",
  da: "dan",
  de: "deu",
  dz: "dzo",
  el: "ell",
  en: "eng",
  eo: "epo",
  es: "spa",
  et: "est",
  eu: "eus",
  fa: "fas",
  fi: "fin",
  fil: "tgl",
  fr: "fra",
  ga: "gle",
  gl: "glg",
  gu: "guj",
  he: "heb",
  hi: "hin",
  hr: "hrv",
  ht: "hat",
  hu: "hun",
  id: "ind",
  in: "ind",
  is: "isl",
  it: "ita",
  iu: "iku",
  iw: "heb",
  ja: "jpn",
  ji: "yid",
  jv: "jav",
  ka: "kat",
  kk: "kaz",
  km: "khm",
  kn: "kan",
  ko: "kor",
  ku: "kur",
  ky: "kir",
  la: "lat",
  lo: "lao",
  lt: "lit",
  lv: "lav",
  mk: "mkd",
  ml: "mal",
  mr: "mar",
  ms: "msa",
  mt: "mlt",
  my: "mya",
  nb: "nor",
  ne: "nep",
  nl: "nld",
  nn: "nor",
  no: "nor",
  or: "ori",
  pa: "pan",
  pl: "pol",
  ps: "pus",
  pt: "por",
  ro: "ron",
  ru: "rus",
  sa: "san",
  si: "sin",
  sk: "slk",
  sl: "slv",
  sq: "sqi",
  sr: "srp",
  sv: "swe",
  sw: "swa",
  ta: "tam",
  te: "tel",
  tg: "tgk",
  th: "tha",
  ti: "tir",
  tl: "tgl",
  tr: "tur",
  ug: "uig",
  uk: "ukr",
  ur: "urd",
  uz: "uzb",
  vi: "vie",
  yi: "yid",
};

// Maps a book language such as "de", "pt-BR" or "zh-Hant" to a tesseract language code,
// or undefined when there is no model for it.
export const bookLangToTesseract = (bookLang?: string | null): string | undefined => {
  if (!bookLang) {
    return undefined;
  }
  const [primary, ...subtags] = bookLang.toLowerCase().split(/[-_]/);
  if (primary === "zh") {
    return subtags.some((s) => ["hant", "tw", "hk", "mo"].includes(s)) ? "chi_tra" : "chi_sim";
  }
  if (primary === "sr" && subtags.includes("latn")) {
    return "srp_latn";
  }
  if (primary in isoToTesseractLangs) {
    return isoToTesseractLangs[primary];
  }
  // some books already use a three-letter code
  return primary in tesseractLangs ? primary : undefined;
};

// What tesseract should load for a book language.
export const ocrLangsForBook = (bookLang?: string | null): string =>
  bookLangToTesseract(bookLang) ?? FALLBACK_OCR_LANG;

// Set on <html> by the bookLang content script (MAIN world) when KCR loads a book.
export const bookLangDataKey = "kcrtBookLang";

export enum Commands {
  SETTINGS_UPDATED = "SETTINGS_UPDATED",
  EXTENSION_MOUNTED = "ACTIVATE_PAGE_ACTION",
  EXTENSION_UNMOUNTED = "EXTENSION_UNMOUNTED",
  SET_PROGRESS = "SET_PROGRESS",
  START_RECOGNITION = "START_RECOGNITION",
  GET_SETTINGS = "GET_SETTINGS",
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
