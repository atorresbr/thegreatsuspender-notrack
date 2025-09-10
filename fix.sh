#!/bin/bash
# Targeted Fix for The Great Suspender - Options Page & Tab Suspension
JS_DIR="/home/linux/Documents/GitHub/thegreatsuspender-notrack/src/js"
SRC_DIR="/home/linux/Documents/GitHub/thegreatsuspender-notrack/src"

echo "🔧 Fixing specific issues with options page and tab suspension..."

# 1. Fix options.js to work in Manifest V3
echo "Fixing options page..."
cp "$SRC_DIR/js/options.js" "$SRC_DIR/js/options.js.backup"

# Add wrapper to options.js
sed -i '1i // Fix for options page in Manifest V3\n(function() {\n  console.log("Options page initializing...");\n\n  // Get background page safely\n  function getBackgroundPage(callback) {\n    if (chrome.runtime && chrome.runtime.getBackgroundPage) {\n      chrome.runtime.getBackgroundPage(function(bg) {\n        callback(bg);\n      });\n    } else if (chrome.extension && chrome.extension.getBackgroundPage) {\n      const bg = chrome.extension.getBackgroundPage();\n      callback(bg);\n    } else {\n      console.error("Cannot get background page!");\n      callback(null);\n    }\n  }\n' "$SRC_DIR/js/options.js"

# Add closing wrapper at end
echo '})();' >> "$SRC_DIR/js/options.js"

# Replace all direct chrome.extension.getBackgroundPage calls
sed -i 's/chrome.extension.getBackgroundPage()/getBackgroundPage(function(backgroundPage) {/g' "$SRC_DIR/js/options.js"
sed -i 's/var backgroundPage = chrome.extension.getBackgroundPage();/getBackgroundPage(function(backgroundPage) {/g' "$SRC_DIR/js/options.js"

# Add closing brackets for the callbacks
sed -i 's/^\});$/});\\n});/g' "$SRC_DIR/js/options.js"

# 2. Fix gsTabCheckManager.js
echo "Fixing gsTabCheckManager.js..."
cp "$JS_DIR/gsTabCheckManager.js" "$JS_DIR/gsTabCheckManager.js.backup"

# Create a completely new version with defensive checks added
cat > "$JS_DIR/gsTabCheckManager.js.fixed" << 'EOF'
/*global gsUtils, gsChrome, gsSession, gsIndexedDb, gsStorage, gsTabQueue, gsTabDiscardManager, gsTabSuspendManager, gsFavicon, tgs, gsMessages */
'use strict';

