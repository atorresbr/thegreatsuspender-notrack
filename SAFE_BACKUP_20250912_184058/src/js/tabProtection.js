/**
 * TAB PROTECTION SYSTEM
 * Prevents suspended tabs from closing on extension reload/removal
 */
(function() {
  'use strict';

  console.log('Tab Protection System initializing...');

  let protectionEnabled = true;
  let autoRestoreEnabled = true;
  let suspendedTabs = new Map();

  // Get protection settings
  function getProtectionSettings() {
    return new Promise((resolve) => {
      chrome.storage.local.get(['tabProtection', 'autoRestore'], (result) => {
        protectionEnabled = result.tabProtection !== false;
        autoRestoreEnabled = result.autoRestore !== false;
        resolve({ protectionEnabled, autoRestoreEnabled });
      });
    });
  }

  // Track suspended tabs
  function trackSuspendedTab(tabId, tabInfo) {
    if (protectionEnabled) {
      suspendedTabs.set(tabId, {
        ...tabInfo,
        protected: true,
        timestamp: Date.now()
      });
      
      // Store in persistent storage
      chrome.storage.local.get(['protectedTabs'], (result) => {
        const protectedTabs = result.protectedTabs || {};
        protectedTabs[tabId] = suspendedTabs.get(tabId);
        chrome.storage.local.set({ protectedTabs: protectedTabs });
      });
      
      console.log('🛡️ Protected suspended tab:', tabId, tabInfo.title);
    }
  }

  // Remove tab from protection
  function unprotectTab(tabId) {
    suspendedTabs.delete(tabId);
    
    chrome.storage.local.get(['protectedTabs'], (result) => {
      const protectedTabs = result.protectedTabs || {};
      delete protectedTabs[tabId];
      chrome.storage.local.set({ protectedTabs: protectedTabs });
    });
  }

  // Restore protected tabs after extension reload
  function restoreProtectedTabs() {
    if (!autoRestoreEnabled) return;
    
    chrome.storage.local.get(['protectedTabs'], (result) => {
      const protectedTabs = result.protectedTabs || {};
      const tabsToRestore = Object.entries(protectedTabs);
      
      if (tabsToRestore.length === 0) return;
      
      console.log('🔄 Restoring', tabsToRestore.length, 'protected tabs...');
      
      tabsToRestore.forEach(([tabId, tabInfo], index) => {
        setTimeout(() => {
          const restoreUrl = tabInfo.suspendedUrl || tabInfo.originalUrl || 'chrome://newtab/';
          
          chrome.tabs.create({
            url: restoreUrl,
            active: false,
            pinned: tabInfo.pinned || false
          }, (newTab) => {
            if (!chrome.runtime.lastError) {
              console.log('✅ Restored protected tab:', newTab.id, tabInfo.title);
              
              // Track the restored tab
              trackSuspendedTab(newTab.id, {
                ...tabInfo,
                id: newTab.id,
                restored: true
              });
            }
          });
        }, index * 100);
      });
      
      // Clear old protected tabs after restoration
      setTimeout(() => {
        chrome.storage.local.set({ protectedTabs: {} });
      }, tabsToRestore.length * 100 + 1000);
    });
  }

  // Monitor tab updates for suspended tabs
  function setupTabMonitoring() {
    // Track new suspended tabs
    chrome.tabs.onUpdated.addListener((tabId, changeInfo, tab) => {
      if (changeInfo.status === 'complete' && isSuspendedTab(tab.url)) {
        const tabInfo = {
          id: tabId,
          title: tab.title,
          originalUrl: extractOriginalUrl(tab.url),
          suspendedUrl: tab.url,
          favIconUrl: tab.favIconUrl,
          pinned: tab.pinned,
          windowId: tab.windowId,
          index: tab.index
        };
        
        trackSuspendedTab(tabId, tabInfo);
      }
    });

    // Remove from protection when tab is closed normally
    chrome.tabs.onRemoved.addListener((tabId) => {
      unprotectTab(tabId);
    });
  }

  // Check if URL is a suspended tab
  function isSuspendedTab(url) {
    return url && (
      url.includes('suspended.html') ||
      url.includes('suspended_tab') ||
      (url.includes('chrome-extension://') && url.includes('suspended'))
    );
  }

  // Extract original URL from suspended tab
  function extractOriginalUrl(suspendedUrl) {
    if (!suspendedUrl || !isSuspendedTab(suspendedUrl)) return suspendedUrl;
    
    try {
      const urlParams = new URLSearchParams(suspendedUrl.split('?')[1] || '');
      return urlParams.get('url') || urlParams.get('uri') || suspendedUrl;
    } catch (error) {
      return suspendedUrl;
    }
  }

  // Public API
  const TabProtection = {
    async init() {
      await getProtectionSettings();
      setupTabMonitoring();
      
      // Restore tabs on startup if enabled
      if (autoRestoreEnabled) {
        setTimeout(restoreProtectedTabs, 2000);
      }
      
      console.log('🛡️ Tab Protection initialized - Protection:', protectionEnabled, 'AutoRestore:', autoRestoreEnabled);
    },

    setProtection(enabled) {
      protectionEnabled = enabled;
      chrome.storage.local.set({ tabProtection: enabled });
      console.log('🛡️ Tab protection', enabled ? 'enabled' : 'disabled');
    },

    setAutoRestore(enabled) {
      autoRestoreEnabled = enabled;
      chrome.storage.local.set({ autoRestore: enabled });
      console.log('🔄 Auto-restore', enabled ? 'enabled' : 'disabled');
    },

    getProtectedTabsCount() {
      return suspendedTabs.size;
    },

    async getProtectedTabs() {
      return new Promise((resolve) => {
        chrome.storage.local.get(['protectedTabs'], (result) => {
          resolve(result.protectedTabs || {});
        });
      });
    },

    restoreAllProtectedTabs() {
      restoreProtectedTabs();
    }
  };

  // Export globally
  window.TabProtection = TabProtection;

  // Auto-initialize
  TabProtection.init();

  console.log('🛡️ Tab Protection System ready!');
})();
