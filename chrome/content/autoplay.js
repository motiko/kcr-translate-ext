function inject(fn) {
  var script = document.createElement("script");
  script.setAttribute("type", "application/javascript");
  script.textContent = "(" + fn + ")();";
  document.body.appendChild(script); // run the script
  document.body.removeChild(script); // clean up
}

chrome.runtime.sendMessage({ command: "ACTIVATE_PAGE_ACTION" });

chrome.runtime.sendMessage({ command: "GET_SETTINGS" }, function (response) {
  if (response) {
    if (response && response.autoread) {
      inject(main);
    }
  } else {
    console.error(chrome.runtime.lastError.message);
  }
});

function main() {
  const srcPlay = document.querySelector("div.source-footer > div.src-tts");
  const container = document.querySelector(".input-button-container");
  let autoreadEnabled = true;
  window.onhashchange = function () {
    autoRead();
  };

  const autoRead = () => {
    if (autoreadEnabled) {
      srcPlay.dispatchEvent(new MouseEvent("mousedown"));
      srcPlay.dispatchEvent(new MouseEvent("mouseup"));
    }
  };

  let cb = document.createElement("span");
  cb.innerHTML = `<input type="checkbox" id="auto_read" checked="checked" />
                        <label for="auto_read">Autoread</label>`;
  container.appendChild(cb);
  document
    .querySelector("#auto_read")
    .addEventListener("click", function ({ target }) {
      autoreadEnabled = target.checked;
    });
  setTimeout(autoRead, 500);
}
