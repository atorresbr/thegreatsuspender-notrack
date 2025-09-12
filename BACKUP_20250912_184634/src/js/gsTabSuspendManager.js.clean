/*global gsUtils, gsChrome, gsStorage, gsSession, gsIndexedDb, gsTabQueue */
'use strict';

var gsTabSuspendManager = (function() {
  // Private variables
  var QUEUE_ID = 'suspendTabQueue';

  function queueTabForSuspension(tab, delay) {
    if (!tab) {
      return Promise.reject('tab not specified');
    }
    
    return new Promise(function(resolve) {
      if (!gsUtils.isSuspendable(tab)) {
        return resolve();
      }
      
      // If tab is already in suspendQueue then clear previous timer
      gsUtils.log(tab.id, 'Queueing tab for suspension.');
      
      if (!gsTabQueue) {
        console.warn('gsTabQueue not available');
        return resolve();
      }
      
      gsTabQueue.queueTabAsPromise(tab.id, QUEUE_ID, function() {
        if (gsUtils.isSuspendable(tab)) {
          handleSuspendTab(tab);
        } else {
          gsUtils.log(tab.id, 'Tab has become unsuspendable. Aborting suspension.');
        }
      }, delay).then(resolve);
    });
  }

  function handleSuspendTab(tab) {
    // Ensure tab is still valid and suspendable
    gsChrome.tabsGet(tab.id).then(function(newTab) {
      if (!gsUtils.isSuspendable(newTab)) {
        gsUtils.log(tab.id, 'Tab has become unsuspendable. Aborting suspension.');
        return;
      }
      gsUtils.log(tab.id, 'Suspending tab.');
      gsStorage.fetchTabInfo(newTab.id).then(function(tabInfo) {
        gsChrome.tabsUpdate(tab.id, { url: gsUtils.generateSuspendedUrl(newTab.url, newTab.title, tabInfo) });
      });
    });
  }

  function unqueueTabForSuspension(tab) {
    if (!tab) return Promise.resolve();
    
    gsUtils.log(tab.id, 'Unqueueing tab for suspension.');
    
    if (!gsTabQueue) {
      console.warn('gsTabQueue not available for unqueueing');
      return Promise.resolve();
    }
    
    return gsTabQueue.unqueueTab(tab.id, QUEUE_ID);
  }

  function getQueuedTabDetails(tabId) {
    if (!gsTabQueue || typeof gsTabQueue.getQueuedTabDetails !== 'function') {
      return null;
    }
    return gsTabQueue.getQueuedTabDetails(tabId, QUEUE_ID);
  }

  function getQueuedOrSuspendingTabById(tabId) {
    const queuedTabDetails = getQueuedTabDetails(tabId);
    if (queuedTabDetails) {
      return queuedTabDetails;
    }
    return false;
  }

  function getTabScore(tab) {
    if (!tab) return 0;
    
    var score = 0;
    if (tab.active) score += 10;
    if (tab.audible) score += 10;
    if (tab.pinned) score += 10;
    if (tab.status === 'loading') score += 10;
    return score;
  }

  function handleSuspendedTabRecovered(tab, tabTitle, originalUrl, faviconMeta, scrollPosition) {
    return gsChrome.tabsUpdate(tab.id, { url: originalUrl }).then(function() {
      return gsUtils.sendInitSuspendedTabToContentScript(tab.id, tabTitle, originalUrl, faviconMeta, scrollPosition);
    });
  }

  return {
    queueTabForSuspension: queueTabForSuspension,
    unqueueTabForSuspension: unqueueTabForSuspension,
    getQueuedTabDetails: getQueuedTabDetails,
    getQueuedOrSuspendingTabById: getQueuedOrSuspendingTabById,
    getTabScore: getTabScore,
    handleSuspendedTabRecovered: handleSuspendedTabRecovered,
    
    // Export for testing only
    handleSuspendTab: handleSuspendTab
  };
})();

// Register with global registry if available
if (typeof GS_REGISTRY !== 'undefined') {
  GS_REGISTRY.register('gsTabSuspendManager', gsTabSuspendManager);
}
