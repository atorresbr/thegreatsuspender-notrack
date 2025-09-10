#!/bin/bash
# Script to fix Manifest V3 compatibility issues in The Great Suspender
# Run from the repository root directory

REPO_DIR="/home/linux/Documents/GitHub/thegreatsuspender-notrack"
SRC_DIR="$REPO_DIR/src"
JS_DIR="$SRC_DIR/js"

echo "Applying Manifest V3 compatibility fixes..."

# 1. Create/update manifest.json with all required permissions
echo "Updating manifest.json..."
cat > "$SRC_DIR/manifest.json" << 'EOF'
{
  "name": "__MSG_ext_extension_name__",
  "description": "__MSG_ext_extension_description__",
  "version": "7.1.10",
  "default_locale": "en",
  "manifest_version": 3,
  "minimum_chrome_version": "88",
  
  "permissions": [
    "tabs",
    "storage",
    "history",
    "unlimitedStorage",
    "contextMenus",
    "cookies",
    "favicon",
    "alarms",
    "scripting"
  ],
  
  "host_permissions": [
    "http://*/*",
    "https://*/*",
    "file://*/*"
  ],
  
  "storage": {
    "managed_schema": "managed-storage-schema.json"
  },
  
  "background": {
    "service_worker": "js/background-wrapper.js"
  },
  
  "content_scripts": [
    {
      "matches": ["http://*/*", "https://*/*", "file://*/*"],
      "js": ["js/contentscript.js"]
    }
  ],
  
  "action": {
    "default_title": "__MSG_ext_default_title__",
    "default_icon": {
      "16": "img/ic_suspendy_16x16.png",
      "32": "img/ic_suspendy_32x32.png"
    },
    "default_popup": "popup.html"
  },
  
  "options_page": "options.html",
  
  "icons": {
    "16": "img/ic_suspendy_16x16.png",
    "32": "img/ic_suspendy_32x32.png",
    "48": "img/ic_suspendy_48x48.png",
    "128": "img/ic_suspendy_128x128.png"
  },
  
  "web_accessible_resources": [{
    "resources": [
      "suspended.html",
      "css/*",
      "img/*",
      "js/*",
      "font/*"
    ],
    "matches": ["<all_urls>"]
  }],
  
  "content_security_policy": {
    "extension_pages": "script-src 'self'; object-src 'self'; child-src 'self'; connect-src 'self'; img-src 'self' data: chrome:; style-src 'self'; default-src 'self'"
  },
  
  "incognito": "split",
  
  "commands": {
    "1-suspend-tab": {
      "description": "__MSG_ext_cmd_toggle_tab_suspension_description__",
      "suggested_key": { "default": "Ctrl+Shift+S" }
    },
    "2-toggle-temp-whitelist-tab": {
      "description": "__MSG_ext_cmd_toggle_tab_pause_description__"
    },
    "2a-suspend-selected-tabs": {
      "description": "__MSG_ext_cmd_suspend_selected_tabs_description__"
    },
    "2b-unsuspend-selected-tabs": {
      "description": "__MSG_ext_cmd_unsuspend_selected_tabs_description__"
    },
    "3-suspend-active-window": {
      "description": "__MSG_ext_cmd_soft_suspend_active_window_description__"
    },
    "3b-force-suspend-active-window": {
      "description": "__MSG_ext_cmd_force_suspend_active_window_description__"
    },
    "4-unsuspend-active-window": {
      "description": "__MSG_ext_cmd_unsuspend_active_window_description__"
    },
    "4b-soft-suspend-all-windows": {
      "description": "__MSG_ext_cmd_soft_suspend_all_windows_description__"
    },
    "5-suspend-all-windows": {
      "description": "__MSG_ext_cmd_force_suspend_all_windows_description__"
    },
    "6-unsuspend-all-windows": {
      "description": "__MSG_ext_cmd_unsuspend_all_windows_description__"
    }
  }
}
EOF

# 2. Update gsManifestV3Adapter.js
echo "Creating compatibility adapter..."
cat > "$JS_DIR/gsManifestV3Adapter.js" << 'EOF'
/**
 * The Great Suspender - NoTrack
 * Manifest V3 Compatibility Adapter
 */
'use strict';

