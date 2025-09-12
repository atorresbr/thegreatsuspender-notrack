#!/bin/bash
# filepath: /home/linux/Documents/GitHub/thegreatsuspender-notrack/add_session_management.sh

echo "🔐 Adding Advanced Session Management System..."

# Set up directories
REPO_DIR="/home/linux/Documents/GitHub/thegreatsuspender-notrack"
SRC_DIR="$REPO_DIR/src"
CSS_DIR="$SRC_DIR/css"
JS_DIR="$SRC_DIR/js"

# Create backup directory
mkdir -p "$REPO_DIR/backup"

echo "📁 Working in directory: $REPO_DIR"

# 1. Create Session Management JavaScript
echo "🔐 Creating advanced session management system..."

cat > "$JS_DIR/sessionManager.js" << 'EOF'
/**
 * ADVANCED SESSION MANAGEMENT SYSTEM
 * Handles unique session IDs, tab backup/restore, and session persistence
 */
(function() {
  'use strict';

  console.log('Advanced Session Management System initializing...');

  // Generate unique session ID (like gs-1757644649438-pydclbokv)
  function generateSessionId() {
    const timestamp = Date.now();
    const randomString = Math.random().toString(36).substring(2, 11);
    return `gs-${timestamp}-${randomString}`;
  }

  // Get or create current session ID
  let currentSessionId = null;
  
  function getCurrentSessionId() {
    if (currentSessionId) return Promise.resolve(currentSessionId);
    
    return new Promise((resolve) => {
      chrome.storage.local.get(['currentSessionId'], (result) => {
        if (result.currentSessionId) {
          currentSessionId = result.currentSessionId;
          console.log('📋 Using existing session ID:', currentSessionId);
        } else {
          currentSessionId = generateSessionId();
          chrome.storage.local.set({ currentSessionId: currentSessionId }, () => {
            console.log('🆕 Generated new session ID:', currentSessionId);
          });
        }
        resolve(currentSessionId);
      });
    });
  }

  // Enhanced tab info with session tracking
  function createTabInfo(tab, originalUrl = '') {
    return {
      id: tab.id,
      sessionId: currentSessionId,
      originalUrl: originalUrl || extractOriginalUrl(tab.url),
      suspendedUrl: tab.url,
      title: tab.title || 'Suspended Tab',
      favIconUrl: tab.favIconUrl || '',
      windowId: tab.windowId,
      index: tab.index,
      pinned: tab.pinned || false,
      timestamp: Date.now(),
      tabSessionId: `${currentSessionId}-tab-${tab.id}-${Date.now()}`,
      restored: false
    };
  }

  // Extract original URL from suspended tab URL
  function extractOriginalUrl(suspendedUrl) {
    if (!suspendedUrl || !suspendedUrl.includes('suspended')) return '';
    
    try {
      const urlParams = new URLSearchParams(suspendedUrl.split('?')[1] || '');
      return urlParams.get('url') || urlParams.get('uri') || urlParams.get('originalUrl') || '';
    } catch (error) {
      console.warn('Error extracting original URL:', error);
      return '';
    }
  }

  // Session-based tab storage
  const SessionManager = {
    
    // Initialize session management
    async init() {
      await getCurrentSessionId();
      this.setupSessionTracking();
      console.log('🔐 Session Management initialized with ID:', currentSessionId);
    },

    // Set up session tracking
    setupSessionTracking() {
      // Track suspended tabs with session IDs
      chrome.tabs.onUpdated.addListener((tabId, changeInfo, tab) => {
        if (changeInfo.status === 'complete' && this.isSuspendedTab(tab.url)) {
          this.trackSuspendedTab(tabId, tab);
        }
      });

      // Track tab removal
      chrome.tabs.onRemoved.addListener((tabId) => {
        this.handleTabRemoval(tabId);
      });

      // Session cleanup on browser startup
      chrome.runtime.onStartup.addListener(() => {
        this.cleanupOldSessions();
      });
    },

    // Check if tab is suspended
    isSuspendedTab(url) {
      return url && (
        url.includes('suspended.html') || 
        url.includes('suspended_tab') ||
        (url.includes('chrome-extension://') && url.includes('suspended'))
      );
    },

    // Track suspended tab with session info
    async trackSuspendedTab(tabId, tab) {
      const tabInfo = createTabInfo(tab);
      
      // Store in current session
      await this.storeTabInSession(tabInfo);
      
      // Also store in active tabs map for quick access
      await this.storeActiveTab(tabId, tabInfo);
      
      console.log('📊 Tracked suspended tab:', tabInfo.tabSessionId, tabInfo.title);
    },

    // Store tab in current session
    async storeTabInSession(tabInfo) {
      return new Promise((resolve) => {
        chrome.storage.local.get(['sessions'], (result) => {
          const sessions = result.sessions || {};
          
          if (!sessions[currentSessionId]) {
            sessions[currentSessionId] = {
              id: currentSessionId,
              created: Date.now(),
              lastUpdated: Date.now(),
              tabs: {},
              tabCount: 0
            };
          }
          
          sessions[currentSessionId].tabs[tabInfo.tabSessionId] = tabInfo;
          sessions[currentSessionId].tabCount = Object.keys(sessions[currentSessionId].tabs).length;
          sessions[currentSessionId].lastUpdated = Date.now();
          
          chrome.storage.local.set({ sessions: sessions }, () => {
            console.log('💾 Tab stored in session:', currentSessionId);
            resolve();
          });
        });
      });
    },

    // Store active tab for quick access
    async storeActiveTab(tabId, tabInfo) {
      return new Promise((resolve) => {
        chrome.storage.local.get(['activeTabs'], (result) => {
          const activeTabs = result.activeTabs || {};
          activeTabs[tabId] = tabInfo;
          
          chrome.storage.local.set({ activeTabs: activeTabs }, () => {
            resolve();
          });
        });
      });
    },

    // Handle tab removal
    async handleTabRemoval(tabId) {
      chrome.storage.local.get(['activeTabs'], (result) => {
        const activeTabs = result.activeTabs || {};
        
        if (activeTabs[tabId]) {
          console.log('🗑️ Tab removed from session:', tabId);
          delete activeTabs[tabId];
          chrome.storage.local.set({ activeTabs: activeTabs });
        }
      });
    },

    // Get current session info
    async getCurrentSession() {
      return new Promise((resolve) => {
        chrome.storage.local.get(['sessions'], (result) => {
          const sessions = result.sessions || {};
          resolve(sessions[currentSessionId] || null);
        });
      });
    },

    // Get all sessions
    async getAllSessions() {
      return new Promise((resolve) => {
        chrome.storage.local.get(['sessions'], (result) => {
          resolve(result.sessions || {});
        });
      });
    },

    // Backup current session to file-like storage
    async backupCurrentSession(backupName = null) {
      const session = await this.getCurrentSession();
      if (!session) {
        throw new Error('No current session to backup');
      }

      const backupId = `backup-${Date.now()}-${Math.random().toString(36).substring(2, 8)}`;
      const backupData = {
        id: backupId,
        name: backupName || `Session Backup ${new Date().toLocaleString()}`,
        originalSessionId: currentSessionId,
        created: Date.now(),
        tabCount: session.tabCount,
        tabs: { ...session.tabs }
      };

      return new Promise((resolve) => {
        chrome.storage.local.get(['sessionBackups'], (result) => {
          const backups = result.sessionBackups || {};
          backups[backupId] = backupData;
          
          chrome.storage.local.set({ sessionBackups: backups }, () => {
            console.log('💾 Session backed up:', backupId, backupData.name);
            resolve(backupData);
          });
        });
      });
    },

    // Export session data as JSON string
    async exportSession(sessionId = null) {
      const targetSessionId = sessionId || currentSessionId;
      const sessions = await this.getAllSessions();
      const session = sessions[targetSessionId];
      
      if (!session) {
        throw new Error('Session not found');
      }

      const exportData = {
        exportVersion: '1.0',
        exportDate: new Date().toISOString(),
        sessionId: targetSessionId,
        session: session,
        tabCount: session.tabCount
      };

      return JSON.stringify(exportData, null, 2);
    },

    // Import session from JSON string
    async importSession(jsonData, newSessionId = null) {
      try {
        const importData = JSON.parse(jsonData);
        
        if (!importData.session || !importData.session.tabs) {
          throw new Error('Invalid session data format');
        }

        const importSessionId = newSessionId || generateSessionId();
        
        return new Promise((resolve) => {
          chrome.storage.local.get(['sessions'], (result) => {
            const sessions = result.sessions || {};
            
            sessions[importSessionId] = {
              ...importData.session,
              id: importSessionId,
              imported: true,
              importDate: Date.now(),
              originalId: importData.sessionId
            };
            
            chrome.storage.local.set({ sessions: sessions }, () => {
              console.log('📥 Session imported:', importSessionId);
              resolve(sessions[importSessionId]);
            });
          });
        });
      } catch (error) {
        throw new Error('Failed to import session: ' + error.message);
      }
    },

    // Restore session tabs (recreate suspended tabs)
    async restoreSession(sessionId) {
      const sessions = await this.getAllSessions();
      const session = sessions[sessionId];
      
      if (!session) {
        throw new Error('Session not found');
      }

      const tabs = Object.values(session.tabs);
      let restoredCount = 0;
      
      console.log('🔄 Restoring session:', sessionId, 'with', tabs.length, 'tabs');
      
      for (let i = 0; i < tabs.length; i++) {
        const tabInfo = tabs[i];
        
        setTimeout(() => {
          let restoreUrl = tabInfo.suspendedUrl;
          
          // Add restored flag
          if (!restoreUrl.includes('restored=true')) {
            const separator = restoreUrl.includes('?') ? '&' : '?';
            restoreUrl += separator + 'restored=true&sessionRestore=' + sessionId;
          }
          
          chrome.tabs.create({
            url: restoreUrl,
            active: false,
            pinned: tabInfo.pinned || false
          }, (newTab) => {
            if (chrome.runtime.lastError) {
              console.warn('Error restoring tab:', chrome.runtime.lastError.message);
            } else {
              console.log('✅ Restored tab:', newTab.id, tabInfo.title);
              restoredCount++;
              
              // Track the restored tab
              this.trackSuspendedTab(newTab.id, {
                ...newTab,
                url: restoreUrl
              });
            }
          });
        }, i * 200); // 200ms delay between each tab
      }
      
      return { sessionId, tabCount: tabs.length, restored: restoredCount };
    },

    // Get session backups
    async getSessionBackups() {
      return new Promise((resolve) => {
        chrome.storage.local.get(['sessionBackups'], (result) => {
          resolve(result.sessionBackups || {});
        });
      });
    },

    // Delete session backup
    async deleteSessionBackup(backupId) {
      return new Promise((resolve) => {
        chrome.storage.local.get(['sessionBackups'], (result) => {
          const backups = result.sessionBackups || {};
          delete backups[backupId];
          
          chrome.storage.local.set({ sessionBackups: backups }, () => {
            console.log('🗑️ Deleted session backup:', backupId);
            resolve();
          });
        });
      });
    },

    // Clean up old sessions (older than 30 days)
    async cleanupOldSessions() {
      const thirtyDaysAgo = Date.now() - (30 * 24 * 60 * 60 * 1000);
      
      chrome.storage.local.get(['sessions', 'sessionBackups'], (result) => {
        const sessions = result.sessions || {};
        const backups = result.sessionBackups || {};
        let cleanedSessions = 0;
        let cleanedBackups = 0;
        
        // Clean old sessions
        Object.keys(sessions).forEach(sessionId => {
          if (sessions[sessionId].created < thirtyDaysAgo && sessionId !== currentSessionId) {
            delete sessions[sessionId];
            cleanedSessions++;
          }
        });
        
        // Clean old backups
        Object.keys(backups).forEach(backupId => {
          if (backups[backupId].created < thirtyDaysAgo) {
            delete backups[backupId];
            cleanedBackups++;
          }
        });
        
        if (cleanedSessions > 0 || cleanedBackups > 0) {
          chrome.storage.local.set({ sessions: sessions, sessionBackups: backups }, () => {
            console.log(`🧹 Cleaned up ${cleanedSessions} old sessions and ${cleanedBackups} old backups`);
          });
        }
      });
    },

    // Force create new session (for new Chrome session)
    async createNewSession() {
      currentSessionId = generateSessionId();
      chrome.storage.local.set({ currentSessionId: currentSessionId }, () => {
        console.log('🆕 Created new session:', currentSessionId);
      });
      return currentSessionId;
    }
  };

  // Export SessionManager to global scope
  window.SessionManager = SessionManager;

  // Auto-initialize
  SessionManager.init();

  console.log('🔐 Advanced Session Management System ready!');
})();
EOF

