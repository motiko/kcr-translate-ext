let appTabIds = {};

function focusTab(tabId) {
  browser.tabs.get(tabId).then(tab => {
    if (tab)
      browser.tabs.update(tab.id, {
        active: true
      });
    browser.windows.getCurrent({}).then(currentWindow => {
      if (tab.windowId != currentWindow.id) {
        browser.windows.update(tab.windowId, {
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
  browser.tabs
    .create({
      url: url,
      selected: true
    })
    .then(tab => (appTabIds[name] = tab.id));
}

browser.browserAction.onClicked.addListener(() =>
  openOrFocusTab(browser.extension.getURL("options.html"), "options")
);

browser.tabs.onRemoved.addListener((tabId, changeInfo, tab) => {
  if (Object.values(appTabIds).indexOf(tabId) > -1) {
    Object.keys(appTabIds)
      .filter(key => appTabIds[key] == tabId)
      .forEach(key => (appTabIds[key] = undefined));
  }
});

