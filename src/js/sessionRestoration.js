/**
 * SESSION RESTORATION SYSTEM - WORKING VERSION
 * Restore suspended tabs by Session ID
 * Rule 2: All named functions only
 */

console.log('🔄 Session Restoration System loading...');

/**
 * Function: initializeSessionRestoration
 * Description: Initialize session restoration system (Rule 2 - named function)
 */
function initializeSessionRestoration() {
    console.log('🔄 Session restoration system initialized');
    setupSessionRestoreHandlers();
}

/**
 * Function: setupSessionRestoreHandlers
 * Description: Setup event handlers for session restoration (Rule 2 - named function)
 */
function setupSessionRestoreHandlers() {
    const restoreButton = document.getElementById('restoreBySessionId');
    const copyButton = document.getElementById('copySessionId');
    
    if (restoreButton) {
        restoreButton.addEventListener('click', handleRestoreBySessionIdClick);
        console.log('✅ Restore button handler setup');
    }
    
    if (copyButton) {
        copyButton.addEventListener('click', handleCopySessionIdClick);
        console.log('✅ Copy session ID button handler setup');
    }
    
    loadCurrentSessionId();
}

/**
 * Function: handleRestoreBySessionIdClick
 * Description: Handle restore by session ID button click (Rule 2 - named function)
 */
function handleRestoreBySessionIdClick() {
    const sessionInput = document.getElementById('sessionIdInput');
    if (!sessionInput) {
        console.error('❌ Session ID input not found');
        return;
    }
    
    const sessionId = sessionInput.value.trim();
    if (!sessionId) {
        showStatusMessage('❌ Please enter a Session ID', 'error');
        return;
    }
    
    console.log('🔄 Restoring session:', sessionId);
    restoreTabsBySessionId(sessionId);
}

/**
 * Function: handleCopySessionIdClick
 * Description: Handle copy session ID button click (Rule 2 - named function)
 */
function handleCopySessionIdClick() {
    const sessionIdElement = document.getElementById('currentSessionId');
    if (!sessionIdElement) {
        console.error('❌ Current session ID element not found');
        return;
    }
    
    const sessionId = sessionIdElement.textContent;
    
    if (navigator.clipboard) {
        navigator.clipboard.writeText(sessionId).then(handleCopySuccess, handleCopyError);
    } else {
        copyToClipboardFallback(sessionId);
    }
}

/**
 * Function: handleCopySuccess
 * Description: Handle successful copy to clipboard (Rule 2 - named function)
 */
function handleCopySuccess() {
    showStatusMessage('📋 Session ID copied to clipboard!', 'success');
}

/**
 * Function: handleCopyError
 * Description: Handle copy to clipboard error (Rule 2 - named function)
 */
function handleCopyError(error) {
    console.error('❌ Failed to copy session ID:', error);
    showStatusMessage('❌ Failed to copy session ID', 'error');
}

/**
 * Function: copyToClipboardFallback
 * Description: Fallback copy method for older browsers (Rule 2 - named function)
 */
function copyToClipboardFallback(text) {
    const textArea = document.createElement('textarea');
    textArea.value = text;
    document.body.appendChild(textArea);
    textArea.select();
    
    try {
        document.execCommand('copy');
        showStatusMessage('📋 Session ID copied to clipboard!', 'success');
    } catch (error) {
        console.error('❌ Fallback copy failed:', error);
        showStatusMessage('❌ Failed to copy session ID', 'error');
    }
    
    document.body.removeChild(textArea);
}

/**
 * Function: loadCurrentSessionId
 * Description: Load and display current session ID (Rule 2 - named function)
 */
function loadCurrentSessionId() {
    if (typeof chrome !== 'undefined' && chrome.tabs) {
        chrome.tabs.query({ currentWindow: true }, handleCurrentTabsQuery);
    }
}

/**
 * Function: handleCurrentTabsQuery
 * Description: Handle current tabs query for session ID (Rule 2 - named function)
 */
function handleCurrentTabsQuery(tabs) {
    let currentSessionId = 'No suspended tabs found';
    
    for (let i = 0; i < tabs.length; i++) {
        const tab = tabs[i];
        if (tab.url && tab.url.includes('suspended.html')) {
            const sessionId = extractSessionIdFromUrl(tab.url);
            if (sessionId !== 'unknown') {
                currentSessionId = sessionId;
                break;
            }
        }
    }
    
    const sessionIdElement = document.getElementById('currentSessionId');
    if (sessionIdElement) {
        sessionIdElement.textContent = currentSessionId;
        console.log('📋 Current session ID loaded:', currentSessionId);
    }
}

