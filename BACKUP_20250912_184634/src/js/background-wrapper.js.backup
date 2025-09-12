// Auto-patched by fix.sh
// Load global queue implementation first
importScripts("globalQueue.js");

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

// Create essential global objects before importing scripts
self.window = self;
self.document = {
  createElement: function() {
    return {
      style: {},
      setAttribute: function() {},
      appendChild: function() {},
      addEventListener: function() {},
      removeEventListener: function() {}
    };
  },
  addEventListener: function() {},
  removeEventListener: function() {}
};

// Define important stubs before any scripts are loaded
self.gsTabQueue = {
  queueTabAsPromise: function(tabId, queueId, callback) { 
    console.log("gsTabQueue.queueTabAsPromise stub called:", tabId, queueId); 
    if (typeof callback === 'function') {
      setTimeout(callback, 0);
    }
    return Promise.resolve(); 
  },
  unqueueTab: function(tabId, queueId) { 
    console.log("gsTabQueue.unqueueTab stub called:", tabId, queueId); 
    return Promise.resolve(); 
  },
  requestProcessQueue: function() { 
    console.log("gsTabQueue.requestProcessQueue stub called"); 
    return Promise.resolve(); 
  }
};

self.gsFavicon = {
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

// Now import our compatibility adapter
importScripts('gsManifestV3Adapter.js');
importScripts('globalBinding.js');

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

// Fix 5: Add debug message to check if suspension feature works
chrome.commands.onCommand.addListener(function(command) {
  console.log('Command received:', command);
  if (command === '1-suspend-tab' && typeof tgs !== 'undefined') {
    console.log('Suspend command received, tgs available:', typeof tgs !== 'undefined');
    // Additional debug info
    chrome.tabs.query({active: true, currentWindow: true}, function(tabs) {
      console.log('Active tab to suspend:', tabs[0]);
    });
  }
});

console.log('Great Suspender background wrapper loaded');
