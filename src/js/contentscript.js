/**
 * Manifest V3 Content Script
 */

console.log('Content script loaded on:', window.location.href);

(function() {
  'use strict';
  
  // Check if this is a suspended tab
  if (window.location.href.includes('suspended.html')) {
    console.log('Suspended tab detected');
    return;
  }
  
  // Page activity monitoring
  let lastActivity = Date.now();
  let isActive = true;
  
  // Activity listeners
  ['mousedown', 'mousemove', 'keypress', 'scroll', 'touchstart', 'click'].forEach(event => {
    document.addEventListener(event, () => {
      lastActivity = Date.now();
      isActive = true;
    }, true);
  });
  
  // Visibility change
  document.addEventListener('visibilitychange', () => {
    if (document.hidden) {
      isActive = false;
    } else {
      lastActivity = Date.now();
      isActive = true;
    }
  });
  
  // Message handling
  chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
    console.log('Content script received message:', request);
    
    switch(request.action) {
      case 'getPageInfo':
        sendResponse({
          success: true,
          url: window.location.href,
          title: document.title,
          lastActivity: lastActivity,
          isActive: isActive
        });
        break;
      case 'checkActivity':
        const inactive = Date.now() - lastActivity > (request.timeout || 1200000); // 20 minutes
        sendResponse({
          success: true,
          inactive: inactive,
          lastActivity: lastActivity
        });
        break;
      default:
        sendResponse({success: false, error: 'Unknown action'});
    }
    
    return true;
  });
  
  console.log('Content script initialized');
})();
