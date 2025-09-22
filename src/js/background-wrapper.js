/**
 * COMPLETE SESSION MANAGEMENT WITH FIXED BACKUP FUNCTIONALITY
 */

console.log('🚀 Complete Session Management Service Worker starting...');

// Global state
let isServiceWorkerReady = false;
let suspendedTabs = new Map();
let currentSessionId = null;
let contextMenusCreated = false;
let originalTabs = new Map();

// Initialize service worker
async function initializeServiceWorker() {
    try {
        console.log('🔧 Initializing Complete Session Management...');
        
        const defaults = {
            extensionEnabled: true,
            selectedTheme: "purple",
            tabProtection: true,
            autoRestore: true,
            systemThemeBehavior: "manual",
            suspendAfter: 60
        };
        
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
        
        const sessionResult = await chrome.storage.local.get(['currentSessionId']);
        if (!sessionResult.currentSessionId) {
            currentSessionId = `gs-${Date.now()}-${Math.random().toString(36).substring(2, 11)}`;
            await chrome.storage.local.set({ currentSessionId: currentSessionId });
            console.log('✅ Created new session ID:', currentSessionId);
        } else {
            currentSessionId = sessionResult.currentSessionId;
            console.log('✅ Using existing session ID:', currentSessionId);
        }
        
        await storeCurrentTabsForProtection();
        
        const settings = await chrome.storage.local.get(['autoRestore', 'tabProtection']);
        if (settings.autoRestore) {
            await autoRestoreSuspendedTabs();
        }
        
        await applySessionIdToAllTabs();
        
        if (!contextMenusCreated && chrome.contextMenus) {
            await setupContextMenu();
        }
        
        isServiceWorkerReady = true;
        console.log('✅ Complete Session Management initialized successfully');
        
    } catch (error) {
        console.error('❌ Service Worker initialization error:', error);
        isServiceWorkerReady = true;
    }
}

async function storeCurrentTabsForProtection() {
    try {
        const tabs = await chrome.tabs.query({});
        const protectedTabs = [];
        
        for (const tab of tabs) {
            if (canManageTab(tab)) {
                protectedTabs.push({
                    id: tab.id,
                    url: tab.url,
                    title: tab.title,
                    sessionId: currentSessionId,
                    timestamp: Date.now(),
                    protected: true
                });
                
                originalTabs.set(tab.id, {
                    url: tab.url,
                    title: tab.title,
                    sessionId: currentSessionId
                });
            }
        }
        
        if (protectedTabs.length > 0) {
            await chrome.storage.local.set({ 
                protectedTabs: protectedTabs,
                [`session_${currentSessionId}_protected`]: protectedTabs
            });
            console.log(`✅ Protected ${protectedTabs.length} tabs from extension reload`);
        }
    } catch (error) {
        console.error('❌ Error storing protected tabs:', error);
    }
}

async function autoRestoreSuspendedTabs() {
    try {
        const result = await chrome.storage.local.get(['protectedTabs', `session_${currentSessionId}_protected`]);
        const tabsToRestore = result.protectedTabs || result[`session_${currentSessionId}_protected`] || [];
        
        if (tabsToRestore.length > 0) {
            console.log(`🔄 Auto-restoring ${tabsToRestore.length} protected tabs...`);
            
            const currentTabs = await chrome.tabs.query({});
            const nonSystemTabs = currentTabs.filter(canManageTab);
            
            if (nonSystemTabs.length <= 1) {
                for (const tab of tabsToRestore) {
                    if (tab.url && canManageTab(tab)) {
                        await chrome.tabs.create({ 
                            url: tab.url, 
                            active: false 
                        });
                    }
                }
                console.log('✅ Auto-restore completed');
            }
        }
    } catch (error) {
        console.error('❌ Auto-restore error:', error);
    }
}

