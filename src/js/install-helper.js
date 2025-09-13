// Auto-pin extension helper (user must manually pin)
chrome.runtime.onInstalled.addListener(function(details) {
    if (details.reason === 'install') {
        console.log('🎉 Extension installed! Please pin it to your toolbar for easy access.');
        
        // Open options page on first install
        chrome.tabs.create({ url: chrome.runtime.getURL('options.html') });
        
        // Show notification about pinning
        if (chrome.notifications) {
            chrome.notifications.create('pin-reminder', {
                type: 'basic',
                iconUrl: 'img/icon48.png',
                title: 'The Great Suspender (NoTrack)',
                message: 'Extension installed! Please pin it to your toolbar by clicking the puzzle piece icon and clicking the pin button.'
            });
        }
    }
});
