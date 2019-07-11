chrome.runtime.onMessageExternal.addListener(function(
  request,
  sender,
  sendResponse
) {
  if (request.command === "GET_SETTINGS") {
    chrome.storage.sync.get("translateEngines", ({ translateEngines }) => {
      let settings = translateEngines
        ? translateEngines.find(e => e.selected)
        : {
            name: "google",
            label: "Google Tranlsate",
            url: "https://translate.google.com/?hl=en#auto/en/"
          };
      sendResponse(settings);
    });
  }
});