async function applySessionIdToAllTabs() {
    try {
        const tabs = await chrome.tabs.query({});
        const sessionTabs = [];
        
        for (const tab of tabs) {
            if (canManageTab(tab)) {
                sessionTabs.push({
                    id: tab.id,
                    url: tab.url,
                    title: tab.title,
                    sessionId: currentSessionId,
                    timestamp: Date.now()
                });
            }
        }
        
        if (sessionTabs.length > 0) {
            await chrome.storage.local.set({ 
                [`session_${currentSessionId}`]: sessionTabs,
                currentSessionTabs: sessionTabs
            });
            console.log(`✅ Applied session ID ${currentSessionId} to ${sessionTabs.length} tabs`);
        }
    } catch (error) {
        console.error('❌ Error applying session ID:', error);
    }
}

// UNIFIED MESSAGE HANDLER with FIXED backup functions
function handleMessage(request, sender, sendResponse) {
    console.log('📨 Background received:', request.action);
    
    switch(request.action) {
        case 'exportTabs':
            chrome.tabs.query({}, (tabs) => {
                const exportTabs = tabs.filter(canManageTab).map((tab) => ({
                    title: tab.title,
                    url: tab.url,
                    sessionId: currentSessionId,
                    timestamp: Date.now()
                }));
                console.log('✅ Exporting', exportTabs.length, 'tabs with session ID:', currentSessionId);
                sendResponse({tabs: exportTabs, sessionId: currentSessionId});
            });
            return true;
            
        // FIXED: backupAllTabs - works with ALL tabs (not just suspended)
        case 'backupAllTabs':
            chrome.tabs.query({}, (tabs) => {
                // Get ALL manageable tabs (both regular and suspended)
                const allTabs = tabs.filter(canManageTab).map((tab) => ({
                    id: tab.id,
                    title: tab.title,
                    url: tab.url,
                    sessionId: currentSessionId,
                    timestamp: Date.now(),
                    suspended: tab.url.includes('suspended.html')
                }));
                
                console.log(`🔄 Backing up ${allTabs.length} tabs (${allTabs.filter(t => t.suspended).length} suspended, ${allTabs.filter(t => !t.suspended).length} regular)`);
                
                // Generate backup name if not provided
                let backupName = request.backupName;
                if (!backupName || backupName.trim() === '') {
                    const now = new Date();
                    backupName = `backup_${now.getFullYear()}-${String(now.getMonth()+1).padStart(2,'0')}-${String(now.getDate()).padStart(2,'0')}_${String(now.getHours()).padStart(2,'0')}-${String(now.getMinutes()).padStart(2,'0')}`;
                }
                
                const backupData = {
                    name: backupName,
                    sessionId: currentSessionId,
                    tabs: allTabs,
                    created: Date.now(),
                    count: allTabs.length,
                    suspendedCount: allTabs.filter(t => t.suspended).length,
                    regularCount: allTabs.filter(t => !t.suspended).length
                };
                
                // Store backup
                chrome.storage.local.set({ 
                    [`session_${currentSessionId}`]: allTabs,
                    [`backup_${backupName}`]: backupData,
                    currentSessionTabs: allTabs,
                    protectedTabs: allTabs
                }, () => {
                    if (chrome.runtime.lastError) {
                        console.error('❌ Error storing backup:', chrome.runtime.lastError);
                        sendResponse({
                            success: false, 
                            error: chrome.runtime.lastError.message
                        });
                    } else {
                        console.log(`✅ Backed up ${allTabs.length} tabs as "${backupName}" with session ID: ${currentSessionId}`);
                        sendResponse({
                            success: true, 
                            count: allTabs.length, 
                            sessionId: currentSessionId,
                            backupName: backupName,
                            suspendedCount: backupData.suspendedCount,
                            regularCount: backupData.regularCount
                        });
                    }
                });
            });
            return true;
            
        // FIXED: deleteBackup function
        case 'deleteBackup':
            const backupName = request.backupName;
            if (!backupName) {
                sendResponse({success: false, error: 'Backup name required'});
                return true;
            }
            
            console.log(`🗑️ Deleting backup: ${backupName}`);
            
            chrome.storage.local.remove([`backup_${backupName}`], () => {
                if (chrome.runtime.lastError) {
                    console.error('❌ Error deleting backup:', chrome.runtime.lastError);
                    sendResponse({
                        success: false, 
                        error: chrome.runtime.lastError.message
                    });
                } else {
                    console.log(`✅ Backup "${backupName}" deleted successfully`);
                    sendResponse({
                        success: true,
                        message: `Backup "${backupName}" deleted`
                    });
                }
            });
            return true;
            
        // Original backupTabs (keep for compatibility)
        case 'backupTabs':
            chrome.tabs.query({}, (tabs) => {
                const backupTabs = tabs.filter(canManageTab).map((tab) => ({
                    id: tab.id,
                    title: tab.title,
                    url: tab.url,
                    sessionId: currentSessionId,
                    timestamp: Date.now()
                }));
                
                let backupName = request.backupName;
                if (!backupName || backupName.trim() === '') {
                    const now = new Date();
                    backupName = `backup_${now.getFullYear()}-${String(now.getMonth()+1).padStart(2,'0')}-${String(now.getDate()).padStart(2,'0')}_${String(now.getHours()).padStart(2,'0')}-${String(now.getMinutes()).padStart(2,'0')}`;
                }
                
                const backupData = {
                    name: backupName,
                    sessionId: currentSessionId,
                    tabs: backupTabs,
                    created: Date.now(),
                    count: backupTabs.length
                };
                
                chrome.storage.local.set({ 
                    [`session_${currentSessionId}`]: backupTabs,
                    [`backup_${backupName}`]: backupData,
                    currentSessionTabs: backupTabs,
                    protectedTabs: backupTabs
                }, () => {
                    console.log(`✅ Backed up ${backupTabs.length} tabs as "${backupName}" with session ID: ${currentSessionId}`);
                    sendResponse({
                        success: true, 
                        count: backupTabs.length, 
                        sessionId: currentSessionId,
                        backupName: backupName
                    });
                });
            });
            return true;
            
        case 'createNewSession':
            chrome.tabs.query({}, async (tabs) => {
                try {
                    const currentTabs = tabs.filter(canManageTab).map((tab) => ({
                        id: tab.id,
                        title: tab.title,
                        url: tab.url,
                        sessionId: currentSessionId,
                        timestamp: Date.now()
                    }));
                    
                    if (currentTabs.length > 0) {
                        await chrome.storage.local.set({ 
                            [`session_${currentSessionId}`]: currentTabs,
                            [`backup_previous_${Date.now()}`]: {
                                name: `Previous Session ${new Date().toLocaleString()}`,
                                sessionId: currentSessionId,
                                tabs: currentTabs,
                                created: Date.now()
                            }
                        });
                    }
                    
                    const newSessionId = `gs-${Date.now()}-${Math.random().toString(36).substring(2, 11)}`;
                    
                    let suspendedCount = 0;
                    const suspendPromises = tabs.map(async (tab) => {
                        if (canManageTab(tab)) {
                            try {
                                const suspendedUrl = chrome.runtime.getURL('suspended.html') + 
                                    '?uri=' + encodeURIComponent(tab.url) + 
                                    '&title=' + encodeURIComponent(tab.title) +
                                    '&sessionId=' + encodeURIComponent(newSessionId) +
                                    '&tabId=' + encodeURIComponent(tab.id);
                                
                                await chrome.tabs.update(tab.id, { url: suspendedUrl });
                                suspendedCount++;
                                
                                suspendedTabs.set(tab.id, {
                                    id: tab.id,
                                    url: tab.url,
                                    title: tab.title,
                                    sessionId: newSessionId,
                                    suspended: Date.now()
                                });
                                
                            } catch (error) {
                                console.error('Error suspending tab:', error);
                            }
                        }
                    });
                    
                    await Promise.all(suspendPromises);
                    
                    await chrome.storage.local.set({ currentSessionId: newSessionId });
                    currentSessionId = newSessionId;
                    
                    await applySessionIdToAllTabs();
                    await storeCurrentTabsForProtection();
                    
                    console.log(`✅ Created new session ${newSessionId}, suspended ${suspendedCount} tabs`);
                    
                    sendResponse({
                        success: true,
                        sessionId: newSessionId,
                        suspended: suspendedCount,
                        previousCount: currentTabs.length
                    });
                    
                } catch (error) {
                    console.error('❌ Error creating new session:', error);
                    sendResponse({
                        success: false,
                        error: error.message
                    });
                }
            });
            return true;
            
        case 'restoreSession':
            const sessionId = request.sessionId;
            console.log('🔄 Restoring session:', sessionId);
            
            chrome.storage.local.get([`session_${sessionId}`, sessionId], (result) => {
                let sessionTabs = result[`session_${sessionId}`] || result[sessionId] || [];
                
                if (sessionTabs.length === 0) {
                    chrome.storage.local.get(null, (allData) => {
                        const backupKey = Object.keys(allData).find(key => 
                            key.startsWith('backup_') && allData[key].sessionId === sessionId
                        );
                        
                        if (backupKey) {
                            sessionTabs = allData[backupKey].tabs || [];
                        }
                        
                        if (sessionTabs.length > 0) {
                            sessionTabs.forEach((tab) => {
                                if (tab.url && canManageTab(tab)) {
                                    chrome.tabs.create({url: tab.url, active: false});
                                }
                            });
                            sendResponse({success: true, restored: sessionTabs.length, sessionId: sessionId});
                        } else {
                            sendResponse({success: false, error: 'Session not found', sessionId: sessionId});
                        }
                    });
                } else {
                    sessionTabs.forEach((tab) => {
                        if (tab.url && canManageTab(tab)) {
                            chrome.tabs.create({url: tab.url, active: false});
                        }
                    });
                    sendResponse({success: true, restored: sessionTabs.length, sessionId: sessionId});
                }
            });
            return true;
            
        case 'getSessionId':
            sendResponse({sessionId: currentSessionId});
            return true;
            
        case 'getCurrentSessionId':
            sendResponse({success: true, sessionId: currentSessionId});
            return true;
            
        case 'importTabs':
            try {
                const imported = JSON.parse(request.jsonData);
                const tabsArray = imported.tabs || imported;
                if (!Array.isArray(tabsArray)) {
                    sendResponse({success: false, error: "Invalid format"});
                    return true;
                }
                tabsArray.forEach((tab) => {
                    if (tab.url && canManageTab(tab)) {
                        chrome.tabs.create({url: tab.url, active: false});
                    }
                });
                sendResponse({success: true, imported: tabsArray.length});
            } catch (err) {
                console.error('Import error:', err);
                sendResponse({success: false, error: err.message});
            }
            return true;
            
        case 'getBackupsList':
            chrome.storage.local.get(null, (data) => {
                const backups = Object.keys(data)
                    .filter(key => key.startsWith('backup_'))
                    .map(key => data[key])
                    .filter(backup => backup && backup.name)
                    .sort((a, b) => b.created - a.created);
                sendResponse({backups: backups});
            });
            return true;
            
        // Original tab management functions
        case 'suspendTab':
            suspendTab(request.tabId || sender.tab.id).then((result) => {
                sendResponse(result);
            });
            return true;
            
        case 'unsuspendTab':
            unsuspendTab(request.tabId || sender.tab.id).then((result) => {
                sendResponse(result);
            });
            return true;
            
        case 'suspendOtherTabs':
            suspendOtherTabs(request.activeTabId || sender.tab.id).then((result) => {
                sendResponse(result);
            });
            return true;
            
        case 'unsuspendAllTabs':
            unsuspendAllTabs().then((result) => {
                sendResponse(result);
            });
            return true;
            
        case 'getSuspendedCount':
            getSuspendedTabsCount().then((result) => {
                sendResponse(result);
            });
            return true;
            
        case 'openOptions':
            chrome.runtime.openOptionsPage();
            sendResponse({success: true});
            return true;
            
        case 'getTabInfo':
            getTabInfo(request.tabId).then((result) => {
                sendResponse(result);
            });
            return true;
            
        default:
            sendResponse({success: false, error: 'Unknown action: ' + request.action});
            return true;
    }
}