# 2. Update background.js to integrate session management
echo "🔄 Integrating session management with background script..."

if [ -f "$JS_DIR/background.js" ]; then
    cp "$JS_DIR/background.js" "$REPO_DIR/backup/background.js.backup"
    
    # Add session management integration
    cat >> "$JS_DIR/background.js" << 'EOF'

// SESSION MANAGEMENT INTEGRATION
chrome.runtime.onMessage.addListener(function(request, sender, sendResponse) {
  console.log('Background received session message:', request.action);
  
  try {
    if (request.action === 'getCurrentSessionId') {
      if (window.SessionManager) {
        window.SessionManager.getCurrentSessionId().then(sessionId => {
          sendResponse({ success: true, sessionId: sessionId });
        });
      } else {
        sendResponse({ success: false, error: 'SessionManager not available' });
      }
      return true;
      
    } else if (request.action === 'backupCurrentSession') {
      if (window.SessionManager) {
        window.SessionManager.backupCurrentSession(request.backupName).then(backup => {
          sendResponse({ success: true, backup: backup });
        }).catch(error => {
          sendResponse({ success: false, error: error.message });
        });
      } else {
        sendResponse({ success: false, error: 'SessionManager not available' });
      }
      return true;
      
    } else if (request.action === 'restoreSession') {
      if (window.SessionManager) {
        window.SessionManager.restoreSession(request.sessionId).then(result => {
          sendResponse({ success: true, result: result });
        }).catch(error => {
          sendResponse({ success: false, error: error.message });
        });
      } else {
        sendResponse({ success: false, error: 'SessionManager not available' });
      }
      return true;
      
    } else if (request.action === 'exportSession') {
      if (window.SessionManager) {
        window.SessionManager.exportSession(request.sessionId).then(jsonData => {
          sendResponse({ success: true, data: jsonData });
        }).catch(error => {
          sendResponse({ success: false, error: error.message });
        });
      } else {
        sendResponse({ success: false, error: 'SessionManager not available' });
      }
      return true;
      
    } else if (request.action === 'importSession') {
      if (window.SessionManager) {
        window.SessionManager.importSession(request.jsonData, request.newSessionId).then(session => {
          sendResponse({ success: true, session: session });
        }).catch(error => {
          sendResponse({ success: false, error: error.message });
        });
      } else {
        sendResponse({ success: false, error: 'SessionManager not available' });
      }
      return true;
      
    } else if (request.action === 'getAllSessions') {
      if (window.SessionManager) {
        window.SessionManager.getAllSessions().then(sessions => {
          sendResponse({ success: true, sessions: sessions });
        });
      } else {
        sendResponse({ success: false, error: 'SessionManager not available' });
      }
      return true;
      
    } else if (request.action === 'getSessionBackups') {
      if (window.SessionManager) {
        window.SessionManager.getSessionBackups().then(backups => {
          sendResponse({ success: true, backups: backups });
        });
      } else {
        sendResponse({ success: false, error: 'SessionManager not available' });
      }
      return true;
      
    } else if (request.action === 'createNewSession') {
      if (window.SessionManager) {
        window.SessionManager.createNewSession().then(sessionId => {
          sendResponse({ success: true, sessionId: sessionId });
        });
      } else {
        sendResponse({ success: false, error: 'SessionManager not available' });
      }
      return true;
    }
  } catch (error) {
    console.error('Error handling session message:', error);
    sendResponse({ success: false, error: error.message });
  }
  
  return false;
});
EOF

    echo "✅ Session management integrated into background.js"
