/*global chrome, gsSession, gsUtils */
(function(global) {
  'use strict';

  try {
    chrome.extension.getBackgroundPage().tgs.setViewGlobals(global);
  } catch (e) {
    window.setTimeout(() => window.location.reload(), 1000);
    return;
  }

  function toggleUpdated() {
    document.getElementById('updating').style.display = 'none';
    document.getElementById('updated').style.display = 'block';
  }

  gsUtils.documentReadyAndLocalisedAsPromsied(document).then(function() {
    // var versionEl = document.getElementById('updatedVersion');
    // versionEl.innerHTML = 'v' + chrome.runtime.getManifest().version;

    document.getElementById('sessionManagerLink').onclick = function(e) {
      e.preventDefault();
      chrome.tabs.create({ url: chrome.extension.getURL('history.html') });
    };

    var updateType = gsSession.getUpdateType();
    if (updateType === 'major') {
      document.getElementById('patchMessage').style.display = 'none';
      document.getElementById('minorUpdateDetail').style.display = 'none';
    } else if (updateType === 'minor') {
      document.getElementById('patchMessage').style.display = 'none';
      document.getElementById('majorUpdateDetail').style.display = 'none';
    } else {
      document.getElementById('updateDetail').style.display = 'none';
    }

    if (gsSession.isUpdated()) {
      toggleUpdated();
    }
  });

  global.exports = {
    toggleUpdated,
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
