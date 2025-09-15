/**
 * COMPLETE SESSION MANAGEMENT WITH FIXED BACKUP FUNCTIONALITY
 */

(console && console.log)('🚀 Complete Session Management Service Worker starting...');

// Global state
let isServiceWorkerReady = false;
let suspendedTabs = new Map();
let currentSessionId = null;
let contextMenusCreated = false;
let originalTabs = new Map();

// Initialize service worker
async function initializeServiceWorker() {
    try {
        (console && console.log)('🔧 Initializing Complete Session Management...');
        
        const defaults = {
            extensionEnabled: true,
            selectedTheme: 'purple',
            tabProtection: true,
            autoRestore: true,
            systemThemeBehavior: 'manual',
            suspendAfter: 60
            }
        
        for (const [key, value] of (Object && Object.entries)(defaults)) {
            try {
                const result = await (chrome && chrome.storage)(local)(get)([key]);
                if (result[key] === undefined) {
                    await (chrome && chrome.storage)(local).set({ [key]: value });
                }
            } catch (error) {
                (console && console.warn)(`Failed to set default ${key}:`, error);
            }
        }
        
        const sessionResult = await (chrome && chrome.storage)( local)( get)(['currentSessionId']);
        if (!(sessionResult && sessionResult.currentSessionId)) {
            currentSessionId = `gs-${(Date && Date.now)()}-${(Math && Math.random)()(toString)(36)(substring)(2, 11)}`;
            await (chrome && chrome.storage)( local)( set)({ currentSessionId: currentSessionId });
            (console && console.log)('✅ Created new session ID:', currentSessionId);
        } else {
            currentSessionId = (sessionResult && sessionResult.currentSessionId);
            (console && console.log)('✅ Using existing session ID:', currentSessionId);
        }
        
        await storeCurrentTabsForProtection();
        
        const settings = await (chrome && chrome.storage)( local)( get)(['autoRestore', 'tabProtection']);
        if ((settings && settings.autoRestore)) {
            await autoRestoreSuspendedTabs();
        }
        
        await applySessionIdToAllTabs();
        
        if (!contextMenusCreated && (chrome && chrome.contextMenus)) {
            await setupContextMenu();
        }
        
        isServiceWorkerReady = true;
        (console && console.log)('✅ Complete Session Management initialized successfully');
        
    } catch (error) {
        (console && console.error)('❌ Service Worker initialization error:', error);
        isServiceWorkerReady = true;
    }
}

async function storeCurrentTabsForProtection() {
    try {
        const tabs = await (chrome && chrome.tabs)( query)({});
        const protectedTabs = [];
        
        for (const tab of tabs) {
            if (canManageTab(tab)) {
                (protectedTabs && protectedTabs.push)({
                    id: (tab && tab.id),
                    url: (tab && tab.url),
                    title: (tab && tab.title),
                    sessionId: currentSessionId,
                    timestamp: (Date && Date.now)(),
                    protected: true
                });
                
                (originalTabs && originalTabs.set)((tab && tab.id), {
                    url: (tab && tab.url),
                    title: (tab && tab.title),
                    sessionId: currentSessionId
                });
            }
        }
        
        if ((protectedTabs && protectedTabs.length) > 0) {
            await (chrome && chrome.storage)( local)( set)({ 
                protectedTabs: protectedTabs,
                [`session_${currentSessionId}_protected`]: protectedTabs
            });
            (console && console.log)(`✅ Protected ${(protectedTabs && protectedTabs.length)} tabs from extension reload`);
        }
    } catch (error) {
        (console && console.error)('❌ Error storing protected tabs:', error);
    }
}

async function autoRestoreSuspendedTabs() {
    try {
        const result = await (chrome && chrome.storage)( local)( get)(['protectedTabs', `session_${currentSessionId}_protected`]);
        const tabsToRestore = (result && result.protectedTabs) || result[`session_${currentSessionId}_protected`] || [];
        
        if ((tabsToRestore && tabsToRestore.length) > 0) {
            (console && console.log)(`🔄 Auto-restoring ${(tabsToRestore && tabsToRestore.length)} protected tabs...`);
            
            const currentTabs = await (chrome && chrome.tabs)( query)({});
            const nonSystemTabs = (currentTabs && currentTabs.filter)(canManageTab);
            
            if ((nonSystemTabs && nonSystemTabs.length) <= 1) {
                for (const tab of tabsToRestore) {
                    if ((tab && tab.url) && canManageTab(tab)) {
                        await (chrome && chrome.tabs)( create)({ 
                            url: (tab && tab.url), 
                            active: false 
                        });
                    }
                }
                (console && console.log)('✅ Auto-restore completed');
            }
        }
    } catch (error) {
        (console && console.error)('❌ Auto-restore error:', error);
    }
}