var gsManifestV3Adapter = (function() {
  
  // Add localStorage polyfill for service workers
  if (typeof localStorage === 'undefined') {
    self.localStorage = {
      _data: {},
      
      setItem: function(key, value) {
        this._data[key] = String(value);
        chrome.storage.local.set({[key]: String(value)});
      },
      
      getItem: function(key) {
        return this._data[key] === undefined ? null : this._data[key];
      },
      
      removeItem: function(key) {
        delete this._data[key];
        chrome.storage.local.remove(key);
      },
      
      clear: function() {
        this._data = {};
        chrome.storage.local.clear();
      },
      
      key: function(i) {
        const keys = Object.keys(this._data);
        return i >= keys.length ? null : keys[i];
      },
      
      get length() {
        return Object.keys(this._data).length;
      }
    };
    
    // Preload localStorage data from chrome.storage
    chrome.storage.local.get(null, function(items) {
      for (const key in items) {
        if (items.hasOwnProperty(key)) {
          localStorage._data[key] = items[key];
        }
      }
      console.log('localStorage polyfill initialized with', Object.keys(localStorage._data).length, 'items');
    });
  }
  
  // Provide a fake window object for scripts expecting DOM
  if (typeof window === 'undefined') {
    self.window = self;
    self.document = {
      createElement: function() {
        return {
          style: {},
          setAttribute: function() {},
          appendChild: function() {},
          addEventListener: function() {},
          removeEventListener: function() {},
        };
      },
      addEventListener: function() {},
      removeEventListener: function() {}
    };
    
    // Add online/offline event handlers here at initialization time
    self.addEventListener('online', function() {
      if (typeof gsUtils !== 'undefined' && typeof gsStorage !== 'undefined') {
        gsUtils.log('background', 'Internet is online.');
        //restart timer on all normal tabs
        if (gsStorage.getOption(gsStorage.IGNORE_WHEN_OFFLINE)) {
          if (typeof tgs !== 'undefined' && typeof tgs.resetAutoSuspendTimerForAllTabs === 'function') {
            tgs.resetAutoSuspendTimerForAllTabs();
          }
        }
        if (typeof tgs !== 'undefined' && typeof tgs.setIconStatusForActiveTab === 'function') {
          tgs.setIconStatusForActiveTab();
        }
      }
    });
    
    self.addEventListener('offline', function() {
      if (typeof gsUtils !== 'undefined') {
        gsUtils.log('background', 'Internet is offline.');
        if (typeof tgs !== 'undefined' && typeof tgs.setIconStatusForActiveTab === 'function') {
          tgs.setIconStatusForActiveTab();
        }
      }
    });
  }
  
  // FIX 1: Make sure chrome.extension APIs are patched globally
  // This ensures chrome.extension.getURL is available everywhere
  if (!chrome.extension) {
    chrome.extension = {};
  }
  if (!chrome.extension.getURL) {
    chrome.extension.getURL = chrome.runtime.getURL;
  }
  if (!chrome.extension.getBackgroundPage) {
    chrome.extension.getBackgroundPage = function() {
    console.warn('chrome.extension.getBackgroundPage is not available in Manifest V3');
      return self;
    };
  }
  if (!chrome.extension.getViews) {
    chrome.extension.getViews = function() {
      console.warn('chrome.extension.getViews is not available in Manifest V3');
      return [];
    };
  }
  if (!chrome.extension.isAllowedIncognitoAccess) {
    chrome.extension.isAllowedIncognitoAccess = chrome.runtime.isAllowedIncognitoAccess;
  }
  if (!chrome.extension.isAllowedFileSchemeAccess) {
    chrome.extension.isAllowedFileSchemeAccess = chrome.runtime.isAllowedFileSchemeAccess;
  }
  
  // Add inIncognitoContext property
  if (chrome.extension && !('inIncognitoContext' in chrome.extension)) {
    Object.defineProperty(chrome.extension, 'inIncognitoContext', {
      get: function() {
        return false;
      }
    });
  }
  
  // FIX 2: Add chrome.tabs.executeScript compatibility with chrome.scripting
  // This requires the "scripting" permission in manifest.json
  if (chrome.tabs && !chrome.tabs.executeScript && chrome.scripting) {
    chrome.tabs.executeScript = function(tabId, details, callback) {
      // Handle the case where tabId is actually the details object (optional tabId signature)
      if (typeof tabId === 'object' && !details) {
        details = tabId;
        tabId = null;
      }
      
      const target = {
        tabId: tabId || chrome.tabs.TAB_ID_NONE
      };
      
      if (details.frameId !== undefined) {
        target.frameIds = [details.frameId];
      }
      
      const injection = {
        target: target,
        func: details.code ? new Function(details.code) : undefined,
        files: details.file ? [details.file] : undefined,
        injectImmediately: true
      };
      
      try {
        chrome.scripting.executeScript(injection, (results) => {
          if (callback) {
            callback(results && results.map(r => r.result));
          }
        });
      } catch (error) {
        console.error('executeScript error:', error);
        if (callback) callback([]);
      }
    };
  }
  
  // Replace browserAction with action
  if (chrome.action && !chrome.browserAction) {
    chrome.browserAction = {};
    chrome.browserAction.setIcon = chrome.action.setIcon;
    chrome.browserAction.setTitle = chrome.action.setTitle;
    chrome.browserAction.setBadgeText = chrome.action.setBadgeText;
    chrome.browserAction.setBadgeBackgroundColor = chrome.action.setBadgeBackgroundColor;
    chrome.browserAction.getPopup = chrome.action.getPopup;
    chrome.browserAction.setPopup = chrome.action.setPopup;
  }
  
  // Store context menu click handlers
  const contextMenuHandlers = {};
  
  // Replace onclick parameter with storing the handler and using onClicked event
  const originalContextMenusCreate = chrome.contextMenus.create;
  chrome.contextMenus.create = function(createProperties, callback) {
    // Store the onclick handler if it exists
    if (createProperties.onclick) {
      const handler = createProperties.onclick;
      
      // Ensure we have an ID for the menu item
      if (!createProperties.id) {
        const titlePart = createProperties.title 
          ? createProperties.title.substring(0, 20).replace(/[^\w]/g, '_')
          : '';
        const contextPart = createProperties.contexts 
          ? createProperties.contexts.join('_')
          : '';
        createProperties.id = `${titlePart}_${contextPart}_${Math.random().toString(36).substring(2, 8)}`;
      }
      
      // Store the handler with the ID
      contextMenuHandlers[createProperties.id] = handler;
      
      // Remove the onclick property
      delete createProperties.onclick;
    }
    
    // Ensure separators have type property and other items have title
    if (createProperties.type === 'separator') {
      // This is fine - separators don't need titles
    } else if (!createProperties.title) {
      // All non-separator items must have titles
      createProperties.title = createProperties.id || 'Menu Item';
    }
    
    try {
      return originalContextMenusCreate(createProperties, callback);
    } catch (error) {
      console.error('Context menu creation error:', error, 'for item:', createProperties);
      return null;
    }
  };
  
  // Set up the onClicked listener if it's not already set up
  if (!chrome.contextMenus.__onClickedListenerAdded) {
    chrome.contextMenus.onClicked.addListener((info, tab) => {
      if (contextMenuHandlers[info.menuItemId]) {
        contextMenuHandlers[info.menuItemId](info, tab);
      }
    });
    chrome.contextMenus.__onClickedListenerAdded = true;
  }
  
  return {
    saveState: function(key, value) {
      chrome.storage.local.set({['gsm3_' + key]: value});
    },
    loadState: function(key, callback) {
      chrome.storage.local.get(['gsm3_' + key], function(result) {
        callback(result['gsm3_' + key]);
      });
    }
  };
})();

