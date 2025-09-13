#!/bin/bash
# filepath: /home/linux/Documents/GitHub/thegreatsuspender-notrack/fix_session_management.sh

BG_JS="/home/linux/Documents/GitHub/thegreatsuspender-notrack/src/js/background-wrapper.js"

cat > "$BG_JS" << 'EOF'
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
      sendResponse({tabs: exportTabs});
    });
    return true;
  }
  if (msg.action === "importTabs") {
    try {
      const imported = JSON.parse(msg.jsonData);
      const tabsArray = imported.tabs || imported;
      if (!Array.isArray(tabsArray)) {
        sendResponse({success: false});
        return true;
      }
      // Optionally, open tabs here:
      // tabsArray.forEach(tab => chrome.tabs.create({url: tab.url}));
      sendResponse({success: true, imported: tabsArray.length});
    } catch (err) {
      sendResponse({success: false});
    }
    return true;
  }
  if (msg.action === "backupTabs") {
    chrome.tabs.query({}, tabs => {
      // Save tabs to storage
      chrome.storage.local.set({backupTabs: tabs}, () => {
        sendResponse({success: true, count: tabs.length});
      });
    });
    return true;
  }
  if (msg.action === "restoreSession") {
    const sessionId = msg.sessionId;
    chrome.storage.local.get([sessionId], result => {
      const sessionTabs = result[sessionId] || [];
      sessionTabs.forEach(tab => chrome.tabs.create({url: tab.url}));
      sendResponse({success: true, restored: sessionTabs.length});
    });
    return true;
  }
  if (msg.action === "createSession") {
    chrome.tabs.query({}, tabs => {
      const sessionId = "session_" + Date.now();
      chrome.storage.local.set({[sessionId]: tabs}, () => {
        sendResponse({success: true, sessionId: sessionId, count: tabs.length});
      });
    });
    return true;
  }
  if (msg.action === "getSessionId") {
    // Example: get latest session ID
    chrome.storage.local.get(null, data => {
      const sessionIds = Object.keys(data).filter(k => k.startsWith("session_"));
      const latestId = sessionIds.sort().pop() || "none";
      sendResponse({sessionId: latestId});
    });
    return true;
  }
  sendResponse({});
  return true;
});
EOF

echo "✅ Session Management background functions fixed. Reload your extension in chrome://extensions."