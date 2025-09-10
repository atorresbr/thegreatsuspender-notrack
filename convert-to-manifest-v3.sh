#!/bin/bash
# Script to convert The Great Suspender to Manifest V3
# Run from the repository root directory

REPO_DIR="/home/linux/Documents/GitHub/thegreatsuspender-notrack"
SRC_DIR="$REPO_DIR/src"
JS_DIR="$SRC_DIR/js"

echo "Starting Manifest V3 migration..."

# 1. Create gsManifestV3Adapter.js
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
  }
  
  // Add chrome.extension compatibility
  if (!chrome.extension) {
    chrome.extension = {};
    chrome.extension.getURL = chrome.runtime.getURL;
    chrome.extension.getBackgroundPage = function() {
      console.warn('chrome.extension.getBackgroundPage is not available in Manifest V3');
      return self;
    };
    chrome.extension.getViews = function() {
      console.warn('chrome.extension.getViews is not available in Manifest V3');
      return [];
    };
    chrome.extension.isAllowedIncognitoAccess = chrome.runtime.isAllowedIncognitoAccess;
    chrome.extension.isAllowedFileSchemeAccess = chrome.runtime.isAllowedFileSchemeAccess;
    
    // Add inIncognitoContext property
    Object.defineProperty(chrome.extension, 'inIncognitoContext', {
      get: function() {
        return false;
      }
    });
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
  
  // Wrap contextMenus API to ensure IDs
  const originalContextMenusCreate = chrome.contextMenus.create;
  chrome.contextMenus.create = function(createProperties, callback) {
    // Ensure createProperties has an id
    if (!createProperties.id) {
      // Generate a random id if none exists
      const titlePart = createProperties.title 
        ? createProperties.title.substring(0, 20).replace(/[^\w]/g, '_')
        : '';
      const contextPart = createProperties.contexts 
        ? createProperties.contexts.join('_')
        : '';
      createProperties.id = `${titlePart}_${contextPart}_${Math.random().toString(36).substring(2, 8)}`;
    }
    return originalContextMenusCreate(createProperties, callback);
  };
  
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

echo "Created gsManifestV3Adapter.js"

# 2. Create background-wrapper.js
cat > "$JS_DIR/background-wrapper.js" << 'EOF'
/**
 * The Great Suspender - NoTrack
 * Background Service Worker Wrapper for Manifest V3
 */
'use strict';

// First import our compatibility adapter before ANY other scripts
importScripts('gsManifestV3Adapter.js');

console.log('Adapter loaded, localStorage available:', typeof localStorage !== 'undefined');

// Import all background scripts in the same order as the original manifest
importScripts(
  'gsUtils.js',
  'gsChrome.js',
  'gsStorage.js',
  'db.js',
  'gsIndexedDb.js',
  'gsMessages.js',
  'gsSession.js',
  'gsTabQueue.js',
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

echo "Created background-wrapper.js"

# 3. Update manifest.json
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
    "alarms"
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

echo "Updated manifest.json to Manifest V3"

echo "Migration completed! Load the extension in Chrome from the src directory."
echo "Note: You may need to reload the extension a couple of times during initial testing."
