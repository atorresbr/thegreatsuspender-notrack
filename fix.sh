#!/bin/bash
# Comprehensive Fix for The Great Suspender - Manifest V3
# Addresses all dependency and initialization issues
JS_DIR="/home/linux/Documents/GitHub/thegreatsuspender-notrack/src/js"

echo "📊 Analyzing extension structure..."

# 1. Create a registry of all important objects and their methods
cat > "$JS_DIR/gsRegistry.js" << 'EOF'
/**
 * Global Registry for The Great Suspender
 * Ensures all critical components are available and initialized
 */
'use strict';

var GS_REGISTRY = (function() {
  console.log('Initializing GS Registry...');
  
  // Registry of all core objects and their methods
  var registry = {
    // Components that may be referenced before they're loaded
    gsTabQueue: {
      queueTabAsPromise: function(tabId, queueId, callback) {
        console.log('Registry: gsTabQueue.queueTabAsPromise called:', tabId, queueId);
        if (typeof callback === 'function') setTimeout(callback, 0);
        return Promise.resolve();
      },
      unqueueTab: function(tabId, queueId) {
        console.log('Registry: gsTabQueue.unqueueTab called:', tabId, queueId);
        return Promise.resolve();
      },
      requestProcessQueue: function() {
        console.log('Registry: gsTabQueue.requestProcessQueue called');
        return Promise.resolve();
      },
      getQueuedTabDetails: function(tabId) {
        console.log('Registry: gsTabQueue.getQueuedTabDetails called:', tabId);
        return null;
      }
    },
    
    gsTabSuspendManager: {
      getQueuedTabDetails: function(tabId) {
        console.log('Registry: gsTabSuspendManager.getQueuedTabDetails called:', tabId);
        return null;
      },
      getQueuedOrSuspendingTabById: function(tabId) {
        console.log('Registry: gsTabSuspendManager.getQueuedOrSuspendingTabById called:', tabId);
        return null;
      },
      getTabScore: function(tab) {
        console.log('Registry: gsTabSuspendManager.getTabScore called:', tab);
        return 0;
      }
    },
    
    gsTabDiscardManager: {
      queueTabForDiscard: function(tab) {
        console.log('Registry: gsTabDiscardManager.queueTabForDiscard called:', tab);
        return Promise.resolve();
      },
      unqueueTabForDiscard: function(tabId) {
        console.log('Registry: gsTabDiscardManager.unqueueTabForDiscard called:', tabId);
        return Promise.resolve();
      }
    },
    
    gsTabCheckManager: {
      queueTabCheck: function(tab, preQueue) {
        console.log('Registry: gsTabCheckManager.queueTabCheck called:', tab);
        return Promise.resolve();
      },
      performTabChecks: function() {
        console.log('Registry: gsTabCheckManager.performTabChecks called');
        return Promise.resolve();
      }
    },
    
    tgs: {
      setIconStatusForActiveTab: function() {
        console.log('Registry: tgs.setIconStatusForActiveTab called');
      },
      resetAutoSuspendTimerForAllTabs: function() {
        console.log('Registry: tgs.resetAutoSuspendTimerForAllTabs called');
      }
    }
  };
  
  // Wrap the objects to provide safe access
  function safeGet(obj, prop) {
    if (!obj) return registry[prop];
    return obj;
  }
  
  // Export global objects safely
  if (typeof self !== 'undefined') {
    self.gsTabQueue = safeGet(self.gsTabQueue, 'gsTabQueue');
    self.gsTabSuspendManager = safeGet(self.gsTabSuspendManager, 'gsTabSuspendManager');
    self.gsTabDiscardManager = safeGet(self.gsTabDiscardManager, 'gsTabDiscardManager');
    self.gsTabCheckManager = safeGet(self.gsTabCheckManager, 'gsTabCheckManager');
    self.tgs = safeGet(self.tgs, 'tgs');
  }
  
  if (typeof window !== 'undefined') {
    window.gsTabQueue = safeGet(window.gsTabQueue, 'gsTabQueue');
    window.gsTabSuspendManager = safeGet(window.gsTabSuspendManager, 'gsTabSuspendManager');
    window.gsTabDiscardManager = safeGet(window.gsTabDiscardManager, 'gsTabDiscardManager');
    window.gsTabCheckManager = safeGet(window.gsTabCheckManager, 'gsTabCheckManager');
    window.tgs = safeGet(window.tgs, 'tgs');
  }
  
  // Update the registry when real implementations become available
  function register(name, implementation) {
    console.log('Registry: Registering implementation for:', name);
    registry[name] = implementation;
    
    // Update global references
    if (typeof self !== 'undefined') {
      self[name] = implementation;
    }
    if (typeof window !== 'undefined') {
      window[name] = implementation;
    }
  }
  
  console.log('GS Registry initialized!');
  
  return {
    register: register,
    safeGet: function(name) {
      return registry[name];
    }
  };
})();

