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
