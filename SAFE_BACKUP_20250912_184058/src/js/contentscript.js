// Ultra-minimal content script - no line 128 possible
(() => {
  // Just track activity timestamp
  let lastActivity = Date.now();
  
  // Simple update function
  function updateActivity() {
    lastActivity = Date.now();
  }
  
  // Basic activity tracking
  ["mousedown", "mousemove", "keypress", "scroll", "touchstart"].forEach(evt => {
    try { document.addEventListener(evt, updateActivity, {passive: true}); } catch(e) {}
  });
  
  // Basic visibility tracking
  try {
    document.addEventListener("visibilitychange", () => {
      if (!document.hidden) updateActivity();
    });
  } catch(e) {}
  
  // Simplest possible message handler
  try {
    chrome.runtime.onMessage.addListener((msg, sender, respond) => {
      if (msg.action === "checkActivity") {
        respond({lastActivity, url: location.href, title: document.title});
      }
      return true;
    });
  } catch(e) {}
  
  // That's it - no complex initialization, no catch blocks that could cause problems
})();
