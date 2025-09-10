#!/bin/bash
# Script to fix service worker and context menu issues in Manifest V3
# Run from the repository root directory

REPO_DIR="/home/linux/Documents/GitHub/thegreatsuspender-notrack"
JS_DIR="$REPO_DIR/src/js"
ADAPTER_FILE="$JS_DIR/gsManifestV3Adapter.js"
WRAPPER_FILE="$JS_DIR/background-wrapper.js"

echo "Fixing Manifest V3 issues..."

# 1. Update the gsManifestV3Adapter.js file to handle context menu items without titles
cat > "$ADAPTER_FILE" << 'EOF'
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
      if (typeof tgs !== 'undefined' && tgs.requestLogExceptions) {
        tgs.requestLogExceptions(false);
      }
    });
    
    self.addEventListener('offline', function() {
      if (typeof tgs !== 'undefined' && tgs.requestLogExceptions) {
        tgs.requestLogExceptions(true);
      }
    });
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

# 2. Create a patch for background.js to remove the online/offline event listeners
cat > "$REPO_DIR/src/background-event-fix.patch" << 'EOF'
--- background.js.original
+++ background.js
@@ -1647,15 +1647,8 @@
   function addMiscListeners() {
     //add listener for battery state changes
     if (navigator.getBattery) {
       navigator.getBattery().then(function(battery) {
         _handleBatteryStateChanged(battery);
-        battery.addEventListener('chargingchange', function() {
-          _handleBatteryStateChanged(battery);
-        });
-      });
-    }
-    //add listeners for online/offline state changes
-    window.addEventListener('online', function() {
-      gsUtils.log(BACKGROUNDJS, 'Internet is online.');
+        // Remove chargingchange listener to avoid service worker warnings
       if (gsSession.isLoggedIn() && gsSession.needToSync()) {
         gsUtils.log(BACKGROUNDJS, 'Resynchronising due to being back online.');
         gsSession.performSync();
@@ -1663,10 +1656,6 @@
       } else {
         requestLogExceptions(false);
       }
-    });
-    window.addEventListener('offline', function() {
-      gsUtils.log(BACKGROUNDJS, 'Internet is offline.');
-      requestLogExceptions(true);
     });
   }
 };
EOF

echo "Created background.js patch. You need to manually apply it."

echo "Fixes completed!"
echo "Please apply the background.js patch manually, then reload the extension in Chrome."
echo "To apply the patch:"
echo "1. Open background.js in your editor"
echo "2. Remove the online/offline event listeners from the addMiscListeners function"
echo "3. Save the file and reload the extension"

cat << 'EOF'
IMPORTANT: You must manually edit background.js to remove the online/offline event listeners.
Find the addMiscListeners function (around line 1647) and remove these lines:

    //add listeners for online/offline state changes
    window.addEventListener('online', function() {
      gsUtils.log(BACKGROUNDJS, 'Internet is online.');
      // ...existing code...
    });
    window.addEventListener('offline', function() {
      gsUtils.log(BACKGROUNDJS, 'Internet is offline.');
      requestLogExceptions(true);
    });

These event listeners are now handled in the gsManifestV3Adapter.js file.
EOF