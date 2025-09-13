#!/bin/bash
# filepath: /home/linux/Documents/GitHub/thegreatsuspender-notrack/fix.sh

REPO_DIR="/home/linux/Documents/GitHub/thegreatsuspender-notrack"
SRC_DIR="$REPO_DIR/src"
JS_DIR="$SRC_DIR/js"
SUSPENDED_JS="$JS_DIR/suspended.js"
SUSPENDED_HTML="$SRC_DIR/suspended.html"
POPUP_JS="$JS_DIR/popup.js"
OPTIONS_HTML="$SRC_DIR/options.html"
EXPORT_JS="$JS_DIR/exportTabs.js"
BG_JS="$JS_DIR/background-wrapper.js"

echo "🔧 Fixing ALL issues: duplicates, closing tabs, delete buttons, context menu..."

# 1. Fix CSP errors in options.html - remove ALL inline event handlers
echo "🛡️ Fixing CSP violations in options.html..."
sed -i 's/onmouseover="[^"]*"//g' "$OPTIONS_HTML"
sed -i 's/onmouseout="[^"]*"//g' "$OPTIONS_HTML" 
sed -i 's/onclick="[^"]*"//g' "$OPTIONS_HTML"
sed -i 's/onchange="[^"]*"//g' "$OPTIONS_HTML"
sed -i 's/oninput="[^"]*"//g' "$OPTIONS_HTML"
echo "✅ Removed inline event handlers from options.html"

# 2. Fix context menu duplicate error in background-wrapper.js
echo "🛡️ Fixing context menu duplicate creation..."
# Replace the entire setupContextMenu function to prevent duplicates
sed -i '/^async function setupContextMenu/,/^}$/c\
async function setupContextMenu() {\
    return new Promise((resolve) => {\
        chrome.contextMenus.removeAll(() => {\
            if (chrome.runtime.lastError) {\
                console.warn("Context menu removeAll warning:", chrome.runtime.lastError.message);\
            }\
            \
            setTimeout(() => {\
                const menuItems = [\
                    { id: "suspend-tab", title: "💤 Suspend this tab", contexts: ["page"] },\
                    { id: "suspend-other", title: "😴 Suspend other tabs", contexts: ["page"] },\
                    { id: "unsuspend-all", title: "🔄 Unsuspend all tabs", contexts: ["page"] }\
                ];\
                \
                let itemsCreated = 0;\
                const totalItems = menuItems.length;\
                \
                menuItems.forEach((item) => {\
                    chrome.contextMenus.create(item, () => {\
                        if (chrome.runtime.lastError) {\
                            console.warn(`Context menu creation error for ${item.id}:`, chrome.runtime.lastError.message);\
                        } else {\
                            console.log(`✅ Created context menu: ${item.id}`);\
                        }\
                        \
                        itemsCreated++;\
                        if (itemsCreated === totalItems) {\
                            contextMenusCreated = true;\
                            console.log("✅ All context menus created successfully");\
                            resolve();\
                        }\
                    });\
                });\
            }, 150);\
        });\
    });\
}' "$BG_JS"

