#!/bin/bash
# Direct fix by completely replacing the problematic file
JS_DIR="/home/linux/Documents/GitHub/thegreatsuspender-notrack/src/js"

# Create a backup
cp "$JS_DIR/gsTabDiscardManager.js" "$JS_DIR/gsTabDiscardManager.js.bak"

# Create a new file with a fixed unqueueTabForDiscard function
cat > "$JS_DIR/gsTabDiscardManager.js.fixed" << 'EOF'
/*global gsUtils, gsChrome, gsStorage, gsTabSuspendManager, gsTabQueue */
'use strict';

var gsTabDiscardManager = (function() {
  // Private variables
  var QUEUE_ID = 'discardQueue';

  // Private functions
  function queueTabForDiscardAsPromise(tab) {
    return new Promise(function(resolve) {
      gsUtils.log(tab.id, 'Queuing tab for discard.');
      gsTabQueue.queueTabAsPromise(tab.id, QUEUE_ID, function() {
        handleDiscardTabJob(tab);
      }).then(resolve);
    });
  }

  function requestTabDiscardAsPromise(tab) {
    return new Promise(function(resolve, reject) {
      gsUtils.log(tab.id, 'Forcing discarding of tab.');
      if (gsUtils.isSuspendedTab(tab) || gsUtils.isSpecialTab(tab)) {
        resolve(false);
        return;
      }
      if (tab.hasOwnProperty('discarded') && tab.discarded) {
        resolve(false);
        return;
      }
      if (chrome.tabs.discard) {
        chrome.tabs.discard(tab.id, function() {
          if (chrome.runtime.lastError) {
            gsUtils.log(
              tab.id,
              'Failed to discard tab',
              chrome.runtime.lastError
            );
            resolve(false);
            return;
          }
          resolve(true);
        });
      } else {
        resolve(false);
      }
    });
  }

  return {
    queueTabForDiscard: function(tab) {
      return queueTabForDiscardAsPromise(tab);
    },

    unqueueTabForDiscard: function(tabId) {
      // Add defensive check for gsTabQueue
      if (!gsTabQueue || typeof gsTabQueue.unqueueTab !== 'function') {
        console.warn('gsTabQueue is not available for unqueueTabForDiscard');
        return Promise.resolve();
      }
      return gsTabQueue.unqueueTab(tabId, QUEUE_ID);
    },

    handleDiscardTabJob: function(tab) {
      return requestTabDiscardAsPromise(tab);
    },

    discardLowMemoryTabs: function() {
      gsUtils.log('gsTabDiscardManager', 'discardLowMemoryTabs');
      gsChrome.tabsQuery({}).then(function(tabs) {
        if (tabs.length === 0) {
          return;
        }
        var totalMemory = 0;
        var lowestMemoryTab = null;
        var lowestMemory = false;
        tabs.forEach(function(tab) {
          var tabMemory = 0;
          if (
            tab.hasOwnProperty('title') &&
            tab.title &&
            tab.title.indexOf('Great Suspender') < 0 &&
            !gsUtils.isSpecialTab(tab) &&
            !gsUtils.isSuspendedTab(tab) &&
            !gsTabSuspendManager.getQueuedOrSuspendingTabById(tab.id)
          ) {
            tabMemory = gsTabSuspendManager.getTabScore(tab);
            totalMemory += tabMemory;
            if (!lowestMemory || tabMemory < lowestMemory) {
              lowestMemory = tabMemory;
              lowestMemoryTab = tab;
            }
          }
        });
        gsUtils.log('gsTabDiscardManager', 'totalMemory: ' + totalMemory);
        gsUtils.log('gsTabDiscardManager', 'lowestMemoryTab: ', lowestMemoryTab);
        if (
          totalMemory > 0 &&
          lowestMemoryTab &&
          gsUtils.isNormalTab(lowestMemoryTab)
        ) {
          requestTabDiscardAsPromise(lowestMemoryTab);
        }
      });
    },
  };
})();
EOF

# Replace the original with the fixed version
mv "$JS_DIR/gsTabDiscardManager.js.fixed" "$JS_DIR/gsTabDiscardManager.js"

# Also ensure gsTabQueue is defined globally in background-wrapper.js if needed
sed -i '/importScripts/i \
// Define gsTabQueue globally before importing any scripts\
self.gsTabQueue = {\
  queueTabAsPromise: function(tabId, queueId, callback) { console.log("stub queueTabAsPromise"); return Promise.resolve(); },\
  unqueueTab: function(tabId, queueId) { console.log("stub unqueueTab"); return Promise.resolve(); },\
  requestProcessQueue: function() { console.log("stub requestProcessQueue"); return Promise.resolve(); }\
};' "$JS_DIR/background-wrapper.js"

echo "Fixed gsTabDiscardManager.js with complete replacement"
echo "Also added global gsTabQueue definition to background-wrapper.js"
echo "Reload the extension in Chrome to apply changes"