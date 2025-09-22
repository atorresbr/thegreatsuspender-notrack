/*global chrome, historyItems, gsMessages, gsSession, gsStorage, gsIndexedDb, gsChrome, gsUtils */
(function(global) {
  'use strict';

  try {
    chrome.extension.getBackgroundPage().tgs.setViewGlobals(global);
  } catch (e) {
    window.setTimeout(() => window.location.reload(), 1000);
    return;
  }

  var restoreAttempted = false;
  var tabsToRecover = [];

  async function getRecoverableTabs(currentTabs) {
    const lastSession = await gsIndexedDb.fetchLastSession();
    //check to see if they still exist in current session
    if (lastSession) {
      gsUtils.removeInternalUrlsFromSession(lastSession);
      for (const window of lastSession.windows) {
        for (const tabProperties of window.tabs) {
          if (gsUtils.isSuspendedTab(tabProperties)) {
            var originalUrl = gsUtils.getOriginalUrl(tabProperties.url);
            // Ignore suspended tabs from previous session that exist unsuspended now
            const originalTab = currentTabs.find(o => o.url === originalUrl);
            if (!originalTab) {
              tabProperties.windowId = window.id;
              tabProperties.sessionId = lastSession.sessionId;
              tabsToRecover.push(tabProperties);
            }
          }
        }
      }
      return tabsToRecover;
    }
  }

  function removeTabFromList(tabToRemove) {
    // Add safety check for element
<<<<<<< HEAD
    const recoveryTabsElement = document.recoveryTabsElement || document.createElement("div");
    const recoveryTabsEl = document.recoveryTabsElement;
=======
    const recoveryTabsEl = document.recoveryTabsElement || document.createElement("div");
>>>>>>> 6f7e0069b3234b9835b3c5e6fec4fbd500216f53
    const childLinks = recoveryTabsEl.children;

    for (var i = 0; i < childLinks.length; i++) {
      const element = childLinks[i];
      const url = tabToRemove.url || tabToRemove.pendingUrl;
      const originalUrl = gsUtils.isSuspendedUrl(url)
        ? gsUtils.getOriginalUrl(url)
        : url;

      if (
        element.getAttribute('data-url') === originalUrl ||
        element.getAttribute('data-tabId') == tabToRemove.id
      ) {
        // eslint-disable-line eqeqeq
        recoveryTabsEl.removeChild(element);
      }
    }

    //if removing the last element.. (re-get the element this function gets called asynchronously
<<<<<<< HEAD
    // Add safety check for element
    const recoveryTabsElement = document.recoveryTabsElement || document.createElement("div");
    if (document.recoveryTabsElement.children.length === 0) {
      //if we have already clicked the restore button then redirect to success page
=======
    //if removing the last element.. (re-get the element this function gets called asynchronously
    // Add safety check for element
    if (document.recoveryTabsElement && document.recoveryTabsElement.children.length === 0) {
>>>>>>> 6f7e0069b3234b9835b3c5e6fec4fbd500216f53
      if (restoreAttempted) {
        document.getElementById('suspendy-guy-inprogress').style.display =
          'none';
        document.getElementById('recovery-inprogress').style.display = 'none';
        document.getElementById('suspendy-guy-complete').style.display =
          'inline-block';
        document.getElementById('recovery-complete').style.display =
          'inline-block';

        //otherwise we have no tabs to recover so just hide references to recovery
      } else {
        hideRecoverySection();
      }
    }
  }

  function showTabSpinners() {
    // Add safety check for element
<<<<<<< HEAD
    const recoveryTabsElement = document.recoveryTabsElement || document.createElement("div");
    var recoveryTabsEl = document.recoveryTabsElement,
      childLinks = recoveryTabsEl.children;

=======
    var recoveryTabsEl = document.recoveryTabsElement || document.createElement("div");
    var childLinks = recoveryTabsEl.children;
>>>>>>> 6f7e0069b3234b9835b3c5e6fec4fbd500216f53
    for (var i = 0; i < childLinks.length; i++) {
      var tabContainerEl = childLinks[i];
      tabContainerEl.removeChild(tabContainerEl.firstChild);
      var spinnerEl = document.createElement('span');
      spinnerEl.classList.add('faviconSpinner');
      tabContainerEl.insertBefore(spinnerEl, tabContainerEl.firstChild);
    }
  }

  function hideRecoverySection() {
    var recoverySectionEls = document.getElementsByClassName('recoverySection');
    for (var i = 0; i < recoverySectionEls.length; i++) {
      recoverySectionEls[i].style.display = 'none';
    }
    document.getElementById('restoreSession').style.display = 'none';
  }

  gsUtils.documentReadyAndLocalisedAsPromsied(document).then(async function() {
    var restoreEl = document.getElementById('restoreSession'),
      manageEl = document.getElementById('manageManuallyLink'),
<<<<<<< HEAD
      previewsEl = document.getElementById('restoreSession'),
    // Add safety check for element
    const recoveryTabsElement = document.recoveryTabsElement || document.createElement("div");
      recoveryEl = document.recoveryTabsElement,
      warningEl = document.getElementById('screenCaptureNotice'),
      tabEl;

    manageEl.onclick = function(e) {
      e.preventDefault();
      chrome.tabs.create({ url: chrome.extension.getURL('history.html') });
    };
=======
      previewsEl = document.getElementById('restoreSession');
    // Add safety check for element
    var recoveryEl = document.recoveryTabsElement || document.createElement("div");
    var warningEl = document.getElementById('warning');

    if (manageEl) {
      manageEl.onclick = function(e) {
        e.preventDefault();
        chrome.tabs.create({ url: chrome.extension.getURL('history.html') });
      };
    }
>>>>>>> 6f7e0069b3234b9835b3c5e6fec4fbd500216f53

    if (previewsEl) {
      previewsEl.onclick = function(e) {
        gsStorage.setOptionAndSync(gsStorage.SCREEN_CAPTURE, '0');
        window.location.reload();
      };

      //show warning if screen capturing turned on
      if (gsStorage.getOption(gsStorage.SCREEN_CAPTURE) !== '0') {
        warningEl.style.display = 'block';
      }
    }

    var performRestore = async function() {
      restoreAttempted = true;
      restoreEl.className += ' btnDisabled';
      restoreEl.removeEventListener('click', performRestore);
      showTabSpinners();
      while (gsSession.isInitialising()) {
        await gsUtils.setTimeout(200);
      }
      await gsSession.recoverLostTabs();
    };

    restoreEl.addEventListener('click', performRestore);

    const currentTabs = await gsChrome.tabsQuery();
    const tabsToRecover = await getRecoverableTabs(currentTabs);
    if (tabsToRecover.length === 0) {
      hideRecoverySection();
      return;
    }

    for (var tabToRecover of tabsToRecover) {
      tabToRecover.title = gsUtils.getCleanTabTitle(tabToRecover);
      tabToRecover.url = gsUtils.getOriginalUrl(tabToRecover.url);
      tabEl = await historyItems.createTabHtml(tabToRecover, false);
      tabEl.onclick = function() {
        return function(e) {
          e.preventDefault();
          chrome.tabs.create({ url: tabToRecover.url, active: false });
          removeTabFromList(tabToRecover);
        };
      };
      recoveryEl.appendChild(tabEl);
    }

    var currentSuspendedTabs = currentTabs.filter(o =>
      gsUtils.isSuspendedTab(o)
    );
    for (const suspendedTab of currentSuspendedTabs) {
      gsMessages.sendPingToTab(suspendedTab.id, function(error) {
        if (error) {
          gsUtils.warning(suspendedTab.id, 'Failed to sendPingToTab', error);
        } else {
          removeTabFromList(suspendedTab);
        }
      });
    }
  });

  global.exports = {
    removeTabFromList,
  };
})(this);

// Event delegation for handling data-action attributes (replaces inline onclick)
function setupEventDelegation() {
    document.addEventListener('click', function(event) {
        let target = event.target;
        while (target && target !== document.body) {
            if (target.hasAttribute('data-action')) {
                const action = target.getAttribute('data-action');
                try {
                    // Execute the action using Function constructor
                    const func = new Function(action);
                    func.call(target, event);
                } catch (error) {
                    console.error('Error executing data-action:', action, error);
                }
                event.preventDefault();
                break;
            }
            target = target.parentNode;
        }
    });

    // Handle change events for data-change attributes
    document.addEventListener('change', function(event) {
        let target = event.target;
        if (target.hasAttribute('data-change')) {
            const action = target.getAttribute('data-change');
            try {
                const func = new Function(action);
                func.call(target, event);
            } catch (error) {
                console.error('Error executing data-change:', action, error);
            }
        }
    });

    // Handle other event types
    const eventTypes = ['submit', 'keyup', 'keydown', 'load'];
    const dataAttributes = ['data-submit', 'data-keyup', 'data-keydown', 'data-load'];
    
    eventTypes.forEach((type, index) => {
        document.addEventListener(type, function(event) {
            let target = event.target;
            if (type === 'load' && target === document) return; // Skip document load
            
            while (target && target !== document.body) {
                if (target.hasAttribute(dataAttributes[index])) {
                    const action = target.getAttribute(dataAttributes[index]);
                    try {
                        const func = new Function(action);
                        func.call(target, event);
                    } catch (error) {
                        console.error(`Error executing ${dataAttributes[index]}:`, action, error);
                    }
                    if (type === 'submit') {
                        event.preventDefault();
                    }
                    break;
                }
                target = target.parentNode;
            }
        });
    });
}

// Initialize event delegation on page load
document.addEventListener('DOMContentLoaded', function() {
    setupEventDelegation();
});
