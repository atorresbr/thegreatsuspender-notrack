/**
 * Manifest V3 Service Worker Background Script
 */

console.log('Service worker loaded');

// Manifest V3 service worker initialization
chrome.runtime.onInstalled.addListener(() => {
  console.log('Extension installed');
  
  // Set default settings
  chrome.storage.local.set({
    extensionEnabled: true,
    autoSuspendTime: 20,
    theme: 'purple'
  });
});

// Handle extension startup
chrome.runtime.onStartup.addListener(() => {
  console.log('Extension startup');
});

// Message handling for Manifest V3
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  console.log('Service worker received message:', request);
  
  switch(request.action) {
    case 'getStatus':
      sendResponse({success: true, status: 'Extension is running'});
      break;
    case 'suspendTab':
      handleSuspendTab(request.tabId);
      sendResponse({success: true});
      break;
    default:
      sendResponse({success: false, error: 'Unknown action'});
  }
  
  return true;
});

// Tab monitoring
chrome.tabs.onUpdated.addListener((tabId, changeInfo, tab) => {
  if (changeInfo.status === 'complete') {
    console.log('Tab updated:', tabId, tab.url);
  }
});

// Basic suspend functionality
async function handleSuspendTab(tabId) {
  try {
    const tab = await chrome.tabs.get(tabId);
    if (tab && !tab.url.includes('chrome://') && !tab.url.includes('suspended.html')) {
      const suspendedUrl = chrome.runtime.getURL('suspended.html') + 
        '?url=' + encodeURIComponent(tab.url) + 
        '&title=' + encodeURIComponent(tab.title);
      
      await chrome.tabs.update(tabId, {url: suspendedUrl});
      console.log('Tab suspended:', tabId);
    }
  } catch (error) {
    console.error('Error suspending tab:', error);
  }
}

console.log('Service worker initialized');
