/**
 * FIXED SESSION MANAGEMENT SYSTEM
 * Complete session handling with proper Chrome API integration
 */
(function() {
  'use strict';

  console.log('Fixed Session Management System initializing...');

  let currentSessionId = null;

  function generateSessionId() {
    const timestamp = Date.now();
    const randomString = Math.random().toString(36).substring(2, 11);
    return `gs-${timestamp}-${randomString}`;
  }

  function getCurrentSessionId() {
    return new Promise((resolve) => {
      chrome.storage.local.get(['currentSessionId'], (result) => {
        if (result.currentSessionId) {
          currentSessionId = result.currentSessionId;
        } else {
          currentSessionId = generateSessionId();
          chrome.storage.local.set({ currentSessionId: currentSessionId });
        }
        resolve(currentSessionId);
      });
    });
  }

  const FixedSessionManager = {
    async init() {
      await getCurrentSessionId();
      console.log('🔐 Fixed Session Management initialized:', currentSessionId);
    },

    async getAllChromeTabs() {
      return new Promise((resolve) => {
        chrome.tabs.query({}, (tabs) => {
          const allTabs = tabs.map(tab => ({
            id: tab.id,
            title: tab.title,
            url: tab.url,
            originalUrl: this.extractOriginalUrl(tab.url),
            favIconUrl: tab.favIconUrl,
            pinned: tab.pinned,
            windowId: tab.windowId,
            index: tab.index,
            active: !tab.url.includes('suspended'),
            sessionId: currentSessionId,
            timestamp: Date.now()
          }));
          resolve(allTabs);
        });
      });
    },

    extractOriginalUrl(url) {
      if (!url || !url.includes('suspended')) return url;
      
      try {
        const urlParams = new URLSearchParams(url.split('?')[1] || '');
        return urlParams.get('url') || urlParams.get('uri') || url;
      } catch (error) {
        return url;
      }
    },

    async backupAllTabs(backupName = null) {
      const allTabs = await this.getAllChromeTabs();
      
      const backupId = `backup-${Date.now()}-${Math.random().toString(36).substring(2, 8)}`;
      const backupData = {
        id: backupId,
        name: backupName || `All Tabs Backup ${new Date().toLocaleString()}`,
        sessionId: currentSessionId,
        created: Date.now(),
        tabCount: allTabs.length,
        tabs: allTabs,
        allTabsBackup: true
      };

      return new Promise((resolve) => {
        chrome.storage.local.get(['sessionBackups'], (result) => {
          const backups = result.sessionBackups || {};
          backups[backupId] = backupData;
          
          chrome.storage.local.set({ sessionBackups: backups }, () => {
            console.log('💾 ALL TABS backed up:', backupId, allTabs.length, 'tabs');
            resolve(backupData);
          });
        });
      });
    },

    async exportAllTabs() {
      const allTabs = await this.getAllChromeTabs();
      
      const exportData = {
        exportVersion: '1.0',
        exportDate: new Date().toISOString(),
        exportType: 'ALL_TABS',
        sessionId: currentSessionId,
        tabCount: allTabs.length,
        tabs: allTabs
      };

      return JSON.stringify(exportData, null, 2);
    },

    async importTabs(jsonData) {
      try {
        const importData = JSON.parse(jsonData);
        
        if (!importData.tabs) {
          throw new Error('Invalid tab data format');
        }

        const tabs = Array.isArray(importData.tabs) ? importData.tabs : Object.values(importData.tabs);
        let restoredCount = 0;
        
        console.log('📥 Importing', tabs.length, 'tabs...');
        
        return new Promise((resolve) => {
          tabs.forEach((tabInfo, index) => {
            setTimeout(() => {
              let restoreUrl = tabInfo.originalUrl || tabInfo.url || 'chrome://newtab/';
              
              chrome.tabs.create({
                url: restoreUrl,
                active: false,
                pinned: tabInfo.pinned || false
              }, (newTab) => {
                if (!chrome.runtime.lastError) {
                  restoredCount++;
                  console.log('✅ Imported tab:', newTab.id, tabInfo.title);
                }
                
                if (index === tabs.length - 1) {
                  setTimeout(() => {
                    resolve({ 
                      success: true, 
                      imported: tabs.length, 
                      restored: restoredCount 
                    });
                  }, 500);
                }
              });
            }, index * 100);
          });
        });
        
      } catch (error) {
        throw new Error('Failed to import tabs: ' + error.message);
      }
    },

    async restoreBySessionId(sessionId) {
      return new Promise((resolve) => {
        chrome.storage.local.get(['sessions', 'sessionBackups'], (result) => {
          const sessions = result.sessions || {};
          const backups = result.sessionBackups || {};
          
          let targetSession = sessions[sessionId] || backups[sessionId];
          
          if (!targetSession) {
            resolve({ success: false, error: 'Session ID not found' });
            return;
          }
          
          const tabs = targetSession.tabs ? Object.values(targetSession.tabs) : [];
          let restoredCount = 0;
          
          if (tabs.length === 0) {
            resolve({ success: false, error: 'No tabs found in session' });
            return;
          }
          
          console.log('🔄 Restoring session:', sessionId, 'with', tabs.length, 'tabs');
          
          tabs.forEach((tabInfo, index) => {
            setTimeout(() => {
              let restoreUrl = tabInfo.originalUrl || tabInfo.url || 'chrome://newtab/';
              
              chrome.tabs.create({
                url: restoreUrl,
                active: false,
                pinned: tabInfo.pinned || false
              }, (newTab) => {
                if (!chrome.runtime.lastError) {
                  restoredCount++;
                  console.log('✅ Restored tab:', newTab.id, tabInfo.title);
                }
                
                if (index === tabs.length - 1) {
                  setTimeout(() => {
                    resolve({ 
                      success: true, 
                      sessionId: sessionId, 
                      tabCount: tabs.length, 
                      restored: restoredCount 
                    });
                  }, 500);
                }
              });
            }, index * 100);
          });
        });
      });
    },

    async getAllSessions() {
      return new Promise((resolve) => {
        chrome.storage.local.get(['sessions'], (result) => {
          resolve(result.sessions || {});
        });
      });
    },

    async getSessionBackups() {
      return new Promise((resolve) => {
        chrome.storage.local.get(['sessionBackups'], (result) => {
          resolve(result.sessionBackups || {});
        });
      });
    },

    async createNewSession() {
      currentSessionId = generateSessionId();
      chrome.storage.local.set({ currentSessionId: currentSessionId });
      return currentSessionId;
    }
  };

  window.FixedSessionManager = FixedSessionManager;
  FixedSessionManager.init();

  console.log('🔐 Fixed Session Management System ready!');
})();