// Initialize the adapter right away
gsManifestV3Adapter;
console.log('Manifest V3 adapter loaded with compatibility layers');
EOF

# 3. Create background-wrapper.js
echo "Creating service worker wrapper..."
cat > "$JS_DIR/background-wrapper.js" << 'EOF'
/**
 * The Great Suspender - NoTrack
 * Background Service Worker Wrapper for Manifest V3
 */
'use strict';

// Global error handlers
self.addEventListener('error', function(event) {
  console.error('Global error:', event.message, event.filename, event.lineno);
});

self.addEventListener('unhandledrejection', function(event) {
  console.error('Unhandled rejection:', event.reason);
});

// Immediate patch for chrome.extension APIs before anything else runs
if (!chrome.extension) {
  chrome.extension = {};
}
chrome.extension.getURL = chrome.runtime.getURL;
chrome.extension.getBackgroundPage = function() {
  console.log('chrome.extension.getBackgroundPage is not available in Manifest V3');
  return self;
};
chrome.extension.getViews = function() {
  console.log('chrome.extension.getViews is not available in Manifest V3');
  return [];
};
chrome.extension.isAllowedIncognitoAccess = chrome.runtime.isAllowedIncognitoAccess;
chrome.extension.isAllowedFileSchemeAccess = chrome.runtime.isAllowedFileSchemeAccess;
Object.defineProperty(chrome.extension, 'inIncognitoContext', {
  get: function() {
    return false;
  }
});

// Now import our compatibility adapter
importScripts('gsManifestV3Adapter.js');

console.log('Adapter loaded, localStorage available:', typeof localStorage !== 'undefined');
console.log('chrome.extension.getURL available:', typeof chrome.extension.getURL === 'function');