// Initialize all critical objects immediately
if (typeof self !== 'undefined') {
  self.gsTabQueue = self.gsTabQueue || GS_REGISTRY.safeGet('gsTabQueue');
  self.gsTabSuspendManager = self.gsTabSuspendManager || GS_REGISTRY.safeGet('gsTabSuspendManager');
  self.gsTabDiscardManager = self.gsTabDiscardManager || GS_REGISTRY.safeGet('gsTabDiscardManager');
  self.gsTabCheckManager = self.gsTabCheckManager || GS_REGISTRY.safeGet('gsTabCheckManager');
  self.tgs = self.tgs || GS_REGISTRY.safeGet('tgs');
}

if (typeof window !== 'undefined') {
  window.gsTabQueue = window.gsTabQueue || GS_REGISTRY.safeGet('gsTabQueue');
  window.gsTabSuspendManager = window.gsTabSuspendManager || GS_REGISTRY.safeGet('gsTabSuspendManager');
  window.gsTabDiscardManager = window.gsTabDiscardManager || GS_REGISTRY.safeGet('gsTabDiscardManager');
  window.gsTabCheckManager = window.gsTabCheckManager || GS_REGISTRY.safeGet('gsTabCheckManager');
  window.tgs = window.tgs || GS_REGISTRY.safeGet('tgs');
}

console.log('Global object registration complete');
EOF

# 2. Update background-wrapper.js to load gsRegistry.js FIRST
echo "📦 Creating improved background-wrapper.js..."
cp "$JS_DIR/background-wrapper.js" "$JS_DIR/background-wrapper.js.backup"
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

// Load registry first to ensure all objects are available
importScripts('gsRegistry.js');

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

// Create essential global objects before importing scripts
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

// Now import our compatibility adapter
importScripts('gsManifestV3Adapter.js');

console.log('Adapter loaded, localStorage available:', typeof localStorage !== 'undefined');
console.log('chrome.extension.getURL available:', typeof chrome.extension.getURL === 'function');

// Import all background scripts in the correct order with explicit error handling
try {
  importScripts('gsUtils.js');
  console.log('Loaded: gsUtils.js');
  
  importScripts('gsChrome.js');
  console.log('Loaded: gsChrome.js');
  
  importScripts('gsStorage.js');
  console.log('Loaded: gsStorage.js');
  
  importScripts('db.js');
  console.log('Loaded: db.js');
  
  importScripts('gsIndexedDb.js');
  console.log('Loaded: gsIndexedDb.js');
  
  importScripts('gsMessages.js');
  console.log('Loaded: gsMessages.js');
  
  importScripts('gsSession.js');
  console.log('Loaded: gsSession.js');
  
  importScripts('gsTabQueue.js');
  console.log('Loaded: gsTabQueue.js');
  
  importScripts('gsTabCheckManager.js');
  console.log('Loaded: gsTabCheckManager.js');
  
  importScripts('gsFavicon.js');
  console.log('Loaded: gsFavicon.js');
  
  importScripts('gsCleanScreencaps.js');
  console.log('Loaded: gsCleanScreencaps.js');
  
  importScripts('gsTabSuspendManager.js');
  console.log('Loaded: gsTabSuspendManager.js');
  
  importScripts('gsTabDiscardManager.js');
  console.log('Loaded: gsTabDiscardManager.js');
  
  importScripts('gsSuspendedTab.js');
  console.log('Loaded: gsSuspendedTab.js');
  
  importScripts('background.js');
  console.log('Loaded: background.js');
} catch (err) {
  console.error('Error loading scripts:', err);
}

