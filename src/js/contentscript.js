/**
 * CONTENT SCRIPT WITH CONTEXT INVALIDATION PROTECTION
 * Handles extension context invalidation gracefully
 */

console.log('📄 Content script loaded with context protection');

// Track tab activity
let lastActivity = Date.now();
let isTabActive = true;
let protectionEnabled = true;
let contextValid = true;

// Check if extension context is still valid
function isExtensionContextValid() {
    try {
        // Try to access chrome.runtime
        if (!chrome.runtime || !chrome.runtime.id) {
            return false;
        }
        
        // Check if we can send messages
        if (!chrome.runtime.sendMessage) {
            return false;
        }
        
        return contextValid;
    } catch (error) {
        console.warn('Extension context check failed:', error);
        return false;
    }
}

// Safe message sending with context validation
function safeRuntimeSendMessage(message, callback) {
    if (!isExtensionContextValid()) {
        console.warn('Extension context invalid, skipping message:', message.action);
        if (callback) {
            callback({ success: false, error: 'Extension context invalidated' });
        }
        return;
    }
    
    try {
        chrome.runtime.sendMessage(message, (response) => {
            // Check for runtime errors
            if (chrome.runtime.lastError) {
                console.warn('Runtime error:', chrome.runtime.lastError.message);
                
                // Mark context as invalid if it's a context error
                if (chrome.runtime.lastError.message.includes('context invalidated') ||
                    chrome.runtime.lastError.message.includes('Extension context') ||
                    chrome.runtime.lastError.message.includes('receiving end does not exist')) {
                    contextValid = false;
                    console.warn('Extension context marked as invalid');
                }
                
                if (callback) {
                    callback({ success: false, error: chrome.runtime.lastError.message });
                }
                return;
            }
            
            if (callback) {
                callback(response);
            }
        });
    } catch (error) {
        console.error('Error sending message:', error);
        contextValid = false;
        
        if (callback) {
            callback({ success: false, error: error.message });
        }
    }
}

// Update activity timestamp
function updateActivity() {
    lastActivity = Date.now();
}

// Check if tab protection is enabled (with safe storage access)
function checkProtection() {
    if (!isExtensionContextValid()) {
        console.warn('Cannot check protection - extension context invalid');
        return;
    }
    
    try {
        chrome.storage.local.get(['tabProtection'], (result) => {
            if (chrome.runtime.lastError) {
                console.warn('Storage error:', chrome.runtime.lastError.message);
                return;
            }
            protectionEnabled = result.tabProtection !== false;
        });
    } catch (error) {
        console.warn('Error checking protection:', error);
    }
}

// Listen for user activity
const activityEvents = ['mousedown', 'mousemove', 'keypress', 'scroll', 'touchstart', 'click'];
activityEvents.forEach(event => {
    document.addEventListener(event, updateActivity, { passive: true });
});

// Listen for visibility changes
document.addEventListener('visibilitychange', () => {
    isTabActive = !document.hidden;
    if (isTabActive) {
        updateActivity();
    }
});

// Listen for messages from background (with context protection)
try {
    chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
        if (!isExtensionContextValid()) {
            console.warn('Cannot handle message - extension context invalid');
            sendResponse({ success: false, error: 'Extension context invalidated' });
            return;
        }
        
        console.log('Content script received message:', message);
        
        try {
            switch(message.action) {
                case 'checkActivity':
                    sendResponse({
                        lastActivity: lastActivity,
                        isActive: isTabActive,
                        protected: protectionEnabled,
                        url: window.location.href,
                        title: document.title,
                        contextValid: contextValid
                    });
                    break;
                    
                case 'suspend':
                    if (protectionEnabled) {
                        sendResponse({ success: true, message: 'Tab will be suspended' });
                    } else {
                        sendResponse({ success: false, message: 'Tab protection disabled' });
                    }
                    break;
                    
                case 'ping':
                    // Simple ping to check if content script is responsive
                    sendResponse({ success: true, message: 'Content script responsive' });
                    break;
                    
                default:
                    sendResponse({ success: false, message: 'Unknown action' });
            }
        } catch (error) {
            console.error('Error handling message:', error);
            sendResponse({ success: false, error: error.message });
        }
        
        return true;
    });
} catch (error) {
    console.error('Error setting up message listener:', error);
}

// Prevent suspension of important pages
const protectedDomains = [
    'chrome://',
    'chrome-extension://',
    'moz-extension://',
    'edge://',
    'about:',
    'file://'
];

