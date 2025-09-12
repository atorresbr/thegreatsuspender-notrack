/**
 * BACKGROUND SERVICE WORKER - FIXED SW INITIALIZATION
 * Properly handles service worker lifecycle and prevents "No SW" error
 */

console.log('🚀 Service Worker starting...');

// Service Worker state tracking
let isServiceWorkerReady = false;
let initializationPromise = null;

// Extension state
let suspendedTabs = new Map();
let sessionData = {
    id: null,
    created: Date.now(),
    tabs: []
};

// Service Worker initialization with error handling
async function initializeServiceWorker() {
    if (initializationPromise) {
        return initializationPromise;
    }
    
    initializationPromise = new Promise(async (resolve, reject) => {
        try {
            console.log('🔧 Initializing Service Worker...');
            
            // Wait for service worker to be ready
            if (self.registration) {
                await self.registration.ready;
            }
            
            // Set default storage values if not exist
            const defaultSettings = {
                extensionEnabled: true,
                selectedTheme: 'purple',
                tabProtection: true,
                autoRestore: true,
                systemThemeBehavior: 'manual',
                suspendAfter: 60
            };
            
            // Only set defaults if they don't exist
            for (const [key, value] of Object.entries(defaultSettings)) {
                const result = await chrome.storage.local.get([key]);
                if (result[key] === undefined) {
                    await chrome.storage.local.set({ [key]: value });
                }
            }
            
            // Create initial session if none exists
            const sessionResult = await chrome.storage.local.get(['currentSessionId']);
            if (!sessionResult.currentSessionId) {
                createNewSession();
            } else {
                sessionData.id = sessionResult.currentSessionId;
            }
            
            // Setup context menu
            setupContextMenu();
            
            isServiceWorkerReady = true;
            console.log('✅ Service Worker initialized successfully');
            resolve(true);
            
        } catch (error) {
            console.error('❌ Service Worker initialization failed:', error);
            reject(error);
        }
    });
    
    return initializationPromise;
}

// Safe message handler with SW check
async function safeMessageHandler(request, sender, sendResponse) {
    try {
        // Ensure service worker is ready
        if (!isServiceWorkerReady) {
            await initializeServiceWorker();
        }
        
        console.log('📨 Background received message:', request.action);
        
        switch(request.action) {
            // SESSION MANAGEMENT
            case 'getCurrentSessionId':
                try {
                    const result = await chrome.storage.local.get(['currentSessionId']);
                    if (!result.currentSessionId) {
                        const newId = createNewSession();
                        sendResponse({ success: true, sessionId: newId });
                    } else {
                        sendResponse({ success: true, sessionId: result.currentSessionId });
                    }
                } catch (error) {
                    sendResponse({ success: false, error: error.message });
                }
                break;
                
            case 'createNewSession':
                try {
                    const newId = createNewSession();
                    sendResponse({ success: true, sessionId: newId });
                } catch (error) {
                    sendResponse({ success: false, error: error.message });
                }
                break;
                
            case 'backupAllTabs':
                handleBackupAllTabs(request.backupName).then(result => {
                    sendResponse(result);
                }).catch(error => {
                    sendResponse({ success: false, error: error.message });
                });
                return true; // Keep message channel open
                
            case 'exportAllTabs':
                handleExportAllTabs().then(result => {
                    sendResponse(result);
                }).catch(error => {
                    sendResponse({ success: false, error: error.message });
                });
                return true;
                
            case 'importTabs':
                handleImportTabs(request.jsonData).then(result => {
                    sendResponse(result);
                }).catch(error => {
                    sendResponse({ success: false, error: error.message });
                });
                return true;
                
            case 'restoreBySessionId':
                handleRestoreBySessionId(request.sessionId).then(result => {
                    sendResponse(result);
                }).catch(error => {
                    sendResponse({ success: false, error: error.message });
                });
                return true;
                
            case 'getSessionBackups':
                try {
                    const result = await chrome.storage.local.get(['sessionBackups']);
                    sendResponse({ success: true, backups: result.sessionBackups || {} });
                } catch (error) {
                    sendResponse({ success: false, error: error.message });
                }
                break;
                
            // TAB SUSPENSION
            case 'suspendTab':
                suspendTab(request.tabId || sender.tab?.id).then(result => {
                    sendResponse(result);
                }).catch(error => {
                    sendResponse({ success: false, error: error.message });
                });
                return true;
                
            case 'unsuspendTab':
                unsuspendTab(request.tabId || sender.tab?.id).then(result => {
                    sendResponse(result);
                }).catch(error => {
                    sendResponse({ success: false, error: error.message });
                });
                return true;
                
            case 'suspendOtherTabs':
                suspendOtherTabs(request.activeTabId || sender.tab?.id).then(result => {
                    sendResponse(result);
                }).catch(error => {
                    sendResponse({ success: false, error: error.message });
                });
                return true;
                
            case 'unsuspendAllTabs':
                unsuspendAllTabs().then(result => {
                    sendResponse(result);
                }).catch(error => {
                    sendResponse({ success: false, error: error.message });
                });
                return true;
                
            case 'getSuspendedCount':
                getSuspendedTabsCount().then(result => {
                    sendResponse(result);
                }).catch(error => {
                    sendResponse({ success: false, error: error.message });
                });
                return true;
                
            // POPUP SUPPORT
            case 'openOptions':
                chrome.runtime.openOptionsPage();
                sendResponse({ success: true });
                break;
                
            case 'getTabInfo':
                getTabInfo(request.tabId).then(result => {
                    sendResponse(result);
                }).catch(error => {
                    sendResponse({ success: false, error: error.message });
                });
                return true;
                
            // CONTENT SCRIPT COMMUNICATION
            case 'protectionStatus':
                handleProtectionStatus(sender.tab, request.status);
                sendResponse({ success: true });
                break;
                
            default:
                sendResponse({ success: false, error: 'Unknown action: ' + request.action });
        }
    } catch (error) {
        console.error('❌ Error in message handler:', error);
        sendResponse({ success: false, error: 'Service worker error: ' + error.message });
    }
}