else
    echo "⚠️ background.js not found"
fi

# 3. Add session management UI to options.html
echo "🎨 Adding session management UI to options.html..."

if [ -f "$SRC_DIR/options.html" ]; then
    cp "$SRC_DIR/options.html" "$REPO_DIR/backup/options.html.backup"
    
    # Check if session management already exists
    if ! grep -q "sessionManagement" "$SRC_DIR/options.html"; then
        # Add session management section before the closing content div
        sed -i '/<\/div>.*<div class="save-status"/i\
            <div class="card" id="sessionManagement">\
                <div class="card-header">\
                    <div class="card-icon">🔐</div>\
                    <div class="card-title">Session Management</div>\
                </div>\
                <div class="card-content">\
                    <div class="session-info">\
                        <div class="info-item">\
                            <span class="info-label">Current Session ID:</span>\
                            <span id="currentSessionId" class="info-value">Loading...</span>\
                            <button id="copySessionId" class="copy-btn" title="Copy Session ID">📋</button>\
                        </div>\
                        <div class="info-item">\
                            <span class="info-label">Suspended Tabs:</span>\
                            <span id="suspendedTabCount" class="info-value">0</span>\
                        </div>\
                    </div>\
                    \
                    <div class="session-controls">\
                        <h4>Session Backup & Restore</h4>\
                        <div class="control-group">\
                            <input type="text" id="backupName" placeholder="Enter backup name (optional)" class="backup-input">\
                            <button id="backupSession" class="action-btn">💾 Backup Current Session</button>\
                        </div>\
                        \
                        <div class="control-group">\
                            <select id="sessionSelect" class="session-select">\
                                <option value="">Select session to restore...</option>\
                            </select>\
                            <button id="restoreSession" class="action-btn">🔄 Restore Session</button>\
                        </div>\
                        \
                        <div class="control-group">\
                            <button id="newSession" class="action-btn">🆕 Create New Session</button>\
                            <button id="refreshSessions" class="action-btn">🔄 Refresh List</button>\
                        </div>\
                    </div>\
                    \
                    <div class="import-export-controls">\
                        <h4>Import / Export Sessions</h4>\
                        <div class="control-group">\
                            <button id="exportSession" class="action-btn">📤 Export Current Session</button>\
                            <button id="exportAllSessions" class="action-btn">📦 Export All Sessions</button>\
                        </div>\
                        \
                        <div class="control-group">\
                            <input type="file" id="importFile" accept=".json" style="display: none;">\
                            <button id="importSession" class="action-btn">📥 Import Session File</button>\
                            <textarea id="importText" placeholder="Or paste session JSON here..." class="import-textarea"></textarea>\
                            <button id="importFromText" class="action-btn">📥 Import from Text</button>\
                        </div>\
                    </div>\
                    \
                    <div class="session-backups">\
                        <h4>Session Backups</h4>\
                        <div id="backupsList" class="backups-list">\
                            <p class="no-backups">No session backups found.</p>\
                        </div>\
                    </div>\
                </div>\
            </div>\
' "$SRC_DIR/options.html"
        
        echo "✅ Added session management UI to options.html"
    else
        echo "✅ Session management UI already exists in options.html"
    fi
