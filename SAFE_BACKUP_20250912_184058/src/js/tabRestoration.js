/**
 * Tab Restoration Utility
 * Handles preservation and restoration of suspended tabs
 */
(function() {
  'use strict';

  const TabRestoration = {
    // Generate unique suspension ID
    generateId: function() {
      return 'gs-' + Date.now() + '-' + Math.random().toString(36).substr(2, 9);
    },

    // Create suspension data object
    createSuspensionData: function(tabInfo, originalUrl, originalTitle) {
      return {
        id: this.generateId(),
        originalUrl: originalUrl,
        originalTitle: originalTitle,
        tabId: tabInfo.id,
        windowId: tabInfo.windowId,
        index: tabInfo.index,
        timestamp: Date.now(),
        userAgent: navigator.userAgent,
        preserved: true
      };
    },

    // Save suspension data to localStorage and chrome.storage
    saveSuspensionData: function(suspensionData) {
      // Save to localStorage (survives extension removal)
      try {
        const localData = JSON.parse(localStorage.getItem('gs-suspended-tabs') || '{}');
        localData[suspensionData.id] = suspensionData;
        localStorage.setItem('gs-suspended-tabs', JSON.stringify(localData));
      } catch (e) {
        console.warn('Could not save to localStorage:', e);
      }

      // Save to chrome.storage (for extension functionality)
      if (chrome.storage && chrome.storage.local) {
        chrome.storage.local.get(['gs-suspended-tabs'], function(result) {
          const storageData = result['gs-suspended-tabs'] || {};
          storageData[suspensionData.id] = suspensionData;
          chrome.storage.local.set({'gs-suspended-tabs': storageData});
        });
      }
    },

    // Get all suspended tab data
    getAllSuspensionData: function(callback) {
      const localData = JSON.parse(localStorage.getItem('gs-suspended-tabs') || '{}');
      
      if (chrome.storage && chrome.storage.local) {
        chrome.storage.local.get(['gs-suspended-tabs'], function(result) {
          const storageData = result['gs-suspended-tabs'] || {};
          const combined = { ...localData, ...storageData };
          callback(combined);
        });
      } else {
        callback(localData);
      }
    },

    // Create suspended URL with preservation data
    createSuspendedUrl: function(originalUrl, originalTitle, suspensionId) {
      const baseUrl = chrome.runtime ? chrome.runtime.getURL('suspended.html') : 'suspended.html';
      return baseUrl + '?' + 
             'uri=' + encodeURIComponent(originalUrl) + 
             '&title=' + encodeURIComponent(originalTitle) +
             '&gsId=' + encodeURIComponent(suspensionId);
    },

    // Restore tab from suspension data
    restoreTab: function(suspensionData) {
      if (chrome.tabs) {
        chrome.tabs.create({
          url: suspensionData.originalUrl,
          active: false
        });
      } else {
        // Fallback: open in new tab
        window.open(suspensionData.originalUrl, '_blank');
      }
    },

    // Restore all suspended tabs
    restoreAllTabs: function() {
      this.getAllSuspensionData(function(allData) {
        Object.values(allData).forEach(function(tabData) {
          if (tabData.preserved) {
            TabRestoration.restoreTab(tabData);
          }
        });
      });
    },

    // Export tab IDs for manual restoration
    exportTabIds: function() {
      this.getAllSuspensionData(function(allData) {
        const ids = Object.values(allData)
          .filter(data => data.preserved)
          .map(data => data.id + '|' + encodeURIComponent(data.originalUrl) + '|' + encodeURIComponent(data.originalTitle))
          .join('\n');
        
        if (ids) {
          // Copy to clipboard or show in prompt
          if (navigator.clipboard && navigator.clipboard.writeText) {
            navigator.clipboard.writeText(ids).then(() => {
              alert('Tab IDs copied to clipboard! Save these to restore tabs later.');
            });
          } else {
            prompt('Copy these Tab IDs to restore tabs later:', ids);
          }
        } else {
          alert('No suspended tabs found to export.');
        }
      });
    },

    // Import and restore tabs from IDs
    importTabIds: function(idsText) {
      const lines = idsText.split('\n').filter(line => line.trim());
      let restored = 0;
      
      lines.forEach(function(line) {
        const parts = line.trim().split('|');
        if (parts.length >= 3) {
          const [id, encodedUrl, encodedTitle] = parts;
          const originalUrl = decodeURIComponent(encodedUrl);
          const originalTitle = decodeURIComponent(encodedTitle);
          
          // Create suspended URL
          const suspendedUrl = TabRestoration.createSuspendedUrl(originalUrl, originalTitle, id);
          
          if (chrome.tabs) {
            chrome.tabs.create({ url: suspendedUrl, active: false });
          } else {
            window.open(suspendedUrl, '_blank');
          }
          restored++;
        }
      });
      
      return restored;
    }
  };

  // Export for global use
  if (typeof window !== 'undefined') {
    window.TabRestoration = TabRestoration;
  }

  // Export for Node.js environments
  if (typeof module !== 'undefined' && module.exports) {
    module.exports = TabRestoration;
  }

  return TabRestoration;
})();
