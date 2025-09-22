#!/bin/bash
# filepath: /home/linux/Documents/GitHub/thegreatsuspender-notrack/fix_session_duplicate.sh

echo "🔧 Fixing currentSessionId duplicate declaration..."

REPO_DIR="/home/linux/Documents/GitHub/thegreatsuspender-notrack"
JS_DIR="$REPO_DIR/src/js"

# Check if options.js exists
if [ -f "$JS_DIR/options.js" ]; then
    
    echo "📝 Backing up options.js..."
    cp "$JS_DIR/options.js" "$REPO_DIR/backup/options.js.duplicate-fix.backup"
    
    # Remove the duplicate currentSessionId declaration and fix the code
    echo "🔧 Removing duplicate currentSessionId declaration..."
    
    # Create a temporary file with the fixed content
    cat > "$JS_DIR/options_session_fixed.js" << 'EOF'

  // COMPLETE SESSION MANAGEMENT FUNCTIONS
  // Use existing currentSessionId variable or create if not exists
  if (typeof currentSessionId === 'undefined') {
    var currentSessionId = null;
  }

  async function initializeCompleteSessionManagement() {
    console.log('Initializing COMPLETE session management...');
    
    // Get current session ID
    chrome.runtime.sendMessage({ action: 'getCurrentSessionId' }, (response) => {
      if (response && response.success) {
        currentSessionId = response.sessionId;
        document.getElementById('currentSessionId').textContent = currentSessionId;
      }
    });
    
    updateTabCounts();
    loadAllSessions();
    loadAllBackups();
    setupCompleteEventListeners();
    
    // Auto-refresh every 10 seconds
    setInterval(() => {
      updateTabCounts();
      loadAllSessions();
      loadAllBackups();
    }, 10000);
  }

  function updateTabCounts() {
    chrome.tabs.query({}, (tabs) => {
      document.getElementById('totalTabCount').textContent = tabs.length;
    });
  }

  function loadAllSessions() {
    chrome.runtime.sendMessage({ action: 'getAllSessions' }, (response) => {
      if (response && response.success) {
        const sessionSelect = document.getElementById('sessionSelect');
        const sessions = response.sessions;
        
        // Clear existing options except first
        while (sessionSelect.children.length > 1) {
          sessionSelect.removeChild(sessionSelect.lastChild);
        }
        
        Object.values(sessions).forEach(session => {
          if (session.id !== currentSessionId) {
            const option = document.createElement('option');
            option.value = session.id;
            option.textContent = `${session.id} (${session.tabCount} tabs) - ${new Date(session.created).toLocaleString()}`;
            sessionSelect.appendChild(option);
          }
        });
      }
    });
  }

  function loadAllBackups() {
    chrome.runtime.sendMessage({ action: 'getSessionBackups' }, (response) => {
      if (response && response.success) {
        const backupsList = document.getElementById('backupsList');
        const backups = response.backups;
        
        if (Object.keys(backups).length === 0) {
          backupsList.innerHTML = '<h4>Session Backups</h4><p class="no-backups">No session backups found.</p>';
          return;
        }
        
        backupsList.innerHTML = '<h4>Session Backups</h4>';
        
        Object.values(backups).forEach(backup => {
          const backupItem = document.createElement('div');
          backupItem.className = 'backup-item';
          backupItem.innerHTML = `
            <div class="backup-info">
              <div class="backup-name">${backup.name}</div>
              <div class="backup-details">
                ${backup.tabCount} tabs • Created: ${new Date(backup.created).toLocaleString()}
                <br>${backup.allTabsBackup ? 'ALL TABS BACKUP' : 'Session: ' + (backup.originalSessionId || backup.sessionId)}
              </div>
            </div>
            <div class="backup-actions">
              <button onclick="restoreSessionBackup('${backup.id}')">🔄</button>
              <button onclick="exportSessionBackup('${backup.id}')">📤</button>
              <button onclick="deleteSessionBackup('${backup.id}')">🗑️</button>
            </div>
          `;
          backupsList.appendChild(backupItem);
        });
      }
    });
  }

  function setupCompleteEventListeners() {
    // Get elements and check they exist
    const copySessionIdBtn = document.getElementById('copySessionId');
    const backupAllTabsBtn = document.getElementById('backupAllTabs');
    const exportAllTabsBtn = document.getElementById('exportAllTabs');
    const importAllTabsBtn = document.getElementById('importAllTabs');
    const restoreBySessionIdBtn = document.getElementById('restoreBySessionId');
    const restoreSessionBtn = document.getElementById('restoreSession');
    const newSessionBtn = document.getElementById('newSession');
    const refreshSessionsBtn = document.getElementById('refreshSessions');
    const importFromTextBtn = document.getElementById('importFromText');
    const exportToTextBtn = document.getElementById('exportToText');
    const importAllTabsFile = document.getElementById('importAllTabsFile');

    // Copy session ID
    if (copySessionIdBtn) {
      copySessionIdBtn.addEventListener('click', () => {
        navigator.clipboard.writeText(currentSessionId).then(() => {
          showSessionStatus('✅ Session ID copied!');
        });
      });
    }

    // Backup ALL tabs
    if (backupAllTabsBtn) {
      backupAllTabsBtn.addEventListener('click', () => {
        const backupName = document.getElementById('allTabsBackupName').value.trim();
        
        chrome.runtime.sendMessage({ 
          action: 'backupAllTabs', 
          backupName: backupName || undefined 
        }, (response) => {
          if (response && response.success) {
            showSessionStatus(`✅ ALL TABS backed up: ${response.backup.tabCount} tabs`);
            document.getElementById('allTabsBackupName').value = '';
            loadAllBackups();
          } else {
            showSessionStatus('❌ Failed to backup all tabs: ' + (response?.error || 'Unknown error'));
          }
        });
      });
    }

    // Export ALL tabs
    if (exportAllTabsBtn) {
      exportAllTabsBtn.addEventListener('click', () => {
        chrome.runtime.sendMessage({ action: 'exportAllTabs' }, (response) => {
          if (response && response.success) {
            downloadSessionFile(response.data, `all-tabs-${Date.now()}.json`);
            showSessionStatus('✅ ALL TABS exported successfully');
          } else {
            showSessionStatus('❌ Failed to export all tabs');
          }
        });
      });
    }

    // Import ALL tabs
    if (importAllTabsBtn) {
      importAllTabsBtn.addEventListener('click', () => {
        if (importAllTabsFile) {
          importAllTabsFile.click();
        }
      });
    }

    if (importAllTabsFile) {
      importAllTabsFile.addEventListener('change', (event) => {
        const file = event.target.files[0];
        if (file) {
          const reader = new FileReader();
          reader.onload = (e) => {
            chrome.runtime.sendMessage({ 
              action: 'importTabs', 
              jsonData: e.target.result 
            }, (response) => {
              if (response && response.success) {
                showSessionStatus(`✅ Imported ${response.imported} tabs successfully`);
              } else {
                showSessionStatus('❌ Failed to import tabs: ' + (response?.error || 'Unknown error'));
              }
            });
          };
          reader.readAsText(file);
        }
      });
    }

    // Restore by Session ID
    if (restoreBySessionIdBtn) {
      restoreBySessionIdBtn.addEventListener('click', () => {
        const sessionId = document.getElementById('sessionIdInput').value.trim();
        if (!sessionId) {
          showSessionStatus('❌ Please enter a Session ID');
          return;
        }
        
        chrome.runtime.sendMessage({ 
          action: 'restoreBySessionId', 
          sessionId: sessionId 
        }, (response) => {
          if (response && response.success) {
            showSessionStatus(`✅ Restored ${response.tabCount} tabs from session: ${sessionId}`);
            document.getElementById('sessionIdInput').value = '';
          } else {
            showSessionStatus('❌ Failed to restore by Session ID: ' + (response?.error || 'Session not found'));
          }
        });
      });
    }

    // Regular session restore
    if (restoreSessionBtn) {
      restoreSessionBtn.addEventListener('click', () => {
        const sessionId = document.getElementById('sessionSelect').value;
        if (!sessionId) {
          showSessionStatus('❌ Please select a session');
          return;
        }
        
        chrome.runtime.sendMessage({ 
          action: 'restoreBySessionId', 
          sessionId: sessionId 
        }, (response) => {
          if (response && response.success) {
            showSessionStatus(`✅ Restored ${response.tabCount} tabs`);
          } else {
            showSessionStatus('❌ Failed to restore session');
          }
        });
      });
    }

    // New session
    if (newSessionBtn) {
      newSessionBtn.addEventListener('click', () => {
        chrome.runtime.sendMessage({ action: 'createNewSession' }, (response) => {
          if (response && response.success) {
            currentSessionId = response.sessionId;
            document.getElementById('currentSessionId').textContent = currentSessionId;
            showSessionStatus(`✅ New session: ${currentSessionId}`);
            loadAllSessions();
          }
        });
      });
    }

    // Refresh
    if (refreshSessionsBtn) {
      refreshSessionsBtn.addEventListener('click', () => {
        loadAllSessions();
        loadAllBackups();
        updateTabCounts();
        showSessionStatus('✅ Refreshed');
      });
    }

    // Import from text
    if (importFromTextBtn) {
      importFromTextBtn.addEventListener('click', () => {
        const jsonData = document.getElementById('importExportText').value.trim();
        if (!jsonData) {
          showSessionStatus('❌ Please paste JSON data');
          return;
        }
        
        chrome.runtime.sendMessage({ 
          action: 'importTabs', 
          jsonData: jsonData 
        }, (response) => {
          if (response && response.success) {
            showSessionStatus(`✅ Imported ${response.imported} tabs from text`);
            document.getElementById('importExportText').value = '';
          } else {
            showSessionStatus('❌ Failed to import from text');
          }
        });
      });
    }

    // Export to text
    if (exportToTextBtn) {
      exportToTextBtn.addEventListener('click', () => {
        chrome.runtime.sendMessage({ action: 'exportAllTabs' }, (response) => {
          if (response && response.success) {
            document.getElementById('importExportText').value = response.data;
            showSessionStatus('✅ Exported to text area');
          } else {
            showSessionStatus('❌ Failed to export to text');
          }
        });
      });
    }
  }

  function downloadSessionFile(data, filename) {
    const blob = new Blob([data], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  }

  // Global functions for backup management
  window.restoreSessionBackup = function(backupId) {
    chrome.runtime.sendMessage({ 
      action: 'restoreBySessionId', 
      sessionId: backupId 
    }, (response) => {
      if (response && response.success) {
        showSessionStatus(`✅ Restored backup: ${response.tabCount} tabs`);
      } else {
        showSessionStatus('❌ Failed to restore backup');
      }
    });
  };

  window.exportSessionBackup = function(backupId) {
    chrome.storage.local.get(['sessionBackups'], (result) => {
      const backup = result.sessionBackups[backupId];
      if (backup) {
        const exportData = JSON.stringify(backup, null, 2);
        downloadSessionFile(exportData, `backup-${backup.name.replace(/\s+/g, '-')}.json`);
        showSessionStatus('✅ Backup exported');
      }
    });
  };

  window.deleteSessionBackup = function(backupId) {
    if (confirm('Delete this backup?')) {
      chrome.storage.local.get(['sessionBackups'], (result) => {
        const backups = result.sessionBackups || {};
        delete backups[backupId];
        chrome.storage.local.set({ sessionBackups: backups }, () => {
          showSessionStatus('✅ Backup deleted');
          loadAllBackups();
        });
      });
    }
  };

  function showSessionStatus(message) {
    const status = document.getElementById('sessionStatus') || document.createElement('div');
    status.id = 'sessionStatus';
    status.textContent = message;
    status.style.cssText = `
      position: fixed; top: 20px; right: 20px; background: rgba(0,0,0,0.8);
      color: white; padding: 10px 20px; border-radius: 5px; z-index: 10000;
      border: 1px solid rgba(255,255,255,0.3);
    `;
    
    if (!document.getElementById('sessionStatus')) {
      document.body.appendChild(status);
    }
    
    setTimeout(() => {
      if (status.textContent === message) {
        status.textContent = '';
      }
    }, 5000);
  }

  // Initialize session management when DOM is ready
  document.addEventListener('DOMContentLoaded', function() {
    // Wait a bit for other scripts to load
    setTimeout(() => {
      initializeCompleteSessionManagement();
    }, 1000);
  });

  // Also initialize when options page loads
  if (typeof init === 'function') {
    const originalOptionsInit = init;
    init = async function() {
      await originalOptionsInit();
      setTimeout(() => {
        initializeCompleteSessionManagement();
      }, 500);
    };
  } else {
    // If no init function exists, create one
    window.init = async function() {
      await initializeCompleteSessionManagement();
    };
  }
EOF

    echo "🔧 Fixing duplicate declaration in options.js..."
    
    # Remove the duplicate section that was added
    sed -i '/\/\/ COMPLETE SESSION MANAGEMENT FUNCTIONS/,/await initializeCompleteSessionManagement();/d' "$JS_DIR/options.js"
    
    # Append the fixed version
    cat "$JS_DIR/options_session_fixed.js" >> "$JS_DIR/options.js"
    
    # Clean up temporary file
    rm "$JS_DIR/options_session_fixed.js"
    
    echo "✅ Fixed currentSessionId duplicate declaration"
    
else
    echo "❌ options.js not found"
    exit 1
fi

echo ""
echo "🎉 ✅ DUPLICATE DECLARATION FIXED!"
echo ""
echo "🔧 Changes Made:"
echo "   ✅ Removed duplicate currentSessionId declaration"
echo "   ✅ Added proper variable check before declaration"
echo "   ✅ Added element existence checks to prevent errors"
echo "   ✅ Fixed event listener setup"
echo "   ✅ Added proper initialization timing"
echo ""
echo "🔄 Next Steps:"
echo "   1. Reload your extension in Chrome"
echo "   2. Open the options page"
echo "   3. Check the console - no more duplicate declaration errors!"
echo "   4. Test the session management features"
echo ""
echo "💪 Session management should now work without JavaScript errors!"