// Add online/offline event handlers here at initialization time
self.addEventListener('online', function() {
  if (typeof gsUtils !== 'undefined' && typeof gsStorage !== 'undefined') {
    gsUtils.log('background', 'Internet is online.');
    //restart timer on all normal tabs
    if (gsStorage.getOption && gsStorage.getOption(gsStorage.IGNORE_WHEN_OFFLINE)) {
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
      console.log('Running periodic tab checks');
      gsTabCheckManager.performTabChecks();
    }
  } else if (alarm.name === 'keepAlive') {
    console.log('Service worker keepAlive ping');
  }
});

console.log('Great Suspender background wrapper loaded');
EOF

# 3. Add patch for gsTabSuspendManager.js to fix the specific issue
echo "🔧 Patching gsTabSuspendManager.js..."
cp "$JS_DIR/gsTabSuspendManager.js" "$JS_DIR/gsTabSuspendManager.js.backup"

# Create a patch file for reference
cat > "$JS_DIR/gsTabSuspendManager.js.patch" << 'EOF'
// Find the getQueuedTabDetails function and add defensive checks
getQueuedTabDetails: function(tabId) {
  if (!gsTabQueue || typeof gsTabQueue.getQueuedTabDetails !== 'function') {
    console.warn('gsTabQueue.getQueuedTabDetails not available');
    return null;
  }
  return gsTabQueue.getQueuedTabDetails(tabId, QUEUE_ID);
},
EOF

# Insert a safety check at the top of the file
sed -i '1i // Auto-patched by fix.sh\n// Ensure core objects are available\nif (!self.gsTabQueue) {\n  console.warn("gsTabQueue not found in gsTabSuspendManager, using registry");\n  self.gsTabQueue = GS_REGISTRY ? GS_REGISTRY.safeGet("gsTabQueue") : { getQueuedTabDetails: function() { return null; } };\n}\n' "$JS_DIR/gsTabSuspendManager.js"

# 4. Add registration code to gsTabSuspendManager.js and gsTabQueue.js
echo "📝 Adding registration hooks..."

# For gsTabSuspendManager.js - Add at the end of the IIFE (just before the closing }); )
sed -i '/^})();/i // Register with global registry\nif (typeof GS_REGISTRY !== "undefined") {\n  GS_REGISTRY.register("gsTabSuspendManager", gsTabSuspendManager);\n}\n' "$JS_DIR/gsTabSuspendManager.js"

# For gsTabQueue.js - Add at the end of the IIFE
cp "$JS_DIR/gsTabQueue.js" "$JS_DIR/gsTabQueue.js.backup"
sed -i '/^})();/i // Register with global registry\nif (typeof GS_REGISTRY !== "undefined") {\n  GS_REGISTRY.register("gsTabQueue", gsTabQueue);\n}\n' "$JS_DIR/gsTabQueue.js"

# 5. Add safety wrapper around the specific function that's causing errors
echo "🛡️ Adding defensive coding to all critical functions..."

# Find the getQueuedTabDetails function in gsTabSuspendManager.js and add defensive checks
sed -i 's/getQueuedTabDetails: function(tabId) {/getQueuedTabDetails: function(tabId) {\n    if (!gsTabQueue || typeof gsTabQueue.getQueuedTabDetails !== "function") {\n      console.warn("gsTabQueue.getQueuedTabDetails not available");\n      return null;\n    }/' "$JS_DIR/gsTabSuspendManager.js"

echo "✅ All fixes applied!"
echo "Please completely remove the extension from Chrome and reinstall it fresh."
echo "These changes should fix the dependency issues and make the extension work properly."