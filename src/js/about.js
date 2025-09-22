/* global chrome, XMLHttpRequest, gsStorage, gsUtils */
(function(global) {
  'use strict';

  try {
    chrome.extension.getBackgroundPage().tgs.setViewGlobals(global);
  } catch (e) {
    window.setTimeout(() => window.location.reload(), 1000);
    return;
  }

  gsUtils.documentReadyAndLocalisedAsPromsied(document).then(function() {
    var versionEl = document.getElementById('aboutVersion');
    versionEl.innerHTML = 'v' + chrome.runtime.getManifest().version;

    //hide incompatible sidebar items if in incognito mode
    if (chrome.extension.inIncognitoContext) {
      Array.prototype.forEach.call(
        document.getElementsByClassName('noIncognito'),
        function(el) {
          el.style.display = 'none';
        }
      );
    }
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