// Utility functions
function canManageTab(tab) {
    return tab && 
           tab.url &&
           !tab.url.startsWith('chrome://') && 
           !tab.url.startsWith('chrome-extension://') && 
           !tab.url.includes('suspended.html') &&
           !tab.url.startsWith('about:') &&
           !tab.url.startsWith('moz-extension://') &&
           tab.url !== '' && 
           tab.url !== 'about:blank';
}

// Tab suspension functions
async function suspendTab(tabId) {
    try {
        if (!tabId) return { success: false, error: 'No tab ID provided' };
        
        const tab = await chrome.tabs.get(tabId);
        if (!canManageTab(tab)) {
            return { success: false, error: 'Tab cannot be suspended' };
        }
        
        const suspendedUrl = chrome.runtime.getURL('suspended.html') + 
            '?uri=' + encodeURIComponent(tab.url) + 
            '&title=' + encodeURIComponent(tab.title) +
            '&sessionId=' + encodeURIComponent(currentSessionId) +
            '&tabId=' + encodeURIComponent(tab.id);
        
        await chrome.tabs.update(tabId, { url: suspendedUrl });
        
        suspendedTabs.set(tabId, {
            id: tabId,
            url: tab.url,
            title: tab.title,
            sessionId: currentSessionId,
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
            if (tab.id !== activeTabId && canManageTab(tab)) {
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

async function getSuspendedTabsCount() {
    try {
        const tabs = await chrome.tabs.query({});
        const suspendedCount = tabs.filter((tab) => tab.url.includes('suspended.html')).length;
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
                sessionId: currentSessionId,
                suspended: tab.url.includes('suspended.html')
            }
        };
    } catch (error) {
        return { success: false, error: error.message };
    }
}

// Context menu setup
// Context menu setup with duplicate prevention
async function setupContextMenu() {
    if (contextMenusCreated) {
        console.log("Context menus already created, skipping...");
        return Promise.resolve();
    }
    // Prevent concurrent context menu creation
    if (globalThis.gsContextMenuCreationInProgress) {
        console.log("⚠️ Context menu creation already in progress, skipping...");
        return Promise.resolve();
    }
    globalThis.gsContextMenuCreationInProgress = true;
    // Prevent concurrent context menu creation
    if (globalThis.gsContextMenuCreationInProgress) {
        console.log("⚠️ Context menu creation already in progress, skipping...");
        return Promise.resolve();
    }
    globalThis.gsContextMenuCreationInProgress = true;
    // Prevent concurrent context menu creation
    if (globalThis.gsContextMenuCreationInProgress) {
        console.log("⚠️ Context menu creation already in progress, skipping...");
        return Promise.resolve();
    }
    globalThis.gsContextMenuCreationInProgress = true;
    return new Promise((resolve) => {
        // Always remove all existing context menus first
        chrome.contextMenus.removeAll(() => {
            if (chrome.runtime.lastError) {
                console.warn("Context menu removeAll warning:", chrome.runtime.lastError.message);
                globalThis.gsContextMenuCreationInProgress = false;
                resolve();
                globalThis.gsContextMenuCreationInProgress = false;
                resolve();
                globalThis.gsContextMenuCreationInProgress = false;
                resolve();
            }
            
            const menuItems = [
                { id: "suspend-tab", title: "💤 Suspend this tab", contexts: ["page"] },
                { id: "suspend-other", title: "😴 Suspend other tabs", contexts: ["page"] },
                { id: "unsuspend-all", title: "🔄 Unsuspend all tabs", contexts: ["page"] }
            ];
            
            let itemsCreated = 0;
            const totalItems = menuItems.length;
            
            // Add small delay to ensure removeAll completes
            setTimeout(() => {
                menuItems.forEach((item) => {
                    chrome.contextMenus.create(item, () => {
                        if (chrome.runtime.lastError) {
                            console.warn(`Context menu creation error for ${item.id}:`, chrome.runtime.lastError.message);
                            // If creation fails, still count it to avoid hanging
                            itemsCreated++;
                            if (itemsCreated === totalItems) {
                                globalThis.gsContextMenuCreationInProgress = false;
                                contextMenusCreated = true;
                                resolve();
                            }
                            return;
                            // If creation fails, still count it to avoid hanging
                            itemsCreated++;
                            if (itemsCreated === totalItems) {
                                globalThis.gsContextMenuCreationInProgress = false;
                                contextMenusCreated = true;
                            globalThis.gsContextMenuCreationInProgress = false;
                                resolve();
                            }
                            return;
                            // If creation fails, still count it to avoid hanging
                            itemsCreated++;
                            if (itemsCreated === totalItems) {
                                globalThis.gsContextMenuCreationInProgress = false;
                                contextMenusCreated = true;
                            globalThis.gsContextMenuCreationInProgress = false;
                            globalThis.gsContextMenuCreationInProgress = false;
                                resolve();
                            }
                            return;
                        } else {
                            console.log(`✅ Created context menu: ${item.id}`);
                        }
                        
                        itemsCreated++;
                        if (itemsCreated === totalItems) {
                            contextMenusCreated = true;
                            globalThis.gsContextMenuCreationInProgress = false;
                            globalThis.gsContextMenuCreationInProgress = false;
                            globalThis.gsContextMenuCreationInProgress = false;
                            console.log("✅ All context menus created successfully");
                            resolve();
                        }
                    });
                });
            }, 100); // 100ms delay
            
            // Safety timeout to prevent hanging
            setTimeout(() => {
                if (globalThis.gsContextMenuCreationInProgress) {
                    console.warn("⚠️ Context menu creation timeout, forcing completion");
                    globalThis.gsContextMenuCreationInProgress = false;
                    contextMenusCreated = true;
                    resolve();
                }
            }, 5000); // 5 second timeout
            
            // Safety timeout to prevent hanging
            setTimeout(() => {
                if (globalThis.gsContextMenuCreationInProgress) {
                    console.warn("⚠️ Context menu creation timeout, forcing completion");
                    globalThis.gsContextMenuCreationInProgress = false;
                    contextMenusCreated = true;
                            globalThis.gsContextMenuCreationInProgress = false;
                    resolve();
                }
            }, 5000); // 5 second timeout
            
            // Safety timeout to prevent hanging
            setTimeout(() => {
                if (globalThis.gsContextMenuCreationInProgress) {
                    console.warn("⚠️ Context menu creation timeout, forcing completion");
                    globalThis.gsContextMenuCreationInProgress = false;
                    contextMenusCreated = true;
                            globalThis.gsContextMenuCreationInProgress = false;
                            globalThis.gsContextMenuCreationInProgress = false;
                    resolve();
                }
            }, 5000); // 5 second timeout
        });
    });
}

// Tab protection
chrome.tabs.onRemoved.addListener(async (tabId, removeInfo) => {
    try {
        const settings = await chrome.storage.local.get(['tabProtection']);
        if (settings.tabProtection) {
            if (originalTabs.has(tabId)) {
                const tabInfo = originalTabs.get(tabId);
                const protectedTabs = await chrome.storage.local.get(['protectedTabs']);
                let tabs = protectedTabs.protectedTabs || [];
                
                if (!tabs.find(t => t.id === tabId)) {
                    tabs.push({
                        id: tabId,
                        url: tabInfo.url,
                        title: tabInfo.title,
                        sessionId: tabInfo.sessionId,
                        timestamp: Date.now(),
                        protected: true
                    });
                    
                    await chrome.storage.local.set({ protectedTabs: tabs });
                    console.log(`🛡️ Protected tab ${tabId} from removal`);
                }
            }
        }
    } catch (error) {
        console.error('Tab protection error:', error);
    }
});

chrome.tabs.onUpdated.addListener(async (tabId, changeInfo, tab) => {
    if (changeInfo.status === 'complete' && canManageTab(tab)) {
        originalTabs.set(tabId, {
            url: tab.url,
            title: tab.title,
            sessionId: currentSessionId
        });
        
        await applySessionIdToAllTabs();
        await storeCurrentTabsForProtection();
    }
});

// Event listeners
// Cleanup context menus on startup
if (typeof chrome !== "undefined" && chrome.contextMenus) {
    chrome.contextMenus.removeAll(() => {
        contextMenusCreated = false;
        console.log("🧹 Cleaned up existing context menus");
    });
}
chrome.runtime.onInstalled.addListener((details) => {
    console.log('🔧 Extension installed:', details.reason);
    initializeServiceWorker();
});

chrome.runtime.onStartup.addListener(() => {
    console.log('🚀 Extension startup');
    initializeServiceWorker();
});

chrome.runtime.onMessage.addListener(handleMessage);

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

initializeServiceWorker();

// Enhanced Tab Protection Integration
console.log('🛡️ Integrating Enhanced Tab Protection...');

// Track suspended tabs for protection
chrome.tabs.onUpdated.addListener(async (tabId, changeInfo, tab) => {
    if (changeInfo.status === 'complete' && tab.url && tab.url.includes('suspended.html')) {
        // This is a suspended tab - protect it
        console.log('🛡️ Protecting suspended tab:', tabId, tab.title);
        
        const tabInfo = {
            id: tabId,
            title: tab.title,
            url: tab.url,
            originalUrl: extractOriginalUrlFromSuspended(tab.url),
            sessionId: extractSessionIdFromSuspended(tab.url),
            favIconUrl: tab.favIconUrl,
            pinned: tab.pinned,
            windowId: tab.windowId,
            index: tab.index,
            timestamp: Date.now(),
            protected: true
        };
        
        // Store in protection system
        const result = await chrome.storage.local.get(['protectedTabs']);
        const protectedTabs = result.protectedTabs || {};
        protectedTabs[tabId] = tabInfo;
        
        await chrome.storage.local.set({ 
            protectedTabs: protectedTabs,
            lastProtectionUpdate: Date.now()
        });
        
        console.log('✅ Tab protected:', tabId);
    }
});

// Helper functions for URL extraction
function extractOriginalUrlFromSuspended(suspendedUrl) {
    try {
        const urlParams = new URLSearchParams(suspendedUrl.split('?')[1] || '');
        return urlParams.get('uri') || urlParams.get('url') || suspendedUrl;
    } catch (error) {
        return suspendedUrl;
    }
}

function extractSessionIdFromSuspended(suspendedUrl) {
    try {
        const urlParams = new URLSearchParams(suspendedUrl.split('?')[1] || '');
        return urlParams.get('sessionId') || 'unknown';
    } catch (error) {
        return 'unknown';
    }
}

// Auto-restore on extension startup
chrome.runtime.onStartup.addListener(async () => {
    console.log('🔄 Extension startup - checking for tabs to restore...');
    
    // Small delay to let extension fully initialize
    setTimeout(async () => {
        const settings = await chrome.storage.local.get(['autoRestore']);
        if (settings.autoRestore !== false) {
            console.log('🔄 Auto-restore enabled, restoring protected tabs...');
            
            if (window.TabProtection && window.TabProtection.restoreAllProtectedTabs) {
                window.TabProtection.restoreAllProtectedTabs();
            } else {
                // Fallback restoration
                const result = await chrome.storage.local.get(['protectedTabs']);
                const protectedTabs = result.protectedTabs || {};
                const tabsToRestore = Object.values(protectedTabs);
                
                if (tabsToRestore.length > 0) {
                    console.log('🔄 Fallback restore:', tabsToRestore.length, 'tabs');
                    
                    tabsToRestore.forEach((tabInfo, index) => {
                        setTimeout(() => {
                            chrome.tabs.create({
                                url: tabInfo.url, // Keep as suspended
                                active: false,
                                pinned: tabInfo.pinned || false
                            });
                        }, index * 100);
                    });
                }
            }
        }
    }, 3000);
});

console.log('✅ Enhanced Tab Protection integration complete');
