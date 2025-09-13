#!/bin/bash
# filepath: /home/linux/Documents/GitHub/thegreatsuspender-notrack/fix_exportTabs_json.sh

EXPORT_JS="/home/linux/Documents/GitHub/thegreatsuspender-notrack/src/js/exportTabs.js"

cat > "$EXPORT_JS" << 'EOF'
// Export tabs as JSON with { "tabs": [...] }
document.addEventListener("DOMContentLoaded", function() {
  const exportBtn = document.getElementById("exportAllTabs");
  if (exportBtn) {
    exportBtn.addEventListener("click", function() {
      chrome.runtime.sendMessage({action: "exportTabs"}, function(response) {
        if (chrome.runtime.lastError) {
          alert("Error: " + chrome.runtime.lastError.message);
          return;
        }
        if (response && response.tabs) {
          // Export as { "tabs": [...] }
          const data = JSON.stringify({tabs: response.tabs}, null, 2);
          const blob = new Blob([data], {type: "application/json"});
          const url = URL.createObjectURL(blob);
          const a = document.createElement("a");
          a.href = url;
          a.download = "tabs_export.json";
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

echo "✅ exportTabs.js updated to export tabs as JSON with { \"tabs\": [...] } format."