var gsTabCheckManager = (function() {
  // Milliseconds to wait before checking if a tab is unresponsive
  const UNRESPONSIVE_TIMEOUT = 5000;
  const MAX_FAILED_SUSPENSIONS = 3;
  const MAX_POPUP_ATTEMPTS = 5;
  const QUEUE_ID = 'checkQueue';

  // MUST ALWAYS check that gsTabQueue exists before using it
  function safeTabQueue() {
    if (!gsTabQueue) {
      console.warn('gsTabQueue not available');
      return {
        queueTabAsPromise: function() {
          console.warn('Using stub queueTabAsPromise');
          return Promise.resolve();
        },
        unqueueTab: function() {
          console.warn('Using stub unqueueTab');
          return Promise.resolve();
        }
      };
    }
    return gsTabQueue;
  }

  function getQueuedTabDetails(tabId) {
    return safeTabQueue().getQueuedTabDetails(tabId, QUEUE_ID);
  }

  function queueTabCheck(tab, preQueue) {
    preQueue = preQueue || [];
    queueTabCheckAsPromise(tab, preQueue);
    return Promise.resolve(preQueue); // Not actually a promise
  }

  function queueTabCheckAsPromise(tab, preQueue) {
    preQueue = preQueue || [];
    return new Promise(function(resolve) {
      gsUtils.log(tab.id, 'Queuing tab for check.');
      safeTabQueue()
        .queueTabAsPromise(tab.id, QUEUE_ID, function() {
          checkTab(tab, preQueue);
        })
        .then(resolve);
    });
  }

  function unqueueTabCheck(tabId) {
    return safeTabQueue().unqueueTab(tabId, QUEUE_ID);
  }

  function getUpdatedTab(tab, callback) {
    if (typeof tab === 'undefined') {
      callback(null);
      return;
    }
    if (!gsUtils.isValidTabInfo(tab)) {
      gsUtils.log(tab.id, 'Tab is invalid. Getting updated tab information.');
      gsChrome.tabsGet(tab.id).then(function(newTab) {
        if (!gsUtils.isValidTabInfo(newTab)) {
          gsUtils.log(tab.id, 'Updated tab is invalid!');
          callback(null);
          return;
        }
        callback(newTab);
      });
      return;
    }
    callback(tab);
  }

  function checkTab(tab, preQueue) {
    gsUtils.log(tab.id, 'Checking tab state.');

    getUpdatedTab(tab, function(newTab) {
      if (!newTab) {
        gsUtils.log(tab.id, 'Tab has been discarded/removed. Aborting tab check.');
        return;
      }
      tab = newTab;

      // If tab is already suspended
      if (gsUtils.isSuspendedTab(tab)) {
        checkSuspendedTab(tab);
        return;
      }

      // If tab is special or already discarded
      if (gsUtils.isSpecialTab(tab) || gsUtils.isDiscardedTab(tab)) {
        gsUtils.log(tab.id, 'Tab is special or discarded. Aborting tab check.');
        return;
      }

      // If tab is not responding (in loading state)
      if (gsUtils.isNormalTab(tab) && tab.status === 'loading') {
        gsUtils.log(tab.id, 'Tab is still loading');
        // sometimes tab gets left in 'loading' state
        // so check for unresponsive tabs here
        checkForUnresponsiveTab(tab, preQueue);
        return;
      }

      // If tab is normal and fully loaded
      if (gsUtils.isNormalTab(tab) && tab.status === 'complete') {
        checkNormalTab(tab, preQueue);
        return;
      }

      gsUtils.log(tab.id, 'Tab in unknown state. Aborting tab check.');
    });
  }

  function checkForUnresponsiveTab(tab, preQueue) {
    if (preQueue.indexOf('checkForUnresponsiveTab') >= 0) {
      gsUtils.log(tab.id, 'Already checking this tab for unresponsiveness.');
      return;
    }

    var tabCheckPromises = [];
    preQueue.push('checkForUnresponsiveTab');
    gsUtils.log(tab.id, 'Tab has been in loading state for a while. Attempting tab reload.');
    tabCheckPromises.push(
      gsChrome.tabsUpdate(tab.id, { url: tab.url }).then(function() {
        return new Promise(function(resolve) {
          window.setTimeout(function() {
            gsTabCheckManager.queueTabCheck(tab, preQueue);
            resolve();
          }, UNRESPONSIVE_TIMEOUT);
        });
      })
    );
    Promise.all(tabCheckPromises);
  }

  function checkNormalTab(tab, preQueue) {
    const queuedTabDetails = getQueuedTabDetails(tab.id);
    if (queuedTabDetails && queuedTabDetails.executionProps.refetchTab) {
      gsUtils.log(
        tab.id,
        'Refetching tab. Tab state may have changed since last check.',
        queuedTabDetails
      );
      gsChrome.tabsGet(tab.id).then(function(newTab) {
        if (!gsUtils.isValidTabInfo(newTab)) {
          gsUtils.log(tab.id, 'Updated tab is invalid!');
          return;
        }
        if (gsUtils.isDiscardedTab(newTab)) {
          gsUtils.log(
            tab.id,
            'Tab has been discarded. Aborting tab check.',
            newTab
          );
          return;
        }
        gsTabCheckManager.queueTabCheck(newTab);
      });
      return;
    }

    // Ensure we can access the chrome content scripts API
    if (
      !chrome.scripting &&
      !chrome.tabs.executeScript
    ) {
      gsUtils.log(
        tab.id,
        'Chrome scripting API not available. Aborting tab check.'
      );
      return;
    }

    // If tab is loading then try again in a few seconds
    if (tab.status === 'loading') {
      gsUtils.log(tab.id, 'Tab is still loading');
      window.setTimeout(function() {
        preQueue.push('checkNormalTab');
        gsTabCheckManager.queueTabCheck(tab, preQueue);
      }, UNRESPONSIVE_TIMEOUT);
      return;
    }

    // Make sure tab is fully loaded
    if (tab.status !== 'complete') {
      gsUtils.log(tab.id, 'Tab not fully loaded. Will check again in 10 seconds.');
      window.setTimeout(function() {
        preQueue.push('checkNormalTab');
        gsTabCheckManager.queueTabCheck(tab, preQueue);
      }, 10000);
      return;
    }

    reinjectContentScriptOnTab(tab)
      .then(function(response) {
        if (response !== 'content_script_loaded') {
          gsUtils.log(
            tab.id,
            'Failed to verify content script. Aborting tab check.',
            response
          );
          return;
        }

        // Content script is loaded correctly, now check if we need to suspend
        // gsUtils.log(tab.id, 'Content script verified. Continuing tab check.', response);
        validateStayAwake(tab);
      })
      .catch(function(error) {
        gsUtils.log(
          tab.id,
          'Failed to verify content script. Aborting tab check.',
          error
        );
      });
  }

  async function reinjectContentScriptOnTab(tab) {
    gsUtils.log(tab.id, 'Injecting content script to verify tab state');
    return new Promise(function(resolve, reject) {
      try {
        gsMessages.executeScriptOnTab(
          tab.id,
          'js/contentscript.js',
          function(error, response) {
            if (error) {
              gsUtils.log(tab.id, 'Failed to inject content script', error);
              reject(error);
              return;
            }
            if (!response) {
              gsUtils.log(tab.id, 'No response from content script');
              reject('No response from content script');
              return;
            }
            resolve(response);
          }
        );
      } catch (err) {
        gsUtils.log(tab.id, 'Failed to inject content script', err);
        reject(err);
      }
    });
  }

  function validateStayAwake(tab) {
    // If we need to check if a tab should be unwhitelisted
    chrome.alarms.get('stayAwakeReview', function(alarm) {
      if (typeof alarm !== 'undefined') {
        // If tab not in tempWhitelist, then check if it should be auto-unwhitelisted
        gsUtils.log(tab.id, 'Found stay-awake review alarm. Performing check.');

        const suspensionToggleTime = gsStorage.fetchNoticeVersion('temporarily-disabled');
        // If suspension has ot been toggled, or suspension has been re-enabled, then clear alarm and continue tab check
        if (!suspensionToggleTime || !gsStorage.getOption(gsStorage.SUSPEND_PAUSED)) {
          chrome.alarms.clear('stayAwakeReview');
          gsUtils.log(tab.id, 'Tab auto-unwhitelisting not required.');
        } else {
          const currentTime = new Date().getTime();
          if (currentTime - suspensionToggleTime > 3600000) {
            gsUtils.log(tab.id, 'Tab auto-unwhitelisting triggered.');
            gsStorage.setOption(gsStorage.SUSPEND_PAUSED, false);
            chrome.alarms.clear('stayAwakeReview');
          }
        }
      }
    });
  }

  function checkSuspendedTab(tab) {
    var targetUrl;
    var suspendedView = null;

    if (gsUtils.isDiscardedTab(tab)) {
      gsUtils.log(tab.id, 'Tab is discarded. Aborting check.');
      return;
    }

    try {
      targetUrl = gsUtils.getOriginalUrl(tab.url);
      if (!targetUrl) {
        gsUtils.log(tab.id, 'Could not determine original URL from suspended URL. Aborting check.');
        return;
      }
    } catch (err) {
      gsUtils.log(tab.id, 'Could not determine original URL from suspended URL. Aborting check.', err);
      return;
    }

    // Try to find any suspendedViews for the tab
    if (gsSession.isInitialising()) {
      gsUtils.log(
        tab.id,
        'Extension is still initialising. Ignoring check for this suspended tab.'
      );
      return;
    }

    // If successful then update the tab with the new suspended URL
    gsUtils.sendMessageToTab(tab.id, { action: 'requestInfo' }, function(
      error,
      suspendedView
    ) {
      if (error) {
        gsUtils.log(tab.id, 'Failed to get requestInfo for suspended tab', error);
        return;
      }
      if (!suspendedView) {
        gsUtils.log(tab.id, 'RequestInfo returned null suspendedView. Skipping check.');
        return;
      }

      if (!suspendedView.isStaticSuspendedTab) {
        gsUtils.log(tab.id, 'This is not a static suspended tab. Skipping check.');
        return;
      }

      const tabTitle = gsUtils.getSuspendedTitle(tab.url);
      const faviconUrl = gsUtils.getFaviconFromSuspendedUrl(tab.url);
      const faviconMeta = { favIconUrl: faviconUrl };
      const scrollPosition = gsUtils.getSuspendedScrollPosition(tab.url);
      gsTabSuspendManager
        .handleSuspendedTabRecovered(
          tab,
          tabTitle,
          targetUrl,
          faviconMeta,
          scrollPosition
        )
        .then(function(updatedTab) {
          if (!updatedTab) {
            gsUtils.log(
              tab.id,
              'Failed to update suspended tab recovery information.'
            );
          } else {
            gsUtils.log(
              tab.id,
              'Successfully updated suspended tab recovery information.'
            );
            if (suspendedView.backHash && suspendedView.backHash !== 'null') {
              gsUtils.log(tab.id, 'Saving back history for suspended tab.');
              gsIndexedDb.setTabInfo({ backHash: suspendedView.backHash });
            }
          }
        });
    });
  }

  function performTabChecks() {
    gsUtils.executeForEachTab(function(tab) {
      gsTabCheckManager.queueTabCheck(tab);
    });
  }

  return {
    queueTabCheck,
    unqueueTabCheck,
    performTabChecks,
    checkTabs: performTabChecks,
    queueTabCheckAsPromise,
  };
})();

