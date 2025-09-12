/*global gsUtils, gsChrome, gsSession, gsIndexedDb, gsStorage, gsTabQueue, gsTabDiscardManager, gsTabSuspendManager, gsFavicon, tgs, gsMessages */
'use strict';

var gsTabCheckManager = (function() {
  // Constants
  const UNRESPONSIVE_TIMEOUT = 5000;
  const MAX_FAILED_SUSPENSIONS = 3;
  const MAX_POPUP_ATTEMPTS = 5;
  const QUEUE_ID = 'checkQueue';

  function getQueuedTabDetails(tabId) {
    if (!gsTabQueue) return null;
    return gsTabQueue.getQueuedTabDetails(tabId, QUEUE_ID);
  }

  function queueTabCheck(tab, preQueue) {
    preQueue = preQueue || [];
    queueTabCheckAsPromise(tab, preQueue);
    return Promise.resolve();
  }

  function queueTabCheckAsPromise(tab, preQueue) {
    preQueue = preQueue || [];
    return new Promise(function(resolve) {
      gsUtils.log(tab.id, 'Queuing tab for check.');
      if (!gsTabQueue || typeof gsTabQueue.queueTabAsPromise !== 'function') {
        console.warn('gsTabQueue not available for queueTabCheckAsPromise');
        resolve();
        return;
      }
      gsTabQueue
        .queueTabAsPromise(tab.id, QUEUE_ID, function() {
          checkTab(tab, preQueue);
        })
        .then(resolve);
    });
  }

  function unqueueTabCheck(tabId) {
    if (!gsTabQueue) return Promise.resolve();
    return gsTabQueue.unqueueTab(tabId, QUEUE_ID);
  }

  function checkTab(tab, preQueue) {
    gsUtils.log(tab.id, 'Checking tab state.');

    if (typeof tab === 'undefined') {
      return;
    }
    
    if (!gsUtils.isValidTabInfo(tab)) {
      gsUtils.log(tab.id, 'Tab is invalid. Getting updated tab information.');
      gsChrome.tabsGet(tab.id).then(function(newTab) {
        if (!gsUtils.isValidTabInfo(newTab)) {
          gsUtils.log(tab.id, 'Updated tab is invalid!');
          return;
        }
        tab = newTab;
        processTabState(tab, preQueue);
      });
      return;
    }
    
    processTabState(tab, preQueue);
  }

  function processTabState(tab, preQueue) {
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
    if (queuedTabDetails && queuedTabDetails.executionProps && queuedTabDetails.executionProps.refetchTab) {
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
      !chrome.scripting.executeScript
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

    validateScriptAndStayAwake(tab);
  }

  function validateScriptAndStayAwake(tab) {
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

  function reinjectContentScriptOnTab(tab) {
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
        // If suspension has not been toggled, or suspension has been re-enabled, then clear alarm and continue tab check
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
    // Use local implementation if gsUtils.executeForEachTab is not available
    if (typeof gsUtils !== "undefined" && typeof gsUtils.executeForEachTab === "function") {
      gsUtils.executeForEachTab(function(tab) {
        gsTabCheckManager.queueTabCheck(tab);
      });
    } else {
      console.log("Using local executeForEachTab implementation");
      // Local implementation
      chrome.tabs.query({}, function(tabs) {
        if (tabs && tabs.length > 0) {
          tabs.forEach(function(tab) {
            gsTabCheckManager.queueTabCheck(tab);
          });
        }
      });
    }
  }

  return {
    queueTabCheck: queueTabCheck,
    unqueueTabCheck: unqueueTabCheck,
    performTabChecks: performTabChecks
  };
})();

// Register with global registry if available
if (typeof GS_REGISTRY !== 'undefined') {
  GS_REGISTRY.register('gsTabCheckManager', gsTabCheckManager);
}