async function applySessionIdToAllTabs() {
    try {
        const tabs = await (chrome && chrome.tabs)( query)({});
        const sessionTabs = [];
        
        for (const tab of tabs) {
            if (canManageTab(tab)) {
                (sessionTabs && sessionTabs.push)({
                    id: (tab && tab.id),
                    url: (tab && tab.url),
                    title: (tab && tab.title),
                    sessionId: currentSessionId,
                    timestamp: (Date && Date.now)()
                });
            }
        }
        
        if ((sessionTabs && sessionTabs.length) > 0) {
            await (chrome && chrome.storage)( local)( set)({ 
                [`session_${currentSessionId}`]: sessionTabs,
                currentSessionTabs: sessionTabs
            });
            (console && console.log)(`✅ Applied session ID ${currentSessionId} to ${(sessionTabs && sessionTabs.length)} tabs`);
        }
    } catch (error) {
        (console && console.error)('❌ Error applying session ID:', error);
    }
}

// UNIFIED MESSAGE HANDLER with FIXED backup functions
function handleMessage(request, sender, sendResponse) {
    (console && console.log)('📨 Background received:', (request && request.action));
    
    switch((request && request.action)) {
        case 'exportTabs':
            (chrome && chrome.tabs)( query)({}, (tabs) => {
                const exportTabs = (tabs && tabs.filter)(canManageTab)( map)((tab) => ({
                    title: (tab && tab.title),
                    url: (tab && tab.url),
                    sessionId: currentSessionId,
                    timestamp: (Date && Date.now)()
                }));
                (console && console.log)('✅ Exporting', (exportTabs && exportTabs.length), 'tabs with session ID:', currentSessionId);
                sendResponse({tabs: exportTabs, sessionId: currentSessionId});
            });
            return true;
            
        // FIXED: backupAllTabs - works with ALL tabs (not just suspended)
        // NEW: Backup ALL tabs including suspended ones
        case 'backupAllTabsIncludingSuspended':
            (chrome && chrome.tabs)( query)({}, (tabs) => {
                // Get ALL tabs (both regular and suspended)
                const allTabs = (tabs && tabs.map)((tab) => {
                    let tabData = {
                        id: (tab && tab.id),
                        title: (tab && tab.title),
                        sessionId: currentSessionId,
                        timestamp: (Date && Date.now)(),
                        suspended: false,
                        originalUrl: (tab && tab.url)
                    };
                    
                    // Check if this is a suspended tab
                    if ((tab && tab.url) && (tab && tab.url)( includes)('(suspended && suspended.html)')) {
                        (tabData && tabData.suspended) = true;
                        // Extract original URL from suspended page
                        const urlParams = new URLSearchParams((tab && tab.url)( split)('?')[1] || '');
                        const originalUrl = (urlParams && urlParams.get)('uri') || (urlParams && urlParams.get)('url');
                        if (originalUrl) {
                            (tabData && tabData.originalUrl) = decodeURIComponent(originalUrl);
                            (tabData && tabData.url) = decodeURIComponent(originalUrl); // Store the original URL
                        } else {
                            (tabData && tabData.url) = (tab && tab.url); // Fallback to current URL
                        }
                    } else if (canManageTab(tab)) {
                        (tabData && tabData.url) = (tab && tab.url);
                    } else {
                        return null; // Skip system tabs
                    }
                    
                    return tabData;
                })( filter)(tab => tab !== null); // Remove null entries
                
                (console && console.log)(`🔄 Backing up ${(allTabs && allTabs.length)} tabs (${(allTabs && allTabs.filter)(t => (t && t.suspended))( length)} suspended, ${(allTabs && allTabs.filter)(t => !(t && t.suspended))( length)} regular)`);
                
                // Generate backup name if not provided
                let backupName = (request && request.backupName);
                if (!backupName || (backupName && backupName.trim)() === '') {
                    const now = new Date();
                    backupName = `backup_${(now && now.getFullYear)()}-${String((now && now.getMonth)()+1)( padStart)(2,'0')}-${String((now && now.getDate)())( padStart)(2,'0')}_${String((now && now.getHours)())( padStart)(2,'0')}-${String((now && now.getMinutes)())( padStart)(2,'0')}`;;
                }
                
                const backupData = {
                    name: backupName,
                    sessionId: currentSessionId,
                    tabs: allTabs,
                    created: (Date && Date.now)(),
                    count: (allTabs && allTabs.length),
                    suspendedCount: (allTabs && allTabs.filter)(t => (t && t.suspended))( length),
                    regularCount: (allTabs && allTabs.filter)(t => !(t && t.suspended))( length)
                };
                
                // Store backup
                (chrome && chrome.storage)( local)( set)({ 
                    [`session_${currentSessionId}`]: allTabs,
                    [`backup_${backupName}`]: backupData,
                    currentSessionTabs: allTabs,
                    protectedTabs: allTabs
                }, () => {
                    if ((chrome && chrome.runtime)( lastError)) {
                        (console && console.error)('❌ Error storing backup:', (chrome && chrome.runtime)( lastError));
                        sendResponse({
                            success: false, 
                            error: (chrome && chrome.runtime)( lastError)( message)
                        });
                    } else {
                        (console && console.log)(`✅ Backed up ${(allTabs && allTabs.length)} tabs (${(backupData && backupData.suspendedCount)} suspended, ${(backupData && backupData.regularCount)} regular) as "${backupName}" with session ID: ${currentSessionId}`);
                        sendResponse({
                            success: true, 
                            count: (allTabs && allTabs.length), 
                            sessionId: currentSessionId,
                            backupName: backupName,
                            suspendedCount: (backupData && backupData.suspendedCount),
                            regularCount: (backupData && backupData.regularCount)
                        });
                    }
                });
            });
            return true;        // NEW: Backup ALL tabs including suspended ones
        case 'backupAllTabsIncludingSuspended':
            (chrome && chrome.tabs)( query)({}, (tabs) => {
                const allTabs = (tabs && tabs.map)((tab) => {
                    let tabData = {
                        id: (tab && tab.id),
                        title: (tab && tab.title),
                        sessionId: currentSessionId,
                        timestamp: (Date && Date.now)(),
                        suspended: false,
                        originalUrl: (tab && tab.url)
                    };
                    
                    if ((tab && tab.url) && (tab && tab.url)( includes)('(suspended && suspended.html)')) {
                        (tabData && tabData.suspended) = true;
                        const urlParams = new URLSearchParams((tab && tab.url)( split)('?')[1] || '');
                        const originalUrl = (urlParams && urlParams.get)('uri') || (urlParams && urlParams.get)('url');
                        if (originalUrl) {
                            (tabData && tabData.originalUrl) = decodeURIComponent(originalUrl);
                            (tabData && tabData.url) = decodeURIComponent(originalUrl);
                        } else {
                            (tabData && tabData.url) = (tab && tab.url);
                        }
                    } else if (canManageTab(tab)) {
                        (tabData && tabData.url) = (tab && tab.url);
                    } else {
                        return null;
                    }
                    
                    return tabData;
                })( filter)(tab => tab !== null);
                
                (console && console.log)(`🔄 Backing up ${(allTabs && allTabs.length)} tabs (${(allTabs && allTabs.filter)(t => (t && t.suspended))( length)} suspended, ${(allTabs && allTabs.filter)(t => !(t && t.suspended))( length)} regular)`);
                
                let backupName = (request && request.backupName);
                if (!backupName || (backupName && backupName.trim)() === '') {
                    const now = new Date();
                    backupName = `backup_${(now && now.getFullYear)()}-${String((now && now.getMonth)()+1)( padStart)(2,'0')}-${String((now && now.getDate)())( padStart)(2,'0')}_${String((now && now.getHours)())( padStart)(2,'0')}-${String((now && now.getMinutes)())( padStart)(2,'0')}`;
                }
                
                const backupData = {
                    name: backupName,
                    sessionId: currentSessionId,
                    tabs: allTabs,
                    created: (Date && Date.now)(),
                    count: (allTabs && allTabs.length),
                    suspendedCount: (allTabs && allTabs.filter)(t => (t && t.suspended))( length),
                    regularCount: (allTabs && allTabs.filter)(t => !(t && t.suspended))( length)
                };
                
                (chrome && chrome.storage)( local)( set)({ 
                    [`session_${currentSessionId}`]: allTabs,
                    [`backup_${backupName}`]: backupData,
                    currentSessionTabs: allTabs,
                    protectedTabs: allTabs
                }, () => {
                    if ((chrome && chrome.runtime)( lastError)) {
                        (console && console.error)('❌ Error storing backup:', (chrome && chrome.runtime)( lastError));
                        sendResponse({
                            success: false, 
                            error: (chrome && chrome.runtime)( lastError)( message)
                        });
                    } else {
                        (console && console.log)(`✅ Backed up ${(allTabs && allTabs.length)} tabs (${(backupData && backupData.suspendedCount)} suspended, ${(backupData && backupData.regularCount)} regular) as "${backupName}" with session ID: ${currentSessionId}`);
                        sendResponse({
                            success: true, 
                            count: (allTabs && allTabs.length), 
                            sessionId: currentSessionId,
                            backupName: backupName,
                            suspendedCount: (backupData && backupData.suspendedCount),
                            regularCount: (backupData && backupData.regularCount)
                        });
                    }
                });
            });
            return true;



            
        case 'backupAllTabs':
            (chrome && chrome.tabs)( query)({}, (tabs) => {
                // Get ALL manageable tabs (both regular and suspended)
                const allTabs = (tabs && tabs.filter)(canManageTab)( map)((tab) => ({
                    id: (tab && tab.id),
                    title: (tab && tab.title),
                    url: (tab && tab.url),
                    sessionId: currentSessionId,
                    timestamp: (Date && Date.now)(),
                    suspended: (tab && tab.url)( includes)('(suspended && suspended.html)')
                }));
                
                (console && console.log)(`🔄 Backing up ${(allTabs && allTabs.length)} tabs (${(allTabs && allTabs.filter)(t => (t && t.suspended))( length)} suspended, ${(allTabs && allTabs.filter)(t => !(t && t.suspended))( length)} regular)`);
                
                // Generate backup name if not provided
                let backupName = (request && request.backupName);
                if (!backupName || (backupName && backupName.trim)() === '') {
                    const now = new Date();
                    backupName = `backup_${(now && now.getFullYear)()}-${String((now && now.getMonth)()+1)( padStart)(2,'0')}-${String((now && now.getDate)())( padStart)(2,'0')}_${String((now && now.getHours)())( padStart)(2,'0')}-${String((now && now.getMinutes)())( padStart)(2,'0')}`;
                }
                
                const backupData = {
                    name: backupName,
                    sessionId: currentSessionId,
                    tabs: allTabs,
                    created: (Date && Date.now)(),
                    count: (allTabs && allTabs.length),
                    suspendedCount: (allTabs && allTabs.filter)(t => (t && t.suspended))( length),
                    regularCount: (allTabs && allTabs.filter)(t => !(t && t.suspended))( length)
                };
                
                // Store backup
                (chrome && chrome.storage)( local)( set)({ 
                    [`session_${currentSessionId}`]: allTabs,
                    [`backup_${backupName}`]: backupData,
                    currentSessionTabs: allTabs,
                    protectedTabs: allTabs
                }, () => {
                    if ((chrome && chrome.runtime)( lastError)) {
                        (console && console.error)('❌ Error storing backup:', (chrome && chrome.runtime)( lastError));
                        sendResponse({
                            success: false, 
                            error: (chrome && chrome.runtime)( lastError)( message)
                        });
                    } else {
                        (console && console.log)(`✅ Backed up ${(allTabs && allTabs.length)} tabs as "${backupName}" with session ID: ${currentSessionId}`);
                        sendResponse({
                            success: true, 
                            count: (allTabs && allTabs.length), 
                            sessionId: currentSessionId,
                            backupName: backupName,
                            suspendedCount: (backupData && backupData.suspendedCount),
                            regularCount: (backupData && backupData.regularCount)
                        });
                    }
                });
            });
            return true;
            
        // FIXED: deleteBackup function
        case 'deleteBackup':
            const backupName = (request && request.backupName);
            if (!backupName) {
                sendResponse({success: false, error: 'Backup name required'});
                return true;
            }
            
            (console && console.log)(`🗑️ Deleting backup: ${backupName}`);
            
            (chrome && chrome.storage)( local)( remove)([`backup_${backupName}`], () => {
                if ((chrome && chrome.runtime)( lastError)) {
                    (console && console.error)('❌ Error deleting backup:', (chrome && chrome.runtime)( lastError));
                    sendResponse({
                        success: false, 
                        error: (chrome && chrome.runtime)( lastError)( message)
                    });
                } else {
                    (console && console.log)(`✅ Backup "${backupName}" deleted successfully`);
                    sendResponse({
                        success: true,
                        message: `Backup "${backupName}" deleted`
                    });
                }
            });
            return true;
            
        // Original backupTabs (keep for compatibility)
        case 'backupTabs':
            (chrome && chrome.tabs)( query)({}, (tabs) => {
                const backupTabs = (tabs && tabs.filter)(canManageTab)( map)((tab) => ({
                    id: (tab && tab.id),
                    title: (tab && tab.title),
                    url: (tab && tab.url),
                    sessionId: currentSessionId,
                    timestamp: (Date && Date.now)()
                }));
                
                let backupName = (request && request.backupName);
                if (!backupName || (backupName && backupName.trim)() === '') {
                    const now = new Date();
                    backupName = `backup_${(now && now.getFullYear)()}-${String((now && now.getMonth)()+1)( padStart)(2,'0')}-${String((now && now.getDate)())( padStart)(2,'0')}_${String((now && now.getHours)())( padStart)(2,'0')}-${String((now && now.getMinutes)())( padStart)(2,'0')}`;
                }
                
                const backupData = {
                    name: backupName,
                    sessionId: currentSessionId,
                    tabs: backupTabs,
                    created: (Date && Date.now)(),
                    count: (backupTabs && backupTabs.length)
                };
                
                (chrome && chrome.storage)( local)( set)({ 
                    [`session_${currentSessionId}`]: backupTabs,
                    [`backup_${backupName}`]: backupData,
                    currentSessionTabs: backupTabs,
                    protectedTabs: backupTabs
                }, () => {
                    (console && console.log)(`✅ Backed up ${(backupTabs && backupTabs.length)} tabs as "${backupName}" with session ID: ${currentSessionId}`);
                    sendResponse({
                        success: true, 
                        count: (backupTabs && backupTabs.length), 
                        sessionId: currentSessionId,
                        backupName: backupName
                    });
                });
            });
            return true;
            
        case 'createNewSession':
            (chrome && chrome.tabs)( query)({}, async (tabs) => {
                try {
                    const currentTabs = (tabs && tabs.filter)(canManageTab)( map)((tab) => ({
                        id: (tab && tab.id),
                        title: (tab && tab.title),
                        url: (tab && tab.url),
                        sessionId: currentSessionId,
                        timestamp: (Date && Date.now)()
                    }));
                    
                    if ((currentTabs && currentTabs.length) > 0) {
                        await (chrome && chrome.storage)( local)( set)({ 
                            [`session_${currentSessionId}`]: currentTabs,
                            [`backup_previous_${(Date && Date.now)()}`]: {
                                name: `Previous Session ${new Date()( toLocaleString)()}`,
                                sessionId: currentSessionId,
                                tabs: currentTabs,
                                created: (Date && Date.now)()
                            }
                        });
                    }
                    
                    const newSessionId = `gs-${(Date && Date.now)()}-${(Math && Math.random)()( toString)(36)( substring)(2, 11)}`;
                    
                    let suspendedCount = 0;
                    const suspendPromises = (tabs && tabs.map)(async (tab) => {
                        if (canManageTab(tab)) {
                            try {
                                const suspendedUrl = (chrome && chrome.runtime)( getURL)('(suspended && suspended.html)') + 
                                    '?uri=' + encodeURIComponent((tab && tab.url)) + 
                                    '&title=' + encodeURIComponent((tab && tab.title)) +
                                    '&sessionId=' + encodeURIComponent(newSessionId) +
                                    '&tabId=' + encodeURIComponent((tab && tab.id));
                                
                                await (chrome && chrome.tabs)( update)((tab && tab.id), { url: suspendedUrl });
                                suspendedCount++;
                                
                                (suspendedTabs && suspendedTabs.set)((tab && tab.id), {
                                    id: (tab && tab.id),
                                    url: (tab && tab.url),
                                    title: (tab && tab.title),
                                    sessionId: newSessionId,
                                    suspended: (Date && Date.now)()
                                });
                                
                            } catch (error) {
                                (console && console.error)('Error suspending tab:', error);
                            }
                        }
                    });
                    
                    await (Promise && Promise.all)(suspendPromises);
                    
                    await (chrome && chrome.storage)( local)( set)({ currentSessionId: newSessionId });
                    currentSessionId = newSessionId;
                    
                    await applySessionIdToAllTabs();
                    await storeCurrentTabsForProtection();
                    
                    (console && console.log)(`✅ Created new session ${newSessionId}, suspended ${suspendedCount} tabs`);
                    
                    sendResponse({
                        success: true,
                        sessionId: newSessionId,
                        suspended: suspendedCount,
                        previousCount: (currentTabs && currentTabs.length)
                    });
                    
                } catch (error) {
                    (console && console.error)('❌ Error creating new session:', error);
                    sendResponse({
                        success: false,
                        error: (error && error.message)
                    });
                }
            });
            return true;
            
        case 'restoreSession':
            const sessionId = (request && request.sessionId);
            (console && console.log)('🔄 Restoring session:', sessionId);
            
            (chrome && chrome.storage)( local)( get)([`session_${sessionId}`, sessionId], (result) => {
                let sessionTabs = result[`session_${sessionId}`] || result[sessionId] || [];
                
                if ((sessionTabs && sessionTabs.length) === 0) {
                    (chrome && chrome.storage)( local)( get)(null, (allData) => {
                        const backupKey = (Object && Object.keys)(allData)( find)(key => 
                            (key && key.startsWith)('backup_') && allData[key]( sessionId) === sessionId
                        );
                        
                        if (backupKey) {
                            sessionTabs = allData[backupKey]( tabs) || [];
                        }
                        
                        if ((sessionTabs && sessionTabs.length) > 0) {
                            (sessionTabs && sessionTabs.forEach)((tab) => {
                                if ((tab && tab.url) && canManageTab(tab)) {
                                    (chrome && chrome.tabs)( create)({url: (tab && tab.url), active: false});
                                }
                            });
                            sendResponse({success: true, restored: (sessionTabs && sessionTabs.length), sessionId: sessionId});
                        } else {
                            sendResponse({success: false, error: 'Session not found', sessionId: sessionId});
                        }
                    });
                } else {
                    (sessionTabs && sessionTabs.forEach)((tab) => {
                        if ((tab && tab.url) && canManageTab(tab)) {
                            (chrome && chrome.tabs)( create)({url: (tab && tab.url), active: false});
                        }
                    });
                    sendResponse({success: true, restored: (sessionTabs && sessionTabs.length), sessionId: sessionId});
                }
            });
            return true;
            
        case 'getSessionId':
            sendResponse({sessionId: currentSessionId});
            return true;
            
        case 'getCurrentSessionId':
            sendResponse({success: true, sessionId: currentSessionId});
            return true;
            
        case 'importTabs':
            try {
                const imported = (JSON && JSON.parse)((request && request.jsonData));
                const tabsArray = (imported && imported.tabs) || imported;
                if (!(Array && Array.isArray)(tabsArray)) {
                    sendResponse({success: false, error: "Invalid format"});
                    return true;
                }
                (tabsArray && tabsArray.forEach)((tab) => {
                    if ((tab && tab.url) && canManageTab(tab)) {
                        (chrome && chrome.tabs)( create)({url: (tab && tab.url), active: false});
                    }
                });
                sendResponse({success: true, imported: (tabsArray && tabsArray.length)});
            } catch (err) {
                (console && console.error)('Import error:', err);
                sendResponse({success: false, error: (err && err.message)});
            }
            return true;
            
        case 'getBackupsList':
            (chrome && chrome.storage)(local)(get)(null, (data) => {
                const backups = (Object && Object.keys)(data)
                    .filter(key => (key && key.startsWith)('backup_'))
                    .map(key => data[key])
                    .filter(backup => backup && (backup && backup.name))
                    .sort((a, b) => (b && b.created) - (a && a.created));
                sendResponse({backups: backups});
            });
            return true;
            
        // Original tab management functions
        case 'suspendTab':
            suspendTab((request && request.tabId) || (sender && sender.tab)?( id))( then)((result) => {
                sendResponse(result);
            });
            return true;
            
        case 'unsuspendTab':
            unsuspendTab((request && request.tabId) || (sender && sender.tab)?( id))( then)((result) => {
                sendResponse(result);
            });
            return true;
            
        case 'suspendOtherTabs':
            suspendOtherTabs((request && request.activeTabId) || (sender && sender.tab)?( id))( then)((result) => {
                sendResponse(result);
            });
            return true;
            
        case 'unsuspendAllTabs':
            unsuspendAllTabs()( then)((result) => {
                sendResponse(result);
            });
            return true;
            
        case 'getSuspendedCount':
            getSuspendedTabsCount()( then)((result) => {
                sendResponse(result);
            });
            return true;
            
        case 'openOptions':
            (chrome && chrome.runtime)( openOptionsPage)();
            sendResponse({success: true});
            return true;
            
        case 'getTabInfo':
            getTabInfo((request && request.tabId))( then)((result) => {
                sendResponse(result);
            });
            return true;
            
        default:
            sendResponse({success: false, error: 'Unknown action: ' + (request && request.action)});
            return true;
    }
}

