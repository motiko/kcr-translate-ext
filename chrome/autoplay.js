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
      inject(function () {
        const srcPlay = document.querySelector(
          "div.source-footer > div.src-tts"
        );
        setTimeout(() => {
          srcPlay.dispatchEvent(new MouseEvent("mousedown"));
          srcPlay.dispatchEvent(new MouseEvent("mouseup"));
        }, 100);
      });
    }
  } else {
    console.error(chrome.runtime.lastError.message);
  }
});
