/**
 * FIXED Popup - No element dependency errors
 */

console.log('📱 Popup loading...');

let currentTab = null;

// Safe element access
function safeGetElement(id) {
    try {
        return document.getElementById(id);
    } catch (error) {
        console.warn(`Element ${id} not found:`, error);
        return null;
    }
}

// Safe text content setting
function safeSetText(elementId, text) {
    const el = safeGetElement(elementId);
    if (el) {
        el.textContent = text;
        return true;
    }
    return false;
}

// Initialize popup
document.addEventListener('DOMContentLoaded', async function() {
    console.log('🚀 Popup initializing...');
    
    try {
        // Load current tab
        await loadCurrentTab();
        
        // Load stats
        await loadStats();
        
        // Setup buttons
        setupButtons();
        
        console.log('✅ Popup initialized');
    } catch (error) {
        console.error('Popup initialization error:', error);
    }
});

// Load current tab info
async function loadCurrentTab() {
    try {
        const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
        if (tab) {
            currentTab = tab;
            
            // Update tab title
            const title = tab.title.length > 30 ? tab.title.substring(0, 27) + '...' : tab.title;
            safeSetText('tabTitle', title);
            
            // Update suspend button
            const suspendBtn = safeGetElement('suspendTab');
            if (suspendBtn) {
                if (tab.url.includes('suspended.html')) {
                    suspendBtn.textContent = '🔄 Unsuspend This Tab';
                } else {
                    suspendBtn.textContent = '💤 Suspend This Tab';
                }
            }
        }
    } catch (error) {
        console.error('Error loading current tab:', error);
        safeSetText('tabTitle', 'Error loading tab');
    }
}

// Load statistics
async function loadStats() {
    try {
        const response = await chrome.runtime.sendMessage({ action: 'getSuspendedCount' });
        
        if (response && response.success) {
            safeSetText('suspendedCount', response.count.toString());
            
            const memory = response.estimatedMemory;
            if (memory > 1024) {
                safeSetText('memorySaved', (memory / 1024).toFixed(1) + 'GB');
            } else {
                safeSetText('memorySaved', memory + 'MB');
            }
        } else {
            safeSetText('suspendedCount', '0');
            safeSetText('memorySaved', '0MB');
        }
    } catch (error) {
        console.error('Error loading stats:', error);
        safeSetText('suspendedCount', '0');
        safeSetText('memorySaved', '0MB');
    }
}

// Setup button listeners
function setupButtons() {
    // Suspend/Unsuspend tab
    const suspendBtn = safeGetElement('suspendTab');
    if (suspendBtn) {
        suspendBtn.addEventListener('click', async () => {
            if (!currentTab) return;
            
            try {
                let response;
                if (currentTab.url.includes('suspended.html')) {
                    response = await chrome.runtime.sendMessage({ 
                        action: 'unsuspendTab', 
                        tabId: currentTab.id 
                    });
                } else {
                    response = await chrome.runtime.sendMessage({ 
                        action: 'suspendTab', 
                        tabId: currentTab.id 
                    });
                }
                
                if (response && response.success) {
                    setTimeout(() => window.close(), 500);
                }
            } catch (error) {
                console.error('Suspend/unsuspend error:', error);
            }
        });
    }
    
    // Suspend other tabs
    const suspendOtherBtn = safeGetElement('suspendOther');
    if (suspendOtherBtn) {
        suspendOtherBtn.addEventListener('click', async () => {
            try {
                const response = await chrome.runtime.sendMessage({ 
                    action: 'suspendOtherTabs',
                    activeTabId: currentTab?.id 
                });
                
                if (response && response.success) {
                    setTimeout(() => window.close(), 1000);
                }
            } catch (error) {
                console.error('Suspend others error:', error);
            }
        });
    }
    
    // Unsuspend all tabs
    const unsuspendAllBtn = safeGetElement('unsuspendAll');
    if (unsuspendAllBtn) {
        unsuspendAllBtn.addEventListener('click', async () => {
            try {
                const response = await chrome.runtime.sendMessage({ action: 'unsuspendAllTabs' });
                
                if (response && response.success) {
                    setTimeout(() => window.close(), 1000);
                }
            } catch (error) {
                console.error('Unsuspend all error:', error);
            }
        });
    }
    
    // Open options
    const openOptionsBtn = safeGetElement('openOptions');
    if (openOptionsBtn) {
        openOptionsBtn.addEventListener('click', () => {
            chrome.runtime.openOptionsPage();
            window.close();
        });
    }
}

console.log('📱 Popup script loaded');
