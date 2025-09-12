/**
 * FIXED Background script with PROPER TAB PRESERVATION
 */
(function() {
  'use strict';

  console.log('Background script with PROPER TAB PRESERVATION initializing...');

  // Tab preservation and recovery system
  let suspendedTabs = new Map();
  let preservationEnabled = true;
  let isInitialized = false;
  
  // Default settings
  const defaultSettings = {
    keepTabsOnReload: true,
    autoRestoreTabs: true
  };

  // Initialize on extension startup
  chrome.runtime.onStartup.addListener(function() {
    console.log('Extension startup - initializing tab preservation...');
    setTimeout(() => {
      initializeTabPreservation();
    }, 1000);
  });

  // Initialize on extension install/enable
  chrome.runtime.onInstalled.addListener(function(details) {
    console.log('Extension installed/updated:', details.reason);
    setTimeout(() => {
      initializeTabPreservation();
      if (details.reason === 'install') {
        chrome.storage.local.set(defaultSettings, () => {
          console.log('Default settings initialized');
        });
      }
    }, 500);
  });

  // MAIN initialization function
  function initializeTabPreservation() {
    if (isInitialized) {
      console.log('Tab preservation already initialized');
      return;
    }

    console.log('Initializing tab preservation system...');
    
    chrome.storage.local.get(['keepTabsOnReload', 'autoRestoreTabs'], function(result) {
      if (chrome.runtime.lastError) {
        console.warn('Storage error during initialization:', chrome.runtime.lastError.message);
        preservationEnabled = defaultSettings.keepTabsOnReload;
      } else {
        preservationEnabled = result.keepTabsOnReload !== false;
        console.log('Tab preservation settings loaded:', {
          keepTabsOnReload: preservationEnabled,
          autoRestoreTabs: result.autoRestoreTabs !== false
        });
      }
      
      if (preservationEnabled) {
        setupTabPreservation();
        setTimeout(restorePreservedTabs, 2000);
      }
      
      isInitialized = true;
    });
  }

  // Set up tab preservation system
  function setupTabPreservation() {
    console.log('Setting up enhanced tab preservation system...');
    
    chrome.tabs.onUpdated.addListener(function(tabId, changeInfo, tab) {
      if (changeInfo.status === 'complete' && tab.url) {
        if (isSuspendedTab(tab.url)) {
          storeSuspendedTab(tabId, tab);
        }
      }
    });

    chrome.tabs.onRemoved.addListener(function(tabId, removeInfo) {
      if (suspendedTabs.has(tabId)) {
        console.log('Suspended tab being removed, preserving:', tabId);
        const tabInfo = suspendedTabs.get(tabId);
        saveSuspendedTabToStorage(tabId, tabInfo);
      }
    });

    if (chrome.tabs.onReplaced) {
      chrome.tabs.onReplaced.addListener(function(addedTabId, removedTabId) {
        if (suspendedTabs.has(removedTabId)) {
          console.log('Tab replaced, preserving:', removedTabId, '->', addedTabId);
          const tabInfo = suspendedTabs.get(removedTabId);
          saveSuspendedTabToStorage(removedTabId, tabInfo);
        }
      });
    }

    setInterval(() => {
      if (preservationEnabled && suspendedTabs.size > 0) {
        backupAllSuspendedTabs();
      }
    }, 30000);

    chrome.runtime.onSuspend && chrome.runtime.onSuspend.addListener(function() {
      console.log('Extension suspending, emergency backup...');
      backupAllSuspendedTabs();
    });
  }

  function isSuspendedTab(url) {
    return url && (
      url.includes('suspended.html') || 
      url.includes('suspended_tab') ||
      url.includes('chrome-extension://') && url.includes('suspended') ||
      url.includes('moz-extension://') && url.includes('suspended')
    );
  }

  function storeSuspendedTab(tabId, tab) {
    try {
      let originalUrl = '';
      let title = tab.title || 'Suspended Tab';
      
      if (tab.url.includes('?')) {
        const urlParams = new URLSearchParams(tab.url.split('?')[1]);
        originalUrl = urlParams.get('url') || urlParams.get('uri') || urlParams.get('originalUrl') || '';
        const titleParam = urlParams.get('title') || urlParams.get('name') || '';
        if (titleParam) {
          title = decodeURIComponent(titleParam);
        }
      }
      
      if (!originalUrl && tab.url.includes('#')) {
        const hash = tab.url.split('#')[1];
        if (hash && hash.startsWith('http')) {
          originalUrl = decodeURIComponent(hash);
        }
      }
      
      if (originalUrl || tab.url.includes('suspended')) {
        const tabInfo = {
          id: tabId,
          originalUrl: originalUrl ? decodeURIComponent(originalUrl) : 'about:blank',
          title: title,
          suspendedUrl: tab.url,
          windowId: tab.windowId,
          index: tab.index,
          pinned: tab.pinned || false,
          timestamp: Date.now(),
          favIconUrl: tab.favIconUrl || '',
          preserved: true
        };
        
        suspendedTabs.set(tabId, tabInfo);
        console.log('Enhanced storage of suspended tab:', tabInfo.title, tabInfo.originalUrl);
        saveSuspendedTabToStorage(tabId, tabInfo);
      }
    } catch (error) {
      console.warn('Error storing suspended tab info:', error);
    }
  }

  function saveSuspendedTabToStorage(tabId, tabInfo) {
    chrome.storage.local.get(['preservedTabs'], function(result) {
      if (chrome.runtime.lastError) {
        console.warn('Storage error during save:', chrome.runtime.lastError.message);
        return;
      }
      
      const preservedTabs = result.preservedTabs || {};
      const storageKey = 'preserved_' + Date.now() + '_' + tabId;
      
      preservedTabs[storageKey] = {
        ...tabInfo,
        preservedAt: Date.now(),
        sessionId: Date.now()
      };
      
      chrome.storage.local.set({ preservedTabs: preservedTabs }, function() {
        if (chrome.runtime.lastError) {
          console.warn('Error saving preserved tab:', chrome.runtime.lastError.message);
        } else {
          console.log('Tab successfully preserved to storage:', storageKey);
        }
      });
    });
  }

  function backupAllSuspendedTabs() {
    if (suspendedTabs.size === 0) return;
    
    console.log('Backing up', suspendedTabs.size, 'suspended tabs...');
    
    chrome.storage.local.get(['preservedTabs'], function(result) {
      if (chrome.runtime.lastError) {
        console.warn('Storage error during backup:', chrome.runtime.lastError.message);
        return;
      }
      
      const preservedTabs = result.preservedTabs || {};
      
      for (const [tabId, tabInfo] of suspendedTabs) {
        const storageKey = 'backup_' + Date.now() + '_' + tabId;
        preservedTabs[storageKey] = {
          ...tabInfo,
          backedUpAt: Date.now(),
          sessionId: Date.now()
        };
      }
      
      chrome.storage.local.set({ 
        preservedTabs: preservedTabs,
        lastBackupTime: Date.now(),
        totalPreserved: Object.keys(preservedTabs).length
      }, function() {
        if (chrome.runtime.lastError) {
          console.warn('Backup error:', chrome.runtime.lastError.message);
        } else {
          console.log('Successfully backed up', suspendedTabs.size, 'tabs');
        }
      });
    });
  }

  function restorePreservedTabs() {
    chrome.storage.local.get(['autoRestoreTabs', 'preservedTabs'], function(result) {
      if (chrome.runtime.lastError) {
        console.warn('Storage error during restore check:', chrome.runtime.lastError.message);
        return;
      }
      
      const autoRestore = result.autoRestoreTabs !== false;
      const preservedTabs = result.preservedTabs || {};
      const preservedKeys = Object.keys(preservedTabs);
      
      if (!autoRestore || preservedKeys.length === 0) {
        console.log('Auto-restore disabled or no preserved tabs found');
        return;
      }
      
      console.log('Restoring', preservedKeys.length, 'preserved tabs...');
      
      let restoredCount = 0;
      
      preservedKeys.forEach((key, index) => {
        const tabInfo = preservedTabs[key];
        if (tabInfo && tabInfo.suspendedUrl) {
          setTimeout(() => {
            let restoreUrl = tabInfo.suspendedUrl;
            
            if (!restoreUrl.includes('restored=true')) {
              const separator = restoreUrl.includes('?') ? '&' : '?';
              restoreUrl += separator + 'restored=true';
            }
            
            chrome.tabs.create({
              url: restoreUrl,
              active: false,
              pinned: tabInfo.pinned || false
            }, function(newTab) {
              if (chrome.runtime.lastError) {
                console.warn('Error restoring tab:', chrome.runtime.lastError.message);
              } else {
                console.log('Restored preserved tab:', newTab.id, tabInfo.title);
                restoredCount++;
                storeSuspendedTab(newTab.id, {
                  ...newTab,
                  url: restoreUrl
                });
              }
            });
          }, index * 200);
        }
      });
      
      setTimeout(() => {
        chrome.storage.local.set({ 
          preservedTabs: {},
          lastRestoreTime: Date.now(),
          lastRestoredCount: restoredCount
        }, function() {
          if (!chrome.runtime.lastError) {
            console.log('Cleaned up preserved tabs storage after restoration');
          }
        });
      }, preservedKeys.length * 200 + 2000);
    });
  }

  chrome.runtime.onMessage.addListener(function(request, sender, sendResponse) {
    console.log('Background received message:', request.action);
    
    try {
      if (request.action === 'backupTabs') {
        backupAllSuspendedTabs();
        chrome.storage.local.get(['preservedTabs'], function(result) {
          const count = result.preservedTabs ? Object.keys(result.preservedTabs).length : 0;
          sendResponse({ 
            success: true, 
            count: suspendedTabs.size,
            totalPreserved: count
          });
        });
        return true;
        
      } else if (request.action === 'restoreTabs') {
        restorePreservedTabs();
        sendResponse({ success: true });
        return true;
        
      } else if (request.action === 'getSuspendedCount') {
        chrome.storage.local.get(['preservedTabs'], function(result) {
          const preservedCount = result.preservedTabs ? Object.keys(result.preservedTabs).length : 0;
          sendResponse({ 
            count: suspendedTabs.size,
            preserved: preservedCount
          });
        });
        return true;
        
      } else if (request.action === 'getPreservationStatus') {
        sendResponse({
          enabled: preservationEnabled,
          initialized: isInitialized,
          tracking: suspendedTabs.size
        });
        return true;
      }
    } catch (error) {
      console.error('Error handling message:', error);
      sendResponse({ success: false, error: error.message });
    }
    
    return false;
  });

  setTimeout(initializeTabPreservation, 100);

  console.log('ENHANCED Background script with PROPER TAB PRESERVATION initialized');
})();

