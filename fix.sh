#!/bin/bash
# filepath: /home/linux/Documents/GitHub/thegreatsuspender-notrack/fix.sh

REPO_DIR="/home/linux/Documents/GitHub/thegreatsuspender-notrack"
SRC_DIR="$REPO_DIR/src"
JS_DIR="$SRC_DIR/js"
EXPORT_JS="$JS_DIR/exportTabs.js"

echo "🔧 Fixing backup buttons in exportTabs.js..."

# Create the fixed exportTabs.js with working backup buttons
cat > "$EXPORT_JS" << 'EOF'
console.log('✅ ExportTabs.js with complete session management loaded');

document.addEventListener("DOMContentLoaded", function() {
    console.log('✅ DOM loaded, setting up complete session management...');
    
    // Export All Tabs
    const exportBtn = document.getElementById("exportAllTabs");
    if (exportBtn) {
        exportBtn.addEventListener("click", function(e) {
            e.preventDefault();
            console.log('🔄 Export button clicked');
            
            chrome.runtime.sendMessage({action: "exportTabs"}, function(response) {
                console.log('📥 Export response:', response);
                
                if (chrome.runtime.lastError) {
                    console.error('❌ Runtime error:', chrome.runtime.lastError);
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
                    console.error('❌ Invalid response:', response);
                    alert("❌ Failed to export tabs");
                }
            });
        });
    }
    
    // Backup All Tabs
    const backupBtn = document.getElementById("backupAllTabs");
    const backupNameInput = document.getElementById("allTabsBackupName");
    
    if (backupBtn) {
        backupBtn.addEventListener("click", function(e) {
            e.preventDefault();
            console.log('🔄 Backup button clicked');
            
            // Get backup name
            let backupName = '';
            if (backupNameInput) {
                backupName = backupNameInput.value.trim();
            }
            
            // Show processing state
            backupBtn.disabled = true;
            backupBtn.textContent = '⏳ Creating Backup...';
            
            chrome.runtime.sendMessage({
                action: "backupAllTabs",
                backupName: backupName
            }, function(response) {
                console.log('📥 Backup response:', response);
                
                // Restore button state
                backupBtn.disabled = false;
                backupBtn.textContent = '💾 Backup All Tabs';
                
                if (chrome.runtime.lastError) {
                    console.error('❌ Runtime error:', chrome.runtime.lastError);
                    alert("Error: " + chrome.runtime.lastError.message);
                    return;
                }
                
                if (response && response.success) {
                    alert(`✅ Successfully backed up ${response.count} tabs!\n\nBackup Name: "${response.backupName}"\nSession ID: ${response.sessionId}\n\nIncludes both regular and suspended tabs.`);
                    if (backupNameInput) backupNameInput.value = '';
                    updateBackupsList();
                    updateCurrentSessionId();
                } else {
                    console.error('❌ Backup failed:', response);
                    alert(`❌ Failed to backup tabs: ${response?.error || 'Unknown error'}`);
                }
            });
        });
    }
    
    // Create New Session
    const newSessionBtn = document.getElementById("newSession");
    
    if (newSessionBtn) {
        newSessionBtn.addEventListener("click", function(e) {
            e.preventDefault();
            console.log('🔄 New session button clicked');
            
            if (!confirm('This will suspend ALL current tabs and create a new session.\n\nYour previous session will be saved as backup.\n\nContinue?')) {
                return;
            }
            
            newSessionBtn.disabled = true;
            newSessionBtn.textContent = '⏳ Creating Session...';
            
            chrome.runtime.sendMessage({action: "createNewSession"}, function(response) {
                console.log('📥 New session response:', response);
                
                newSessionBtn.disabled = false;
                newSessionBtn.textContent = '✨ Create New Session';
                
                if (chrome.runtime.lastError) {
                    console.error('❌ Runtime error:', chrome.runtime.lastError);
                    alert("Error: " + chrome.runtime.lastError.message);
                    return;
                }
                
                if (response && response.success) {
                    alert(`✅ New Session Created!\n\n🆔 Session ID: ${response.sessionId}\n💤 Suspended: ${response.suspended} tabs\n💾 Previous session saved with ${response.previousCount} tabs`);
                    updateCurrentSessionId();
                    updateBackupsList();
                } else {
                    console.error('❌ New session failed:', response);
                    alert(`❌ Failed to create new session: ${response?.error || 'Unknown error'}`);
                }
            });
        });
    }
    
    // Import Tabs
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
    
    // Restore by Session ID
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
    
    // Copy Session ID
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
    
    // Update current session ID display
    function updateCurrentSessionId() {
        chrome.runtime.sendMessage({action: "getSessionId"}, response => {
            const sessionIdElement = document.getElementById("currentSessionId");
            if (sessionIdElement && response) {
                sessionIdElement.textContent = response.sessionId || "none";
            }
        });
    }
    
    // FIXED: Update backups list with EVENT DELEGATION instead of onclick
    function updateBackupsList() {
        chrome.runtime.sendMessage({action: "getBackupsList"}, response => {
            const backupsListElement = document.getElementById("backupsList");
            if (backupsListElement && response) {
                if (!response.backups || response.backups.length === 0) {
                    backupsListElement.innerHTML = '<div style="color: rgba(255,255,255,0.7); font-size: 14px; text-align: center; padding: 20px;">No backups found.</div>';
                } else {
                    const backupItems = response.backups.map(backup => `
                        <div style="
                            background: rgba(255, 255, 255, 0.1);
                            backdrop-filter: blur(10px);
                            border: 1px solid rgba(255, 255, 255, 0.2);
                            border-radius: 8px;
                            padding: 16px;
                            margin: 12px 0;
                            position: relative;
                            box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
                            transition: all 0.3s ease;
                        " onmouseover="this.style.background='rgba(255, 255, 255, 0.15)'; this.style.transform='translateY(-2px)'" 
                           onmouseout="this.style.background='rgba(255, 255, 255, 0.1)'; this.style.transform='translateY(0px)'">
                           
                            <!-- Delete X button in top right corner -->
                            <button class="delete-backup-btn" data-backup-name="${backup.name}" 
                                    style="
                                        position: absolute;
                                        top: 8px;
                                        right: 8px;
                                        background: rgba(244, 67, 54, 0.8);
                                        border: none;
                                        color: white;
                                        width: 24px;
                                        height: 24px;
                                        border-radius: 50%;
                                        cursor: pointer;
                                        font-size: 12px;
                                        font-weight: bold;
                                        display: flex;
                                        align-items: center;
                                        justify-content: center;
                                        transition: all 0.3s ease;
                                        z-index: 10;
                                    "
                                    onmouseover="this.style.background='rgba(244, 67, 54, 1)'; this.style.transform='scale(1.1)'"
                                    onmouseout="this.style.background='rgba(244, 67, 54, 0.8)'; this.style.transform='scale(1)'"
                                    title="Delete this backup">
                                ✕
                            </button>
                            
                            <!-- Main content -->
                            <div style="padding-right: 40px;">
                                <!-- Backup name -->
                                <div style="
                                    color: white;
                                    font-size: 16px;
                                    font-weight: 600;
                                    margin-bottom: 8px;
                                    line-height: 1.3;
                                ">${backup.name}</div>
                                
                                <!-- Session info -->
                                <div style="
                                    color: rgba(255, 255, 255, 0.8);
                                    font-size: 13px;
                                    line-height: 1.4;
                                    margin-bottom: 12px;
                                ">
                                    <div style="margin-bottom: 4px;">
                                        <span style="color: rgba(255, 255, 255, 0.6);">📋 Session:</span> 
                                        <code style="
                                            background: rgba(0, 0, 0, 0.3);
                                            padding: 2px 6px;
                                            border-radius: 4px;
                                            font-family: 'Courier New', monospace;
                                            font-size: 12px;
                                        ">${backup.sessionId}</code>
                                    </div>
                                    <div style="margin-bottom: 4px;">
                                        <span style="color: rgba(255, 255, 255, 0.6);">📊 Tabs:</span> 
                                        <span style="color: #4CAF50; font-weight: 500;">${backup.count || backup.tabs?.length || 0}</span>
                                        <span style="color: rgba(255, 255, 255, 0.5); font-size: 11px;">(includes suspended tabs)</span>
                                    </div>
                                    <div style="margin-bottom: 0;">
                                        <span style="color: rgba(255, 255, 255, 0.6);">📅 Created:</span> 
                                        <span>${new Date(backup.created).toLocaleString()}</span>
                                    </div>
                                </div>
                                
                                <!-- Restore button -->
                                <button class="restore-backup-btn" data-session-id="${backup.sessionId}"
                                        style="
                                            background: rgba(76, 175, 80, 0.2);
                                            border: 2px solid rgba(76, 175, 80, 0.4);
                                            color: white;
                                            padding: 8px 16px;
                                            border-radius: 6px;
                                            cursor: pointer;
                                            font-size: 13px;
                                            font-weight: 500;
                                            transition: all 0.3s ease;
                                            backdrop-filter: blur(5px);
                                        "
                                        onmouseover="this.style.background='rgba(76, 175, 80, 0.3)'; this.style.borderColor='rgba(76, 175, 80, 0.6)'; this.style.transform='translateY(-1px)'"
                                        onmouseout="this.style.background='rgba(76, 175, 80, 0.2)'; this.style.borderColor='rgba(76, 175, 80, 0.4)'; this.style.transform='translateY(0px)'">
                                    🔄 Restore Backup
                                </button>
                            </div>
                        </div>
                    `).join('');
                    backupsListElement.innerHTML = backupItems;
                    
                    // FIXED: Add event listeners using EVENT DELEGATION
                    setupBackupButtonEventListeners();
                }
            }
        });
    }
    
    // FIXED: Setup event listeners for dynamically created buttons
    function setupBackupButtonEventListeners() {
        const backupsListElement = document.getElementById("backupsList");
        if (!backupsListElement) return;
        
        // Remove existing listeners to prevent duplicates
        backupsListElement.removeEventListener('click', handleBackupButtonClick);
        
        // Add single delegated event listener
        backupsListElement.addEventListener('click', handleBackupButtonClick);
        
        console.log('✅ Backup button event listeners setup complete');
    }
    
    // FIXED: Handle backup button clicks with event delegation
    function handleBackupButtonClick(event) {
        const target = event.target;
        
        // Handle restore button clicks
        if (target.classList.contains('restore-backup-btn')) {
            event.preventDefault();
            const sessionId = target.getAttribute('data-session-id');
            console.log('🔄 Restore backup clicked for session:', sessionId);
            
            if (confirm(`Restore backup session: ${sessionId}?\n\nThis will open all tabs from that session (including previously suspended tabs).`)) {
                target.disabled = true;
                target.textContent = '⏳ Restoring...';
                
                chrome.runtime.sendMessage({
                    action: "restoreSession",
                    sessionId: sessionId
                }, response => {
                    target.disabled = false;
                    target.textContent = '🔄 Restore Backup';
                    
                    if (response && response.success) {
                        alert(`✅ Restored ${response.restored} tabs from backup session: ${sessionId}`);
                    } else {
                        alert(`❌ Failed to restore backup: ${response?.error || 'Unknown error'}`);
                    }
                });
            }
        }
        
        // Handle delete button clicks
        else if (target.classList.contains('delete-backup-btn')) {
            event.preventDefault();
            const backupName = target.getAttribute('data-backup-name');
            console.log('🗑️ Delete backup clicked for:', backupName);
            
            if (confirm(`Delete backup "${backupName}"?\n\nThis action cannot be undone.`)) {
                target.disabled = true;
                target.style.opacity = '0.5';
                
                chrome.runtime.sendMessage({
                    action: "deleteBackup",
                    backupName: backupName
                }, response => {
                    if (response && response.success) {
                        alert(`✅ Backup "${backupName}" deleted successfully.`);
                        updateBackupsList(); // Refresh the list
                    } else {
                        alert(`❌ Failed to delete backup: ${response?.error || 'Unknown error'}`);
                        target.disabled = false;
                        target.style.opacity = '1';
                    }
                });
            }
        }
    }
    
    // Initialize
    updateCurrentSessionId();
    updateBackupsList();
    
    console.log('✅ Complete session management setup finished');
});
EOF

echo ""
echo "✅ BACKUP BUTTONS FIXED!"
echo ""
echo "🔧 What was fixed:"
echo "   ❌ Your fix.sh had JavaScript instead of bash commands"
echo "   ✅ Created proper exportTabs.js with event delegation"
echo "   ✅ Restore backup buttons now work"
echo "   ✅ Delete backup buttons (X) now work"
echo "   ✅ Glass styling preserved"
echo ""
echo "🔄 Please reload your extension and test:"
echo "   1. Create a backup"
echo "   2. Check Session Backups section"
echo "   3. Click 'Restore Backup' button"
echo "   4. Click X button to delete backup"
echo ""
echo "✅ Both buttons should work now!"