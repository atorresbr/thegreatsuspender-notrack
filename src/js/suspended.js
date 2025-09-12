(function() {
  'use strict';

  let extensionAvailable = false;
  let suspensionId = null;
  let originalUrl = '';
  let originalTitle = '';

  // Core URL functions
  function getUrlParam(name) {
    const urlParams = new URLSearchParams(window.location.search);
    return urlParams.get(name);
  }

  function getOriginalUrl() {
    return getUrlParam('uri') || getUrlParam('url') || 'about:blank';
  }

  function getOriginalTitle() {
    return getUrlParam('title') || 'Suspended Tab';
  }

  function generateSuspensionId() {
    return 'gs-' + Date.now() + '-' + Math.random().toString(36).substr(2, 9);
  }

  function getSuspensionId() {
    let id = getUrlParam('gsId') || getUrlParam('suspensionId');
    
    if (!id) {
      id = generateSuspensionId();
      const newUrl = new URL(window.location);
      newUrl.searchParams.set('gsId', id);
      
      try {
        const suspendedTabs = JSON.parse(localStorage.getItem('gs-suspended-tabs') || '{}');
        suspendedTabs[id] = {
          url: getOriginalUrl(),
          title: getOriginalTitle(),
          timestamp: Date.now(),
          userAgent: navigator.userAgent,
          windowId: null,
          tabIndex: null
        };
        localStorage.setItem('gs-suspended-tabs', JSON.stringify(suspendedTabs));
        history.replaceState({}, '', newUrl.toString());
      } catch (e) {
        console.warn('Could not store suspension data:', e);
      }
    }
    
    return id;
  }

  // Display functions - FIXED!
  function displayOriginalUrl() {
    originalUrl = getOriginalUrl();
    originalTitle = getOriginalTitle();
    const urlElement = document.getElementById('originalUrl');
    
    console.log('Displaying URL:', originalUrl, 'Title:', originalTitle); // Debug
    
    if (originalUrl && originalUrl !== 'about:blank') {
      const decodedTitle = decodeURIComponent(originalTitle);
      const decodedUrl = decodeURIComponent(originalUrl);
      
      urlElement.innerHTML = 
        '<div style="margin-bottom: 8px; font-weight: bold;">' + 
        escapeHtml(decodedTitle) + 
        '</div><div style="font-size: 0.9em; opacity: 0.8;">' + 
        escapeHtml(decodedUrl) + '</div>';
      document.title = decodedTitle + ' (Suspended)';
    } else {
      urlElement.innerHTML = '<div style="color: #ff6b6b;">❌ No URL available</div>';
      document.title = 'Tab Suspended';
    }

    suspensionId = getSuspensionId();
    const idElement = document.getElementById('suspensionId');
    if (idElement) {
      idElement.textContent = 'Suspension ID: ' + suspensionId;
    }
    
    console.log('Generated suspension ID:', suspensionId); // Debug
  }

  function escapeHtml(text) {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
  }

  // Navigation functions - FIXED!
  function reloadTab() {
    console.log('Reloading tab with URL:', originalUrl); // Debug
    if (originalUrl && originalUrl !== 'about:blank') {
      window.location.href = decodeURIComponent(originalUrl);
    } else {
      window.history.back();
    }
  }

  function openInNewTab() {
    console.log('Opening in new tab:', originalUrl); // Debug
    if (originalUrl && originalUrl !== 'about:blank') {
      window.open(decodeURIComponent(originalUrl), '_blank');
    } else {
      showNotification('No URL to open', 'error');
    }
  }

  // Copy functions - FIXED!
  function copyUrl() {
    console.log('Copying URL:', originalUrl); // Debug
    if (originalUrl && originalUrl !== 'about:blank') {
      const url = decodeURIComponent(originalUrl);
      copyToClipboard(url, 'URL copied to clipboard!');
    } else {
      showNotification('No URL to copy', 'error');
    }
  }

  function copyTabId() {
    console.log('Copying tab ID:', suspensionId); // Debug
    if (suspensionId && originalUrl && originalUrl !== 'about:blank') {
      const tabData = suspensionId + '|' + encodeURIComponent(originalUrl) + '|' + encodeURIComponent(originalTitle);
      copyToClipboard(tabData, 'Tab ID copied! Save this to restore later.');
    } else {
      showNotification('No tab data to copy', 'error');
    }
  }

  function copyToClipboard(text, message) {
    console.log('Attempting to copy:', text); // Debug
    
    if (navigator.clipboard && navigator.clipboard.writeText) {
      navigator.clipboard.writeText(text).then(() => {
        showNotification(message);
      }).catch((err) => {
        console.error('Clipboard API failed:', err);
        fallbackCopy(text, message);
      });
    } else {
      fallbackCopy(text, message);
    }
  }

  function fallbackCopy(text, message) {
    const textArea = document.createElement('textarea');
    textArea.value = text;
    textArea.style.position = 'fixed';
    textArea.style.left = '-999999px';
    textArea.style.top = '-999999px';
    document.body.appendChild(textArea);
    textArea.focus();
    textArea.select();
    
    try {
      const successful = document.execCommand('copy');
      if (successful) {
        showNotification(message);
      } else {
        showNotification('Could not copy to clipboard', 'error');
      }
    } catch (err) {
      console.error('Fallback copy failed:', err);
      showNotification('Could not copy to clipboard', 'error');
    }
    
    document.body.removeChild(textArea);
  }

  function showNotification(message, type = 'success') {
    console.log('Showing notification:', message, type); // Debug
    
    const notification = document.createElement('div');
    notification.textContent = message;
    notification.style.cssText = `
      position: fixed;
      top: 20px;
      right: 20px;
      padding: 12px 20px;
      border-radius: 6px;
      color: white;
      font-weight: 500;
      z-index: 10000;
      transition: all 0.3s ease;
      ${type === 'error' ? 'background: #dc3545;' : 'background: #28a745;'}
    `;
    
    document.body.appendChild(notification);
    
    setTimeout(() => {
      notification.style.opacity = '0';
      notification.style.transform = 'translateX(100%)';
      setTimeout(() => {
        if (notification.parentNode) {
          notification.parentNode.removeChild(notification);
        }
      }, 300);
    }, 3000);
  }

  // Tab restoration functions
  function restoreTabsFromIds() {
    const input = document.getElementById('tabIdsInput');
    const ids = input.value.split('\n').filter(id => id.trim());
    
    if (ids.length === 0) {
      showNotification('Please enter at least one tab ID', 'error');
      return;
    }

    let restored = 0;
    ids.forEach(idLine => {
      const parts = idLine.trim().split('|');
      if (parts.length >= 3) {
        const [id, encodedUrl, encodedTitle] = parts;
        const url = decodeURIComponent(encodedUrl);
        const title = decodeURIComponent(encodedTitle);
        
        // Create suspended URL for this tab
        const suspendedUrl = window.location.origin + window.location.pathname + 
                           '?uri=' + encodeURIComponent(url) + 
                           '&title=' + encodeURIComponent(title) + 
                           '&gsId=' + encodeURIComponent(id);
        
        // Open in new tab
        window.open(suspendedUrl, '_blank');
        restored++;
      }
    });

    if (restored > 0) {
      showNotification(`Restored ${restored} suspended tab(s)!`);
      input.value = '';
    } else {
      showNotification('No valid tab IDs found', 'error');
    }
  }

  // Extension status and theme functions
  function checkExtensionStatus() {
    const statusElement = document.getElementById('extensionStatus');
    const tabIdSection = document.getElementById('tabIdSection');
    
    try {
      if (chrome && chrome.runtime && chrome.runtime.id) {
        extensionAvailable = true;
        statusElement.className = 'extension-status status-success';
        statusElement.textContent = '✅ Extension active - Full functionality available';
        
        document.body.classList.remove('extension-unavailable');
        tabIdSection.style.display = 'none';
        detectAndApplyTheme();
        setupExtensionListeners();
      } else {
        throw new Error('Extension not available');
      }
    } catch (e) {
      extensionAvailable = false;
      document.body.classList.add('extension-unavailable');
      statusElement.className = 'extension-status status-warning';
      statusElement.innerHTML = '⚠️ Extension not active - Limited functionality<br><small>Use "Copy Tab ID" before removing extension</small>';
      
      // Show tab restoration section when extension is unavailable
      tabIdSection.style.display = 'block';
    }
  }

  function detectAndApplyTheme() {
    if (!extensionAvailable) return;
    
    const body = document.body;
    
    console.log('Detecting extension theme...'); // Debug
    
    if (chrome.storage && chrome.storage.local) {
      chrome.storage.local.get(['theme'], function(result) {
        if (chrome.runtime.lastError) {
          console.log('Storage error, applying system theme');
          applySystemTheme();
          return;
        }
        
        const extensionTheme = result.theme;
        console.log('Extension theme setting:', extensionTheme); // Debug
        
        body.classList.remove('extension-dark-theme', 'extension-light-theme');
        
        if (extensionTheme === 'dark') {
          console.log('Applying extension dark theme');
          body.classList.add('extension-dark-theme');
        } else if (extensionTheme === 'light') {
          console.log('Applying extension light theme (beautiful purple)');
          body.classList.add('extension-light-theme');
        } else {
          console.log('Extension theme is auto, using system preference');
          applySystemTheme();
        }
      });
    } else {
      console.log('No chrome.storage, using system theme');
      applySystemTheme();
    }
  }

  function applySystemTheme() {
    const body = document.body;
    body.classList.remove('extension-dark-theme', 'extension-light-theme');
    
    if (window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches) {
      console.log('System prefers dark theme');
    } else {
      console.log('System prefers light theme (beautiful purple will be used)');
    }
  }

  function setupExtensionListeners() {
    if (!extensionAvailable) return;
    
    if (chrome.storage && chrome.storage.onChanged) {
      chrome.storage.onChanged.addListener(function(changes, namespace) {
        if (changes.theme) {
          console.log('Extension theme changed from', changes.theme.oldValue, 'to', changes.theme.newValue);
          detectAndApplyTheme();
        }
      });
    }

    if (window.matchMedia) {
      const darkModeQuery = window.matchMedia('(prefers-color-scheme: dark)');
      darkModeQuery.addEventListener('change', function(e) {
        console.log('System theme changed to:', e.matches ? 'dark' : 'light');
        
        if (chrome.storage && chrome.storage.local) {
          chrome.storage.local.get(['theme'], function(result) {
            if (!result.theme || result.theme === 'auto') {
              detectAndApplyTheme();
            }
          });
        }
      });
    }
  }

  // Event listeners - FIXED!
  function setupEventListeners() {
    const reloadBtn = document.getElementById('reloadBtn');
    const newTabBtn = document.getElementById('newTabBtn');
    const copyUrlBtn = document.getElementById('copyUrlBtn');
    const copyIdBtn = document.getElementById('copyIdBtn');
    const restoreTabsBtn = document.getElementById('restoreTabsBtn');
    
    console.log('Setting up event listeners...'); // Debug
    console.log('Found buttons:', {
      reloadBtn: !!reloadBtn,
      newTabBtn: !!newTabBtn,
      copyUrlBtn: !!copyUrlBtn,
      copyIdBtn: !!copyIdBtn,
      restoreTabsBtn: !!restoreTabsBtn
    });
    
    if (reloadBtn) {
      reloadBtn.addEventListener('click', function(e) {
        e.preventDefault();
        e.stopPropagation();
        console.log('Reload button clicked');
        reloadTab();
      });
    }
    
    if (newTabBtn) {
      newTabBtn.addEventListener('click', function(e) {
        e.preventDefault();
        e.stopPropagation();
        console.log('New tab button clicked');
        openInNewTab();
      });
    }
    
    if (copyUrlBtn) {
      copyUrlBtn.addEventListener('click', function(e) {
        e.preventDefault();
        e.stopPropagation();
        console.log('Copy URL button clicked');
        copyUrl();
      });
    }
    
    if (copyIdBtn) {
      copyIdBtn.addEventListener('click', function(e) {
        e.preventDefault();
        e.stopPropagation();
        console.log('Copy ID button clicked');
        copyTabId();
      });
    }
    
    if (restoreTabsBtn) {
      restoreTabsBtn.addEventListener('click', function(e) {
        e.preventDefault();
        e.stopPropagation();
        console.log('Restore tabs button clicked');
        restoreTabsFromIds();
      });
    }

    // Keyboard shortcuts
    document.addEventListener('keydown', function(event) {
      if (event.code === 'Space' || event.code === 'Enter') {
        event.preventDefault();
        console.log('Keyboard shortcut pressed, reloading tab');
        reloadTab();
      } else if (event.ctrlKey && event.code === 'KeyC') {
        event.preventDefault();
        console.log('Ctrl+C pressed, copying URL');
        copyUrl();
      }
    });

    // REMOVED background click reload to prevent interference with buttons
    console.log('Event listeners setup complete');
  }

  // Preserve data before potential closure
  function preserveDataOnUnload() {
    window.addEventListener('beforeunload', function(event) {
      try {
        const suspendedTabs = JSON.parse(localStorage.getItem('gs-suspended-tabs') || '{}');
        if (suspensionId) {
          suspendedTabs[suspensionId] = {
            url: originalUrl,
            title: originalTitle,
            timestamp: Date.now(),
            lastAccessed: Date.now(),
            preserved: true
          };
          localStorage.setItem('gs-suspended-tabs', JSON.stringify(suspendedTabs));
          console.log('Data preserved on unload');
        }
      } catch (e) {
        console.warn('Could not save state:', e);
      }
    });
  }

  // Initialization
  function init() {
    console.log('Initializing suspended tab...');
    displayOriginalUrl();
    checkExtensionStatus();
    setupEventListeners();
    preserveDataOnUnload();
    console.log('Suspended tab initialized');
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }

  // Periodic checks
  setInterval(checkExtensionStatus, 5000);

  // Expose functions for debugging
  window.checkExtensionStatus = checkExtensionStatus;
  window.detectAndApplyTheme = detectAndApplyTheme;
  window.restoreTabsFromIds = restoreTabsFromIds;
  window.reloadTab = reloadTab;
  window.copyUrl = copyUrl;
  window.copyTabId = copyTabId;
})();

// Load dynamic theme
if (typeof loadDynamicTheme === 'function') {
  loadDynamicTheme();
}