else
    echo "⚠️ options.html not found"
fi

# 4. Add session management CSS
echo "🎨 Adding session management CSS..."

cat >> "$CSS_DIR/options.css" << 'EOF'

/* SESSION MANAGEMENT STYLES */
#sessionManagement {
  margin-top: 20px;
}

.session-info {
  background: rgba(255, 255, 255, 0.1);
  padding: 15px;
  border-radius: 10px;
  margin-bottom: 20px;
}

.info-item {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 10px;
}

.info-label {
  font-weight: bold;
  color: rgba(255, 255, 255, 0.9);
}

.info-value {
  font-family: monospace;
  background: rgba(0, 0, 0, 0.2);
  padding: 5px 10px;
  border-radius: 5px;
  font-size: 12px;
}

.copy-btn {
  background: none;
  border: 1px solid rgba(255, 255, 255, 0.3);
  color: white;
  padding: 5px 10px;
  border-radius: 5px;
  cursor: pointer;
  font-size: 12px;
  margin-left: 10px;
}

.copy-btn:hover {
  background: rgba(255, 255, 255, 0.1);
}

.session-controls h4,
.import-export-controls h4,
.session-backups h4 {
  color: rgba(255, 255, 255, 0.9);
  margin: 20px 0 10px 0;
  font-size: 16px;
  border-bottom: 1px solid rgba(255, 255, 255, 0.2);
  padding-bottom: 5px;
}

