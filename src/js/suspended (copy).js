/**
 * COMPLETE Suspended Tab JavaScript with ALL original functions
 */

console.log('✅ Complete suspended tab script loaded');

// Global variables
let suspendedAt = null;
let originalUrl = '';
let tabTitle = '';
let sessionId = '';
let tabId = '';
let durationInterval = null;

// Initialize everything when DOM loads
document.addEventListener('DOMContentLoaded', function() {
    console.log('✅ Suspended page DOM loaded - initializing all functions');
    
    // Parse URL parameters
    const urlParams = new URLSearchParams(window.location.search);
    originalUrl = urlParams.get('uri') || urlParams.get('url') || '';
    tabTitle = urlParams.get('title') || 'Suspended Tab';
    sessionId = urlParams.get('sessionId') || 'No Session ID';
    tabId = urlParams.get('tabId') || 'Unknown';
    
    // Get suspension time (try from URL first, then use current time)
    const suspendedAtParam = urlParams.get('suspendedAt');
    if (suspendedAtParam) {
        suspendedAt = new Date(parseInt(suspendedAtParam));
    } else {
        suspendedAt = new Date(); // Current time as fallback
    }
    
    console.log('Parsed parameters:', { 
        originalUrl, 
        tabTitle, 
        sessionId, 
        tabId, 
        suspendedAt: suspendedAt.toISOString() 
    });
    
    // Update all page content
    updatePageContent();
    
    // Start duration counter
    startDurationCounter();
    
    // Update statistics
    updateStatistics();
    
    // Setup all event handlers
    setupEventHandlers();
    
    console.log('✅ All suspended page functions initialized');
});

// Update page content with all information
function updatePageContent() {
    // Basic info
    updateElement('tabTitle', decodeURIComponent(tabTitle));
    updateElement('tabUrl', decodeURIComponent(originalUrl));
    updateElement('sessionId', sessionId);
    updateElement('tabId', tabId);
    
    // Set page title
    document.title = `Suspended: ${decodeURIComponent(tabTitle)}`;
    
    // Suspension time
    if (suspendedAt) {
        updateElement('suspendedAt', suspendedAt.toLocaleString());
    }
    
    // Initial duration
    updateDuration();
}

// Update element content safely
function updateElement(id, content) {
    const element = document.getElementById(id);
    if (element) {
        element.textContent = content;
    }
}

// Start duration counter
function startDurationCounter() {
    // Clear any existing interval
    if (durationInterval) {
        clearInterval(durationInterval);
    }
    
    // Update duration every second
    durationInterval = setInterval(updateDuration, 1000);
    
    // Initial update
    updateDuration();
}

// Update duration display
function updateDuration() {
    if (!suspendedAt) return;
    
    const now = new Date();
    const diff = now - suspendedAt;
    
    if (diff < 0) {
        updateElement('duration', '0 seconds');
        return;
    }
    
    const seconds = Math.floor(diff / 1000) % 60;
    const minutes = Math.floor(diff / (1000 * 60)) % 60;
    const hours = Math.floor(diff / (1000 * 60 * 60)) % 24;
    const days = Math.floor(diff / (1000 * 60 * 60 * 24));
    
    let durationText = '';
    
    if (days > 0) {
        durationText = `${days} day${days > 1 ? 's' : ''}, ${hours} hour${hours !== 1 ? 's' : ''}`;
    } else if (hours > 0) {
        durationText = `${hours} hour${hours !== 1 ? 's' : ''}, ${minutes} minute${minutes !== 1 ? 's' : ''}`;
    } else if (minutes > 0) {
        durationText = `${minutes} minute${minutes !== 1 ? 's' : ''}, ${seconds} second${seconds !== 1 ? 's' : ''}`;
    } else {
        durationText = `${seconds} second${seconds !== 1 ? 's' : ''}`;
    }
    
    updateElement('duration', durationText);
}

// Update statistics (suspended tabs count, memory saved, etc.)
function updateStatistics() {
    // Get suspended tabs count and memory info
    if (typeof chrome !== 'undefined' && chrome.runtime) {
        chrome.runtime.sendMessage({action: 'getSuspendedCount'}, function(response) {
            if (response && response.success) {
                updateElement('suspendedCount', response.count || 0);
                updateElement('memorySaved', `${response.estimatedMemory || 0} MB`);
            } else {
                updateElement('suspendedCount', '1');
                updateElement('memorySaved', '~75 MB');
            }
        });
        
        // Get session duration
        chrome.runtime.sendMessage({action: 'getSessionDuration'}, function(response) {
            if (response && response.duration) {
                updateElement('sessionDuration', formatDuration(response.duration));
            } else {
                updateElement('sessionDuration', 'Unknown');
            }
        });
    } else {
        // Fallback values
        updateElement('suspendedCount', '1');
        updateElement('memorySaved', '~75 MB');
        updateElement('sessionDuration', 'Unknown');
    }
}

// Format duration helper
function formatDuration(milliseconds) {
    const seconds = Math.floor(milliseconds / 1000) % 60;
    const minutes = Math.floor(milliseconds / (1000 * 60)) % 60;
    const hours = Math.floor(milliseconds / (1000 * 60 * 60));
    
    if (hours > 0) {
        return `${hours}h ${minutes}m`;
    } else if (minutes > 0) {
        return `${minutes}m ${seconds}s`;
    } else {
        return `${seconds}s`;
    }
}

