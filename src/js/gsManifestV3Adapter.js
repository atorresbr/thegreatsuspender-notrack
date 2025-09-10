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
      // Return self as a fallback
      return self;
    };
    chrome.extension.getViews = function() {
      console.warn('chrome.extension.getViews is not available in Manifest V3');
      return [];
    };
    
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
  
  // Handle internal view functions that won't work in service workers
  if (typeof tgs !== 'undefined') {
    // Replace any functions that use chrome.extension.getViews
    if (tgs.getInternalViewByTabId) {
      tgs.getInternalViewByTabId = function() {
        console.warn('getInternalViewByTabId is not available in Manifest V3');
        return null;
      };
    }
    if (tgs.getInternalViewsByViewName) {
      tgs.getInternalViewsByViewName = function() {
        console.warn('getInternalViewsByViewName is not available in Manifest V3');
        return [];
      };
    }
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