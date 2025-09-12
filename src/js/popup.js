/**
 * COMPLETE POPUP JAVASCRIPT - ALL FUNCTIONALITY
 * Beautiful interface with real-time stats and smooth animations
 */

console.log('📱 Popup loaded with complete functionality');

let currentTab = null;

// Initialize popup
document.addEventListener('DOMContentLoaded', async function() {
    console.log('🚀 Initializing popup interface...');
    
    // Load current tab info
    await loadCurrentTabInfo();
    
    // Load statistics
    await loadStats();
    
    // Setup all button listeners
    setupButtonListeners();
    
    // Apply theme from storage
    await applyStoredTheme();
    
    console.log('✅ Popup fully initialized');
});

// Load current tab information
async function loadCurrentTabInfo() {
    try {
        const response = await chrome.runtime.sendMessage({ action: 'getTabInfo' });
        
        if (response && response.success) {
            currentTab = response.tab;
            updateTabDisplay();
            updateSuspendButton();
        } else {
            showError('Failed to load tab information');
        }
    } catch (error) {
        console.error('Error loading tab info:', error);
        showError('Error loading tab information');
    }
}

// Update tab information display
function updateTabDisplay() {
    if (!currentTab) return;
    
    const tabTitleEl = document.getElementById('tabTitle');
    const tabUrlEl = document.getElementById('tabUrl');
    const tabFaviconEl = document.getElementById('tabFavicon');
    
    if (tabTitleEl) {
        const title = currentTab.title.length > 35 ? 
            currentTab.title.substring(0, 35) + '...' : currentTab.title;
        tabTitleEl.textContent = title;
    }
    
    if (tabUrlEl) {
        const url = currentTab.url.length > 45 ? 
            currentTab.url.substring(0, 45) + '...' : currentTab.url;
        tabUrlEl.textContent = url;
    }
    
    if (tabFaviconEl) {
        if (currentTab.favIconUrl) {
            tabFaviconEl.innerHTML = `<img src="${currentTab.favIconUrl}" alt="favicon" style="width: 16px; height: 16px;">`;
        } else {
            tabFaviconEl.textContent = currentTab.suspended ? '😴' : '📄';
        }
    }
}

// Update suspend button based on tab state
function updateSuspendButton() {
    const suspendBtn = document.getElementById('suspendTab');
    if (!suspendBtn || !currentTab) return;
    
    const btnIcon = suspendBtn.querySelector('.btn-icon');
    const btnText = suspendBtn.querySelector('.btn-text');
    
    if (currentTab.suspended) {
        btnIcon.textContent = '🔄';
        btnText.textContent = 'Unsuspend Tab';
        suspendBtn.classList.remove('primary');
        suspendBtn.classList.add('accent');
    } else {
        btnIcon.textContent = '💤';
        btnText.textContent = 'Suspend Tab';
        suspendBtn.classList.remove('accent');
        suspendBtn.classList.add('primary');
    }
}

// Load and display statistics
async function loadStats() {
    try {
        const response = await chrome.runtime.sendMessage({ action: 'getSuspendedCount' });
        
        if (response && response.success) {
            updateStatsDisplay(response.count, response.estimatedMemory);
        } else {
            updateStatsDisplay(0, 0);
        }
    } catch (error) {
        console.error('Error loading stats:', error);
        updateStatsDisplay(0, 0);
    }
}

// Update statistics display
function updateStatsDisplay(suspendedCount, memorySaved) {
    const suspendedCountEl = document.getElementById('suspendedCount');
    const memorySavedEl = document.getElementById('memorySaved');
    
    if (suspendedCountEl) {
        suspendedCountEl.textContent = suspendedCount.toString();
    }
    
    if (memorySavedEl) {
        if (memorySaved > 1024) {
            memorySavedEl.textContent = (memorySaved / 1024).toFixed(1) + 'GB';
        } else {
            memorySavedEl.textContent = memorySaved + 'MB';
        }
    }
}

