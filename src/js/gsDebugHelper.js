/**
 * Debug Helper for The Great Suspender
 */
'use strict';

var gsDebugHelper = (function() {
  
  function injectDebugMonitor() {
    console.log('🔍 Debug monitor injected');
    
    // Check if tgs is available and hook into it
    if (typeof tgs !== 'undefined') {
      const originalSuspendTab = tgs.suspendTab;
      if (originalSuspendTab) {
        tgs.suspendTab = function(tab) {
          console.log('🔄 tgs.suspendTab called with tab:', tab);
          return originalSuspendTab.apply(this, arguments);
        };
      } else {
        console.warn('tgs.suspendTab not available for monitoring');
      }
    } else {
      console.warn('tgs object not available for monitoring');
    }
    
    // Create a context menu for debugging
    if (chrome.contextMenus) {
      try {
        chrome.contextMenus.create({
          id: 'debug-suspend-tab',
          title: 'Debug: Suspend Tab',
          contexts: ['page'],
          documentUrlPatterns: ['http://*/*', 'https://*/*'],
          onclick: function(info, tab) {
            console.log('Debug suspend clicked for:', tab);
            if (typeof tgs !== 'undefined' && tgs.suspendTab) {
              tgs.suspendTab(tab);
            } else {
              console.error('tgs.suspendTab not available');
            }
          }
        });
      } catch(e) {
        console.error('Error creating debug context menu:', e);
      }
    }
    
    console.log('Debug monitor setup complete');
  }
  
  // Wait a bit longer to ensure everything is loaded
  setTimeout(injectDebugMonitor, 5000);
  
  return {
    injectDebugMonitor: injectDebugMonitor
  };
})();
