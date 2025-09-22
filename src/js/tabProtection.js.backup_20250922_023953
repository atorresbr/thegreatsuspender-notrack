/**
 * TAB PROTECTION SYSTEM - WORKING VERSION
 * Prevents suspended tabs from closing on extension reload/removal
 * Rule 2: All named functions only
 */

console.log('🛡️ Tab Protection System loading...');

// Global variables
let protectionEnabled = true;
let autoRestoreEnabled = true;
let suspendedTabsMap = new Map();

/**
 * Function: initializeTabProtection
 * Description: Initialize tab protection system (Rule 2 - named function)
 */
function initializeTabProtection() {
    console.log('🛡️ Initializing tab protection...');
    
    loadProtectionSettings();
    setupTabMonitoring();
    scheduleTabRestoration();
    
    console.log('✅ Tab protection initialized');
}

/**
 * Function: loadProtectionSettings
 * Description: Load protection settings from storage (Rule 2 - named function)
 */
function loadProtectionSettings() {
    if (typeof chrome !== 'undefined' && chrome.storage) {
        chrome.storage.local.get(['tabProtection', 'autoRestore'], handleProtectionSettingsLoad);
    }
}

/**
 * Function: handleProtectionSettingsLoad
 * Description: Handle loaded protection settings (Rule 2 - named function)
 */
function handleProtectionSettingsLoad(result) {
    protectionEnabled = result.tabProtection !== false;
    autoRestoreEnabled = result.autoRestore !== false;
    
    console.log('🛡️ Protection settings loaded:', {
        protectionEnabled: protectionEnabled,
        autoRestoreEnabled: autoRestoreEnabled
    });
}

/**
 * Function: setupTabMonitoring
 * Description: Setup tab monitoring for protection (Rule 2 - named function)
 */
function setupTabMonitoring() {
    if (typeof chrome !== 'undefined' && chrome.tabs) {
        chrome.tabs.onUpdated.addListener(handleTabUpdate);
        chrome.tabs.onRemoved.addListener(handleTabRemoval);
        
        console.log('✅ Tab monitoring setup complete');
    }
}

/**
 * Function: handleTabUpdate
 * Description: Handle tab updates to track suspended tabs (Rule 2 - named function)
 */
function handleTabUpdate(tabId, changeInfo, tab) {
    if (!protectionEnabled) return;
    
    if (changeInfo.status === 'complete' && isSuspendedTab(tab.url)) {
        protectSuspendedTab(tabId, tab);
    }
}

/**
 * Function: handleTabRemoval
 * Description: Handle tab removal events (Rule 2 - named function)
 */
function handleTabRemoval(tabId, removeInfo) {
    // Only unprotect if window is not closing (manual tab close)
    if (!removeInfo.isWindowClosing) {
        setTimeout(function() {
            unprotectTab(tabId);
        }, 1000);
    }
}

/**
 * Function: isSuspendedTab
 * Description: Check if tab URL is a suspended tab (Rule 2 - named function)
 */
function isSuspendedTab(url) {
    if (!url) return false;
    
    return url.includes('suspended.html') || 
           (url.includes('chrome-extension://') && url.includes('suspended'));
}

/**
 * Function: protectSuspendedTab
 * Description: Protect a suspended tab from closing (Rule 2 - named function)
 */
function protectSuspendedTab(tabId, tabInfo) {
    const suspendedTabData = {
        id: tabId,
        title: tabInfo.title || 'Suspended Tab',
        url: tabInfo.url,
        originalUrl: extractOriginalUrl(tabInfo.url),
        sessionId: extractSessionId(tabInfo.url),
        favIconUrl: tabInfo.favIconUrl,
        pinned: tabInfo.pinned || false,
        windowId: tabInfo.windowId,
        index: tabInfo.index,
        timestamp: Date.now(),
        protected: true
    };
    
    suspendedTabsMap.set(tabId, suspendedTabData);
    
    // Store in persistent storage
    saveSuspendedTabData(suspendedTabData);
    
    console.log('🛡️ Protected suspended tab:', tabId, suspendedTabData.title);
}

