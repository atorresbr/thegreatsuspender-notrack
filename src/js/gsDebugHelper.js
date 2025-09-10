/**
 * Debug Helper for The Great Suspender
 */
'use strict';

var gsDebugHelper = (function() {
  
  function injectDebugMonitor() {
    console.log('🔍 Debug monitor injected');
    
    // Check if suspension works
    chrome.commands.onCommand.addListener(function(command) {
      console.log('Command received:', command);
      if (command === '1-suspend-tab') {
        console.log('Trying to suspend current tab...');
        chrome.tabs.query({active: true, currentWindow: true}, function(tabs) {
          if (tabs && tabs.length > 0) {
            const activeTab = tabs[0];
            console.log('Active tab:', activeTab);
            
            // Try to suspend through background page
            if (typeof tgs !== 'undefined' && tgs.suspendTab) {
              console.log('Calling tgs.suspendTab...');
              tgs.suspendTab(activeTab);
            } else {
              console.error('tgs.suspendTab not available!');
              
              // Try direct message
              chrome.tabs.sendMessage(
                activeTab.id,
                { action: 'suspendTab' },
                function(response) {
                  console.log('Direct suspension response:', response);
                }
              );
            }
          }
        });
      }
    });
    
    // Intercept tab suspension attempts
    const originalSuspendTab = tgs && tgs.suspendTab;
    if (originalSuspendTab) {
      tgs.suspendTab = function(tab) {
        console.log('🔄 tgs.suspendTab called with tab:', tab);
        return originalSuspendTab.apply(this, arguments);
      };
    }
  }
  
  // Inject monitoring after a delay to ensure everything is loaded
  setTimeout(injectDebugMonitor, 5000);
  
  return {
    injectDebugMonitor: injectDebugMonitor
  };
})();
