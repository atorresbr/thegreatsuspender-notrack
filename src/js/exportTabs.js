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