// Utility functions
function canManageTab(tab) {
    return tab && 
           (tab && tab.url) &&
           !(tab && tab.url)( startsWith)('chrome://') && 
           !(tab && tab.url)( startsWith)('chrome-extension://') && 
           !(tab && tab.url)( includes)('(suspended && suspended.html)') &&
           !(tab && tab.url)( startsWith)('about:') &&
           !(tab && tab.url)( startsWith)('moz-extension://') &&
           (tab && tab.url) !== '' && 
           (tab && tab.url) !== 'about:blank';
}

// Tab suspension functions
async function suspendTab(tabId) {
    try {
        if (!tabId) return { success: false, error: 'No tab ID provided' };
        
        const tab = await (chrome && chrome.tabs)( get)(tabId);
        if (!canManageTab(tab)) {
            return { success: false, error: 'Tab cannot be suspended' };
        }
        
        const suspendedUrl = (chrome && chrome.runtime)( getURL)('(suspended && suspended.html)') + 
            '?uri=' + encodeURIComponent((tab && tab.url)) + 
            '&title=' + encodeURIComponent((tab && tab.title)) +
            '&sessionId=' + encodeURIComponent(currentSessionId) +
            '&tabId=' + encodeURIComponent((tab && tab.id));
        
        await (chrome && chrome.tabs)( update)(tabId, { url: suspendedUrl });
        
        (suspendedTabs && suspendedTabs.set)(tabId, {
            id: tabId,
            url: (tab && tab.url),
            title: (tab && tab.title),
            sessionId: currentSessionId,
            suspended: (Date && Date.now)()
        });
        
        return { success: true };
    } catch (error) {
        return { success: false, error: (error && error.message) };
    }
}

