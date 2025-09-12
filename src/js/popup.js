/**
 * Popup Functionality for Manifest V3
 */

document.addEventListener('DOMContentLoaded', async function() {
    console.log('Popup loaded');
    
    // Get current tab info
    try {
        const [tab] = await chrome.tabs.query({active: true, currentWindow: true});
        
        if (tab) {
            const tabTitle = document.getElementById('tabTitle');
            if (tabTitle) {
                tabTitle.textContent = tab.title || 'Current Tab';
            }
            
            // Setup button event listeners
            const suspendTabBtn = document.getElementById('suspendTab');
            if (suspendTabBtn) {
                suspendTabBtn.addEventListener('click', async () => {
                    try {
                        await chrome.runtime.sendMessage({
                            action: 'suspendTab',
                            tabId: tab.id
                        });
                        window.close();
                    } catch (error) {
                        console.error('Error suspending tab:', error);
                    }
                });
            }
        }
    } catch (error) {
        console.error('Error getting current tab:', error);
    }
    
    // Suspend other tabs
    const suspendOtherBtn = document.getElementById('suspendOther');
    if (suspendOtherBtn) {
        suspendOtherBtn.addEventListener('click', async () => {
            try {
                const tabs = await chrome.tabs.query({currentWindow: true});
                const [activeTab] = await chrome.tabs.query({active: true, currentWindow: true});
                
                for (const tab of tabs) {
                    if (tab.id !== activeTab.id && !tab.url.includes('chrome://') && !tab.url.includes('suspended.html')) {
                        await chrome.runtime.sendMessage({
                            action: 'suspendTab',
                            tabId: tab.id
                        });
                    }
                }
                window.close();
            } catch (error) {
                console.error('Error suspending other tabs:', error);
            }
        });
    }
    
    // Unsuspend all tabs
    const unsuspendAllBtn = document.getElementById('unsuspendAll');
    if (unsuspendAllBtn) {
        unsuspendAllBtn.addEventListener('click', async () => {
            try {
                const tabs = await chrome.tabs.query({});
                
                for (const tab of tabs) {
                    if (tab.url.includes('suspended.html')) {
                        const urlParams = new URLSearchParams(tab.url.split('?')[1]);
                        const originalUrl = urlParams.get('url');
                        if (originalUrl) {
                            await chrome.tabs.update(tab.id, {url: originalUrl});
                        }
                    }
                }
                window.close();
            } catch (error) {
                console.error('Error unsuspending tabs:', error);
            }
        });
    }
    
    // Open options
    const openOptionsBtn = document.getElementById('openOptions');
    if (openOptionsBtn) {
        openOptionsBtn.addEventListener('click', () => {
            chrome.runtime.openOptionsPage();
            window.close();
        });
    }
});
