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
