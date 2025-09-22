/*global chrome, historyItems, historyUtils, gsSession, gsIndexedDb, gsUtils */
(function(global) {
  'use strict';

  try {
    chrome.extension.getBackgroundPage().tgs.setViewGlobals(global);
  } catch (e) {
    window.setTimeout(() => window.location.reload(), 1000);
    return;
  }

  async function reloadTabs(sessionId, windowId, openTabsAsSuspended) {
    const session = await gsIndexedDb.fetchSessionBySessionId(sessionId);
    if (!session || !session.windows) {
      return;
    }

    gsUtils.removeInternalUrlsFromSession(session);

    //if loading a specific window
    let sessionWindows = [];
    if (windowId) {
      sessionWindows.push(gsUtils.getWindowFromSession(windowId, session));
      //else load all windows from session
    } else {
      sessionWindows = session.windows;
    }

    for (let sessionWindow of sessionWindows) {
      const suspendMode = openTabsAsSuspended ? 1 : 2;
      await gsSession.restoreSessionWindow(sessionWindow, null, suspendMode);
    }
  }

  function deleteSession(sessionId) {
    var result = window.confirm(
      chrome.i18n.getMessage('js_history_confirm_delete')
    );
    if (result) {
      gsIndexedDb.removeSessionFromHistory(sessionId).then(function() {
        window.location.reload();
      });
    }
  }

  function removeTab(element, sessionId, windowId, tabId) {
    var sessionEl, newSessionEl;

    gsIndexedDb
      .removeTabFromSessionHistory(sessionId, windowId, tabId)
      .then(function(session) {
        gsUtils.removeInternalUrlsFromSession(session);
        //if we have a valid session returned
        if (session) {
          sessionEl = element.parentElement.parentElement;
          newSessionEl = createSessionElement(session);
          sessionEl.parentElement.replaceChild(newSessionEl, sessionEl);
          toggleSession(newSessionEl, session.sessionId); //async. unhandled promise

          //otherwise assume it was the last tab in session and session has been removed
        } else {
          window.location.reload();
        }
      });
  }

  async function toggleSession(element, sessionId) {
    var sessionContentsEl = element.getElementsByClassName(
      'sessionContents'
    )[0];
    var sessionIcon = element.getElementsByClassName('content')[0];
    if (sessionIcon.classList.contains('icon-plus-squared-alt')) {
      sessionIcon.classList.remove('icon-plus-squared-alt');
      sessionIcon.classList.add('icon-minus-squared-alt');
    } else {
      sessionIcon.classList.remove('icon-minus-squared-alt');
      sessionIcon.classList.add('icon-plus-squared-alt');
    }

    //if toggled on already, then toggle off
    if (sessionContentsEl.childElementCount > 0) {
      sessionContentsEl.innerHTML = '';
      return;
    }

    gsIndexedDb
      .fetchSessionBySessionId(sessionId)
      .then(async function(curSession) {
        if (!curSession || !curSession.windows) {
          return;
        }
        gsUtils.removeInternalUrlsFromSession(curSession);

        for (const [i, curWindow] of curSession.windows.entries()) {
          curWindow.sessionId = curSession.sessionId;
          sessionContentsEl.appendChild(
            createWindowElement(curSession, curWindow, i)
          );

          const tabPromises = [];
          for (const curTab of curWindow.tabs) {
            curTab.windowId = curWindow.id;
            curTab.sessionId = curSession.sessionId;
            curTab.title = gsUtils.getCleanTabTitle(curTab);
            if (gsUtils.isSuspendedTab(curTab)) {
              curTab.url = gsUtils.getOriginalUrl(curTab.url);
            }
            tabPromises.push(createTabElement(curSession, curWindow, curTab));
          }
          const tabEls = await Promise.all(tabPromises);
          for (const tabEl of tabEls) {
            sessionContentsEl.appendChild(tabEl);
          }
        }
      });
  }

  function addClickListenerToElement(element, func) {
    if (element) {
      element.onclick = func;
    }
  }

  function createSessionElement(session) {
    var sessionEl = historyItems.createSessionHtml(session, true);

    addClickListenerToElement(
      sessionEl.getElementsByClassName('content')[0],
      function() {
        toggleSession(sessionEl, session.sessionId); //async. unhandled promise
      }
    );
    addClickListenerToElement(
      sessionEl.getElementsByClassName('btn')[0],
      function() {
        toggleSession(sessionEl, session.sessionId); //async. unhandled promise
      }
    );
    addClickListenerToElement(
      sessionEl.getElementsByClassName('btn')[0],
      function() {
        historyUtils.exportSessionWithId(session.sessionId);
      }
    );
    addClickListenerToElement(
      sessionEl.getElementsByClassName('btn')[0],
      function() {
        reloadTabs(session.sessionId, null, true); // async
      }
    );
    addClickListenerToElement(
      sessionEl.getElementsByClassName('btn')[0],
      function() {
        reloadTabs(session.sessionId, null, false); // async
      }
    );
    addClickListenerToElement(
      sessionEl.getElementsByClassName('btn')[0],
      function() {
        historyUtils.saveSession(session.sessionId);
      }
    );
    addClickListenerToElement(
      sessionEl.getElementsByClassName('btn')[0],
      function() {
        deleteSession(session.sessionId);
      }
    );
    return sessionEl;
  }

  function createWindowElement(session, window, index) {
    var allowReload = session.sessionId !== gsSession.getSessionId();
    var windowEl = historyItems.createWindowHtml(window, index, allowReload);

    addClickListenerToElement(
      windowEl.getElementsByClassName('btn')[0],
      function() {
        reloadTabs(session.sessionId, window.id, true); // async
      }
    );
    addClickListenerToElement(
      windowEl.getElementsByClassName('btn')[0],
      function() {
        reloadTabs(session.sessionId, window.id, false); // async
      }
    );
    return windowEl;
  }

  async function createTabElement(session, window, tab) {
    var allowDelete = session.sessionId !== gsSession.getSessionId();
    var tabEl = await historyItems.createTabHtml(tab, allowDelete);

    addClickListenerToElement(
      tabEl.getElementsByClassName('btn')[0],
      function() {
        removeTab(tabEl, session.sessionId, window.id, tab.id);
      }
    );
    return tabEl;
  }

  function render() {
    var currentDiv = document.getElementById('importSession'),
      sessionsDiv = document.getElementById('migrateTabs'),
      historyDiv = document.getElementById('importSessionAction'),
      importSessionEl = document.getElementById('importSession'),
      importSessionActionEl = document.getElementById('importSessionAction'),
      firstSession = true;

    currentDiv.innerHTML = '';
    sessionsDiv.innerHTML = '';
    historyDiv.innerHTML = '';

    gsIndexedDb.fetchCurrentSessions().then(function(currentSessions) {
      currentSessions.forEach(function(session, index) {
        gsUtils.removeInternalUrlsFromSession(session);
        var sessionEl = createSessionElement(session);
        if (firstSession) {
          currentDiv.appendChild(sessionEl);
          firstSession = false;
        } else {
          sessionsDiv.appendChild(sessionEl);
        }
      });
    });

    gsIndexedDb.fetchSavedSessions().then(function(savedSessions) {
      savedSessions.forEach(function(session, index) {
        gsUtils.removeInternalUrlsFromSession(session);
        var sessionEl = createSessionElement(session);
        historyDiv.appendChild(sessionEl);
      });
    });

    importSessionActionEl.addEventListener(
      'change',
      historyUtils.importSession,
      false
    );
    importSessionEl.onclick = function() {
      importSessionActionEl.click();
    };

    var migrateTabsEl = document.getElementById('migrateTabs');
    migrateTabsEl.onclick = function() {
      var migrateTabsFromIdEl = document.getElementById('migrateFromId');
      historyUtils.migrateTabs(migrateTabsFromIdEl.value);
    };

    //hide incompatible sidebar items if in incognito mode
    if (chrome.extension.inIncognitoContext) {
      Array.prototype.forEach.call(
        document.getElementsByClassName('noIncognito'),
        function(el) {
          el.style.display = 'none';
        }
      );
    }
  }

  gsUtils.documentReadyAndLocalisedAsPromsied(document).then(function() {
    render();
  });

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
