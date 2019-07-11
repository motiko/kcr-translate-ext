let appTabIds = {};

function focusTab(tabId) {
  chrome.tabs.get(tabId, tab => {
    if (tab)
      chrome.tabs.update(tab.id, {
        active: true
      });
    chrome.windows.getCurrent({}, currentWindow => {
      if (tab.windowId != currentWindow.id) {
        chrome.windows.update(tab.windowId, {
          focused: true
        });
      }
    });
  });
}

function openOrFocusTab(url, name) {
  if (appTabIds[name]) {
    focusTab(appTabIds[name]);
  } else {
    openTab(url, name);
  }
}

function openTab(url, name) {
  chrome.tabs.create(
    {
      url: url,
      selected: true
    },
    tab => (appTabIds[name] = tab.id)
  );
}

chrome.browserAction.onClicked.addListener(() =>
  openOrFocusTab(chrome.extension.getURL("options.html"), "options")
);

chrome.tabs.onRemoved.addListener((tabId, changeInfo, tab) => {
  if (Object.values(appTabIds).indexOf(tabId) > -1) {
    Object.keys(appTabIds)
      .filter(key => appTabIds[key] == tabId)
      .forEach(key => (appTabIds[key] = undefined));
  }
});

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