// Register with global registry if available
if (typeof GS_REGISTRY !== 'undefined') {
  GS_REGISTRY.register('gsTabCheckManager', gsTabCheckManager);
}
EOF

# Replace the original with the fixed version
mv "$JS_DIR/gsTabCheckManager.js.fixed" "$JS_DIR/gsTabCheckManager.js"

# 3. Fix the web_accessible_resources in manifest.json
echo "Fixing manifest.json web_accessible_resources..."
cp "$SRC_DIR/manifest.json" "$SRC_DIR/manifest.json.backup"

# Update manifest.json to fix CSP for options page
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
    "alarms",
    "scripting"
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
      "options.html",
      "popup.html",
      "css/*",
      "img/*",
      "js/*",
      "font/*"
    ],
    "matches": ["<all_urls>"]
  }]
}
EOF

# 4. Update gsMessages.js to fix executeScriptOnTab function
echo "Fixing gsMessages.js for script execution..."
cp "$JS_DIR/gsMessages.js" "$JS_DIR/gsMessages.js.backup"

# Add patched version of executeScriptOnTab function
sed -i '/executeScriptOnTab: function(tabId, scriptFile, callback) {/,/},/c\
  executeScriptOnTab: function(tabId, scriptFile, callback) {\
    if (chrome.scripting) {\
      try {\
        chrome.scripting.executeScript(\
          {\
            target: { tabId: tabId },\
            files: [scriptFile]\
          },\
          function(results) {\
            if (chrome.runtime.lastError) {\
              callback(chrome.runtime.lastError, null);\
              return;\
            }\
            callback(null, results && results.length > 0 ? "content_script_loaded" : null);\
          }\
        );\
      } catch (err) {\
        callback(err, null);\
      }\
    } else if (chrome.tabs.executeScript) {\
      try {\
        chrome.tabs.executeScript(\
          tabId,\
          { file: scriptFile },\
          function(results) {\
            if (chrome.runtime.lastError) {\
              callback(chrome.runtime.lastError, null);\
              return;\
            }\
            callback(null, results && results.length > 0 ? "content_script_loaded" : null);\
          }\
        );\
      } catch (err) {\
        callback(err, null);\
      }\
    } else {\
      callback(new Error("No script execution API available"), null);\
    }\
  },' "$JS_DIR/gsMessages.js"

