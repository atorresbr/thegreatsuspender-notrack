/**
 * FIXED Background Service Worker - Proper Manifest V3 Implementation
 */

console.log('🚀 Service Worker starting...');

// Global state
let isServiceWorkerReady = false;
let suspendedTabs = new Map();
let sessionData = { id: null, created: Date.now(), tabs: [] };

// Simple initialization without problematic SW APIs
async function initializeServiceWorker() {
    try {
        console.log('🔧 Initializing Service Worker...');
        
        // Set default storage values
        const defaults = {
            extensionEnabled: true,
            selectedTheme: 'purple',
            tabProtection: true,
            autoRestore: true,
            systemThemeBehavior: 'manual',
            suspendAfter: 60
        };
        
        // Initialize defaults
        for (const [key, value] of Object.entries(defaults)) {
            try {
                const result = await chrome.storage.local.get([key]);
                if (result[key] === undefined) {
                    await chrome.storage.local.set({ [key]: value });
                }
            } catch (error) {
                console.warn(`Failed to set default ${key}:`, error);
            }
        }
        
        // Create session ID if needed
        const sessionResult = await chrome.storage.local.get(['currentSessionId']);
        if (!sessionResult.currentSessionId) {
            const newId = `gs-${Date.now()}-${Math.random().toString(36).substring(2, 11)}`;
            await chrome.storage.local.set({ currentSessionId: newId });
            sessionData.id = newId;
        } else {
            sessionData.id = sessionResult.currentSessionId;
        }
        
        // Setup context menu
        setupContextMenu();
        
        isServiceWorkerReady = true;
        console.log('✅ Service Worker initialized successfully');
        
    } catch (error) {
        console.error('❌ Service Worker initialization error:', error);
        // Don't throw - just log and continue
        isServiceWorkerReady = true; // Allow operation even if some parts failed
    }
}

// Message handler
async function handleMessage(request, sender, sendResponse) {
    try {
        console.log('📨 Background received:', request.action);
        
        switch(request.action) {
            case 'getCurrentSessionId':
                const result = await chrome.storage.local.get(['currentSessionId']);
                sendResponse({ success: true, sessionId: result.currentSessionId });
                break;
                
            case 'createNewSession':
                const newId = `gs-${Date.now()}-${Math.random().toString(36).substring(2, 11)}`;
                await chrome.storage.local.set({ currentSessionId: newId });
                sendResponse({ success: true, sessionId: newId });
                break;
                
            case 'suspendTab':
                const suspendResult = await suspendTab(request.tabId || sender.tab?.id);
                sendResponse(suspendResult);
                break;
                
            case 'unsuspendTab':
                const unsuspendResult = await unsuspendTab(request.tabId || sender.tab?.id);
                sendResponse(unsuspendResult);
                break;
                
            case 'suspendOtherTabs':
                const suspendOtherResult = await suspendOtherTabs(request.activeTabId || sender.tab?.id);
                sendResponse(suspendOtherResult);
                break;
                
            case 'unsuspendAllTabs':
                const unsuspendAllResult = await unsuspendAllTabs();
                sendResponse(unsuspendAllResult);
                break;
                
            case 'getSuspendedCount':
                const countResult = await getSuspendedTabsCount();
                sendResponse(countResult);
                break;
                
            case 'openOptions':
                chrome.runtime.openOptionsPage();
                sendResponse({ success: true });
                break;
                
            case 'getTabInfo':
                const tabResult = await getTabInfo(request.tabId);
                sendResponse(tabResult);
                break;
                
            default:
                sendResponse({ success: false, error: 'Unknown action: ' + request.action });
        }
    } catch (error) {
        console.error('❌ Message handler error:', error);
        sendResponse({ success: false, error: error.message });
    }
}

// Tab suspension functions
async function suspendTab(tabId) {
    try {
        if (!tabId) return { success: false, error: 'No tab ID provided' };
        
        const tab = await chrome.tabs.get(tabId);
        if (!canSuspendTab(tab)) {
            return { success: false, error: 'Tab cannot be suspended' };
        }
        
        const suspendedUrl = chrome.runtime.getURL('suspended.html') + 
            '?uri=' + encodeURIComponent(tab.url) + 
            '&title=' + encodeURIComponent(tab.title);
        
        await chrome.tabs.update(tabId, { url: suspendedUrl });
        
        suspendedTabs.set(tabId, {
            id: tabId,
            url: tab.url,
            title: tab.title,
            suspended: Date.now()
        });
        
        return { success: true };
    } catch (error) {
        return { success: false, error: error.message };
    }
}

async function unsuspendTab(tabId) {
    try {
        const tab = await chrome.tabs.get(tabId);
        if (tab.url.includes('suspended.html')) {
            const urlParams = new URLSearchParams(tab.url.split('?')[1] || '');
            const originalUrl = urlParams.get('uri') || urlParams.get('url');
            
            if (originalUrl) {
                await chrome.tabs.update(tabId, { url: decodeURIComponent(originalUrl) });
                suspendedTabs.delete(tabId);
                return { success: true };
            }
        }
        return { success: false, error: 'Tab is not suspended' };
    } catch (error) {
        return { success: false, error: error.message };
    }
}

async function suspendOtherTabs(activeTabId) {
    try {
        const tabs = await chrome.tabs.query({ currentWindow: true });
        let suspended = 0;
        
        for (const tab of tabs) {
            if (tab.id !== activeTabId && canSuspendTab(tab)) {
                const result = await suspendTab(tab.id);
                if (result.success) suspended++;
            }
        }
        
        return { success: true, suspended };
    } catch (error) {
        return { success: false, error: error.message };
    }
}