function isProtectedPage() {
    const url = window.location.href.toLowerCase();
    return protectedDomains.some(domain => url.startsWith(domain));
}

// Check for audio/video elements
function hasActiveMedia() {
    try {
        const videos = document.querySelectorAll('video');
        const audios = document.querySelectorAll('audio');
        
        for (let video of videos) {
            if (!video.paused && !video.muted && video.currentTime > 0) {
                return true;
            }
        }
        
        for (let audio of audios) {
            if (!audio.paused && !audio.muted && audio.currentTime > 0) {
                return true;
            }
        }
        
        return false;
    } catch (error) {
        console.warn('Error checking active media:', error);
        return false;
    }
}

// Check for form inputs with content
function hasUnsavedForm() {
    try {
        const inputs = document.querySelectorAll('input[type="text"], input[type="email"], input[type="password"], textarea');
        
        for (let input of inputs) {
            if (input.value.trim().length > 0) {
                return true;
            }
        }
        
        return false;
    } catch (error) {
        console.warn('Error checking unsaved forms:', error);
        return false;
    }
}

// Notify background of protection status (with safe messaging)
function notifyProtectionStatus() {
    if (!isExtensionContextValid()) {
        console.warn('Cannot notify protection status - extension context invalid');
        return;
    }
    
    const status = {
        protected: isProtectedPage() || hasActiveMedia() || hasUnsavedForm(),
        reason: isProtectedPage() ? 'protected-domain' : 
               hasActiveMedia() ? 'active-media' : 
               hasUnsavedForm() ? 'unsaved-form' : 'none',
        lastActivity: lastActivity,
        isActive: isTabActive,
        contextValid: contextValid
    };
    
    safeRuntimeSendMessage({
        action: 'protectionStatus',
        status: status
    }, (response) => {
        if (!response || !response.success) {
            console.warn('Failed to notify protection status:', response?.error);
        }
    });
}

// Context validation check
function validateExtensionContext() {
    try {
        // Test chrome.runtime access
        if (!chrome.runtime || !chrome.runtime.id) {
            contextValid = false;
            return false;
        }
        
        // Test storage access
        chrome.storage.local.get(['test'], (result) => {
            if (chrome.runtime.lastError) {
                contextValid = false;
            }
        });
        
        return contextValid;
    } catch (error) {
        console.warn('Context validation failed:', error);
        contextValid = false;
        return false;
    }
}

// Initialize content script with context protection
function init() {
    console.log('🔧 Initializing content script with context protection...');
    
    // Validate context first
    if (!validateExtensionContext()) {
        console.warn('Extension context invalid during initialization');
        return;
    }
    
    checkProtection();
    
    // Send initial status after a delay
    setTimeout(() => {
        if (isExtensionContextValid()) {
            notifyProtectionStatus();
        }
    }, 1000);
    
    // Periodic status updates with context checking
    setInterval(() => {
        if (isExtensionContextValid()) {
            notifyProtectionStatus();
        } else {
            console.warn('Skipping status update - extension context invalid');
        }
    }, 30000); // Every 30 seconds
    
    // Periodic context validation
    setInterval(() => {
        validateExtensionContext();
    }, 10000); // Every 10 seconds
    
    console.log('✅ Content script initialized with context protection');
}

// Start initialization when DOM is ready
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
} else {
    init();
}

// Listen for storage changes (with context protection)
try {
    chrome.storage.onChanged.addListener((changes, namespace) => {
        if (!isExtensionContextValid()) {
            console.warn('Cannot handle storage changes - extension context invalid');
            return;
        }
        
        if (namespace === 'local' && changes.tabProtection) {
            protectionEnabled = changes.tabProtection.newValue !== false;
            console.log('Tab protection updated:', protectionEnabled);
        }
    });
} catch (error) {
    console.error('Error setting up storage listener:', error);
}

// Handle page unload
window.addEventListener('beforeunload', () => {
    console.log('Content script unloading...');
});

// Recovery mechanism - try to re-establish context
function attemptContextRecovery() {
    console.log('🔄 Attempting context recovery...');
    
    setTimeout(() => {
        contextValid = true;
        if (validateExtensionContext()) {
            console.log('✅ Context recovery successful');
            init();
        } else {
            console.warn('❌ Context recovery failed');
        }
    }, 1000);
}

// Monitor for context invalidation
setInterval(() => {
    if (!contextValid) {
        attemptContextRecovery();
    }
}, 5000); // Every 5 seconds

console.log('✅ Content script loaded with full context invalidation protection');
