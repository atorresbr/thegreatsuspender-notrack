/**
 * COMPLETE ADVANCED SESSION MANAGEMENT SYSTEM
 * Supports UNLIMITED tabs - handles ANY number of suspended/active tabs
 */
(function() {
  'use strict';

  console.log('COMPLETE Session Management System initializing...');

  // Generate unique session ID (like gs-1757644649438-pydclbokv)
  function generateSessionId() {
    const timestamp = Date.now();
    const randomString = Math.random().toString(36).substring(2, 11);
    return `gs-${timestamp}-${randomString}`;
  }

  let currentSessionId = null;
  
  function getCurrentSessionId() {
    if (currentSessionId) return Promise.resolve(currentSessionId);
    
    return new Promise((resolve) => {
      chrome.storage.local.get(['currentSessionId'], (result) => {
        if (result.currentSessionId) {
          currentSessionId = result.currentSessionId;
          console.log('📋 Using existing session ID:', currentSessionId);
        } else {
          currentSessionId = generateSessionId();
          chrome.storage.local.set({ currentSessionId: currentSessionId }, () => {
            console.log('🆕 Generated new session ID:', currentSessionId);
          });
        }
        resolve(currentSessionId);
      });
    });
  }

  // Enhanced tab info
  function createTabInfo(tab, originalUrl = '') {
    return {
      id: tab.id,
      sessionId: currentSessionId,
      originalUrl: originalUrl || extractOriginalUrl(tab.url),
      suspendedUrl: tab.url,
      title: tab.title || 'Tab',
      favIconUrl: tab.favIconUrl || '',
      windowId: tab.windowId,
      index: tab.index,
      pinned: tab.pinned || false,
      timestamp: Date.now(),
      tabSessionId: `${currentSessionId}-tab-${tab.id}-${Date.now()}`,
      restored: false,
      active: !tab.url.includes('suspended')
    };
  }

  function extractOriginalUrl(suspendedUrl) {
    if (!suspendedUrl || !suspendedUrl.includes('suspended')) return suspendedUrl;
    
    try {
      const urlParams = new URLSearchParams(suspendedUrl.split('?')[1] || '');
      return urlParams.get('url') || urlParams.get('uri') || urlParams.get('originalUrl') || suspendedUrl;
    } catch (error) {
      return suspendedUrl;
    }
  }

  const SessionManager = {
    
    async init() {
      await getCurrentSessionId();
      this.setupSessionTracking();
      console.log('🔐 COMPLETE Session Management initialized:', currentSessionId);
    },

    setupSessionTracking() {
      chrome.tabs.onUpdated.addListener((tabId, changeInfo, tab) => {
        if (changeInfo.status === 'complete') {
          this.trackTab(tabId, tab);
        }
      });

      chrome.tabs.onRemoved.addListener((tabId) => {
        this.handleTabRemoval(tabId);
      });
    },

    isSuspendedTab(url) {
      return url && (
        url.includes('suspended.html') || 
        url.includes('suspended_tab') ||
        (url.includes('chrome-extension://') && url.includes('suspended'))
      );
    },

    async trackTab(tabId, tab) {
      const tabInfo = createTabInfo(tab);
      await this.storeTabInSession(tabInfo);
      await this.storeActiveTab(tabId, tabInfo);
      console.log('📊 Tracked tab:', tabInfo.title, 'Active:', tabInfo.active);
    },

    async storeTabInSession(tabInfo) {
      return new Promise((resolve) => {
        chrome.storage.local.get(['sessions'], (result) => {
          const sessions = result.sessions || {};
          
          if (!sessions[currentSessionId]) {
            sessions[currentSessionId] = {
              id: currentSessionId,
              created: Date.now(),
              lastUpdated: Date.now(),
              tabs: {},
              tabCount: 0
            };
          }
          
          sessions[currentSessionId].tabs[tabInfo.tabSessionId] = tabInfo;
          sessions[currentSessionId].tabCount = Object.keys(sessions[currentSessionId].tabs).length;
          sessions[currentSessionId].lastUpdated = Date.now();
          
          chrome.storage.local.set({ sessions: sessions }, resolve);
        });
      });
    },

    async storeActiveTab(tabId, tabInfo) {
      return new Promise((resolve) => {
        chrome.storage.local.get(['activeTabs'], (result) => {
          const activeTabs = result.activeTabs || {};
          activeTabs[tabId] = tabInfo;
          chrome.storage.local.set({ activeTabs: activeTabs }, resolve);
        });
      });
    },

    async handleTabRemoval(tabId) {
      chrome.storage.local.get(['activeTabs'], (result) => {
        const activeTabs = result.activeTabs || {};
        if (activeTabs[tabId]) {
          delete activeTabs[tabId];
          chrome.storage.local.set({ activeTabs: activeTabs });
        }
      });
    },

    // GET ALL CHROME TABS (active + suspended) - UNLIMITED support
    async getAllChromeTabs() {
      return new Promise((resolve) => {
        chrome.tabs.query({}, (tabs) => {
          const allTabs = tabs.map(tab => createTabInfo(tab));
          console.log('📊 Found', allTabs.length, 'total Chrome tabs');
          resolve(allTabs);
        });
      });
    },

    // BACKUP ALL TABS (not just suspended) - UNLIMITED support
    async backupAllTabs(backupName = null) {
      const allTabs = await this.getAllChromeTabs();
      
      const backupId = `backup-${Date.now()}-${Math.random().toString(36).substring(2, 8)}`;
      const backupData = {
        id: backupId,
        name: backupName || `All Tabs Backup ${new Date().toLocaleString()}`,
        sessionId: currentSessionId,
        created: Date.now(),
        tabCount: allTabs.length,
        tabs: {},
        allTabsBackup: true
      };

      // Store all tabs
      allTabs.forEach((tab, index) => {
        backupData.tabs[`alltab-${index}-${Date.now()}`] = tab;
      });

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

    // RESTORE TABS by Session ID
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
          
          const tabs = Object.values(targetSession.tabs);
          let restoredCount = 0;
          
          console.log('🔄 Restoring by Session ID:', sessionId, 'with', tabs.length, 'tabs');
          
          tabs.forEach((tabInfo, index) => {
            setTimeout(() => {
              let restoreUrl = tabInfo.active ? tabInfo.originalUrl : tabInfo.suspendedUrl;
              
              if (!restoreUrl || restoreUrl === 'about:blank') {
                restoreUrl = tabInfo.suspendedUrl || 'chrome://newtab/';
              }
              
              chrome.tabs.create({
                url: restoreUrl,
                active: false,
                pinned: tabInfo.pinned || false
              }, (newTab) => {
                if (!chrome.runtime.lastError) {
                  restoredCount++;
                  console.log('✅ Restored tab:', newTab.id, tabInfo.title);
                }
              });
            }, index * 100);
          });
          
          setTimeout(() => {
            resolve({ 
              success: true, 
              sessionId: sessionId, 
              tabCount: tabs.length, 
              restored: restoredCount 
            });
          }, tabs.length * 100 + 1000);
        });
      });
    },

    // EXPORT ALL TABS as JSON
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

    // IMPORT TABS from JSON
    async importTabs(jsonData) {
      try {
        const importData = JSON.parse(jsonData);
        
        if (!importData.tabs) {
          throw new Error('Invalid tab data format');
        }

        const tabs = Array.isArray(importData.tabs) ? importData.tabs : Object.values(importData.tabs);
        let restoredCount = 0;
        
        console.log('📥 Importing', tabs.length, 'tabs...');
        
        tabs.forEach((tabInfo, index) => {
          setTimeout(() => {
            let restoreUrl = tabInfo.originalUrl || tabInfo.suspendedUrl || tabInfo.url || 'chrome://newtab/';
            
            chrome.tabs.create({
              url: restoreUrl,
              active: false,
              pinned: tabInfo.pinned || false
            }, (newTab) => {
              if (!chrome.runtime.lastError) {
                restoredCount++;
                console.log('✅ Imported tab:', newTab.id, tabInfo.title);
              }
            });
          }, index * 100);
        });
        
        return { 
          success: true, 
          imported: tabs.length, 
          restored: restoredCount 
        };
        
      } catch (error) {
        throw new Error('Failed to import tabs: ' + error.message);
      }
    },

    async getCurrentSession() {
      return new Promise((resolve) => {
        chrome.storage.local.get(['sessions'], (result) => {
          const sessions = result.sessions || {};
          resolve(sessions[currentSessionId] || null);
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

  window.SessionManager = SessionManager;
  SessionManager.init();

  console.log('🔐 COMPLETE Session Management System ready!');
})();