async function unsuspendAllTabs() {
    try {
        const tabs = await chrome.tabs.query({});
        let unsuspended = 0;
        
        for (const tab of tabs) {
            if (tab.url.includes('suspended.html')) {
                const result = await unsuspendTab(tab.id);
                if (result.success) unsuspended++;
            }
        }
        
        return { success: true, unsuspended };
    } catch (error) {
        return { success: false, error: error.message };
    }
}

function canSuspendTab(tab) {
    return tab && 
           !tab.url.includes('chrome://') && 
           !tab.url.includes('chrome-extension://') && 
           !tab.url.includes('suspended.html') &&
           !tab.url.includes('about:') &&
           tab.url !== '';
}

async function getSuspendedTabsCount() {
    try {
        const tabs = await chrome.tabs.query({});
        const suspendedCount = tabs.filter(tab => tab.url.includes('suspended.html')).length;
        return {
            success: true,
            count: suspendedCount,
            estimatedMemory: suspendedCount * 75
        };
    } catch (error) {
        return { success: false, error: error.message };
    }
}

async function getTabInfo(tabId) {
    try {
        let tab;
        if (tabId) {
            tab = await chrome.tabs.get(tabId);
        } else {
            [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
        }
        
        return {
            success: true,
            tab: {
                id: tab.id,
                title: tab.title,
                url: tab.url,
                suspended: tab.url.includes('suspended.html')
            }
        };
    } catch (error) {
        return { success: false, error: error.message };
    }
}

function setupContextMenu() {
    try {
        chrome.contextMenus.removeAll(() => {
            const menuItems = [
                { id: 'suspend-tab', title: '💤 Suspend this tab', contexts: ['page'] },
                { id: 'suspend-other', title: '😴 Suspend other tabs', contexts: ['page'] },
                { id: 'unsuspend-all', title: '🔄 Unsuspend all tabs', contexts: ['page'] }
            ];
            
            menuItems.forEach(item => {
                chrome.contextMenus.create(item, () => {
                    if (chrome.runtime.lastError) {
                        console.warn('Context menu creation error:', chrome.runtime.lastError.message);
                    }
                });
            });
        });
    } catch (error) {
        console.warn('Context menu setup failed:', error);
    }
}

// Event listeners
chrome.runtime.onInstalled.addListener((details) => {
    console.log('🔧 Extension installed:', details.reason);
    initializeServiceWorker();
});

chrome.runtime.onStartup.addListener(() => {
    console.log('🚀 Extension startup');
    initializeServiceWorker();
});

chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
    handleMessage(request, sender, sendResponse);
    return true; // Keep message channel open
});

chrome.contextMenus.onClicked.addListener(async (info, tab) => {
    try {
        switch(info.menuItemId) {
            case 'suspend-tab':
                await suspendTab(tab.id);
                break;
            case 'suspend-other':
                await suspendOtherTabs(tab.id);
                break;
            case 'unsuspend-all':
                await unsuspendAllTabs();
                break;
        }
    } catch (error) {
        console.error('Context menu action error:', error);
    }
});

// Initialize immediately
initializeServiceWorker();


// Session Management Handlers
chrome.runtime.onMessage.addListener((msg, sender, sendResponse) => {
  if (msg.action === "exportTabs") {
    chrome.tabs.query({}, tabs => {
      const exportTabs = tabs.filter(tab =>
        tab.url &&
        !tab.url.startsWith("chrome://") &&
        !tab.url.startsWith("chrome-extension://")
      ).map(tab => ({
        title: tab.title,
        url: tab.url
      }));
      sendResponse({tabs: exportTabs});
    });
    return true;
  }
  if (msg.action === "importTabs") {
    try {
      const imported = JSON.parse(msg.jsonData);
      const tabsArray = imported.tabs || imported;
      if (!Array.isArray(tabsArray)) {
        sendResponse({success: false});
        return true;
      }
      // Open imported tabs
      tabsArray.forEach(tab => {
        if (tab.url) chrome.tabs.create({url: tab.url});
      });
      sendResponse({success: true, imported: tabsArray.length});
    } catch (err) {
      sendResponse({success: false});
    }
    return true;
  }
  if (msg.action === "backupTabs") {
    chrome.tabs.query({}, tabs => {
      chrome.storage.local.set({backupTabs: tabs}, () => {
        sendResponse({success: true, count: tabs.length});
      });
    });
    return true;
  }
  if (msg.action === "restoreSession") {
    const sessionId = msg.sessionId;
    chrome.storage.local.get([sessionId], result => {
      const sessionTabs = result[sessionId] || [];
      sessionTabs.forEach(tab => {
        if (tab.url) chrome.tabs.create({url: tab.url});
      });
      sendResponse({success: true, restored: sessionTabs.length});
    });
    return true;
  }
  if (msg.action === "createSession") {
    chrome.tabs.query({}, tabs => {
      const sessionId = "session_" + Date.now();
      chrome.storage.local.set({[sessionId]: tabs}, () => {
        sendResponse({success: true, sessionId: sessionId, count: tabs.length});
      });
    });
    return true;
  }
  if (msg.action === "getSessionId") {
    chrome.storage.local.get(null, data => {
      const sessionIds = Object.keys(data).filter(k => k.startsWith("session_"));
      const latestId = sessionIds.sort().pop() || "none";
      sendResponse({sessionId: latestId});
    });
    return true;
  }
});