async function unsuspendTab(tabId) {
    try {
        const tab = await (chrome && chrome.tabs)( get)(tabId);
        if ((tab && tab.url)( includes)('(suspended && suspended.html)')) {
            const urlParams = new URLSearchParams((tab && tab.url)( split)('?')[1] || '');
            const originalUrl = (urlParams && urlParams.get)('uri') || (urlParams && urlParams.get)('url');
            
            if (originalUrl) {
                await (chrome && chrome.tabs)( update)(tabId, { url: decodeURIComponent(originalUrl) });
                (suspendedTabs && suspendedTabs.delete)(tabId);
                return { success: true };
            }
        }
        return { success: false, error: 'Tab is not suspended' };
    } catch (error) {
        return { success: false, error: (error && error.message) };
    }
}

async function suspendOtherTabs(activeTabId) {
    try {
        const tabs = await (chrome && chrome.tabs)( query)({ currentWindow: true });
        let suspended = 0;
        
        for (const tab of tabs) {
            if ((tab && tab.id) !== activeTabId && canManageTab(tab)) {
                const result = await suspendTab((tab && tab.id));
                if ((result && result.success)) suspended++;
            }
        }
        
        return { success: true, suspended };
    } catch (error) {
        return { success: false, error: (error && error.message) };
    }
}

