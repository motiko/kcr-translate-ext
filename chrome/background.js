
chrome.runtime.onMessageExternal.addListener(function (
  request,
  sender,
  sendResponse
) {
  if (request.command === "GET_SETTINGS") {
    chrome.storage.sync.get("translateEngines", ({ translateEngines }) => {
      let settings = translateEngines
        ? translateEngines.find((e) => e.selected)
        : {
            name: "google",
            label: "Google Tranlsate",
            url: "https://translate.google.com/?hl=en#auto/en/",
          };
      sendResponse(settings);
    });
  }
});

chrome.runtime.onMessage.addListener(function (request, sender, sendResponse) {
  if (request.command === "ACTIVATE_PAGE_ACTION") {
    chrome.pageAction.show(sender.tab.id);
  }
  if (request.command == "RELOAD_SCRIPT") {
    chrome.tabs.executeScript({
      file: "index.js",
    });
  }
  if (request.command === "GET_SETTINGS") {
    chrome.storage.sync.get("translateEngines", ({ translateEngines }) => {
      let settings = translateEngines
        ? translateEngines.find((e) => e.selected)
        : {
            name: "google",
            label: "Google Tranlsate",
            url: "https://translate.google.com/?hl=en#auto/en/",
            autoread: false,
          };
      sendResponse(settings);
    });
    return true;
  }
});
