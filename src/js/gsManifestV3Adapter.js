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
  
  // FIX 2: Add chrome.scripting.executeScript compatibility with chrome.scripting
  // This requires the "scripting" permission in manifest.json
  if (chrome.tabs && !chrome.scripting.executeScript && chrome.scripting) {
    chrome.scripting.executeScript = function(tabId, details, callback) {
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
  if (chrome.action && !chrome.action) {
    chrome.action = {};
    chrome.action.setIcon = chrome.action.setIcon;
    chrome.action.setTitle = chrome.action.setTitle;
    chrome.action.setBadgeText = chrome.action.setBadgeText;
    chrome.action.setBadgeBackgroundColor = chrome.action.setBadgeBackgroundColor;
    chrome.action.getPopup = chrome.action.getPopup;
    chrome.action.setPopup = chrome.action.setPopup;
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

// Additional Manifest V3 compatibility
console.log('Adding enhanced Manifest V3 compatibility...');

// Ensure chrome.extension exists and has all needed methods
if (!chrome.extension) {
  chrome.extension = {};
}

// Enhanced file scheme access polyfill
if (!chrome.extension.isAllowedFileSchemeAccess) {
  chrome.extension.isAllowedFileSchemeAccess = function(callback) {
    console.log('Polyfill: chrome.extension.isAllowedFileSchemeAccess called');
    // For security in Manifest V3, assume file access is not allowed
    const result = false;
    if (typeof callback === 'function') {
      setTimeout(() => callback(result), 0);
    }
    return Promise.resolve(result);
  };
}

// Enhanced background page polyfill
if (!chrome.extension.getBackgroundPage) {
  chrome.extension.getBackgroundPage = function() {
    console.log('Polyfill: chrome.extension.getBackgroundPage called');
    return null; // No background page in service worker context
  };
}

// Enhanced getURL polyfill
if (!chrome.extension.getURL) {
  chrome.extension.getURL = function(path) {
    console.log('Polyfill: chrome.extension.getURL called with:', path);
    return chrome.runtime.getURL(path);
  };
}

// Polyfill for chrome.extension.sendMessage (if needed)
if (!chrome.extension.sendMessage) {
  chrome.extension.sendMessage = function(extensionId, message, options, responseCallback) {
    console.log('Polyfill: chrome.extension.sendMessage called');
    // If extensionId is actually the message (common pattern)
    if (typeof extensionId === 'object' && typeof message === 'function') {
      return chrome.runtime.sendMessage(extensionId, message);
    }
    return chrome.runtime.sendMessage(extensionId, message, options, responseCallback);
  };
}

console.log('Enhanced Manifest V3 compatibility loaded');

// Additional Manifest V3 compatibility
console.log('Adding enhanced Manifest V3 compatibility...');

// Ensure chrome.extension exists and has all needed methods
if (!chrome.extension) {
  chrome.extension = {};
}

// Enhanced file scheme access polyfill
if (!chrome.extension.isAllowedFileSchemeAccess) {
  chrome.extension.isAllowedFileSchemeAccess = function(callback) {
    console.log('Polyfill: chrome.extension.isAllowedFileSchemeAccess called');
    // For security in Manifest V3, assume file access is not allowed
    const result = false;
    if (typeof callback === 'function') {
      setTimeout(() => callback(result), 0);
    }
    return Promise.resolve(result);
  };
}

// Enhanced background page polyfill
if (!chrome.extension.getBackgroundPage) {
  chrome.extension.getBackgroundPage = function() {
    console.log('Polyfill: chrome.extension.getBackgroundPage called');
    return null; // No background page in service worker context
  };
}

// Enhanced getURL polyfill
if (!chrome.extension.getURL) {
  chrome.extension.getURL = function(path) {
    console.log('Polyfill: chrome.extension.getURL called with:', path);
    return chrome.runtime.getURL(path);
  };
}

// Polyfill for chrome.extension.sendMessage (if needed)
if (!chrome.extension.sendMessage) {
  chrome.extension.sendMessage = function(extensionId, message, options, responseCallback) {
    console.log('Polyfill: chrome.extension.sendMessage called');
    // If extensionId is actually the message (common pattern)
    if (typeof extensionId === 'object' && typeof message === 'function') {
      return chrome.runtime.sendMessage(extensionId, message);
    }
    return chrome.runtime.sendMessage(extensionId, message, options, responseCallback);
  };
}

// Service worker error handling
if (typeof self !== 'undefined' && self.addEventListener) {
  self.addEventListener('error', function(event) {
    console.error('Enhanced adapter - Service worker error:', event.error);
    event.preventDefault();
  });
  
  self.addEventListener('unhandledrejection', function(event) {
    console.warn('Enhanced adapter - Unhandled rejection:', event.reason);
    event.preventDefault();
  });
}

console.log('Enhanced Manifest V3 compatibility loaded');

// Additional Manifest V3 compatibility
console.log('Adding enhanced Manifest V3 compatibility...');

// Ensure chrome.extension exists and has all needed methods
if (!chrome.extension) {
  chrome.extension = {};
}

// Enhanced file scheme access polyfill
if (!chrome.extension.isAllowedFileSchemeAccess) {
  chrome.extension.isAllowedFileSchemeAccess = function(callback) {
    console.log('Polyfill: chrome.extension.isAllowedFileSchemeAccess called');
    // For security in Manifest V3, assume file access is not allowed
    const result = false;
    if (typeof callback === 'function') {
      setTimeout(() => callback(result), 0);
    }
    return Promise.resolve(result);
  };
}

// Enhanced background page polyfill
if (!chrome.extension.getBackgroundPage) {
  chrome.extension.getBackgroundPage = function() {
    console.log('Polyfill: chrome.extension.getBackgroundPage called');
    return null; // No background page in service worker context
  };
}

// Enhanced getURL polyfill
if (!chrome.extension.getURL) {
  chrome.extension.getURL = function(path) {
    console.log('Polyfill: chrome.extension.getURL called with:', path);
    return chrome.runtime.getURL(path);
  };
}

// Polyfill for chrome.extension.sendMessage (if needed)
if (!chrome.extension.sendMessage) {
  chrome.extension.sendMessage = function(extensionId, message, options, responseCallback) {
    console.log('Polyfill: chrome.extension.sendMessage called');
    // If extensionId is actually the message (common pattern)
    if (typeof extensionId === 'object' && typeof message === 'function') {
      return chrome.runtime.sendMessage(extensionId, message);
    }
    return chrome.runtime.sendMessage(extensionId, message, options, responseCallback);
  };
}

// Service worker error handling
if (typeof self !== 'undefined' && self.addEventListener) {
  self.addEventListener('error', function(event) {
    console.error('Enhanced adapter - Service worker error:', event.error);
    event.preventDefault();
  });
  
  self.addEventListener('unhandledrejection', function(event) {
    console.warn('Enhanced adapter - Unhandled rejection:', event.reason);
    event.preventDefault();
  });
}

console.log('Enhanced Manifest V3 compatibility loaded');