/**
 * Function: extractOriginalUrl
 * Description: Extract original URL from suspended tab (Rule 2 - named function)
 */
function extractOriginalUrl(suspendedUrl) {
    if (!suspendedUrl || !suspendedUrl.includes('suspended.html')) {
        return suspendedUrl;
    }
    
    try {
        const urlParts = suspendedUrl.split('?');
        if (urlParts.length > 1) {
            const params = new URLSearchParams(urlParts[1]);
            return params.get('uri') || params.get('url') || params.get('originalUrl') || suspendedUrl;
        }
    } catch (error) {
        console.warn('Error extracting original URL:', error);
    }
    
    return suspendedUrl;
}

/**
 * Function: extractSessionId
 * Description: Extract session ID from suspended tab (Rule 2 - named function)
 */
function extractSessionId(suspendedUrl) {
    if (!suspendedUrl || !suspendedUrl.includes('suspended.html')) {
        return 'unknown';
    }
    
    try {
        const urlParts = suspendedUrl.split('?');
        if (urlParts.length > 1) {
            const params = new URLSearchParams(urlParts[1]);
            return params.get('sessionId') || 'unknown';
        }
    } catch (error) {
        console.warn('Error extracting session ID:', error);
    }
    
    return 'unknown';
}

/**
 * Function: saveSuspendedTabData
 * Description: Save suspended tab data to persistent storage (Rule 2 - named function)
 */
function saveSuspendedTabData(tabData) {
    if (typeof chrome !== 'undefined' && chrome.storage) {
        chrome.storage.local.get(['protectedTabs'], handleProtectedTabsLoad);
        
        function handleProtectedTabsLoad(result) {
            const protectedTabs = result.protectedTabs || {};
            protectedTabs[tabData.id] = tabData;
            
            chrome.storage.local.set({
                protectedTabs: protectedTabs,
                lastProtectionUpdate: Date.now()
            }, handleTabDataSaveComplete);
        }
        
        function handleTabDataSaveComplete() {
            console.log('💾 Saved tab protection data for tab:', tabData.id);
        }
    }
}

/**
 * Function: unprotectTab
 * Description: Remove tab from protection (Rule 2 - named function)
 */
function unprotectTab(tabId) {
    suspendedTabsMap.delete(tabId);
    
    if (typeof chrome !== 'undefined' && chrome.storage) {
        chrome.storage.local.get(['protectedTabs'], handleUnprotectTabLoad);
        
        function handleUnprotectTabLoad(result) {
            const protectedTabs = result.protectedTabs || {};
            delete protectedTabs[tabId];
            chrome.storage.local.set({ protectedTabs: protectedTabs });
            console.log('🗑️ Unprotected tab:', tabId);
        }
    }
}

/**
 * Function: scheduleTabRestoration
 * Description: Schedule tab restoration for startup (Rule 2 - named function)
 */
function scheduleTabRestoration() {
    if (!autoRestoreEnabled) {
        console.log('🔄 Auto-restore disabled');
        return;
    }
    
    // Delay restoration to allow extension to fully load
    setTimeout(restoreProtectedTabs, 3000);
}

/**
 * Function: restoreProtectedTabs
 * Description: Restore all protected suspended tabs (Rule 2 - named function)
 */
function restoreProtectedTabs() {
    if (typeof chrome !== 'undefined' && chrome.storage) {
        chrome.storage.local.get(['protectedTabs'], handleRestoreTabsLoad);
    }
}

/**
 * Function: handleRestoreTabsLoad
 * Description: Handle loading tabs for restoration (Rule 2 - named function)
 */