// Create stubs for important objects to avoid "undefined" errors
self.gsTabQueue = self.gsTabQueue || {
  queueTabAsPromise: function() { return Promise.resolve(); },
  unqueueTab: function() { return Promise.resolve(); },
  queueTabForSuspension: function() { return Promise.resolve(); },
  queueTabForDiscarding: function() { return Promise.resolve(); },
  requestProcessQueue: function() { return Promise.resolve(); }
};

self.gsFavicon = self.gsFavicon || {
  fetchFaviconDataUrl: function() {
    return Promise.resolve('');
  },
  buildFaviconMetaData: function() {
    return Promise.resolve({
      favIconUrl: '',
      normalisedDataUrl: '',
      transparentDataUrl: ''
    });
  },
  getFaviconMetaData: function() {
    return Promise.resolve({
      favIconUrl: '',
      normalisedDataUrl: '',
      transparentDataUrl: ''
    });
  },
  generateFaviconFromUrl: function() {
    return Promise.resolve('');
  }
};

// Import all background scripts in the same order as the original manifest
importScripts(
  'gsUtils.js',
  'gsChrome.js',
  'gsStorage.js',
  'db.js',
  'gsIndexedDb.js',
  'gsMessages.js',
  'gsSession.js',
  'gsTabQueue.js',  // Make sure this comes before gsTabDiscardManager
  'gsTabCheckManager.js',
  'gsFavicon.js',
  'gsCleanScreencaps.js',
  'gsTabSuspendManager.js',
  'gsTabDiscardManager.js',
  'gsSuspendedTab.js',
  'background.js'
);

// Service worker lifecycle events
self.addEventListener('install', (event) => {
  self.skipWaiting();
  console.log('Great Suspender service worker installed');
});

self.addEventListener('activate', (event) => {
  console.log('Great Suspender service worker activated');
  event.waitUntil(clients.claim());
});

// Ensure service worker stays alive with periodic alarms
chrome.alarms.create('keepAlive', { periodInMinutes: 1 });
chrome.alarms.create('checkTabs', { periodInMinutes: 1 });

chrome.alarms.onAlarm.addListener((alarm) => {
  if (alarm.name === 'checkTabs') {
    // This simulates the periodic checks that the original extension did with setInterval
    if (typeof gsTabCheckManager !== 'undefined' && gsTabCheckManager.performTabChecks) {
      gsTabCheckManager.performTabChecks();
    }
  }
});

// Debugging helper
console.log('Great Suspender background wrapper loaded');
EOF

# 4. Create patch for gsTabDiscardManager.js
echo "Creating patch for gsTabDiscardManager.js..."
mkdir -p "$REPO_DIR/patches"
cat > "$REPO_DIR/patches/gsTabDiscardManager.js.patch" << 'EOF'
--- gsTabDiscardManager.js
+++ gsTabDiscardManager.js
@@ -43,7 +43,10 @@
   },
 
   unqueueTabForDiscard: function(tabId) {
-    return gsTabQueue.unqueueTab(tabId, QUEUE_ID);
+    if (!gsTabQueue || typeof gsTabQueue.unqueueTab !== 'function') {
+      console.warn('gsTabQueue is not available for unqueueTabForDiscard');
+      return Promise.resolve();
+    }
+    return gsTabQueue.unqueueTab(tabId, QUEUE_ID);
   },
 
   handleDiscardTabJob: function(tab) {
EOF

# Try to apply the patch
echo "Attempting to patch gsTabDiscardManager.js..."
if command -v patch &> /dev/null; then
  if [ -f "$JS_DIR/gsTabDiscardManager.js" ]; then
    patch -p0 "$JS_DIR/gsTabDiscardManager.js" < "$REPO_DIR/patches/gsTabDiscardManager.js.patch" || {
      echo "Warning: Could not apply patch automatically. Please manually edit gsTabDiscardManager.js:"
      echo "Find the 'unqueueTabForDiscard' function and add a defensive check as described in the patch file."
    }
  else
    echo "Warning: gsTabDiscardManager.js not found. Skipping patch."
  fi
else
  echo "Warning: 'patch' command not found. Please manually edit gsTabDiscardManager.js:"
  echo "Find the 'unqueueTabForDiscard' function and add a defensive check as described in the patch file."
fi

echo "Manifest V3 compatibility fixes applied!"
echo "Please reload the extension in Chrome to apply the changes."
echo ""
echo "If you still encounter errors, you may need to manually edit the following files:"
echo "1. Make sure gsTabDiscardManager.js has defensive checks for gsTabQueue"
echo "2. Check for any remaining uses of deprecated Chrome APIs in the original code"
echo ""
echo "Done."