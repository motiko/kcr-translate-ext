const $i = document.getElementById.bind(document);
const google_languages = [
  { language_name: "Auto detect", language_code: "auto" },
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
  { language_name: "Yiddish", language_code: "yi" }
];

const defaultTranslateEngines = [
  {
    name: "google",
    label: "Google Tranlsate",
    url: "https://translate.google.com/#auto/en/",
    selected: true
  },
  {
    name: "dict",
    label: "dict.cc",
    url: "http://pocket.dict.cc/?s=",
    selected: false
  },
  {
    name: "custom",
    label: "Custom",
    url: "",
    selected: false
  }
];

let curTranslateEngines = defaultTranslateEngines;

window.onload = load;

function load(onDoneLoading) {
  chrome.storage.sync.get("translateEngines", ({ translateEngines }) => {
    curTranslateEngines = translateEngines || defaultTranslateEngines;
    $i("translate_engine").innerHTML = "";
    curTranslateEngines.forEach(
      engine =>
        ($i("translate_engine").innerHTML += `<option value="${
          engine.name
        }" ${engine.selected && "selected"}>${engine.label}</option>`)
    );
    $i("translate_engine").addEventListener("change", onChangeEngine);
    $i("save_btn").addEventListener("click", saveSettings);
    $i("src_lang").addEventListener("change", onSrcLangChange);
    $i("destination_lang").addEventListener("change", onDestinationLangChange);
    $i("restore_defaults_btn").addEventListener(
      "click",
      restoreDefaultSettings
    );
    onChangeEngine();
    if (onDoneLoading && typeof onDoneLoading === "function") {
      onDoneLoading();
    }
  });
}

function onDestinationLangChange(event) {
  const prevUrl = $i("url").value;
  if (!prevUrl.match(/(#\w+\/)\w+\//)) {
    showMessage("error_message");
    return;
  }
  const langName = event.target.value;
  const lang = google_languages.find(l => l.language_name === langName);
  if (!lang) return;
  const langCode = lang.language_code;
  const newUrl = prevUrl.replace(/(#\w+\/)\w+\//, `$1${langCode}/`);
  $i("url").value = newUrl;
}

function onSrcLangChange(event) {
  const prevUrl = $i("url").value;
  if (!prevUrl.match(/\#\w+\//)) {
    showMessage("error_message");
    return;
  }
  const langName = event.target.value;
  const lang = google_languages.find(l => l.language_name === langName);
  if (!lang) return;
  const langCode = lang.language_code;
  const newUrl = prevUrl.replace(/\#\w+\//, `#${langCode}/`);
  $i("url").value = newUrl;
}

function restoreDefaultSettings() {
  chrome.storage.sync.set(
    {
      translateEngines: defaultTranslateEngines
    },
    () => {
      showMessage("defaults_restored_message");
      setTimeout(() => load(saveSettings), 1500);
    }
  );
}

function setUrl(event) {
  const selectedEngineName = $i("translate_engine").value;
  const engineIndex = curTranslateEngines.findIndex(
    e => e.name === selectedEngineName
  );
  curTranslateEngines[engineIndex] = {
    ...curTranslateEngines[engineIndex],
    url: event.target.value
  };
}

function onChangeEngine() {
  const selectedEngineName = $i("translate_engine").value;
  const selectedEngineUrl = curTranslateEngines.find(
    t => t.name === selectedEngineName
  ).url;
  $i("url").value = selectedEngineUrl;
  $i("google_lang_controls").classList.add("hidden");
  if (selectedEngineName === "google") {
    $i("google_lang_controls").classList.remove("hidden");
    const { from, to } = getLanguagesFromGoogleUrl(selectedEngineUrl);
    $i("src_lang").value = from;
    $i("destination_lang").value = to;
  }
}

function getLanguagesFromGoogleUrl(url) {
  const parsedUrl = url.match(/#(\w+)\/(\w+)\//);
  if (!parsedUrl) {
    throw new Error(`Could not parse google url: ${url}`);
  }
  const [_, fromCode, toCode] = parsedUrl;
  const fromLang = google_languages.find(l => l.language_code === fromCode);
  const toLang = google_languages.find(l => l.language_code === toCode);
  if (!fromLang || !toLang) {
    throw new Error(
      `Could not find language with code ${fromCode} or ${toCode}. Check if ${url} is valid google url`
    );
  }
  const from = fromLang.language_name;
  const to = toLang.language_name;
  return { from, to };
}

function saveSettings() {
  const selectedEngineName = $i("translate_engine").value;
  const selectedEngine = curTranslateEngines.find(
    e => e.name === selectedEngineName
  );
  curTranslateEngines.forEach(engine => (engine.selected = false));
  selectedEngine["selected"] = true;
  selectedEngine["url"] = $i("url").value;
  chrome.storage.sync.set(
    {
      translateEngines: curTranslateEngines
    },
    chrome.runtime.sendMessage({ command: "RELOAD_SCRIPT" })
  );
  showMessage("saved_message");
}

function showMessage(messageId) {
  $i(messageId).classList.remove("opaque");
  setTimeout(() => $i(messageId).classList.add("opaque"), 2500);
}