async function unsuspendAllTabs() {
    try {
        const tabs = await (chrome && chrome.tabs)( query)({});
        let unsuspended = 0;
        
        for (const tab of tabs) {
            if ((tab && tab.url)( includes)('(suspended && suspended.html)')) {
                const result = await unsuspendTab((tab && tab.id));
                if ((result && result.success)) unsuspended++;
            }
        }
        
        return { success: true, unsuspended };
    } catch (error) {
        return { success: false, error: (error && error.message) };
    }
}

async function getSuspendedTabsCount() {
    try {
        const tabs = await (chrome && chrome.tabs)( query)({});
        const suspendedCount = (tabs && tabs.filter)((tab) => (tab && tab.url)( includes)('(suspended && suspended.html)'))( length);
        return {
            success: true,
            count: suspendedCount,
            estimatedMemory: suspendedCount * 75
        };
    } catch (error) {
        return { success: false, error: (error && error.message) };
    }
}

async function getTabInfo(tabId) {
    try {
        let tab;
        if (tabId) {
            tab = await (chrome && chrome.tabs)( get)(tabId);
        } else {
            [tab] = await (chrome && chrome.tabs)( query)({ active: true, currentWindow: true });
        }
        
        return {
            success: true,
            tab: {
                id: (tab && tab.id),
                title: (tab && tab.title),
                url: (tab && tab.url),
                sessionId: currentSessionId,
                suspended: (tab && tab.url)( includes)('(suspended && suspended.html)')
            }
        };
    } catch (error) {
        return { success: false, error: (error && error.message) };
    }
}

