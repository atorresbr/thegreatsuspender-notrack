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
    
    // Backup All Tabs - FIXED to work with and without names
    const backupBtn = document.getElementById("backupAllTabs");
    const backupNameInput = document.getElementById("allTabsBackupName");
    
    if (backupBtn) {
        backupBtn.addEventListener("click", function(e) {
            e.preventDefault();
            console.log('🔄 Backup button clicked');
            
            // Get backup name (can be empty)
            let backupName = '';
            if (backupNameInput) {
                backupName = backupNameInput.value.trim();
            }
            
            console.log('Backup name:', backupName || '(auto-generated)');
            
            chrome.runtime.sendMessage({
                action: "backupTabs",
                backupName: backupName // Can be empty string
            }, function(response) {
                console.log('📥 Backup response:', response);
                
                if (chrome.runtime.lastError) {
                    console.error('❌ Runtime error:', chrome.runtime.lastError);
                    alert("Error: " + chrome.runtime.lastError.message);
                    return;
                }
                
                if (response && response.success) {
                    alert(`✅ Backed up ${response.count} tabs as "${response.backupName}"\nSession ID: ${response.sessionId}`);
                    if (backupNameInput) backupNameInput.value = '';
                    updateBackupsList();
                    updateCurrentSessionId();
                } else {
                    console.error('❌ Backup failed:', response);
                    alert("❌ Failed to backup tabs");
                }
            });
        });
    }
    
    // Create New Session - FIXED to suspend ALL tabs
    const newSessionBtn = document.getElementById("newSession");
    
    if (newSessionBtn) {
        newSessionBtn.addEventListener("click", function(e) {
            e.preventDefault();
            console.log('🔄 New session button clicked');
            
            if (!confirm('This will suspend ALL current tabs and create a new session.\n\nYour previous session will be saved as backup.\n\nContinue?')) {
                return;
            }
            
            // Show loading state
            newSessionBtn.disabled = true;
            newSessionBtn.textContent = '⏳ Creating Session...';
            
            chrome.runtime.sendMessage({action: "createNewSession"}, function(response) {
                console.log('📥 New session response:', response);
                
                // Restore button state
                newSessionBtn.disabled = false;
                newSessionBtn.textContent = '✨ Create New Session';
                
                if (chrome.runtime.lastError) {
                    console.error('❌ Runtime error:', chrome.runtime.lastError);
                    alert("Error: " + chrome.runtime.lastError.message);
                    return;
                }
                
                if (response && response.success) {
                    alert(`✅ New Session Created Successfully!\n\n🆔 Session ID: ${response.sessionId}\n💤 Suspended: ${response.suspended} tabs\n💾 Previous session saved with ${response.previousCount} tabs\n\nAll your tabs are now suspended with the new session ID.`);
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
    
    // Update backups list
    function updateBackupsList() {
        chrome.runtime.sendMessage({action: "getBackupsList"}, response => {
            const backupsListElement = document.getElementById("backupsList");
            if (backupsListElement && response) {
                if (!response.backups || response.backups.length === 0) {
                    backupsListElement.innerHTML = "<p>No backups found.</p>";
                } else {
                    const backupItems = response.backups.map(backup => `
                        <div class="backup-item" style="background: rgba(255,255,255,0.1); padding: 15px; margin: 10px 0; border-radius: 8px;">
                            <div style="display: flex; justify-content: space-between; align-items: center; flex-wrap: wrap; gap: 10px;">
                                <div>
                                    <strong style="font-size: 1.1em;">${backup.name}</strong>
                                    <br><span style="font-size: 0.9em; opacity: 0.8;">Session: ${backup.sessionId}</span>
                                    <br><span style="font-size: 0.9em; opacity: 0.8;">Tabs: ${backup.count || backup.tabs?.length || 0}</span>
                                    <br><span style="font-size: 0.9em; opacity: 0.8;">Created: ${new Date(backup.created).toLocaleString()}</span>
                                </div>
                                <button onclick="restoreBackup('${backup.sessionId}')" style="background: rgba(255,255,255,0.2); border: 1px solid rgba(255,255,255,0.3); color: white; padding: 8px 16px; border-radius: 5px; cursor: pointer;">
                                    🔄 Restore
                                </button>
                            </div>
                        </div>
                    `).join('');
                    backupsListElement.innerHTML = backupItems;
                }
            }
        });
    }
    
    // Make restoreBackup global
    window.restoreBackup = function(sessionId) {
        if (confirm(`Restore backup session: ${sessionId}?\n\nThis will open all tabs from that session.`)) {
            chrome.runtime.sendMessage({
                action: "restoreSession",
                sessionId: sessionId
            }, response => {
                if (response && response.success) {
                    alert(`✅ Restored ${response.restored} tabs from backup session: ${sessionId}`);
                } else {
                    alert("❌ Failed to restore backup");
                }
            });
        }
    };
    
    // Initialize
    updateCurrentSessionId();
    updateBackupsList();
    
    console.log('✅ Complete session management setup finished');
});