// SESSION MANAGEMENT INTEGRATION
chrome.runtime.onMessage.addListener(function(request, sender, sendResponse) {
  console.log('Background received session message:', request.action);
  
  try {
    if (request.action === 'getCurrentSessionId') {
      if (window.SessionManager) {
        window.SessionManager.getCurrentSessionId().then(sessionId => {
          sendResponse({ success: true, sessionId: sessionId });
        });
      } else {
        sendResponse({ success: false, error: 'SessionManager not available' });
      }
      return true;
      
    } else if (request.action === 'backupCurrentSession') {
      if (window.SessionManager) {
        window.SessionManager.backupCurrentSession(request.backupName).then(backup => {
          sendResponse({ success: true, backup: backup });
        }).catch(error => {
          sendResponse({ success: false, error: error.message });
        });
      } else {
        sendResponse({ success: false, error: 'SessionManager not available' });
      }
      return true;
      
    } else if (request.action === 'restoreSession') {
      if (window.SessionManager) {
        window.SessionManager.restoreSession(request.sessionId).then(result => {
          sendResponse({ success: true, result: result });
        }).catch(error => {
          sendResponse({ success: false, error: error.message });
        });
      } else {
        sendResponse({ success: false, error: 'SessionManager not available' });
      }
      return true;
      
    } else if (request.action === 'exportSession') {
      if (window.SessionManager) {
        window.SessionManager.exportSession(request.sessionId).then(jsonData => {
          sendResponse({ success: true, data: jsonData });
        }).catch(error => {
          sendResponse({ success: false, error: error.message });
        });
      } else {
        sendResponse({ success: false, error: 'SessionManager not available' });
      }
      return true;
      
    } else if (request.action === 'importSession') {
      if (window.SessionManager) {
        window.SessionManager.importSession(request.jsonData, request.newSessionId).then(session => {
          sendResponse({ success: true, session: session });
        }).catch(error => {
          sendResponse({ success: false, error: error.message });
        });
      } else {
        sendResponse({ success: false, error: 'SessionManager not available' });
      }
      return true;
      
    } else if (request.action === 'getAllSessions') {
      if (window.SessionManager) {
        window.SessionManager.getAllSessions().then(sessions => {
          sendResponse({ success: true, sessions: sessions });
        });
      } else {
        sendResponse({ success: false, error: 'SessionManager not available' });
      }
      return true;
      
    } else if (request.action === 'getSessionBackups') {
      if (window.SessionManager) {
        window.SessionManager.getSessionBackups().then(backups => {
          sendResponse({ success: true, backups: backups });
        });
      } else {
        sendResponse({ success: false, error: 'SessionManager not available' });
      }
      return true;
      
    } else if (request.action === 'createNewSession') {
      if (window.SessionManager) {
        window.SessionManager.createNewSession().then(sessionId => {
          sendResponse({ success: true, sessionId: sessionId });
        });
      } else {
        sendResponse({ success: false, error: 'SessionManager not available' });
      }
      return true;
    }
  } catch (error) {
    console.error('Error handling session message:', error);
    sendResponse({ success: false, error: error.message });
  }
  
  return false;
});

