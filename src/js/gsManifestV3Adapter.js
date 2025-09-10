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
        if (!this._data[key]) {
          // Need to sync from chrome.storage.local first time
          const self = this;
          chrome.storage.local.get(key, function(result) {
            if (result[key]) {
              self._data[key] = result[key];
            }
          });
        }
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
    
    // Preload all existing storage data
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
  
  // Replace browserAction with action
  if (chrome.browserAction && !chrome.action) {
    chrome.action = {};
    chrome.action.setIcon = chrome.browserAction.setIcon;
    chrome.action.setTitle = chrome.browserAction.setTitle;
    chrome.action.setBadgeText = chrome.browserAction.setBadgeText;
    chrome.action.setBadgeBackgroundColor = chrome.browserAction.setBadgeBackgroundColor;
    chrome.action.getPopup = chrome.browserAction.getPopup;
    chrome.action.setPopup = chrome.browserAction.setPopup;
  } else if (chrome.action && !chrome.browserAction) {
    chrome.browserAction = {};
    chrome.browserAction.setIcon = chrome.action.setIcon;
    chrome.browserAction.setTitle = chrome.action.setTitle;
    chrome.browserAction.setBadgeText = chrome.action.setBadgeText;
    chrome.browserAction.setBadgeBackgroundColor = chrome.action.setBadgeBackgroundColor;
    chrome.browserAction.getPopup = chrome.action.getPopup;
    chrome.browserAction.setPopup = chrome.action.setPopup;
  }
  
  // Helper to persist state
  function saveState(key, value) {
    chrome.storage.local.set({['gsm3_' + key]: value});
  }
  
  function loadState(key, callback) {
    chrome.storage.local.get(['gsm3_' + key], function(result) {
      callback(result['gsm3_' + key]);
    });
  }
  
  // Store intervals/timeouts to clear on service worker shutdown
  var registeredIntervals = [];
  var registeredTimeouts = [];
  
  // Override setTimeout/setInterval to track and manage them
  const originalSetTimeout = self.setTimeout;
  const originalSetInterval = self.setInterval;
  const originalClearTimeout = self.clearTimeout;
  const originalClearInterval = self.clearInterval;
  
  self.setTimeout = function(fn, delay, ...args) {
    const timeoutId = originalSetTimeout.apply(this, [fn, delay, ...args]);
    registeredTimeouts.push(timeoutId);
    return timeoutId;
  };
  
  self.setInterval = function(fn, delay, ...args) {
    // For longer intervals (over 1 minute), use alarms instead
    if (delay > 60000) {
      const alarmName = 'gsInterval_' + Math.random().toString(36).substring(2);
      
      chrome.alarms.create(alarmName, {
        periodInMinutes: delay / 60000
      });
      
      chrome.alarms.onAlarm.addListener(function(alarm) {
        if (alarm.name === alarmName) {
          fn(...args);
        }
      });
      
      return alarmName;
    } else {
      const intervalId = originalSetInterval.apply(this, [fn, delay, ...args]);
      registeredIntervals.push(intervalId);
      return intervalId;
    }
  };
  
  self.clearTimeout = function(timeoutId) {
    originalClearTimeout(timeoutId);
    const index = registeredTimeouts.indexOf(timeoutId);
    if (index > -1) {
      registeredTimeouts.splice(index, 1);
    }
  };
  
  self.clearInterval = function(intervalId) {
    // Check if this is an alarm name
    if (typeof intervalId === 'string' && intervalId.startsWith('gsInterval_')) {
      chrome.alarms.clear(intervalId);
      return;
    }
    
    originalClearInterval(intervalId);
    const index = registeredIntervals.indexOf(intervalId);
    if (index > -1) {
      registeredIntervals.splice(index, 1);
    }
  };
  
  // On service worker termination, clean up
  self.addEventListener('unload', function() {
    // Clear all intervals
    registeredIntervals.forEach(function(intervalId) {
      originalClearInterval(intervalId);
    });
    
    // Clear all timeouts
    registeredTimeouts.forEach(function(timeoutId) {
      originalClearTimeout(timeoutId);
    });
  });
  
  return {
    saveState: saveState,
    loadState: loadState
  };
})();

// Initialize the adapter right away
gsManifestV3Adapter;
console.log('Manifest V3 adapter loaded with localStorage polyfill');