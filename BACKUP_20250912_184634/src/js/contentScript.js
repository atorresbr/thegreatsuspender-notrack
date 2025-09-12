/**
 * Basic Content Script
 */

console.log('Content script loaded on:', window.location.href);

// Basic content script functionality
(function() {
    'use strict';
    
    // Check if this is a suspended tab
    if (window.location.href.includes('suspended.html')) {
        console.log('Suspended tab detected');
        return;
    }
    
    // Basic page monitoring
    let pageLoadTime = Date.now();
    
    // Listen for messages from background script
    chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
        console.log('Content script received message:', request);
        
        switch(request.action) {
            case 'getPageInfo':
                sendResponse({
                    success: true,
                    url: window.location.href,
                    title: document.title,
                    loadTime: pageLoadTime
                });
                break;
            default:
                sendResponse({success: false, error: 'Unknown action'});
        }
        
        return true;
    });
    
    console.log('Content script initialized');
})();