// COMPLETE SESSION MANAGEMENT MESSAGE HANDLERS
chrome.runtime.onMessage.addListener(function(request, sender, sendResponse) {
  if (window.SessionManager) {
    try {
      switch(request.action) {
        case 'getCurrentSessionId':
          window.SessionManager.getCurrentSessionId().then(sessionId => {
            sendResponse({ success: true, sessionId: sessionId });
          });
          return true;
          
        case 'backupAllTabs':
          window.SessionManager.backupAllTabs(request.backupName).then(backup => {
            sendResponse({ success: true, backup: backup });
          }).catch(error => {
            sendResponse({ success: false, error: error.message });
          });
          return true;
          
        case 'restoreBySessionId':
          window.SessionManager.restoreBySessionId(request.sessionId).then(result => {
            sendResponse(result);
          });
          return true;
          
        case 'exportAllTabs':
          window.SessionManager.exportAllTabs().then(jsonData => {
            sendResponse({ success: true, data: jsonData });
          }).catch(error => {
            sendResponse({ success: false, error: error.message });
          });
          return true;
          
        case 'importTabs':
          window.SessionManager.importTabs(request.jsonData).then(result => {
            sendResponse(result);
          }).catch(error => {
            sendResponse({ success: false, error: error.message });
          });
          return true;
          
        case 'getAllSessions':
          window.SessionManager.getAllSessions().then(sessions => {
            sendResponse({ success: true, sessions: sessions });
          });
          return true;
          
        case 'getSessionBackups':
          window.SessionManager.getSessionBackups().then(backups => {
            sendResponse({ success: true, backups: backups });
          });
          return true;
          
        case 'createNewSession':
          window.SessionManager.createNewSession().then(sessionId => {
            sendResponse({ success: true, sessionId: sessionId });
          });
          return true;
      }
    } catch (error) {
      sendResponse({ success: false, error: error.message });
    }
  }
  return false;
});