// Setup all button event listeners
function setupButtonListeners() {
    // Suspend/Unsuspend current tab
    const suspendTabBtn = document.getElementById('suspendTab');
    if (suspendTabBtn) {
        suspendTabBtn.addEventListener('click', async () => {
            if (!currentTab) return;
            
            suspendTabBtn.classList.add('loading');
            
            try {
                const action = currentTab.suspended ? 'unsuspendTab' : 'suspendTab';
                const response = await chrome.runtime.sendMessage({
                    action: action,
                    tabId: currentTab.id
                });
                
                if (response && response.success) {
                    const message = currentTab.suspended ? 
                        '🔄 Tab unsuspended!' : '💤 Tab suspended!';
                    showSuccess(message);
                    
                    // Reload tab info
                    setTimeout(async () => {
                        await loadCurrentTabInfo();
                        await loadStats();
                    }, 500);
                } else {
                    showError(response ? response.error : 'Action failed');
                }
            } catch (error) {
                console.error('Error suspending/unsuspending tab:', error);
                showError('Error processing tab');
            } finally {
                suspendTabBtn.classList.remove('loading');
            }
        });
    }
    
    // Suspend other tabs
    const suspendOtherBtn = document.getElementById('suspendOther');
    if (suspendOtherBtn) {
        suspendOtherBtn.addEventListener('click', async () => {
            suspendOtherBtn.classList.add('loading');
            
            try {
                const response = await chrome.runtime.sendMessage({
                    action: 'suspendOtherTabs',
                    activeTabId: currentTab ? currentTab.id : null
                });
                
                if (response && response.success) {
                    showSuccess(`😴 Suspended ${response.suspended} other tabs!`);
                    
                    // Update stats
                    setTimeout(loadStats, 500);
                } else {
                    showError(response ? response.error : 'Failed to suspend other tabs');
                }
            } catch (error) {
                console.error('Error suspending other tabs:', error);
                showError('Error suspending other tabs');
            } finally {
                suspendOtherBtn.classList.remove('loading');
            }
        });
    }
    
    // Unsuspend all tabs
    const unsuspendAllBtn = document.getElementById('unsuspendAll');
    if (unsuspendAllBtn) {
        unsuspendAllBtn.addEventListener('click', async () => {
            unsuspendAllBtn.classList.add('loading');
            
            try {
                const response = await chrome.runtime.sendMessage({
                    action: 'unsuspendAllTabs'
                });
                
                if (response && response.success) {
                    showSuccess(`🔄 Unsuspended ${response.unsuspended} tabs!`);
                    
                    // Update stats and current tab
                    setTimeout(async () => {
                        await loadCurrentTabInfo();
                        await loadStats();
                    }, 500);
                } else {
                    showError(response ? response.error : 'Failed to unsuspend tabs');
                }
            } catch (error) {
                console.error('Error unsuspending all tabs:', error);
                showError('Error unsuspending all tabs');
            } finally {
                unsuspendAllBtn.classList.remove('loading');
            }
        });
    }
    
    // Open options page
    const openOptionsBtn = document.getElementById('openOptions');
    if (openOptionsBtn) {
        openOptionsBtn.addEventListener('click', () => {
            chrome.runtime.sendMessage({ action: 'openOptions' });
            window.close();
        });
    }
}

// Apply theme from storage
async function applyStoredTheme() {
    try {
        const result = await chrome.storage.local.get(['selectedTheme']);
        const theme = result.selectedTheme || 'purple';
        
        // Apply theme gradient to popup background
        const themeGradients = {
            purple: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
            ocean: 'linear-gradient(135deg, #667db6 0%, #0082c8 100%)',
            sunset: 'linear-gradient(135deg, #ff9a9e 0%, #fecfef 100%)',
            forest: 'linear-gradient(135deg, #134e5e 0%, #71b280 100%)',
            fire: 'linear-gradient(135deg, #ff416c 0%, #ff4b2b 100%)',
            dark: 'linear-gradient(135deg, #1a1a2e 0%, #16213e 100%)'
        };
        
        const gradient = themeGradients[theme] || themeGradients.purple;
        document.body.style.background = gradient;
        
        console.log('🎨 Popup theme applied:', theme);
    } catch (error) {
        console.error('Error applying theme:', error);
    }
}

// Show success message
function showSuccess(message) {
    showMessage(message, 'success');
}

// Show error message
function showError(message) {
    showMessage(message, 'error');
}

// Show message with animation
function showMessage(message, type) {
    const statusEl = document.getElementById('statusMessage');
    if (!statusEl) return;
    
    statusEl.textContent = message;
    statusEl.className = 'status-message show ' + type;
    
    setTimeout(() => {
        statusEl.classList.remove('show');
    }, 3000);
}

// Listen for storage changes to sync theme
chrome.storage.onChanged.addListener((changes, namespace) => {
    if (namespace === 'local' && changes.selectedTheme) {
        applyStoredTheme();
    }
});

console.log('📱 Popup script loaded successfully');
