const $i = document.getElementById.bind(document);

const defaultTranslateEngines = [
  {
    name: "google",
    label: "Google Tranlsate",
    url: "https://translate.google.com/?hl=en#auto/en/",
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

function load() {
  chrome.storage.sync.get("translateEngines",({ translateEngines }) => {
    curTranslateEngines = translateEngines || defaultTranslateEngines;
    curTranslateEngines.forEach(
      engine =>
      ($i("translate_engine").innerHTML += `<option value="${
          engine.name
        }" ${engine.selected && "selected"}>${engine.label}</option>`)
    );
    $i("translate_engine").addEventListener("change", setUrlByEngine);
    $i("save_btn").addEventListener("click", saveSettings);
    $i("restore_defaults_btn").addEventListener(
      "click",
      restoreDefaultSettings
    );
    setUrlByEngine();
  });
}

function restoreDefaultSettings() {
  chrome.storage.sync
    .set({
      translateEngines: defaultTranslateEngines
    })
    .then(() => {
      $i("saved_message").classList.remove("hidden");
      setTimeout(() => window.location.reload(), 1500);
    });
}

function setUrl(event) {
  const selectedEngine = $i("translate_engine").value;
  const engineIndex = curTranslateEngines.findIndex(
    e => e.name === selectedEngine
  );
  curTranslateEngines[engineIndex] = {
    ...curTranslateEngines[engineIndex],
    url: event.target.value
  };
  console.log(curTranslateEngines);
}

function setUrlByEngine() {
  const selectedEngine = $i("translate_engine").value;
  $i("url").value = curTranslateEngines.find(
    t => t.name === selectedEngine
  ).url;
}

function saveSettings() {
  const selectedEngineName = $i("translate_engine").value;
  const selectedEngine = curTranslateEngines.find(
    e => e.name === selectedEngineName
  );
  curTranslateEngines.forEach(engine => (engine.selected = false));
  selectedEngine["selected"] = true;
  selectedEngine["url"] = $i("url").value;
  chrome.storage.sync.set({
    translateEngines: curTranslateEngines
  });
  showMessage();
}

function showMessage() {
  $i("saved_message").classList.remove("hidden");
  setTimeout(() => $i("saved_message").classList.add("hidden"), 2500);
}