// COMPLETE MESSAGE HANDLING FOR ALL FEATURES
chrome.runtime.onMessage.addListener(function(request, sender, sendResponse) {
  console.log('Background received message:', request.action);
  
  try {
    // Session Management Messages
    if (request.action === 'getCurrentSessionId') {
      if (window.FixedSessionManager) {
        window.FixedSessionManager.init().then(() => {
          chrome.storage.local.get(['currentSessionId'], (result) => {
            sendResponse({ success: true, sessionId: result.currentSessionId });
          });
        });
      } else {
        chrome.storage.local.get(['currentSessionId'], (result) => {
          if (!result.currentSessionId) {
            const newId = `gs-${Date.now()}-${Math.random().toString(36).substring(2, 11)}`;
            chrome.storage.local.set({ currentSessionId: newId }, () => {
              sendResponse({ success: true, sessionId: newId });
            });
          } else {
            sendResponse({ success: true, sessionId: result.currentSessionId });
          }
        });
      }
      return true;
      
    } else if (request.action === 'backupAllTabs') {
      if (window.FixedSessionManager) {
        window.FixedSessionManager.backupAllTabs(request.backupName).then(backup => {
          sendResponse({ success: true, backup: backup });
        }).catch(error => {
          sendResponse({ success: false, error: error.message });
        });
      } else {
        sendResponse({ success: false, error: 'FixedSessionManager not available' });
      }
      return true;
      
    } else if (request.action === 'exportAllTabs') {
      if (window.FixedSessionManager) {
        window.FixedSessionManager.exportAllTabs().then(jsonData => {
          sendResponse({ success: true, data: jsonData });
        }).catch(error => {
          sendResponse({ success: false, error: error.message });
        });
      } else {
        sendResponse({ success: false, error: 'FixedSessionManager not available' });
      }
      return true;
      
    } else if (request.action === 'importTabs') {
      if (window.FixedSessionManager) {
        window.FixedSessionManager.importTabs(request.jsonData).then(result => {
          sendResponse(result);
        }).catch(error => {
          sendResponse({ success: false, error: error.message });
        });
      } else {
        sendResponse({ success: false, error: 'FixedSessionManager not available' });
      }
      return true;
      
    } else if (request.action === 'restoreBySessionId') {
      if (window.FixedSessionManager) {
        window.FixedSessionManager.restoreBySessionId(request.sessionId).then(result => {
          sendResponse(result);
        });
      } else {
        sendResponse({ success: false, error: 'FixedSessionManager not available' });
      }
      return true;
      
    } else if (request.action === 'getAllSessions') {
      if (window.FixedSessionManager) {
        window.FixedSessionManager.getAllSessions().then(sessions => {
          sendResponse({ success: true, sessions: sessions });
        });
      } else {
        sendResponse({ success: false, error: 'FixedSessionManager not available' });
      }
      return true;
      
    } else if (request.action === 'getSessionBackups') {
      if (window.FixedSessionManager) {
        window.FixedSessionManager.getSessionBackups().then(backups => {
          sendResponse({ success: true, backups: backups });
        });
      } else {
        sendResponse({ success: false, error: 'FixedSessionManager not available' });
      }
      return true;
      
    } else if (request.action === 'createNewSession') {
      if (window.FixedSessionManager) {
        window.FixedSessionManager.createNewSession().then(sessionId => {
          sendResponse({ success: true, sessionId: sessionId });
        });
      } else {
        sendResponse({ success: false, error: 'FixedSessionManager not available' });
      }
      return true;
    }
    
  } catch (error) {
    console.error('Error handling message:', error);
    sendResponse({ success: false, error: error.message });
  }
  
  return false;
});

// Initialize on startup
chrome.runtime.onStartup.addListener(() => {
  console.log('Extension startup - initializing all systems...');
  
  // Initialize tab protection
  if (window.TabProtection) {
    window.TabProtection.init();
  }
  
  // Initialize theme manager
  if (window.ThemeManager) {
    window.ThemeManager.initThemeManager();
  }
  
  // Initialize session manager
  if (window.FixedSessionManager) {
    window.FixedSessionManager.init();
  }
});

// Initialize on install
chrome.runtime.onInstalled.addListener(() => {
  console.log('Extension installed - setting up defaults...');
  
  // Set default settings
  chrome.storage.local.set({
    selectedTheme: 'purple',
    systemThemeBehavior: 'manual',
    tabProtection: true,
    autoRestore: true
  });
});
