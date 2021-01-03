chrome.runtime.sendMessage({ command: "ACTIVATE_PAGE_ACTION" });

function inject(fn) {
  var script = document.createElement("script");
  script.setAttribute("type", "application/javascript");
  script.textContent = "(" + fn + ")();";
  document.body.appendChild(script); // run the script
  document.body.removeChild(script); // clean up
}

setTimeout(() => {
  inject(main);
}, 2000);

function main() {
  let settings = {
    name: "google",
    label: "Google Tranlsate",
    url: "https://translate.google.com/?hl=en#auto/en/",
  };
  chrome.runtime.sendMessage(
    "ipalacjfeejceeogpnfaijpadginmfhk",
    { command: "GET_SETTINGS" },
    function (response) {
      if (response) {
        settings = response;
      }
    }
  );
  function cleanIframes() {
    $("#KindleReaderIFrame")
      .contents()
      .find("#kindleReader_content")
      .get(0).style.zIndex = 201;
    $("#KindleReaderIFrame")
      .contents()
      .find("#kindleReader_content")
      .each(function (e) {
        $(this)
          .find("iframe")
          .each(function () {
            const document = this.contentDocument;
            const body = this.contentDocument.body;
            if (body.classList.contains("amzUserPref")) {
              body.style.userSelect = "text";
              body.parentElement.contenteditable = "true";
              body.onselectstart = function (e) {
                return true;
              };

              document.body.onmouseup = function () {
                let selectedText = document.getSelection().toString();
                if (selectedText) {
                  window.open(
                    settings.url + selectedText,
                    settings.label,
                    "height=400,width=776,location=0,menubar=0,scrollbars=1,toolbar=0"
                  );
                }
              };
            }
          });
      });
  }

  setInterval(cleanIframes, 1000);
}