# 3. Fix createNewSession to NOT close suspended tabs and prevent duplicates
echo "🔧 Fixing createNewSession to keep suspended tabs..."
sed -i '/case '\''createNewSession'\''/,/return true;/{
    /case '\''createNewSession'\''/,/return true;/c\
        case '\''createNewSession'\'':\
            chrome.tabs.query({}, async (tabs) => {\
                try {\
                    console.log("🔄 Creating new session without closing suspended tabs...");\
                    \
                    const currentTabs = tabs.filter(canManageTab).map((tab) => ({\
                        id: tab.id,\
                        title: tab.title,\
                        url: tab.url,\
                        sessionId: currentSessionId,\
                        timestamp: Date.now(),\
                        suspended: tab.url.includes("suspended.html")\
                    }));\
                    \
                    if (currentTabs.length > 0) {\
                        const backupName = `Session_${new Date().toISOString().slice(0,19).replace(/:/g,"-")}`;\
                        await chrome.storage.local.set({ \
                            [`session_${currentSessionId}`]: currentTabs,\
                            [`backup_${backupName}`]: {\
                                name: backupName,\
                                sessionId: currentSessionId,\
                                tabs: currentTabs,\
                                created: Date.now(),\
                                count: currentTabs.length,\
                                regularCount: currentTabs.filter(t => !t.suspended).length,\
                                suspendedCount: currentTabs.filter(t => t.suspended).length\
                            }\
                        });\
                        console.log(`✅ Saved current session as backup: ${backupName}`);\
                    }\
                    \
                    const newSessionId = `gs-${Date.now()}-${Math.random().toString(36).substring(2, 11)}`;\
                    \
                    let suspendedCount = 0;\
                    const suspendPromises = tabs.map(async (tab) => {\
                        if (canManageTab(tab) && !tab.url.includes("suspended.html")) {\
                            try {\
                                const suspendedUrl = chrome.runtime.getURL("suspended.html") + \
                                    "?uri=" + encodeURIComponent(tab.url) + \
                                    "&title=" + encodeURIComponent(tab.title) +\
                                    "&sessionId=" + encodeURIComponent(newSessionId) +\
                                    "&tabId=" + encodeURIComponent(tab.id);\
                                \
                                await chrome.tabs.update(tab.id, { url: suspendedUrl });\
                                suspendedCount++;\
                                \
                                suspendedTabs.set(tab.id, {\
                                    id: tab.id,\
                                    url: tab.url,\
                                    title: tab.title,\
                                    sessionId: newSessionId,\
                                    suspended: Date.now()\
                                });\
                                \
                            } catch (error) {\
                                console.error("Error suspending tab:", error);\
                            }\
                        }\
                    });\
                    \
                    await Promise.all(suspendPromises);\
                    \
                    await chrome.storage.local.set({ currentSessionId: newSessionId });\
                    currentSessionId = newSessionId;\
                    \
                    await applySessionIdToAllTabs();\
                    await storeCurrentTabsForProtection();\
                    \
                    console.log(`✅ Created new session ${newSessionId}, suspended ${suspendedCount} new tabs`);\
                    \
                    sendResponse({\
                        success: true,\
                        sessionId: newSessionId,\
                        suspended: suspendedCount,\
                        previousCount: currentTabs.length\
                    });\
                    \
                } catch (error) {\
                    console.error("❌ Error creating new session:", error);\
                    sendResponse({\
                        success: false,\
                        error: error.message\
                    });\
                }\
            });\
            return true;
}' "$BG_JS"

# 4. Fix backupAllTabs to add proper counts
echo "🔧 Fixing backupAllTabs counts..."
sed -i '/case '\''backupAllTabs'\''/,/return true;/{
    /suspendedCount: allTabs.filter(t => t.suspended).length,/d
    /regularCount: allTabs.filter(t => !t.suspended).length,/d
    /count: allTabs.length,/a\
                    regularCount: allTabs.filter(t => !t.suspended).length,\
                    suspendedCount: allTabs.filter(t => t.suspended).length,
}' "$BG_JS"

# 5. Fix exportTabs.js with working delete buttons and no duplicates
cat > "$EXPORT_JS" << 'JSEOF'
console.log('✅ ExportTabs.js with FIXED session management loaded');