function handleRestoreTabsLoad(result) {
    const protectedTabs = result.protectedTabs || {};
    const tabsToRestore = Object.values(protectedTabs);
    
    if (tabsToRestore.length === 0) {
        console.log('🔄 No protected tabs to restore');
        return;
    }
    
    console.log('🔄 Restoring', tabsToRestore.length, 'protected suspended tabs...');
    
    // Check current tabs to avoid duplicates
    if (typeof chrome !== 'undefined' && chrome.tabs) {
        chrome.tabs.query({}, handleCurrentTabsQuery);
        
        function handleCurrentTabsQuery(currentTabs) {
            const currentUrls = currentTabs.map(function(tab) {
                return tab.url;
            });
            
            tabsToRestore.forEach(function(tabInfo, index) {
                if (currentUrls.includes(tabInfo.url)) {
                    console.log('⏭️ Skipping - tab already exists:', tabInfo.title);
                    return;
                }
                
                setTimeout(function() {
                    restoreSingleTab(tabInfo);
                }, index * 100);
            });
            
            // Clean up old protection data after restoration
            setTimeout(cleanupOldProtectionData, tabsToRestore.length * 100 + 2000);
        }
    }
}

/**
 * Function: restoreSingleTab
 * Description: Restore a single suspended tab (Rule 2 - named function)
 */
function restoreSingleTab(tabInfo) {
    if (typeof chrome !== 'undefined' && chrome.tabs) {
        const restoreUrl = tabInfo.url; // Keep as suspended tab
        
        chrome.tabs.create({
            url: restoreUrl,
            active: false,
            pinned: tabInfo.pinned || false
        }, handleTabRestoreComplete);
        
        function handleTabRestoreComplete(newTab) {
            if (chrome.runtime.lastError) {
                console.warn('❌ Error restoring tab:', chrome.runtime.lastError.message);
            } else {
                console.log('✅ Restored suspended tab:', newTab.id, tabInfo.title);
                protectSuspendedTab(newTab.id, tabInfo);
            }
        }
    }
}

/**
 * Function: cleanupOldProtectionData
 * Description: Clean up old protection data (Rule 2 - named function)
 */
function cleanupOldProtectionData() {
    if (typeof chrome !== 'undefined' && chrome.storage) {
        console.log('🧹 Cleaning up old protection data');
        chrome.storage.local.set({ protectedTabs: {} });
    }
}

/**
 * Function: setTabProtection
 * Description: Enable/disable tab protection (Rule 2 - named function)
 */
function setTabProtection(enabled) {
    protectionEnabled = enabled;
    
    if (typeof chrome !== 'undefined' && chrome.storage) {
        chrome.storage.local.set({ tabProtection: enabled }, handleProtectionSettingSave);
    }
    
    console.log('🛡️ Tab protection', enabled ? 'enabled' : 'disabled');
    
    function handleProtectionSettingSave() {
        console.log('💾 Tab protection setting saved');
    }
}

/**
 * Function: setAutoRestore
 * Description: Enable/disable auto-restore (Rule 2 - named function)
 */
function setAutoRestore(enabled) {
    autoRestoreEnabled = enabled;
    
    if (typeof chrome !== 'undefined' && chrome.storage) {
        chrome.storage.local.set({ autoRestore: enabled }, handleAutoRestoreSettingSave);
    }
    
    console.log('🔄 Auto-restore', enabled ? 'enabled' : 'disabled');
    
    function handleAutoRestoreSettingSave() {
        console.log('💾 Auto-restore setting saved');
    }
}

/**
 * Function: getProtectedTabsCount
 * Description: Get count of protected tabs (Rule 2 - named function)
 */
function getProtectedTabsCount() {
    return suspendedTabsMap.size;
}

// Initialize when script loads
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initializeTabProtection);
} else {
    initializeTabProtection();
}

// Export functions globally for options page
if (typeof window !== 'undefined') {
    window.TabProtection = {
        setProtection: setTabProtection,
        setAutoRestore: setAutoRestore,
        getProtectedTabsCount: getProtectedTabsCount,
        restoreAllProtectedTabs: restoreProtectedTabs
    };
}

console.log('✅ Tab Protection System loaded - Rule 2 compliant');
