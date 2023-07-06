chrome.tabs.onUpdated.addListener(function (tabId, changeInfo, tab) {
  if (!tab.url || tab.url.startsWith('chrome://')) return;
  if (tab.status !== 'complete') {
    return;
  }
  chrome.tabs.query({ active: true, currentWindow: true }, function (tabs) {
    var url = tabs[0].url;
    // check if the change is on the target page
    if (tab.url === url) {
      chrome.scripting.executeScript({
        target: { tabId: tabId },
        files: ['scripts/content.js'],
      });
    }
  });
});