# 5. Create a special debugging script that will help identify issues
echo "Creating debug helper..."
cat > "$JS_DIR/gsDebugHelper.js" << 'EOF'
/**
 * Debug Helper for The Great Suspender
 */
'use strict';

var gsDebugHelper = (function() {
  
  function injectDebugMonitor() {
    console.log('🔍 Debug monitor injected');
    
    // Check if suspension works
    chrome.commands.onCommand.addListener(function(command) {
      console.log('Command received:', command);
      if (command === '1-suspend-tab') {
        console.log('Trying to suspend current tab...');
        chrome.tabs.query({active: true, currentWindow: true}, function(tabs) {
          if (tabs && tabs.length > 0) {
            const activeTab = tabs[0];
            console.log('Active tab:', activeTab);
            
            // Try to suspend through background page
            if (typeof tgs !== 'undefined' && tgs.suspendTab) {
              console.log('Calling tgs.suspendTab...');
              tgs.suspendTab(activeTab);
            } else {
              console.error('tgs.suspendTab not available!');
              
              // Try direct message
              chrome.tabs.sendMessage(
                activeTab.id,
                { action: 'suspendTab' },
                function(response) {
                  console.log('Direct suspension response:', response);
                }
              );
            }
          }
        });
      }
    });
    
    // Intercept tab suspension attempts
    const originalSuspendTab = tgs && tgs.suspendTab;
    if (originalSuspendTab) {
      tgs.suspendTab = function(tab) {
        console.log('🔄 tgs.suspendTab called with tab:', tab);
        return originalSuspendTab.apply(this, arguments);
      };
    }
  }
  
  // Inject monitoring after a delay to ensure everything is loaded
  setTimeout(injectDebugMonitor, 5000);
  
  return {
    injectDebugMonitor: injectDebugMonitor
  };
})();
EOF

# Add debug helper to background-wrapper.js
sed -i '/importScripts('\''background.js'\'');/a importScripts('\''gsDebugHelper.js'\'');' "$JS_DIR/background-wrapper.js"

echo "✅ All fixes applied!"
echo "Please completely remove the extension from Chrome and reinstall it fresh."
echo ""
echo "This fix should resolve:"
echo "1. Options page blank/reloading issue"
echo "2. Tab suspension functionality"
echo ""
echo "Use Ctrl+Shift+S to test suspension or right-click menu"