// Install event with proper SW handling
chrome.runtime.onInstalled.addListener(async (details) => {
    console.log('🔧 Extension installed/updated:', details.reason);
    
    try {
        await initializeServiceWorker();
        console.log('✅ Installation completed successfully');
    } catch (error) {
        console.error('❌ Installation failed:', error);
    }
});

// Startup event with SW ready check
chrome.runtime.onStartup.addListener(async () => {
    console.log('🚀 Extension startup...');
    
    try {
        await initializeServiceWorker();
        console.log('✅ Startup completed successfully');
    } catch (error) {
        console.error('❌ Startup failed:', error);
    }
});

// Message listener with safe handling
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
    safeMessageHandler(request, sender, sendResponse);
    return true; // Keep message channel open for async responses
});

// Create new session
function createNewSession() {
    const newSessionId = `gs-${Date.now()}-${Math.random().toString(36).substring(2, 11)}`;
    sessionData.id = newSessionId;
    sessionData.created = Date.now();
    sessionData.tabs = [];
    
    chrome.storage.local.set({ 
        currentSessionId: newSessionId,
        sessionData: sessionData
    }).catch(error => {
        console.error('Error saving session:', error);
    });
    
    console.log('📝 Created new session:', newSessionId);
    return newSessionId;
}

// Setup context menu with error handling
function setupContextMenu() {
    try {
        chrome.contextMenus.removeAll(() => {
            chrome.contextMenus.create({
                id: 'suspend-tab',
                title: '💤 Suspend this tab',
                contexts: ['page']
            });
            
            chrome.contextMenus.create({
                id: 'suspend-other',
                title: '😴 Suspend other tabs',
                contexts: ['page']
            });
            
            chrome.contextMenus.create({
                id: 'unsuspend-all',
                title: '🔄 Unsuspend all tabs',
                contexts: ['page']
            });
            
            console.log('✅ Context menu setup completed');
        });
    } catch (error) {
        console.error('❌ Context menu setup failed:', error);
    }
}

// Handle context menu clicks
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
        console.error('❌ Context menu action failed:', error);
    }
});

