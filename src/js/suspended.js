/**
 * Suspended Tab JavaScript - External file to comply with CSP
 */

console.log('✅ Suspended tab script loaded');

// Parse URL parameters when page loads
document.addEventListener('DOMContentLoaded', function() {
    console.log('✅ Suspended page DOM loaded');
    
    // Parse URL parameters
    const urlParams = new URLSearchParams(window.location.search);
    const originalUrl = urlParams.get('uri') || urlParams.get('url');
    const tabTitle = urlParams.get('title') || 'Suspended Tab';
    const sessionId = urlParams.get('sessionId') || 'No Session ID';
    const tabId = urlParams.get('tabId') || 'Unknown';
    
    console.log('Parsed parameters:', { originalUrl, tabTitle, sessionId, tabId });
    
    // Update page content
    const titleElement = document.getElementById('tabTitle');
    const urlElement = document.getElementById('tabUrl');
    const sessionIdElement = document.getElementById('sessionId');
    const tabIdElement = document.getElementById('tabId');
    
    if (titleElement) titleElement.textContent = decodeURIComponent(tabTitle);
    if (urlElement) urlElement.textContent = decodeURIComponent(originalUrl || '');
    if (sessionIdElement) sessionIdElement.textContent = sessionId;
    if (tabIdElement) tabIdElement.textContent = tabId;
    
    // Set page title
    document.title = `Suspended: ${decodeURIComponent(tabTitle)}`;
    
    // Setup click handlers for ID boxes
    const sessionIdBox = document.querySelector('[data-action="copy-session"]');
    const tabIdBox = document.querySelector('[data-action="copy-tab"]');
    const restoreBtn = document.querySelector('[data-action="restore"]');
    const optionsBtn = document.querySelector('[data-action="options"]');
    
    if (sessionIdBox) {
        sessionIdBox.addEventListener('click', function() {
            copyToClipboard(sessionId, 'Session ID');
        });
    }
    
    if (tabIdBox) {
        tabIdBox.addEventListener('click', function() {
            copyToClipboard(tabId, 'Tab ID');
        });
    }
    
    if (restoreBtn) {
        restoreBtn.addEventListener('click', function() {
            restoreTab(originalUrl);
        });
    }
    
    if (optionsBtn) {
        optionsBtn.addEventListener('click', function() {
            openOptions();
        });
    }
    
    // Keyboard shortcuts
    document.addEventListener('keydown', function(e) {
        if ((e.ctrlKey && e.key === 'r') || e.key === 'F5') {
            e.preventDefault();
            restoreTab(originalUrl);
        }
        if (e.ctrlKey && e.key === 'c') {
            copyToClipboard(sessionId, 'Session ID');
        }
    });
    
    console.log('✅ Suspended page setup complete');
});

// Copy function
function copyToClipboard(text, type) {
    console.log('Copying to clipboard:', type, text);
    
    if (navigator.clipboard && navigator.clipboard.writeText) {
        navigator.clipboard.writeText(text).then(() => {
            showCopyNotification(`${type} copied to clipboard!`);
        }).catch(err => {
            console.error('Clipboard API failed:', err);
            fallbackCopy(text, type);
        });
    } else {
        fallbackCopy(text, type);
    }
}

// Fallback copy method for older browsers
function fallbackCopy(text, type) {
    const textArea = document.createElement('textarea');
    textArea.value = text;
    textArea.style.position = 'fixed';
    textArea.style.opacity = '0';
    document.body.appendChild(textArea);
    textArea.select();
    
    try {
        document.execCommand('copy');
        showCopyNotification(`${type} copied to clipboard!`);
    } catch (err) {
        console.error('Fallback copy failed:', err);
        showCopyNotification(`Failed to copy ${type}`);
    }
    
    document.body.removeChild(textArea);
}

// Show copy notification
function showCopyNotification(message) {
    const notification = document.getElementById('copyNotification');
    if (notification) {
        notification.textContent = message;
        notification.style.display = 'block';
        setTimeout(() => {
            notification.style.display = 'none';
        }, 2000);
    }
}

// Restore tab function
function restoreTab(originalUrl) {
    console.log('Restoring tab:', originalUrl);
    
    if (originalUrl && originalUrl !== 'undefined') {
        try {
            window.location.href = decodeURIComponent(originalUrl);
        } catch (error) {
            console.error('Error restoring tab:', error);
            alert('Cannot restore: Invalid URL');
        }
    } else {
        alert('Cannot restore: Original URL not found');
    }
}

// Open options function
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
    }
}