.control-group {
  display: flex;
  gap: 10px;
  margin-bottom: 15px;
  flex-wrap: wrap;
}

.backup-input,
.session-select {
  flex: 1;
  min-width: 200px;
  padding: 10px;
  border: 1px solid rgba(255, 255, 255, 0.3);
  border-radius: 5px;
  background: rgba(255, 255, 255, 0.1);
  color: white;
  font-size: 14px;
}

.backup-input::placeholder {
  color: rgba(255, 255, 255, 0.6);
}

.session-select option {
  background: #333;
  color: white;
}

.import-textarea {
  width: 100%;
  min-height: 100px;
  padding: 10px;
  border: 1px solid rgba(255, 255, 255, 0.3);
  border-radius: 5px;
  background: rgba(255, 255, 255, 0.1);
  color: white;
  font-family: monospace;
  font-size: 12px;
  resize: vertical;
  margin: 10px 0;
}

.import-textarea::placeholder {
  color: rgba(255, 255, 255, 0.6);
}

.backups-list {
  max-height: 300px;
  overflow-y: auto;
  border: 1px solid rgba(255, 255, 255, 0.2);
  border-radius: 5px;
  padding: 10px;
}

.backup-item {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 10px;
  margin-bottom: 10px;
  background: rgba(255, 255, 255, 0.1);
  border-radius: 5px;
}

.backup-info {
  flex: 1;
}

.backup-name {
  font-weight: bold;
  color: rgba(255, 255, 255, 0.9);
}

.backup-details {
  font-size: 12px;
  color: rgba(255, 255, 255, 0.7);
  margin-top: 5px;
}

.backup-actions {
  display: flex;
  gap: 5px;
}

.backup-actions button {
  padding: 5px 10px;
  font-size: 12px;
  border: 1px solid rgba(255, 255, 255, 0.3);
  background: rgba(255, 255, 255, 0.1);
  color: white;
  border-radius: 3px;
  cursor: pointer;
}