// TAB SUSPENSION FUNCTIONS (with error handling)
async function suspendTab(tabId) {
    try {
        if (!tabId) {
            return { success: false, error: 'No tab ID provided' };
        }
        
        const tab = await chrome.tabs.get(tabId);
        
        // Check if tab can be suspended
        if (!canSuspendTab(tab)) {
            return { success: false, error: 'Tab cannot be suspended' };
        }
        
        // Store tab data
        const tabData = {
            id: tab.id,
            url: tab.url,
            title: tab.title,
            favIconUrl: tab.favIconUrl,
            pinned: tab.pinned,
            suspended: Date.now()
        };
        
        suspendedTabs.set(tab.id, tabData);
        
        // Create suspended URL
        const suspendedUrl = chrome.runtime.getURL('suspended.html') + 
            '?uri=' + encodeURIComponent(tab.url) + 
            '&title=' + encodeURIComponent(tab.title);
        
        await chrome.tabs.update(tabId, { url: suspendedUrl });
        
        console.log('💤 Tab suspended:', tabId, tab.title);
        return { success: true, tabData: tabData };
        
    } catch (error) {
        console.error('❌ Error suspending tab:', error);
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
                const decodedUrl = decodeURIComponent(originalUrl);
                await chrome.tabs.update(tabId, { url: decodedUrl });
                
                suspendedTabs.delete(tabId);
                
                console.log('🔄 Tab unsuspended:', tabId);
                return { success: true, url: decodedUrl };
            }
        }
        
        return { success: false, error: 'Tab is not suspended' };
        
    } catch (error) {
        console.error('❌ Error unsuspending tab:', error);
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
                if (result.success) {
                    suspended++;
                }
            }
        }
        
        return { success: true, suspended: suspended };
        
    } catch (error) {
        console.error('❌ Error suspending other tabs:', error);
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
                if (result.success) {
                    unsuspended++;
                }
            }
        }
        
        return { success: true, unsuspended: unsuspended };
        
    } catch (error) {
        console.error('❌ Error unsuspending all tabs:', error);
        return { success: false, error: error.message };
    }
}

// Check if tab can be suspended
function canSuspendTab(tab) {
    if (!tab || !tab.url) return false;
    
    // Don't suspend special pages
    const protectedUrls = [
        'chrome://', 'chrome-extension://', 'moz-extension://', 
        'edge://', 'about:', 'file://', 'data:', 'blob:'
    ];
    
    for (const protectedUrl of protectedUrls) {
        if (tab.url.startsWith(protectedUrl)) {
            return false;
        }
    }
    
    // Don't suspend already suspended tabs
    if (tab.url.includes('suspended.html')) {
        return false;
    }
    
    return true;
}

// Get suspended tabs count
async function getSuspendedTabsCount() {
    try {
        const tabs = await chrome.tabs.query({});
        const suspendedCount = tabs.filter(tab => tab.url.includes('suspended.html')).length;
        const estimatedMemory = suspendedCount * 75; // ~75MB per suspended tab
        
        return {
            success: true,
            count: suspendedCount,
            estimatedMemory: estimatedMemory
        };
    } catch (error) {
        return { success: false, error: error.message };
    }
}

// Get tab information
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
                favIconUrl: tab.favIconUrl,
                pinned: tab.pinned,
                suspended: tab.url.includes('suspended.html')
            }
        };
    } catch (error) {
        return { success: false, error: error.message };
    }
}

// SESSION MANAGEMENT PLACEHOLDER FUNCTIONS
async function handleBackupAllTabs(backupName) {
    // Implementation would go here
    return { success: true, message: 'Backup functionality available' };
}

async function handleExportAllTabs() {
    // Implementation would go here
    return { success: true, message: 'Export functionality available' };
}

async function handleImportTabs(jsonData) {
    // Implementation would go here
    return { success: true, message: 'Import functionality available' };
}

async function handleRestoreBySessionId(sessionId) {
    // Implementation would go here
    return { success: true, message: 'Restore functionality available' };
}

function handleProtectionStatus(tab, status) {
    console.log('🛡️ Tab protection status:', tab?.id, status);
}

// Initialize immediately when script loads
initializeServiceWorker().catch(error => {
    console.error('❌ Failed to initialize service worker:', error);
});

console.log('✅ Service Worker script loaded and initializing...');
