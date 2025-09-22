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

/**
 * Theme Synchronization System
 * Applies themes from options.js selection
 */

// Same theme gradients as options
const pageThemeGradients = {
    purple: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
    ocean: 'linear-gradient(135deg, #667db6 0%, #0082c8 100%)', 
    sunset: 'linear-gradient(135deg, #ff9a9e 0%, #b31280 100%)',
    forest: 'linear-gradient(135deg, #134e5e 0%, #71b280 100%)',
    fire: 'linear-gradient(135deg, rgb(71 8 22) 0%, rgb(201 35 6) 100%)',
    lavender: 'linear-gradient(135deg, #a8edea 0%, #fed6e3 100%)',
    cosmic: 'linear-gradient(135deg, rgb(167 102 234) 0%, rgb(17 2 33) 100%)',
    emerald: 'linear-gradient(135deg, #11998e 0%, #38ef7d 100%)',
    rose: 'linear-gradient(135deg, #f093fb 0%, #f5576c 100%)',
    sky: 'linear-gradient(135deg, #74b9ff 0%, #0084e3 100%)',
    peach: 'linear-gradient(135deg, #ffecd2 0%, #fcb69f 100%)',
    mint: 'linear-gradient(135deg, #a8e6cf 0%, #7fcdcd 100%)',
    golden: 'linear-gradient(135deg, #ffd89b 0%, #19547b 100%)',
    berry: 'linear-gradient(135deg, #8360c3 0%, #2ebf91 100%)',
    coral: 'linear-gradient(135deg, #ff9a56 0%, #ff6b95 100%)',
    aurora: 'linear-gradient(135deg, #00c6ff 0%, #0072ff 100%)',
    dark: 'linear-gradient(135deg, #1a1a2e 0%, #16213e 100%)',
    midnight: 'linear-gradient(135deg, #0f0f23 0%, #2d1b69 100%)'
};

const pageLightThemes = ['sunset', 'lavender', 'peach', 'mint'];

/**
 * Function: applyStoredTheme
 * Description: Apply theme from storage to this page
 */
function applyStoredTheme(themeName) {
    if (!themeName) return;
    
    console.log('🎨 Applying stored theme:', themeName);
    
    try {
        const gradient = pageThemeGradients[themeName] || pageThemeGradients.purple;
        const isLight = pageLightThemes.includes(themeName);
        const textColor = isLight ? '#333' : '#fff';
        
        // Add transition
        document.body.classList.add('theme-transition');
        
        // Remove existing themes
        document.body.className = document.body.className.replace(/theme-\w+/g, '');
        document.body.classList.remove('light-theme', 'dark-theme');
        
        // Apply new theme
        document.body.classList.add('theme-' + themeName);
        document.body.classList.add(isLight ? 'light-theme' : 'dark-theme');
        
        // Set background
        document.body.style.background = gradient;
        document.body.style.backgroundAttachment = 'fixed';
        
        // Update cards and UI elements
        const cards = document.querySelectorAll('.card, .suspended-card, .popup-card, .info-card');
        cards.forEach(card => {
            card.style.background = 'rgba(255, 255, 255, 0.1)';
            card.style.backdropFilter = 'blur(10px)';
            card.style.color = textColor;
        });
        
        // Update buttons
        const buttons = document.querySelectorAll('.control-btn, button');
        buttons.forEach(btn => {
            if (!btn.style.background || btn.style.background === '') {
                btn.style.background = 'rgba(255, 255, 255, 0.2)';
                btn.style.color = textColor;
            }
        });
        
        setTimeout(() => {
            document.body.classList.remove('theme-transition');
        }, 500);
        
        console.log('✅ Theme applied to page:', themeName);
        
    } catch (e) {
        console.error('Apply stored theme error:', e);
    }
}

/**
 * Function: loadThemeFromStorage
 * Description: Load theme from chrome.storage and apply it
 */
function loadThemeFromStorage() {
    try {
        if (typeof chrome !== 'undefined' && chrome.storage) {
            // Try selectedTheme first (set by options), then theme (sync)
            chrome.storage.local.get(['selectedTheme'], function(result) {
                if (result.selectedTheme) {
                    applyStoredTheme(result.selectedTheme);
                } else {
                    chrome.storage.sync.get(['theme'], function(syncResult) {
                        const theme = syncResult.theme || 'purple';
                        applyStoredTheme(theme);
                    });
                }
            });
        } else {
            applyStoredTheme('purple');
        }
    } catch (e) {
        console.error('Load theme from storage error:', e);
        applyStoredTheme('purple');
    }
}

/**
 * Function: handleThemeStorageChange
 * Description: Listen for theme changes from options page
 */
function handleThemeStorageChange(changes, areaName) {
    try {
        if (areaName === 'local' && changes.selectedTheme) {
            const newTheme = changes.selectedTheme.newValue;
            if (newTheme) {
                console.log('🔄 Theme changed, applying:', newTheme);
                applyStoredTheme(newTheme);
            }
        } else if (areaName === 'sync' && changes.theme) {
            const newTheme = changes.theme.newValue;
            if (newTheme) {
                console.log('🔄 Sync theme changed, applying:', newTheme);
                applyStoredTheme(newTheme);
            }
        }
    } catch (e) {
        console.error('Handle theme storage change error:', e);
    }
}

// Initialize theme system
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', loadThemeFromStorage);
} else {
    loadThemeFromStorage();
}

// Listen for theme changes
if (typeof chrome !== 'undefined' && chrome.storage && chrome.storage.onChanged) {
    try {
        chrome.storage.onChanged.addListener(handleThemeStorageChange);
    } catch (e) {
        console.error('Storage listener setup error:', e);
    }
}

console.log('✅ Theme synchronization system loaded');