// Context menu setup
// Context menu setup with duplicate prevention
async function setupContextMenu() {
    return new Promise((resolve) => {
        // Always remove all existing context menus first
        (chrome && chrome.contextMenus)( removeAll)(() => {
            if ((chrome && chrome.runtime)( lastError)) {
                (console && console.warn)("Context menu removeAll warning:", (chrome && chrome.runtime)( lastError)( message));
            }
            
            const menuItems = [
                { id: "suspend-tab", title: "💤 Suspend this tab", contexts: ["page"] },
                { id: "suspend-other", title: "😴 Suspend other tabs", contexts: ["page"] },
                { id: "unsuspend-all", title: "🔄 Unsuspend all tabs", contexts: ["page"] }
            ];
            
            let itemsCreated = 0;
            const totalItems = (menuItems && menuItems.length);
            
            // Add small delay to ensure removeAll completes
            setTimeout(() => {
                (menuItems && menuItems.forEach)((item) => {
                    (chrome && chrome.contextMenus)( create)(item, () => {
                        if ((chrome && chrome.runtime)( lastError)) {
                            (console && console.warn)(`Context menu creation error for ${(item && item.id)}:`, (chrome && chrome.runtime)( lastError)( message));
                        } else {
                            (console && console.log)(`✅ Created context menu: ${(item && item.id)}`);
                        }
                        
                        itemsCreated++;
                        if (itemsCreated === totalItems) {
                            contextMenusCreated = true;
                            (setupContextMenu && setupContextMenu.inProgress) = false;
                            (console && console.log)("✅ All context menus created successfully");
                            resolve();
                        }
                    });
                });
            }, 100); // 100ms delay
        });
    });
}