document.addEventListener("DOMContentLoaded", function() {
    console.log('✅ DOM loaded, setting up FIXED session management...');
    
    // Global state management
    let isCreatingSession = false;
    let isCreatingBackup = false;
    
    // Export All Tabs
    const exportBtn = document.getElementById("exportAllTabs");
    if (exportBtn) {
        exportBtn.addEventListener("click", function(e) {
            e.preventDefault();
            chrome.runtime.sendMessage({action: "exportTabs"}, function(response) {
                if (chrome.runtime.lastError) {
                    alert("Error: " + chrome.runtime.lastError.message);
                    return;
                }
                
                if (response && response.tabs && Array.isArray(response.tabs)) {
                    const data = JSON.stringify({
                        sessionId: response.sessionId,
                        tabs: response.tabs,
                        exported: new Date().toISOString(),
                        count: response.tabs.length
                    }, null, 2);
                    
                    const blob = new Blob([data], {type: "application/json"});
                    const url = URL.createObjectURL(blob);
                    const a = document.createElement("a");
                    a.href = url;
                    a.download = `tabs_export_${response.sessionId}_${new Date().getTime()}.json`;
                    document.body.appendChild(a);
                    a.click();
                    
                    setTimeout(() => {
                        document.body.removeChild(a);
                        URL.revokeObjectURL(url);
                    }, 100);
                    
                    alert(`✅ Exported ${response.tabs.length} tabs with session ID: ${response.sessionId}`);
                } else {
                    alert("❌ Failed to export tabs");
                }
            });
        });
    }
    
    // FIXED: Backup All Tabs - prevent duplicates
    const backupBtn = document.getElementById("backupAllTabs");
    const backupNameInput = document.getElementById("allTabsBackupName");
    
    if (backupBtn) {
        backupBtn.addEventListener("click", function(e) {
            e.preventDefault();
            
            if (isCreatingBackup) {
                console.log('⚠️ Backup creation already in progress');
                return;
            }
            
            let backupName = '';
            if (backupNameInput) {
                backupName = backupNameInput.value.trim();
            }
            
            isCreatingBackup = true;
            backupBtn.disabled = true;
            backupBtn.textContent = '⏳ Creating Backup...';
            
            chrome.runtime.sendMessage({
                action: "backupAllTabs",
                backupName: backupName
            }, function(response) {
                isCreatingBackup = false;
                backupBtn.disabled = false;
                backupBtn.textContent = '💾 Backup All Tabs';
                
                if (chrome.runtime.lastError) {
                    alert("Error: " + chrome.runtime.lastError.message);
                    return;
                }
                
                if (response && response.success) {
                    alert(`✅ Successfully backed up!\n\n📊 Opened Tabs: ${response.regularCount || 0}\n🪁 Suspended Tabs: ${response.suspendedCount || 0}\n\nBackup: "${response.backupName}"`);
                    if (backupNameInput) backupNameInput.value = '';
                    updateBackupsList();
                } else {
                    alert(`❌ Failed to backup tabs: ${response?.error || 'Unknown error'}`);
                }
            });
        });
    }
    
    // FIXED: Create New Session - prevent duplicates and keep suspended tabs
    const newSessionBtn = document.getElementById("newSession");
    
    if (newSessionBtn) {
        newSessionBtn.addEventListener("click", function(e) {
            e.preventDefault();
            
            if (isCreatingSession) {
                console.log('⚠️ Session creation already in progress');
                return;
            }
            
            if (!confirm('This will suspend ONLY opened tabs and create a new session.\n\nSuspended tabs will remain suspended.\nYour current session will be saved as backup.\n\nContinue?')) {
                return;
            }
            
            isCreatingSession = true;
            newSessionBtn.disabled = true;
            newSessionBtn.textContent = '⏳ Creating Session...';
            
            chrome.runtime.sendMessage({action: "createNewSession"}, function(response) {
                isCreatingSession = false;
                newSessionBtn.disabled = false;
                newSessionBtn.textContent = '✨ Create New Session';
                
                if (chrome.runtime.lastError) {
                    alert("Error: " + chrome.runtime.lastError.message);
                    return;
                }
                
                if (response && response.success) {
                    alert(`✅ New Session Created!\n\n🆔 Session ID: ${response.sessionId}\n✨ Newly Suspended: ${response.suspended} tabs\n💾 Previous session backed up`);
                    updateCurrentSessionId();
                    updateBackupsList();
                } else {
                    alert(`❌ Failed to create new session: ${response?.error || 'Unknown error'}`);
                }
            });
        });
    }
    
    // Import, Restore, Copy functions (unchanged)
    const importBtn = document.getElementById("importAllTabs");
    const importFile = document.getElementById("importAllTabsFile");
    
    if (importBtn && importFile) {
        importBtn.addEventListener("click", () => importFile.click());
        importFile.addEventListener("change", (event) => {
            const file = event.target.files[0];
            if (file) {
                const reader = new FileReader();
                reader.onload = (e) => {
                    try {
                        const jsonData = e.target.result;
                        chrome.runtime.sendMessage({
                            action: "importTabs",
                            jsonData: jsonData
                        }, (response) => {
                            if (response && response.success) {
                                alert(`✅ Imported ${response.imported} tabs successfully!`);
                            } else {
                                alert("❌ Failed to import tabs - Invalid format");
                            }
                        });
                    } catch (error) {
                        alert("❌ Invalid JSON file");
                    }
                };
                reader.readAsText(file);
            }
        });
    }
    
    const restoreBtn = document.getElementById("restoreBySessionId");
    const sessionInput = document.getElementById("sessionIdInput");
    
    if (restoreBtn && sessionInput) {
        restoreBtn.addEventListener("click", () => {
            const sessionId = sessionInput.value.trim();
            if (sessionId) {
                chrome.runtime.sendMessage({
                    action: "restoreSession",
                    sessionId: sessionId
                }, response => {
                    if (response && response.success) {
                        alert(`✅ Restored ${response.restored} tabs from session: ${response.sessionId}`);
                    } else {
                        alert(`❌ Failed to restore session: ${response?.error || 'Session not found'}`);
                    }
                });
            } else {
                alert("Please enter a session ID");
            }
        });
    }
    
    const copySessionBtn = document.getElementById("copySessionId");
    if (copySessionBtn) {
        copySessionBtn.addEventListener("click", () => {
            const sessionIdElement = document.getElementById("currentSessionId");
            if (sessionIdElement) {
                const sessionId = sessionIdElement.textContent;
                navigator.clipboard.writeText(sessionId).then(() => {
                    alert("Session ID copied to clipboard!");
                });
            }
        });
    }
    
    function updateCurrentSessionId() {
        chrome.runtime.sendMessage({action: "getSessionId"}, response => {
            const sessionIdElement = document.getElementById("currentSessionId");
            if (sessionIdElement && response) {
                sessionIdElement.textContent = response.sessionId || "none";
            }
        });
    }
    
    // FIXED: Update backups list with working delete buttons
    function updateBackupsList() {
        chrome.runtime.sendMessage({action: "getBackupsList"}, response => {
            const backupsListElement = document.getElementById("backupsList");
            if (backupsListElement && response) {
                if (!response.backups || response.backups.length === 0) {
                    backupsListElement.innerHTML = '<div style="color: rgba(255,255,255,0.7); font-size: 14px; text-align: center; padding: 20px;">No backups found.</div>';
                } else {
                    const backupItems = response.backups.map(backup => {
                        const openedTabs = backup.regularCount || (backup.tabs ? backup.tabs.filter(t => !t.suspended).length : 0);
                        const suspendedTabs = backup.suspendedCount || (backup.tabs ? backup.tabs.filter(t => t.suspended).length : 0);
                        
                        return `
                        <div class="backup-item" style="
                            background: rgba(255, 255, 255, 0.1);
                            border: 1px solid rgba(255, 255, 255, 0.2);
                            border-radius: 8px;
                            padding: 16px;
                            margin: 12px 0;
                            position: relative;
                        ">
                            <button class="delete-backup-btn" data-backup-name="${backup.name}" 
                                    style="
                                        position: absolute;
                                        top: 8px;
                                        right: 8px;
                                        background: #f44336;
                                        border: none;
                                        color: white;
                                        width: 24px;
                                        height: 24px;
                                        border-radius: 50%;
                                        cursor: pointer;
                                        font-size: 12px;
                                    "
                                    title="Delete this backup">
                                ✕
                            </button>
                            
                            <div style="padding-right: 40px;">
                                <div style="color: white; font-size: 16px; font-weight: 600; margin-bottom: 8px;">
                                    ${backup.name}
                                </div>
                                
                                <div style="color: rgba(255, 255, 255, 0.8); font-size: 13px; margin-bottom: 12px;">
                                    <div>📋 Session: <code>${backup.sessionId}</code></div>
                                    <div>📊 Opened Tabs: <span style="color: #4CAF50;">${openedTabs}</span></div>
                                    <div>🪁 Suspended Tabs: <span style="color: #FF9800;">${suspendedTabs}</span></div>
                                    <div>📅 Created: ${new Date(backup.created).toLocaleString()}</div>
                                </div>
                                
                                <button class="restore-backup-btn" data-session-id="${backup.sessionId}"
                                        style="
                                            background: rgba(76, 175, 80, 0.2);
                                            border: 2px solid rgba(76, 175, 80, 0.4);
                                            color: white;
                                            padding: 8px 16px;
                                            border-radius: 6px;
                                            cursor: pointer;
                                            font-size: 13px;
                                        ">
                                    🔄 Restore Backup
                                </button>
                            </div>
                        </div>
                    `;
                    }).join('');
                    backupsListElement.innerHTML = backupItems;
                    
                    setupBackupEventListeners();
                }
            }
        });
    }
    
    // FIXED: Event listeners for backup buttons
    function setupBackupEventListeners() {
        const backupsListElement = document.getElementById("backupsList");
        if (!backupsListElement) return;
        
        // Use event delegation for dynamically created buttons
        backupsListElement.addEventListener('click', function(event) {
            const target = event.target;
            event.stopPropagation();
            
            if (target.classList.contains('restore-backup-btn')) {
                const sessionId = target.getAttribute('data-session-id');
                console.log('🔄 Restore clicked for:', sessionId);
                
                if (confirm(`Restore backup session: ${sessionId}?`)) {
                    target.disabled = true;
                    target.textContent = '⏳ Restoring...';
                    
                    chrome.runtime.sendMessage({
                        action: "restoreSession",
                        sessionId: sessionId
                    }, response => {
                        target.disabled = false;
                        target.textContent = '🔄 Restore Backup';
                        
                        if (response && response.success) {
                            alert(`✅ Restored ${response.restored} tabs`);
                        } else {
                            alert(`❌ Failed to restore: ${response?.error || 'Unknown error'}`);
                        }
                    });
                }
            }
            
            // FIXED: Delete button functionality
            else if (target.classList.contains('delete-backup-btn')) {
                const backupName = target.getAttribute('data-backup-name');
                console.log('🗑️ Delete clicked for:', backupName);
                
                if (confirm(`Delete backup "${backupName}"?\n\nThis cannot be undone.`)) {
                    target.disabled = true;
                    target.style.opacity = '0.5';
                    
                    chrome.runtime.sendMessage({
                        action: "deleteBackup",
                        backupName: backupName
                    }, response => {
                        console.log('Delete response:', response);
                        
                        if (response && response.success) {
                            alert(`✅ Backup "${backupName}" deleted successfully`);
                            updateBackupsList(); // Refresh the list
                        } else {
                            alert(`❌ Failed to delete backup: ${response?.error || 'Unknown error'}`);
                            target.disabled = false;
                            target.style.opacity = '1';
                        }
                    });
                }
            }
        });
        
        console.log('✅ Backup event listeners setup complete');
    }
    
    // Initialize
    updateCurrentSessionId();
    updateBackupsList();
    
    console.log('✅ FIXED session management setup complete');
});
JSEOF

echo "✅ Fixed exportTabs.js - proper session creation and working delete buttons"

echo ""
echo "✅ ALL CRITICAL ISSUES FIXED!"
echo ""
echo "🔧 What was fixed:"
echo "   🛡️ Context Menu: Fixed duplicate creation with proper cleanup"
echo "   🚫 Session Duplicates: Added proper locking mechanisms"  
echo "   💤 Keep Suspended: New sessions DON'T close existing suspended tabs"
echo "   ✕ Delete Buttons: Fixed event delegation for backup deletion"
echo "   📊 Tab Counts: Proper opened vs suspended tab counting"
echo "   🎯 State Management: Global state prevents multiple operations"
echo ""
echo "🔄 Please reload your extension and test:"
echo "   1. No context menu duplicate errors"
echo "   2. Create New Session keeps existing suspended tabs"
echo "   3. No duplicate session backups"
echo "   4. Delete (X) buttons work properly"
echo "   5. Proper tab counts in backups"
echo ""
echo "✅ Everything should work correctly now!"