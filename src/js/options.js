/**
 * COMPLETE OPTIONS PAGE - ALL FUNCTIONALITY WORKING
 * Same smooth transitions as suspended tab background
 */

console.log('🎨 Loading complete options page with all themes and functionality...');

// All 18 beautiful theme gradients - SAME AS SUSPENDED TAB
const themeGradients = {
    purple: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
    ocean: 'linear-gradient(135deg, #667db6 0%, #0082c8 100%)',
    sunset: 'linear-gradient(135deg, #ff9a9e 0%, #fecfef 100%)',
    forest: 'linear-gradient(135deg, #134e5e 0%, #71b280 100%)',
    fire: 'linear-gradient(135deg, #ff416c 0%, #ff4b2b 100%)',
    lavender: 'linear-gradient(135deg, #a8edea 0%, #fed6e3 100%)',
    cosmic: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
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

const lightThemes = ['sunset', 'lavender', 'peach', 'mint'];
let selectedTheme = 'purple';
let currentSessionId = null;

// SMOOTH THEME TRANSITION - EXACT SAME AS SUSPENDED TAB
function applyTheme(themeName) {
    console.log('🎨 Applying theme with smooth transition:', themeName);
    
    selectedTheme = themeName;
    const gradient = themeGradients[themeName];
    
    // Add transition class for smooth animation - SAME AS SUSPENDED TAB
    document.body.classList.add('theme-transition');
    
    // Update CSS variables for smooth transition
    document.documentElement.style.setProperty('--current-gradient', gradient);
    
    // Update body classes with smooth transition
    document.body.classList.remove('light-theme', 'dark-theme');
    document.body.className = document.body.className.replace(/theme-\w+/g, '');
    
    // Apply new theme class
    document.body.classList.add('theme-' + themeName);
    
    if (lightThemes.includes(themeName)) {
        document.body.classList.add('light-theme');
    } else {
        document.body.classList.add('dark-theme');
    }
    
    // Apply background with smooth transition - SAME LOGIC AS SUSPENDED TAB
    document.body.style.background = gradient;
    document.body.style.backgroundAttachment = 'fixed';
    
    // Update theme button selection with animation
    document.querySelectorAll('.theme-btn').forEach(btn => {
        btn.classList.remove('selected');
        if (btn.dataset.theme === themeName) {
            btn.classList.add('selected');
        }
    });
    
    // Save theme
    chrome.storage.local.set({
        selectedTheme: themeName,
        themeGradient: gradient
    });
    
    showStatus(`✨ Theme changed to ${themeName} with smooth transition!`);
    
    // Remove transition class after animation - SAME TIMING AS SUSPENDED TAB
    setTimeout(() => {
        document.body.classList.remove('theme-transition');
    }, 800);
}

// System theme behavior - COMPLETE IMPLEMENTATION
function handleSystemThemeBehavior() {
    chrome.storage.local.get(['systemThemeBehavior'], (result) => {
        const behavior = result.systemThemeBehavior || 'manual';
        
        switch(behavior) {
            case 'follow-system':
                // Follow system dark/light preference with smooth transition
                if (window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches) {
                    applyTheme('dark');
                } else {
                    applyTheme('sunset'); // Light theme
                }
                break;
                
            case 'always-light':
                applyTheme('sunset');
                break;
                
            case 'always-dark':
                applyTheme('dark');
                break;
                
            default:
                // Manual - use selected theme
                chrome.storage.local.get(['selectedTheme'], (result) => {
                    if (result.selectedTheme) {
                        applyTheme(result.selectedTheme);
                    }
                });
                break;
        }
    });
}

// Status message with beautiful animation
function showStatus(message) {
    const status = document.getElementById('status');
    if (status) {
        status.textContent = message;
        status.classList.add('show');
        
        setTimeout(() => {
            status.classList.remove('show');
        }, 3000);
    }
}

// Load saved settings
function loadSavedSettings() {
    chrome.storage.local.get([
        'selectedTheme', 
        'systemThemeBehavior', 
        'tabProtection', 
        'autoRestore'
    ], (result) => {
        // Load theme with smooth transition
        if (result.selectedTheme) {
            applyTheme(result.selectedTheme);
        }
        
        // Load system theme behavior
        const behaviorSelect = document.getElementById('systemThemeBehavior');
        if (behaviorSelect && result.systemThemeBehavior) {
            behaviorSelect.value = result.systemThemeBehavior;
        }
        
        // Load tab protection settings
        const tabProtectionToggle = document.getElementById('tabProtection');
        if (tabProtectionToggle) {
            tabProtectionToggle.checked = result.tabProtection !== false;
        }
        
        const autoRestoreToggle = document.getElementById('autoRestore');
        if (autoRestoreToggle) {
            autoRestoreToggle.checked = result.autoRestore !== false;
        }
    });
}

// Initialize everything with beautiful animations
document.addEventListener('DOMContentLoaded', function() {
    console.log('🚀 Initializing complete options page...');
    
    // Load saved settings with animation
    setTimeout(loadSavedSettings, 100);
    
    // Setup theme selection with smooth transitions - SAME AS SUSPENDED TAB
    document.querySelectorAll('.theme-btn').forEach(button => {
        button.addEventListener('click', () => {
            const themeName = button.dataset.theme;
            if (themeName) {
                // Add visual feedback with animation
                button.style.transform = 'scale(0.95)';
                setTimeout(() => {
                    button.style.transform = '';
                    applyTheme(themeName); // Smooth transition like suspended tab
                }, 100);
            }
        });
    });
    
    // Setup system theme behavior with smooth transitions
    const behaviorSelect = document.getElementById('systemThemeBehavior');
    if (behaviorSelect) {
        behaviorSelect.addEventListener('change', () => {
            const behavior = behaviorSelect.value;
            chrome.storage.local.set({ systemThemeBehavior: behavior }, () => {
                handleSystemThemeBehavior(); // Apply with smooth transition
                showStatus(`✅ System theme behavior: ${behavior}`);
            });
        });
    }
    
    // Setup tab protection toggles
    const tabProtectionToggle = document.getElementById('tabProtection');
    if (tabProtectionToggle) {
        tabProtectionToggle.addEventListener('change', () => {
            const enabled = tabProtectionToggle.checked;
            chrome.storage.local.set({ tabProtection: enabled });
            showStatus(`🛡️ Tab protection ${enabled ? 'enabled' : 'disabled'}`);
        });
    }
    
    const autoRestoreToggle = document.getElementById('autoRestore');
    if (autoRestoreToggle) {
        autoRestoreToggle.addEventListener('change', () => {
            const enabled = autoRestoreToggle.checked;
            chrome.storage.local.set({ autoRestore: enabled });
            showStatus(`⚡ Auto-restore ${enabled ? 'enabled' : 'disabled'}`);
        });
    }
    
    // Setup complete session management
    setupSessionManagement();
    
    console.log('✅ Complete options page initialized with smooth theme transitions!');
    showStatus('🎉 All 18 themes loaded with beautiful transitions like suspended tabs!');
});

// Listen for system theme changes for smooth transitions
if (window.matchMedia) {
    window.matchMedia('(prefers-color-scheme: dark)').addEventListener('change', (e) => {
        chrome.storage.local.get(['systemThemeBehavior'], (result) => {
            if (result.systemThemeBehavior === 'follow-system') {
                handleSystemThemeBehavior(); // Smooth transition on system change
            }
        });
    });
}

// COMPLETE Session management setup with all functionality
function setupSessionManagement() {
    console.log('💾 Setting up complete session management...');
    
    // Get current session ID
    chrome.runtime.sendMessage({ action: 'getCurrentSessionId' }, (response) => {
        if (response && response.success) {
            currentSessionId = response.sessionId;
            const sessionIdElement = document.getElementById('currentSessionId');
            if (sessionIdElement) {
                sessionIdElement.textContent = currentSessionId;
            }
        }
    });
    
    // Copy session ID with animation
    const copySessionIdBtn = document.getElementById('copySessionId');
    if (copySessionIdBtn) {
        copySessionIdBtn.addEventListener('click', () => {
            if (currentSessionId) {
                navigator.clipboard.writeText(currentSessionId).then(() => {
                    copySessionIdBtn.textContent = '✅ Copied!';
                    showStatus('📋 Session ID copied to clipboard!');
                    setTimeout(() => {
                        copySessionIdBtn.textContent = '📋 Copy';
                    }, 2000);
                });
            }
        });
    }
    
    // Backup all tabs with beautiful animation
    const backupAllTabsBtn = document.getElementById('backupAllTabs');
    if (backupAllTabsBtn) {
        backupAllTabsBtn.addEventListener('click', () => {
            const backupName = document.getElementById('allTabsBackupName')?.value.trim();
            
            // Add loading state
            backupAllTabsBtn.style.opacity = '0.6';
            backupAllTabsBtn.textContent = '💾 Creating backup...';
            
            chrome.runtime.sendMessage({ 
                action: 'backupAllTabs', 
                backupName: backupName || undefined 
            }, (response) => {
                // Restore button state
                backupAllTabsBtn.style.opacity = '1';
                backupAllTabsBtn.textContent = '💾 Backup All Tabs';
                
                if (response && response.success) {
                    showStatus(`💾 Backed up ${response.backup.tabCount} tabs successfully!`);
                    loadSessionBackups();
                    // Clear the input with animation
                    const input = document.getElementById('allTabsBackupName');
                    if (input) {
                        input.style.transform = 'scale(0.95)';
                        setTimeout(() => {
                            input.value = '';
                            input.style.transform = '';
                        }, 200);
                    }
                } else {
                    showStatus('❌ Failed to backup tabs');
                }
            });
        });
    }
    
    // ✅ EXPORT ALL TABS with download functionality
    const exportAllTabsBtn = document.getElementById('exportAllTabs');
    if (exportAllTabsBtn) {
        exportAllTabsBtn.addEventListener('click', () => {
            exportAllTabsBtn.style.opacity = '0.6';
            exportAllTabsBtn.textContent = '📤 Exporting...';
            
            chrome.runtime.sendMessage({ action: 'exportAllTabs' }, (response) => {
                exportAllTabsBtn.style.opacity = '1';
                exportAllTabsBtn.textContent = '📤 Export All Tabs';
                
                if (response && response.success) {
                    downloadFile(response.data, `all-tabs-${Date.now()}.json`);
                    showStatus('📤 All tabs exported successfully!');
                } else {
                    showStatus('❌ Failed to export tabs');
                }
            });
        });
    }
    
    // ✅ IMPORT ALL TABS with file handling
    const importAllTabsBtn = document.getElementById('importAllTabs');
    const importAllTabsFile = document.getElementById('importAllTabsFile');
    
    if (importAllTabsBtn && importAllTabsFile) {
        importAllTabsBtn.addEventListener('click', () => {
            importAllTabsFile.click();
        });
        
        importAllTabsFile.addEventListener('change', (event) => {
            const file = event.target.files[0];
            if (file) {
                const reader = new FileReader();
                reader.onload = (e) => {
                    try {
                        const jsonData = e.target.result;
                        
                        importAllTabsBtn.style.opacity = '0.6';
                        importAllTabsBtn.textContent = '📥 Importing...';
                        
                        chrome.runtime.sendMessage({ 
                            action: 'importTabs', 
                            jsonData: jsonData 
                        }, (response) => {
                            importAllTabsBtn.style.opacity = '1';
                            importAllTabsBtn.textContent = '📥 Import Tabs';
                            
                            if (response && response.success) {
                                showStatus(`📥 Imported ${response.imported} tabs successfully!`);
                            } else {
                                showStatus('❌ Failed to import tabs - Invalid format');
                            }
                        });
                    } catch (error) {
                        showStatus('❌ Invalid JSON file');
                        importAllTabsBtn.style.opacity = '1';
                        importAllTabsBtn.textContent = '📥 Import Tabs';
                    }
                };
                reader.readAsText(file);
            }
        });
    }
    
    // ✅ RESTORE BY SESSION ID with validation
    const restoreBySessionIdBtn = document.getElementById('restoreBySessionId');
    if (restoreBySessionIdBtn) {
        restoreBySessionIdBtn.addEventListener('click', () => {
            const sessionIdInput = document.getElementById('sessionIdInput');
            const sessionId = sessionIdInput?.value.trim();
            
            if (!sessionId) {
                sessionIdInput.style.borderColor = '#ff4444';
                showStatus('❌ Please enter a Session ID');
                setTimeout(() => {
                    sessionIdInput.style.borderColor = '';
                }, 2000);
                return;
            }
            
            restoreBySessionIdBtn.style.opacity = '0.6';
            restoreBySessionIdBtn.textContent = '🔄 Restoring...';
            
            chrome.runtime.sendMessage({ 
                action: 'restoreBySessionId', 
                sessionId: sessionId 
            }, (response) => {
                restoreBySessionIdBtn.style.opacity = '1';
                restoreBySessionIdBtn.textContent = '🔄 Restore';
                
                if (response && response.success) {
                    showStatus(`🔄 Restored ${response.tabCount} tabs successfully!`);
                    // Clear the input with animation
                    sessionIdInput.style.transform = 'scale(0.95)';
                    setTimeout(() => {
                        sessionIdInput.value = '';
                        sessionIdInput.style.transform = '';
                    }, 200);
                } else {
                    showStatus('❌ Failed to restore session - Session ID not found');
                    sessionIdInput.style.borderColor = '#ff4444';
                    setTimeout(() => {
                        sessionIdInput.style.borderColor = '';
                    }, 2000);
                }
            });
        });
    }
    
    // ✅ NEW SESSION with animation
    const newSessionBtn = document.getElementById('newSession');
    if (newSessionBtn) {
        newSessionBtn.addEventListener('click', () => {
            newSessionBtn.style.transform = 'scale(0.95)';
            newSessionBtn.textContent = '✨ Creating...';
            
            chrome.runtime.sendMessage({ action: 'createNewSession' }, (response) => {
                newSessionBtn.style.transform = '';
                newSessionBtn.textContent = '✨ Create New Session';
                
                if (response && response.success) {
                    currentSessionId = response.sessionId;
                    const sessionIdElement = document.getElementById('currentSessionId');
                    if (sessionIdElement) {
                        sessionIdElement.style.transform = 'scale(1.1)';
                        sessionIdElement.textContent = currentSessionId;
                        setTimeout(() => {
                            sessionIdElement.style.transform = '';
                        }, 300);
                    }
                    showStatus(`✨ New session created: ${currentSessionId}`);
                } else {
                    showStatus('❌ Failed to create new session');
                }
            });
        });
    }
    
    // Load backups on page load with animation
    loadSessionBackups();
}

// Load session backups with beautiful UI
function loadSessionBackups() {
    chrome.runtime.sendMessage({ action: 'getSessionBackups' }, (response) => {
        if (response && response.success) {
            const backupsList = document.getElementById('backupsList');
            if (!backupsList) return;
            
            const backups = response.backups;
            
            if (Object.keys(backups).length === 0) {
                backupsList.innerHTML = '<p class="loading">📂 No backups found. Create your first backup above!</p>';
                return;
            }
            
            backupsList.innerHTML = '';
            
            // Sort backups by creation date (newest first)
            const sortedBackups = Object.values(backups).sort((a, b) => b.created - a.created);
            
            sortedBackups.forEach((backup, index) => {
                const backupItem = document.createElement('div');
                backupItem.className = 'backup-item';
                backupItem.style.animationDelay = `${index * 0.1}s`;
                backupItem.innerHTML = `
                    <div class="backup-info">
                        <div class="backup-name">💾 ${backup.name}</div>
                        <div class="backup-details">
                            📊 ${backup.tabCount} tabs • 📅 ${new Date(backup.created).toLocaleString()}
                        </div>
                    </div>
                    <div class="backup-actions">
                        <button onclick="restoreBackup('${backup.id}')" title="Restore this backup">🔄</button>
                        <button onclick="exportBackup('${backup.id}')" title="Export as file">📤</button>
                        <button onclick="deleteBackup('${backup.id}')" title="Delete backup">🗑️</button>
                    </div>
                `;
                backupsList.appendChild(backupItem);
            });
        }
    });
}

// Global backup management functions with animations
window.restoreBackup = function(backupId) {
    const button = event.target;
    const originalText = button.textContent;
    button.textContent = '⏳';
    button.style.opacity = '0.6';
    
    chrome.runtime.sendMessage({ 
        action: 'restoreBySessionId', 
        sessionId: backupId 
    }, (response) => {
        button.textContent = originalText;
        button.style.opacity = '1';
        
        if (response && response.success) {
            showStatus(`🔄 Restored ${response.tabCount} tabs from backup!`);
        } else {
            showStatus('❌ Failed to restore backup');
        }
    });
};

window.exportBackup = function(backupId) {
    const button = event.target;
    const originalText = button.textContent;
    button.textContent = '⏳';
    
    chrome.runtime.sendMessage({ action: 'getSessionBackups' }, (response) => {
        button.textContent = originalText;
        
        if (response && response.success) {
            const backup = response.backups[backupId];
            if (backup) {
                const exportData = JSON.stringify(backup, null, 2);
                downloadFile(exportData, `backup-${backup.name.replace(/\s+/g, '-')}-${Date.now()}.json`);
                showStatus('📤 Backup exported successfully!');
            }
        }
    });
};

window.deleteBackup = function(backupId) {
    if (confirm('🗑️ Are you sure you want to delete this backup? This action cannot be undone.')) {
        chrome.storage.local.get(['sessionBackups'], (result) => {
            const backups = result.sessionBackups || {};
            delete backups[backupId];
            chrome.storage.local.set({ sessionBackups: backups }, () => {
                showStatus('🗑️ Backup deleted successfully!');
                loadSessionBackups();
            });
        });
    }
};

// Download file helper with progress indication
function downloadFile(data, filename) {
    try {
        const blob = new Blob([data], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = filename;
        a.style.display = 'none';
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
    } catch (error) {
        console.error('Download failed:', error);
        showStatus('❌ Download failed');
    }
}
