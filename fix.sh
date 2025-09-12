#!/bin/bash
# filepath: /home/linux/Documents/GitHub/thegreatsuspender-notrack/fix.sh

REPO_DIR="/home/linux/Documents/GitHub/thegreatsuspender-notrack"
SRC_DIR="$REPO_DIR/src"
JS_DIR="$SRC_DIR/js"
OPTIONS_FILE="$SRC_DIR/options.html"
MANIFEST_FILE="$SRC_DIR/manifest.json"

EXPORT_BTN_HTML='<button id="exportTabsBtn" class="primary" style="margin-top:10px;">Export Tabs</button>'

echo "🔧 Fixing Export Tabs function..."

# Check if options.html exists
if [ -f "$OPTIONS_FILE" ]; then
  # Insert the button after the Session Management <h2> header
  awk -v btn="$EXPORT_BTN_HTML" '
    BEGIN {inserted=0}
    /<h2[^>]*>Session Management<\/h2>/ && !inserted {
      print $0
      print btn
      inserted=1
      next
    }
    {print}
  ' "$OPTIONS_FILE" > "${OPTIONS_FILE}.tmp" && mv "${OPTIONS_FILE}.tmp" "$OPTIONS_FILE"
  echo "✅ Export Tabs button inserted after Session Management header."
else
  echo "❌ options.html not found. Please ensure the file exists."
  exit 1
fi

# Add JS reference if missing
if ! grep -q "exportTabs.js" "$OPTIONS_FILE"; then
  sed -i 's|</body>|    <script src="js/exportTabs.js"></script>\n</body>|' "$OPTIONS_FILE"
  echo "✅ Added exportTabs.js reference to options.html"
else
  echo "✅ exportTabs.js already referenced in options.html"
fi

# Create/replace exportTabs.js
cat > "$JS_DIR/exportTabs.js" << 'EOF'
document.addEventListener("DOMContentLoaded", function() {
  const exportBtn = document.getElementById("exportTabsBtn");
  if (exportBtn) {
    exportBtn.addEventListener("click", function() {
      chrome.runtime.sendMessage({action: "exportTabs"}, function(response) {
        if (response && response.tabs) {
          const data = response.tabs.map(tab => `${tab.title}\t${tab.url}`).join("\n");
          const blob = new Blob([data], {type: "text/plain"});
          const url = URL.createObjectURL(blob);
          const a = document.createElement("a");
          a.href = url;
          a.download = "tabs_export.txt";
          document.body.appendChild(a);
          a.click();
          setTimeout(() => {
            document.body.removeChild(a);
            URL.revokeObjectURL(url);
          }, 100);
        } else {
          alert("Could not export tabs.");
        }
      });
    });
  }
});
EOF

# Create/replace background-wrapper.js
cat > "$JS_DIR/background-wrapper.js" << 'EOF'
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
    console.warn(`Unrecognized action: ${msg.action}`);
    sendResponse({});
    return true; // Keep the message channel open
  }
});
EOF

# Check and update manifest.json
if [ -f "$MANIFEST_FILE" ]; then
  if ! grep -q '"tabs"' "$MANIFEST_FILE"; then
    sed -i '/"permissions": \[/a \    "tabs",' "$MANIFEST_FILE"
    echo "✅ Added 'tabs' permission to manifest.json"
  else
    echo "✅ 'tabs' permission already exists in manifest.json"
  fi
else
  echo "❌ manifest.json not found. Please ensure the file exists."
  exit 1
fi

echo "✅ Export Tabs function fixed!"