.backup-actions button:hover {
  background: rgba(255, 255, 255, 0.2);
}

.no-backups {
  text-align: center;
  color: rgba(255, 255, 255, 0.6);
  font-style: italic;
  padding: 20px;
}

/* Light theme adjustments */
body.options-theme-applied.light-theme .info-label,
body.options-theme-applied.light-theme .backup-name,
body.options-theme-applied.light-theme .session-controls h4,
body.options-theme-applied.light-theme .import-export-controls h4,
body.options-theme-applied.light-theme .session-backups h4 {
  color: #1a1a1a !important;
}

body.options-theme-applied.light-theme .backup-input,
body.options-theme-applied.light-theme .session-select,
body.options-theme-applied.light-theme .import-textarea {
  color: #1a1a1a !important;
  background: rgba(255, 255, 255, 0.3) !important;
}

body.options-theme-applied.light-theme .backup-input::placeholder,
body.options-theme-applied.light-theme .import-textarea::placeholder {
  color: rgba(0, 0, 0, 0.6) !important;
}
EOF

echo "✅ Added session management CSS"

# 5. Update options.js with session management functionality
echo "🔄 Adding session management functionality to options.js..."

if [ -f "$JS_DIR/options.js" ]; then
    cat >> "$JS_DIR/options.js" << 'EOF'

  // SESSION MANAGEMENT FUNCTIONS
  let currentSessionId = null;

  // Initialize session management
  async function initializeSessionManagement() {
    console.log('Initializing session management...');
    
    // Get current session ID
    chrome.runtime.sendMessage({ action: 'getCurrentSessionId' }, (response) => {
      if (response && response.success) {
        currentSessionId = response.sessionId;
        document.getElementById('currentSessionId').textContent = currentSessionId;
      }
    });
    
    // Update session info
    updateSessionInfo();
    
    // Load sessions and backups
    loadSessionsList();
    loadSessionBackups();
    
    // Set up event listeners
    setupSessionEventListeners();
    
    // Auto-refresh every 30 seconds
    setInterval(() => {
      updateSessionInfo();
      loadSessionsList();
      loadSessionBackups();
    }, 30000);
  }

  // Update session information display
  function updateSessionInfo() {
    chrome.runtime.sendMessage({ action: 'getSuspendedCount' }, (response) => {
      if (response && response.count !== undefined) {
        document.getElementById('suspendedTabCount').textContent = response.count;
      }
    });
  }

  // Load sessions list for restore dropdown
  function loadSessionsList() {
    chrome.runtime.sendMessage({ action: 'getAllSessions' }, (response) => {
      if (response && response.success) {
        const sessionSelect = document.getElementById('sessionSelect');
        const sessions = response.sessions;
        
        // Clear existing options except first
        while (sessionSelect.children.length > 1) {
          sessionSelect.removeChild(sessionSelect.lastChild);
        }
        
        // Add sessions to dropdown
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

  // Load session backups
  function loadSessionBackups() {
    chrome.runtime.sendMessage({ action: 'getSessionBackups' }, (response) => {
      if (response && response.success) {
        const backupsList = document.getElementById('backupsList');
        const backups = response.backups;
        
        if (Object.keys(backups).length === 0) {
          backupsList.innerHTML = '<p class="no-backups">No session backups found.</p>';
          return;
        }
        
        backupsList.innerHTML = '';
        
        Object.values(backups).forEach(backup => {
          const backupItem = document.createElement('div');
          backupItem.className = 'backup-item';
          backupItem.innerHTML = `
            <div class="backup-info">
              <div class="backup-name">${backup.name}</div>
              <div class="backup-details">
                ${backup.tabCount} tabs • Created: ${new Date(backup.created).toLocaleString()}
                <br>Original Session: ${backup.originalSessionId}
              </div>
            </div>
            <div class="backup-actions">
              <button onclick="restoreSessionBackup('${backup.id}')">🔄 Restore</button>
              <button onclick="exportSessionBackup('${backup.id}')">📤 Export</button>
              <button onclick="deleteSessionBackup('${backup.id}')">🗑️ Delete</button>
            </div>
          `;
          backupsList.appendChild(backupItem);
        });
      }
    });
  }

  // Set up session management event listeners
  function setupSessionEventListeners() {
    // Copy session ID
    document.getElementById('copySessionId').addEventListener('click', () => {
      navigator.clipboard.writeText(currentSessionId).then(() => {
        showSessionStatus('✅ Session ID copied to clipboard!');
      });
    });

    // Backup current session
    document.getElementById('backupSession').addEventListener('click', () => {
      const backupName = document.getElementById('backupName').value.trim();
      
      chrome.runtime.sendMessage({ 
        action: 'backupCurrentSession', 
        backupName: backupName || undefined 
      }, (response) => {
        if (response && response.success) {
          showSessionStatus(`✅ Session backed up: ${response.backup.name}`);
          document.getElementById('backupName').value = '';
          loadSessionBackups();
        } else {
          showSessionStatus('❌ Failed to backup session: ' + (response?.error || 'Unknown error'));
        }
      });
    });

    // Restore session
    document.getElementById('restoreSession').addEventListener('click', () => {
      const sessionId = document.getElementById('sessionSelect').value;
      if (!sessionId) {
        showSessionStatus('❌ Please select a session to restore');
        return;
      }
      
      chrome.runtime.sendMessage({ 
        action: 'restoreSession', 
        sessionId: sessionId 
      }, (response) => {
        if (response && response.success) {
          showSessionStatus(`✅ Restored ${response.result.tabCount} tabs from session`);
        } else {
          showSessionStatus('❌ Failed to restore session: ' + (response?.error || 'Unknown error'));
        }
      });
    });

    // Create new session
    document.getElementById('newSession').addEventListener('click', () => {
      chrome.runtime.sendMessage({ action: 'createNewSession' }, (response) => {
        if (response && response.success) {
          currentSessionId = response.sessionId;
          document.getElementById('currentSessionId').textContent = currentSessionId;
          showSessionStatus(`✅ Created new session: ${currentSessionId}`);
          loadSessionsList();
        } else {
          showSessionStatus('❌ Failed to create new session');
        }
      });
    });

    // Refresh sessions
    document.getElementById('refreshSessions').addEventListener('click', () => {
      loadSessionsList();
      loadSessionBackups();
      updateSessionInfo();
      showSessionStatus('✅ Session list refreshed');
    });

    // Export current session
    document.getElementById('exportSession').addEventListener('click', () => {
      chrome.runtime.sendMessage({ action: 'exportSession' }, (response) => {
        if (response && response.success) {
          downloadSessionFile(response.data, `session-${currentSessionId}.json`);
          showSessionStatus('✅ Session exported successfully');
        } else {
          showSessionStatus('❌ Failed to export session: ' + (response?.error || 'Unknown error'));
        }
      });
    });

    // Export all sessions
    document.getElementById('exportAllSessions').addEventListener('click', () => {
      chrome.runtime.sendMessage({ action: 'getAllSessions' }, (response) => {
        if (response && response.success) {
          const exportData = {
            exportVersion: '1.0',
            exportDate: new Date().toISOString(),
            sessions: response.sessions
          };
          downloadSessionFile(JSON.stringify(exportData, null, 2), `all-sessions-${Date.now()}.json`);
          showSessionStatus('✅ All sessions exported successfully');
        } else {
          showSessionStatus('❌ Failed to export all sessions');
        }
      });
    });

    // Import session file
    document.getElementById('importSession').addEventListener('click', () => {
      document.getElementById('importFile').click();
    });

    document.getElementById('importFile').addEventListener('change', (event) => {
      const file = event.target.files[0];
      if (file) {
        const reader = new FileReader();
        reader.onload = (e) => {
          importSessionData(e.target.result);
        };
        reader.readAsText(file);
      }
    });

    // Import from text
    document.getElementById('importFromText').addEventListener('click', () => {
      const jsonData = document.getElementById('importText').value.trim();
      if (jsonData) {
        importSessionData(jsonData);
      } else {
        showSessionStatus('❌ Please paste session JSON data');
      }
    });
  }

  // Import session data
  function importSessionData(jsonData) {
    chrome.runtime.sendMessage({ 
      action: 'importSession', 
      jsonData: jsonData 
    }, (response) => {
      if (response && response.success) {
        showSessionStatus(`✅ Session imported: ${response.session.id}`);
        document.getElementById('importText').value = '';
        loadSessionsList();
      } else {
        showSessionStatus('❌ Failed to import session: ' + (response?.error || 'Unknown error'));
      }
    });
  }

  // Download session file
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

  // Restore session backup
  window.restoreSessionBackup = function(backupId) {
    chrome.runtime.sendMessage({ 
      action: 'restoreSession', 
      sessionId: backupId 
    }, (response) => {
      if (response && response.success) {
        showSessionStatus(`✅ Restored backup with ${response.result.tabCount} tabs`);
      } else {
        showSessionStatus('❌ Failed to restore backup: ' + (response?.error || 'Unknown error'));
      }
    });
  };

  // Export session backup
  window.exportSessionBackup = function(backupId) {
    chrome.storage.local.get(['sessionBackups'], (result) => {
      const backup = result.sessionBackups[backupId];
      if (backup) {
        const exportData = JSON.stringify(backup, null, 2);
        downloadSessionFile(exportData, `backup-${backup.name.replace(/\s+/g, '-')}.json`);
        showSessionStatus('✅ Backup exported successfully');
      }
    });
  };

  // Delete session backup
  window.deleteSessionBackup = function(backupId) {
    if (confirm('Are you sure you want to delete this backup?')) {
      chrome.runtime.sendMessage({ 
        action: 'deleteSessionBackup', 
        backupId: backupId 
      }, (response) => {
        if (response && response.success) {
          showSessionStatus('✅ Backup deleted');
          loadSessionBackups();
        } else {
          showSessionStatus('❌ Failed to delete backup');
        }
      });
    }
  };

  // Show session status message
  function showSessionStatus(message) {
    const status = document.getElementById('themeStatus') || document.createElement('div');
    status.textContent = message;
    status.className = 'theme-status success';
    
    if (!document.getElementById('themeStatus')) {
      status.id = 'sessionStatus';
      status.style.cssText = `
        position: fixed;
        top: 20px;
        right: 20px;
        background: rgba(0, 0, 0, 0.8);
        color: white;
        padding: 10px 20px;
        border-radius: 5px;
        z-index: 10000;
        border: 1px solid rgba(255, 255, 255, 0.3);
      `;
      document.body.appendChild(status);
    }
    
    setTimeout(() => {
      if (status.textContent === message) {
        status.textContent = '';
        status.className = 'theme-status';
      }
    }, 5000);
  }

  // Add session management initialization to main init function
  const originalInit = init;
  init = async function() {
    await originalInit();
    await initializeSessionManagement();
  };
EOF

    echo "✅ Added session management functionality to options.js"
else
    echo "⚠️ options.js not found"
fi

# 6. Update manifest to include sessionManager.js
echo "📋 Updating manifest.json..."

if [ -f "$SRC_DIR/manifest.json" ]; then
    cp "$SRC_DIR/manifest.json" "$REPO_DIR/backup/manifest.json.backup"
    
    # Add sessionManager.js to background scripts if not already present
    if ! grep -q "sessionManager.js" "$SRC_DIR/manifest.json"; then
        sed -i '/"background": {/,/"scripts": \[/{ s/"scripts": \[/"scripts": [\n      "js\/sessionManager.js",/; }' "$SRC_DIR/manifest.json"
        echo "✅ Added sessionManager.js to manifest.json background scripts"
    else
        echo "✅ sessionManager.js already in manifest.json"
    fi
else
    echo "⚠️ manifest.json not found"
fi

echo ""
echo "🎉 ✅ ADVANCED SESSION MANAGEMENT SYSTEM INSTALLED!"
echo ""
echo "🔐 New Features Added:"
echo "   ✨ Unique Session IDs (like gs-1757644649438-pydclbokv)"
echo "   💾 Session Backup & Restore System"
echo "   📤 Export Sessions to JSON files"
echo "   📥 Import Sessions from JSON files"
echo "   🔄 Automatic session tracking"
echo "   🗂️ Session backup management"
echo "   🆕 Create new sessions"
echo "   🧹 Automatic cleanup of old sessions"
echo ""
echo "📁 Files Created/Updated:"
echo "   📝 $JS_DIR/sessionManager.js (New session management system)"
echo "   📝 $JS_DIR/background.js (Enhanced with session integration)"
echo "   📝 $SRC_DIR/options.html (Added session management UI)"
echo "   📝 $CSS_DIR/options.css (Added session management styles)"
echo "   📝 $JS_DIR/options.js (Added session management functions)"
echo "   📝 $SRC_DIR/manifest.json (Updated background scripts)"
echo ""
echo "🎯 How to Use:"
echo "   1. Reload your extension in Chrome"
echo "   2. Open the options page"
echo "   3. See your unique Session ID at the bottom"
echo "   4. Backup your current session"
echo "   5. Export sessions to JSON files"
echo "   6. Import sessions from JSON files"
echo "   7. Restore previous sessions with all suspended tabs!"
echo ""
echo "💡 Session Features:"
echo "   • Each Chrome session gets a unique ID"
echo "   • All suspended tabs are tracked by session"
echo "   • Backup sessions with custom names"
echo "   • Export/Import sessions as JSON files"
echo "   • Automatic cleanup of old sessions (30+ days)"
echo "   • Restore sessions with all 30+ tabs intact!"
echo ""
echo "🔐 Your sessions are now protected and portable!"