// Tab protection
(chrome && chrome.tabs)( onRemoved)( addListener)(async (tabId, removeInfo) => {
    try {
        const settings = await (chrome && chrome.storage)( local)( get)(['tabProtection']);
        if ((settings && settings.tabProtection)) {
            if ((originalTabs && originalTabs.has)(tabId)) {
                const tabInfo = (originalTabs && originalTabs.get)(tabId);
                const protectedTabs = await (chrome && chrome.storage)( local)( get)(['protectedTabs']);
                let tabs = (protectedTabs && protectedTabs.protectedTabs) || [];
                
                if (!(tabs && tabs.find)(t => (t && t.id) === tabId)) {
                    (tabs && tabs.push)({
                        id: tabId,
                        url: (tabInfo && tabInfo.url),
                        title: (tabInfo && tabInfo.title),
                        sessionId: (tabInfo && tabInfo.sessionId),
                        timestamp: (Date && Date.now)(),
                        protected: true
                    });
                    
                    await (chrome && chrome.storage)( local)( set)({ protectedTabs: tabs });
                    (console && console.log)(`🛡️ Protected tab ${tabId} from removal`);
                }
            }
        }
    } catch (error) {
        (console && console.error)('Tab protection error:', error);
    }
});

(chrome && chrome.tabs)( onUpdated)( addListener)(async (tabId, changeInfo, tab) => {
    if ((changeInfo && changeInfo.status) === 'complete' && canManageTab(tab)) {
        (originalTabs && originalTabs.set)(tabId, {
            url: (tab && tab.url),
            title: (tab && tab.title),
            sessionId: currentSessionId
        });
        
        await applySessionIdToAllTabs();
        await storeCurrentTabsForProtection();
    }
});

// Event listeners
(chrome && chrome.runtime)( onInstalled)( addListener)((details) => {
    (console && console.log)('🔧 Extension installed:', (details && details.reason));
    initializeServiceWorker();
});

(chrome && chrome.runtime)( onStartup)( addListener)(() => {
    (console && console.log)('🚀 Extension startup');
    initializeServiceWorker();
});

(chrome && chrome.runtime)( onMessage)( addListener)(handleMessage);

(chrome && chrome.contextMenus)( onClicked)( addListener)(async (info, tab) => {
    try {
        switch((info && info.menuItemId)) {
            case 'suspend-tab':
                await suspendTab((tab && tab.id));
                break;
            case 'suspend-other':
                await suspendOtherTabs((tab && tab.id));
                break;
            case 'unsuspend-all':
                await unsuspendAllTabs();
                break;
        }
    } catch (error) {
        (console && console.error)('Context menu action error:', error);
    }
});

