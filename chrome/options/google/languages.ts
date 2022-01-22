export interface IGoogleLanguage {
  language_name: string,
  language_code: string,
}

export const google_languages: IGoogleLanguage[] = [
  { language_name: "Automatic Detection", language_code: "auto" },
  { language_name: "Afrikaans", language_code: "af" },
  { language_name: "Albanian", language_code: "sq" },
  { language_name: "Arabic", language_code: "ar" },
  { language_name: "Azerbaijani", language_code: "az" },
  { language_name: "Basque", language_code: "eu" },
  { language_name: "Bengali", language_code: "bn" },
  { language_name: "Belarusian", language_code: "be" },
  { language_name: "Bulgarian", language_code: "bg" },
  { language_name: "Catalan", language_code: "ca" },
  { language_name: "Chinese Simplified", language_code: "zh-CN" },
  { language_name: "Chinese Traditional", language_code: "zh-TW" },
  { language_name: "Croatian", language_code: "hr" },
  { language_name: "Czech", language_code: "cs" },
  { language_name: "Danish", language_code: "da" },
  { language_name: "Dutch", language_code: "nl" },
  { language_name: "English", language_code: "en" },
  { language_name: "Esperanto", language_code: "eo" },
  { language_name: "Estonian", language_code: "et" },
  { language_name: "Filipino", language_code: "tl" },
  { language_name: "Finnish", language_code: "fi" },
  { language_name: "French", language_code: "fr" },
  { language_name: "Galician", language_code: "gl" },
  { language_name: "Georgian", language_code: "ka" },
  { language_name: "German", language_code: "de" },
  { language_name: "Greek", language_code: "el" },
  { language_name: "Gujarati", language_code: "gu" },
  { language_name: "Haitian Creole", language_code: "ht" },
  { language_name: "Hebrew", language_code: "iw" },
  { language_name: "Hindi", language_code: "hi" },
  { language_name: "Hungarian", language_code: "hu" },
  { language_name: "Icelandic", language_code: "is" },
  { language_name: "Indonesian", language_code: "id" },
  { language_name: "Irish", language_code: "ga" },
  { language_name: "Italian", language_code: "it" },
  { language_name: "Japanese", language_code: "ja" },
  { language_name: "Kannada", language_code: "kn" },
  { language_name: "Korean", language_code: "ko" },
  { language_name: "Latin", language_code: "la" },
  { language_name: "Latvian", language_code: "lv" },
  { language_name: "Lithuanian", language_code: "lt" },
  { language_name: "Macedonian", language_code: "mk" },
  { language_name: "Malay", language_code: "ms" },
  { language_name: "Maltese", language_code: "mt" },
  { language_name: "Norwegian", language_code: "no" },
  { language_name: "Persian", language_code: "fa" },
  { language_name: "Polish", language_code: "pl" },
  { language_name: "Portuguese", language_code: "pt" },
  { language_name: "Romanian", language_code: "ro" },
  { language_name: "Russian", language_code: "ru" },
  { language_name: "Serbian", language_code: "sr" },
  { language_name: "Slovak", language_code: "sk" },
  { language_name: "Slovenian", language_code: "sl" },
  { language_name: "Spanish", language_code: "es" },
  { language_name: "Swahili", language_code: "sw" },
  { language_name: "Swedish", language_code: "sv" },
  { language_name: "Tamil", language_code: "ta" },
  { language_name: "Telugu", language_code: "te" },
  { language_name: "Thai", language_code: "th" },
  { language_name: "Turkish", language_code: "tr" },
  { language_name: "Ukrainian", language_code: "uk" },
  { language_name: "Urdu", language_code: "ur" },
  { language_name: "Vietnamese", language_code: "vi" },
  { language_name: "Welsh", language_code: "cy" },
  { language_name: "Yiddish", language_code: "yi" },
];

export function getLanguagesFromGoogleUrl(url: string): {from: string, to: string} {
  const parsedUrl = url.match(/#(\w+)\/(\w+)\//);
  if (!parsedUrl) {
    throw new Error(`Could not parse google url: ${url}`);
  }
  const [, fromCode, toCode] = parsedUrl;
  const fromLang = google_languages.find((l) => l.language_code === fromCode);
  const toLang = google_languages.find((l) => l.language_code === toCode);
  if (!fromLang || !toLang) {
    throw new Error(
      `Could not find language with code ${fromCode} or ${toCode}. Check if ${url} is valid google url`
    );
  }
  const from = fromLang.language_code;
  const to = toLang.language_code;
  return { from, to };
}
