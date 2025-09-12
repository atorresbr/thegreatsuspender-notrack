/**
 * Options Page Functionality for Manifest V3
 */

console.log('Options page loaded');

let settings = {};

function showStatus(message) {
    const status = document.getElementById('status');
    if (status) {
        status.textContent = message;
        status.style.display = 'block';
        
        setTimeout(() => {
            status.style.display = 'none';
        }, 3000);
    }
}

function loadSettings() {
    chrome.storage.local.get(['suspendTime', 'autoSuspend', 'theme'], (result) => {
        settings = result;
        
        // Update UI
        const suspendTimeInput = document.getElementById('suspendTime');
        const autoSuspendCheck = document.getElementById('autoSuspend');
        
        if (suspendTimeInput) {
            suspendTimeInput.value = settings.suspendTime || 20;
        }
        
        if (autoSuspendCheck) {
            autoSuspendCheck.checked = settings.autoSuspend !== false;
        }
        
        // Update theme selection
        const selectedTheme = settings.theme || 'purple';
        document.querySelectorAll('.theme-btn').forEach(btn => {
            btn.classList.remove('selected');
            if (btn.dataset.theme === selectedTheme) {
                btn.classList.add('selected');
            }
        });
    });
}

function saveSettings() {
    chrome.storage.local.set(settings, () => {
        showStatus('Settings saved!');
    });
}

// Initialize when DOM is ready
document.addEventListener('DOMContentLoaded', function() {
    console.log('Options page initialized');
    
    loadSettings();
    
    // Suspend time change
    const suspendTimeInput = document.getElementById('suspendTime');
    if (suspendTimeInput) {
        suspendTimeInput.addEventListener('change', () => {
            settings.suspendTime = parseInt(suspendTimeInput.value);
            saveSettings();
        });
    }
    
    // Auto suspend toggle
    const autoSuspendCheck = document.getElementById('autoSuspend');
    if (autoSuspendCheck) {
        autoSuspendCheck.addEventListener('change', () => {
            settings.autoSuspend = autoSuspendCheck.checked;
            saveSettings();
        });
    }
    
    // Theme selection
    document.querySelectorAll('.theme-btn').forEach(btn => {
        btn.addEventListener('click', () => {
            document.querySelectorAll('.theme-btn').forEach(b => b.classList.remove('selected'));
            btn.classList.add('selected');
            
            settings.theme = btn.dataset.theme;
            saveSettings();
        });
    });
    
    showStatus('Options page loaded successfully');
});
