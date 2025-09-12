/**
 * Helper for options page in Manifest V3 with service worker
 */
(function() {
  console.log('Options helper loaded');

  // Show error message in the options wrapper when DOM is ready
  function showConnectionError() {
    console.error('Could not connect to extension background.');
    
    // Wait for DOM to be ready
    if (document.readyState === 'loading') {
      document.addEventListener('DOMContentLoaded', setupErrorUI);
    } else {
      setupErrorUI();
    }
  }
  
  function setupErrorUI() {
    const wrapper = document.getElementById('options-wrapper');
    if (wrapper) {
      wrapper.innerHTML = `
        <div class="error-msg">
          <h2>Connection Error</h2>
          <p>Could not connect to extension background.</p>
          <p>This is likely because the extension is using Manifest V3 with a service worker.</p>
          <button id="retryConnection">Retry Connection</button>
          <button id="setupMessaging">Use Message Passing</button>
        </div>
      `;
      
      document.getElementById('retryConnection').addEventListener('click', function() {
        window.location.reload();
      });
      
      document.getElementById('setupMessaging').addEventListener('click', function() {
        setupMessagingAPI();
        window.location.reload();
      });
    }
  }

  // Try to get background info via message passing instead
  function getBackgroundInfo() {
    return new Promise((resolve, reject) => {
      chrome.runtime.sendMessage({action: 'getBackgroundStatus'}, response => {
        if (chrome.runtime.lastError) {
          console.error('Error connecting to background:', chrome.runtime.lastError);
          reject(chrome.runtime.lastError);
          return;
        }
        
        if (!response) {
          reject(new Error('Empty response from background'));
          return;
        }
        
        console.log('Got background status:', response);
        resolve(response);
      });
    });
  }
  
  function setupMessagingAPI() {
    console.log('Setting up messaging API for options');
    
    // Create a proxy for the background page
    window.backgroundPage = {
      gsStorage: {
        getOption: function(key) {
          return new Promise((resolve) => {
            chrome.runtime.sendMessage({
              action: 'getOption',
              key: key
            }, resolve);
          });
        },
        setOption: function(key, value) {
          return new Promise((resolve) => {
            chrome.runtime.sendMessage({
              action: 'setOption',
              key: key,
              value: value
            }, resolve);
          });
        },
        // Add other methods as needed
      },
      gsUtils: {
        // Stub methods
      },
      tgs: {
        // Stub methods  
      }
    };
    
    localStorage.setItem('useMessagingAPI', 'true');
  }
  
  // Wait for page load
  window.addEventListener('DOMContentLoaded', function() {
    console.log('Options page loaded, connecting to background...');
    
    // Try messaging API first
    getBackgroundInfo()
      .then(info => {
        console.log('Successfully connected to background service worker');
        setupMessagingAPI();
      })
      .catch(err => {
        console.error('Failed to connect to background:', err);
        showConnectionError();
      });
  });
})();