// Setup all event handlers
function setupEventHandlers() {
    // Copy functions
    setupClickHandler('[data-action="copy-session"]', () => copyToClipboard(sessionId, 'Session ID'));
    setupClickHandler('[data-action="copy-tab"]', () => copyToClipboard(tabId, 'Tab ID'));
    setupClickHandler('[data-action="copy-url"]', () => copyToClipboard(originalUrl, 'URL'));
    
    // Restore functions
    setupClickHandler('[data-action="restore"]', () => restoreTab());
    setupClickHandler('[data-action="restore-new-window"]', () => restoreInNewWindow());
    
    // Options
    setupClickHandler('[data-action="options"]', () => openOptions());
    
    // Keyboard shortcuts
    document.addEventListener('keydown', handleKeyboardShortcuts);
    
    // Escape key for options
    document.addEventListener('keyup', function(e) {
        if (e.key === 'Escape') {
            openOptions();
        }
    });
}

// Setup click handler helper
function setupClickHandler(selector, handler) {
    const element = document.querySelector(selector);
    if (element) {
        element.addEventListener('click', handler);
    }
}

// Handle keyboard shortcuts
function handleKeyboardShortcuts(e) {
    // Prevent default browser refresh
    if ((e.ctrlKey && e.key === 'r') || e.key === 'F5') {
        e.preventDefault();
        restoreTab();
    }
    
    // Copy session ID
    if (e.ctrlKey && e.key === 'c') {
        e.preventDefault();
        copyToClipboard(sessionId, 'Session ID');
    }
    
    // Restore in new window
    if (e.ctrlKey && e.shiftKey && e.key === 'R') {
        e.preventDefault();
        restoreInNewWindow();
    }
}

// Copy to clipboard function
function copyToClipboard(text, type) {
    console.log('Copying to clipboard:', type, text);
    
    if (!text || text === 'Unknown' || text === 'Loading...') {
        showNotification(`Cannot copy ${type}: Not available`);
        return;
    }
    
    if (navigator.clipboard && navigator.clipboard.writeText) {
        navigator.clipboard.writeText(text).then(() => {
            showNotification(`${type} copied to clipboard!`);
        }).catch(err => {
            console.error('Clipboard API failed:', err);
            fallbackCopy(text, type);
        });
    } else {
        fallbackCopy(text, type);
    }
}

// Fallback copy method
function fallbackCopy(text, type) {
    const textArea = document.createElement('textarea');
    textArea.value = text;
    textArea.style.position = 'fixed';
    textArea.style.opacity = '0';
    textArea.style.left = '-9999px';
    document.body.appendChild(textArea);
    textArea.select();
    textArea.setSelectionRange(0, 99999);
    
    try {
        const successful = document.execCommand('copy');
        if (successful) {
            showNotification(`${type} copied to clipboard!`);
        } else {
            showNotification(`Failed to copy ${type}`);
        }
    } catch (err) {
        console.error('Fallback copy failed:', err);
        showNotification(`Failed to copy ${type}`);
    }
    
    document.body.removeChild(textArea);
}

// Show notification
function showNotification(message) {
    const notification = document.getElementById('notification');
    if (notification) {
        notification.textContent = message;
        notification.style.display = 'block';
        
        // Hide after 3 seconds
        setTimeout(() => {
            notification.style.display = 'none';
        }, 3000);
    }
}

// Restore tab in same window
function restoreTab() {
    console.log('Restoring tab in same window:', originalUrl);
    
    if (!originalUrl || originalUrl === 'undefined' || originalUrl.trim() === '') {
        showNotification('Cannot restore: Original URL not found');
        return;
    }
    
    try {
        const decodedUrl = decodeURIComponent(originalUrl);
        console.log('Redirecting to:', decodedUrl);
        window.location.href = decodedUrl;
    } catch (error) {
        console.error('Error restoring tab:', error);
        showNotification('Cannot restore: Invalid URL');
    }
}

// Restore tab in new window
function restoreInNewWindow() {
    console.log('Restoring tab in new window:', originalUrl);
    
    if (!originalUrl || originalUrl === 'undefined' || originalUrl.trim() === '') {
        showNotification('Cannot restore: Original URL not found');
        return;
    }
    
    try {
        const decodedUrl = decodeURIComponent(originalUrl);
        console.log('Opening in new window:', decodedUrl);
        window.open(decodedUrl, '_blank');
        showNotification('Tab restored in new window');
    } catch (error) {
        console.error('Error opening new window:', error);
        showNotification('Cannot open in new window: Invalid URL');
    }
}

// Open options page
function openOptions() {
    console.log('Opening options page');
    
    if (typeof chrome !== 'undefined' && chrome.runtime) {
        chrome.runtime.sendMessage({action: 'openOptions'}, function(response) {
            if (chrome.runtime.lastError) {
                console.error('Error opening options:', chrome.runtime.lastError);
            }
        });
    } else {
        console.error('Chrome runtime not available');
        showNotification('Cannot open options: Extension not available');
    }
}

// Cleanup on page unload
window.addEventListener('beforeunload', function() {
    if (durationInterval) {
        clearInterval(durationInterval);
    }
});
