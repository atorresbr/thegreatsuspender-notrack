chrome.runtime.onMessage.addListener((msg, sender, sendResponse) => {
  if (msg.action === "exportTabs") {
    chrome.tabs.query({}, tabs => {
      const exportTabs = tabs.filter(tab =>
        tab.url &&
        !tab.url.startsWith("chrome://") &&
        !tab.url.startsWith("chrome-extension://")
      ).map(tab => ({
        title: tab.title,
        url: tab.url
      }));
      sendResponse({tabs: exportTabs}); // Send the filtered tabs as a response
    });
    return true; // Keep the message channel open for async sendResponse
  } else {
    // If the action is not recognized, send an empty response
    sendResponse({});
  }
});