/**
 * Function: extractSessionIdFromUrl
 * Description: Extract session ID from suspended tab URL (Rule 2 - named function)
 */
function extractSessionIdFromUrl(url) {
    if (!url || !url.includes('suspended.html')) {
        return 'unknown';
    }
    
    try {
        const urlParts = url.split('?');
        if (urlParts.length > 1) {
            const params = new URLSearchParams(urlParts[1]);
            return params.get('sessionId') || 'unknown';
        }
    } catch (error) {
        console.warn('⚠️ Error extracting session ID:', error);
    }
    
    return 'unknown';
}

/**
 * Function: restoreTabsBySessionId
 * Description: Restore all tabs with matching session ID (Rule 2 - named function)
 */
function restoreTabsBySessionId(sessionId) {
    showStatusMessage('🔄 Searching for tabs with session ID: ' + sessionId, 'info');
    
    if (typeof chrome !== 'undefined' && chrome.storage) {
        chrome.storage.local.get(['protectedTabs'], handleProtectedTabsForRestore);
        
        function handleProtectedTabsForRestore(result) {
            const protectedTabs = result.protectedTabs || {};
            const tabsToRestore = [];
            
            for (const tabId in protectedTabs) {
                const tabInfo = protectedTabs[tabId];
                if (tabInfo.sessionId === sessionId) {
                    tabsToRestore.push(tabInfo);
                }
            }
            
            if (tabsToRestore.length === 0) {
                showStatusMessage('❌ No tabs found with session ID: ' + sessionId, 'error');
                return;
            }
            
            console.log('🔄 Found', tabsToRestore.length, 'tabs for session:', sessionId);
            showStatusMessage('✅ Found ' + tabsToRestore.length + ' tabs. Restoring...', 'success');
            
            restoreTabsArray(tabsToRestore);
        }
    }
}

/**
 * Function: restoreTabsArray
 * Description: Restore an array of tabs (Rule 2 - named function)
 */
function restoreTabsArray(tabsToRestore) {
    let restoredCount = 0;
    
    tabsToRestore.forEach(function(tabInfo, index) {
        setTimeout(function() {
            restoreTabFromInfo(tabInfo, function(success) {
                if (success) {
                    restoredCount++;
                }
                
                if (index === tabsToRestore.length - 1) {
                    setTimeout(function() {
                        showStatusMessage('✅ Restored ' + restoredCount + ' of ' + tabsToRestore.length + ' tabs', 'success');
                    }, 500);
                }
            });
        }, index * 200);
    });
}

/**
 * Function: restoreTabFromInfo
 * Description: Restore a single tab from tab info (Rule 2 - named function)
 */
function restoreTabFromInfo(tabInfo, callback) {
    if (typeof chrome !== 'undefined' && chrome.tabs) {
        const restoreUrl = tabInfo.url;
        
        chrome.tabs.create({
            url: restoreUrl,
            active: false,
            pinned: tabInfo.pinned || false
        }, handleTabCreationComplete);
        
        function handleTabCreationComplete(newTab) {
            if (chrome.runtime.lastError) {
                console.warn('❌ Error restoring tab:', chrome.runtime.lastError.message);
                if (callback) callback(false);
            } else {
                console.log('✅ Restored tab:', newTab.id, tabInfo.title);
                if (callback) callback(true);
            }
        }
    } else {
        if (callback) callback(false);
    }
}

/**
 * Function: showStatusMessage
 * Description: Show status message to user (Rule 2 - named function)
 */
function showStatusMessage(message, type) {
    const statusBar = document.getElementById('status');
    if (!statusBar) {
        console.log('Status:', message);
        return;
    }
    
    statusBar.textContent = message;
    statusBar.className = 'status-bar ' + type;
    statusBar.style.display = 'block';
    
    setTimeout(function() {
        statusBar.style.display = 'none';
    }, 5000);
}

// Export globally for options page
if (typeof window !== 'undefined') {
    window.SessionRestoration = {
        restoreBySessionId: restoreTabsBySessionId,
        loadCurrentSessionId: loadCurrentSessionId
    };
}

// Initialize when script loads
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initializeSessionRestoration);
} else {
    initializeSessionRestoration();
}

console.log('✅ Session Restoration System loaded - Rule 2 compliant');
