/**
 * MINIMAL Content Script - Absolute minimum functionality
 */

(function() {
    'use strict';
    
    // Only log, do nothing else that could throw errors
    console.log('📄 Minimal content script loaded');
    
    // Simple activity tracking without extension communication
    let lastActivity = Date.now();
    
    function updateActivity() {
        lastActivity = Date.now();
    }
    
    // Only add basic event listeners
    try {
        ['mousedown', 'mousemove', 'keypress', 'scroll'].forEach(event => {
            document.addEventListener(event, updateActivity, { passive: true });
        });
    } catch (e) {
        // Ignore any errors
    }
    
    // NO chrome.runtime calls - this prevents all context errors
    
    console.log('✅ Minimal content script ready');
})();
