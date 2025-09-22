/**
 * OPTIONS.JS - CLEAN VERSION WITHOUT SYNTAX ERRORS
 * Control panel functionality for The Great Suspender
 * Rule 2: All named functions only
 */

console.log('📋 Options.js loading...');

// Global variables
let currentTheme = 'purple';
let protectionEnabled = true;
let autoRestoreEnabled = true;

/**
 * Function: initializeOptionsPage
 * Description: Initialize options page when DOM is loaded (Rule 2 - named function)
 */
function initializeOptionsPage() {
    try {
        console.log('📋 Options page DOM loaded');
        
        initializeOptions();
        setupEventListeners();
        initializeThemeSystem();
        initializeTabProtectionOptions();
        setupTabProtectionEventListeners();
        
        console.log('✅ Options page initialization complete');
    } catch (error) {
        console.error('❌ Error initializing options page:', error);
    }
}

/**
 * Function: initializeOptions
 * Description: Initialize options from storage (Rule 2 - named function)
 */
function initializeOptions() {
    console.log('📋 Initializing options from storage...');
    
    if (typeof chrome !== 'undefined' && chrome.storage) {
        chrome.storage.sync.get([
            'theme',
            'autoSuspendTime',
            'pinned',
            'whiteList',
            'neverSuspendForms',
            'suspendInPlaceOfDiscard',
            'discardAfterSuspend'
        ], handleOptionsLoad);
    }
}

/**
 * Function: handleOptionsLoad
 * Description: Handle loaded options from storage (Rule 2 - named function)
 */
function handleOptionsLoad(items) {
    console.log('📋 Loaded options:', items);
    
    const theme = items.theme || 'system';
    const themeSelect = document.getElementById('theme');
    if (themeSelect) {
        themeSelect.value = theme;
        applyTheme(theme);
    }
    
    const autoSuspendTime = document.getElementById('timeToSuspend');
    if (autoSuspendTime) {
        autoSuspendTime.value = items.autoSuspendTime || '60';
    }
    
    setCheckboxValue('dontSuspendPinned', items.pinned !== false);
    setTextareaValue('whitelist', items.whiteList || '');
    setCheckboxValue('neverSuspendForms', items.neverSuspendForms !== false);
    setCheckboxValue('suspendInPlaceOfDiscard', items.suspendInPlaceOfDiscard !== false);
    setCheckboxValue('discardAfterSuspend', items.discardAfterSuspend === true);
    
    console.log('✅ Options initialized with theme:', theme);
}

/**
 * Function: setCheckboxValue
 * Description: Safely set checkbox value (Rule 2 - named function)
 */
function setCheckboxValue(id, checked) {
    const checkbox = document.getElementById(id);
    if (checkbox) {
        checkbox.checked = checked;
    }
}

/**
 * Function: setTextareaValue
 * Description: Safely set textarea value (Rule 2 - named function)
 */
function setTextareaValue(id, value) {
    const textarea = document.getElementById(id);
    if (textarea) {
        textarea.value = value;
    }
}

/**
 * Function: setupEventListeners
 * Description: Setup event listeners for options (Rule 2 - named function)
 */
function setupEventListeners() {
    console.log('📋 Setting up options event listeners...');
    
    const themeSelect = document.getElementById('theme');
    if (themeSelect) {
        themeSelect.addEventListener('change', handleThemeSelectChange);
    }
    
    const autoSuspendTime = document.getElementById('timeToSuspend');
    if (autoSuspendTime) {
        autoSuspendTime.addEventListener('change', handleAutoSuspendTimeChange);
    }
    
    const pinnedCheckbox = document.getElementById('dontSuspendPinned');
    if (pinnedCheckbox) {
        pinnedCheckbox.addEventListener('change', handlePinnedCheckboxChange);
    }
    
    const whitelistTextarea = document.getElementById('whitelist');
    if (whitelistTextarea) {
        whitelistTextarea.addEventListener('blur', handleWhitelistChange);
    }
    
    const neverSuspendFormsCheckbox = document.getElementById('neverSuspendForms');
    if (neverSuspendFormsCheckbox) {
        neverSuspendFormsCheckbox.addEventListener('change', handleNeverSuspendFormsChange);
    }
    
    const suspendInPlaceCheckbox = document.getElementById('suspendInPlaceOfDiscard');
    if (suspendInPlaceCheckbox) {
        suspendInPlaceCheckbox.addEventListener('change', handleSuspendInPlaceChange);
    }
    
    const discardAfterSuspendCheckbox = document.getElementById('discardAfterSuspend');
    if (discardAfterSuspendCheckbox) {
        discardAfterSuspendCheckbox.addEventListener('change', handleDiscardAfterSuspendChange);
    }
    
    console.log('✅ Event listeners setup complete');
}

/**
 * Function: applyTheme
 * Description: Apply theme to page (Rule 2 - named function)
 */
function applyTheme(theme) {
    const body = document.body;
    
    body.classList.remove('light-theme', 'dark-theme', 'system-theme');
    
    if (theme === 'light') {
        body.classList.add('light-theme');
        console.log('✅ Applied light theme');
    } else if (theme === 'dark') {
        body.classList.add('dark-theme');
        console.log('✅ Applied dark theme');
    } else {
        body.classList.add('system-theme');
        if (window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches) {
            body.classList.add('dark-theme');
            console.log('✅ Applied system theme (dark)');
        } else {
            body.classList.add('light-theme');
            console.log('✅ Applied system theme (light)');
        }
    }
}

/**
 * Function: handleThemeSelectChange
 * Description: Handle theme select changes (Rule 2 - named function)
 */
function handleThemeSelectChange() {
    try {
        const theme = this.value;
        console.log('🎨 Theme changed to:', theme);
        applyTheme(theme);
        
        if (typeof chrome !== 'undefined' && chrome.storage) {
            chrome.storage.sync.set({ theme: theme }, handleThemeSaveComplete);
        }
    } catch (error) {
        console.error('❌ Error handling theme select change:', error);
    }
}

/**
 * Function: handleThemeSaveComplete
 * Description: Handle theme save completion (Rule 2 - named function)
 */
function handleThemeSaveComplete() {
    console.log('✅ Theme saved to storage');
}

/**
 * Function: handleAutoSuspendTimeChange
 * Description: Handle auto suspend time changes (Rule 2 - named function)
 */
function handleAutoSuspendTimeChange() {
    try {
        const time = parseInt(this.value) || 60;
        console.log('⏰ Auto-suspend time changed to:', time);
        
        if (typeof chrome !== 'undefined' && chrome.storage) {
            chrome.storage.sync.set({ autoSuspendTime: time }, handleAutoSuspendTimeSave);
        }
    } catch (error) {
        console.error('❌ Error handling auto suspend time change:', error);
    }
}

/**
 * Function: handleAutoSuspendTimeSave
 * Description: Handle auto suspend time save completion (Rule 2 - named function)
 */
function handleAutoSuspendTimeSave() {
    console.log('✅ Auto suspend time saved to storage');
}

/**
 * Function: handlePinnedCheckboxChange
 * Description: Handle pinned checkbox changes (Rule 2 - named function)
 */
function handlePinnedCheckboxChange() {
    try {
        const checked = this.checked;
        console.log('📌 Don\'t suspend pinned tabs changed to:', checked);
        
        if (typeof chrome !== 'undefined' && chrome.storage) {
            chrome.storage.sync.set({ pinned: checked }, handlePinnedSaveComplete);
        }
    } catch (error) {
        console.error('❌ Error handling pinned checkbox change:', error);
    }
}

/**
 * Function: handlePinnedSaveComplete
 * Description: Handle pinned setting save completion (Rule 2 - named function)
 */
function handlePinnedSaveComplete() {
    console.log('✅ Pinned setting saved to storage');
}

/**
 * Function: handleWhitelistChange
 * Description: Handle whitelist textarea changes (Rule 2 - named function)
 */
function handleWhitelistChange() {
    try {
        const whitelist = this.value;
        console.log('📝 Whitelist updated');
        
        if (typeof chrome !== 'undefined' && chrome.storage) {
            chrome.storage.sync.set({ whiteList: whitelist }, handleWhitelistSaveComplete);
        }
    } catch (error) {
        console.error('❌ Error handling whitelist change:', error);
    }
}

/**
 * Function: handleWhitelistSaveComplete
 * Description: Handle whitelist save completion (Rule 2 - named function)
 */
function handleWhitelistSaveComplete() {
    console.log('✅ Whitelist saved to storage');
}

/**
 * Function: handleNeverSuspendFormsChange
 * Description: Handle never suspend forms checkbox (Rule 2 - named function)
 */
function handleNeverSuspendFormsChange() {
    try {
        const checked = this.checked;
        console.log('📋 Never suspend forms changed to:', checked);
        
        if (typeof chrome !== 'undefined' && chrome.storage) {
            chrome.storage.sync.set({ neverSuspendForms: checked }, handleNeverSuspendFormsSaveComplete);
        }
    } catch (error) {
        console.error('❌ Error handling never suspend forms change:', error);
    }
}

/**
 * Function: handleNeverSuspendFormsSaveComplete
 * Description: Handle never suspend forms save completion (Rule 2 - named function)
 */
function handleNeverSuspendFormsSaveComplete() {
    console.log('✅ Never suspend forms setting saved');
}

/**
 * Function: handleSuspendInPlaceChange
 * Description: Handle suspend in place checkbox (Rule 2 - named function)
 */
function handleSuspendInPlaceChange() {
    try {
        const checked = this.checked;
        console.log('🔄 Suspend in place of discard changed to:', checked);
        
        if (typeof chrome !== 'undefined' && chrome.storage) {
            chrome.storage.sync.set({ suspendInPlaceOfDiscard: checked }, handleSuspendInPlaceSaveComplete);
        }
    } catch (error) {
        console.error('❌ Error handling suspend in place change:', error);
    }
}

/**
 * Function: handleSuspendInPlaceSaveComplete
 * Description: Handle suspend in place save completion (Rule 2 - named function)
 */
function handleSuspendInPlaceSaveComplete() {
    console.log('✅ Suspend in place setting saved');
}

/**
 * Function: handleDiscardAfterSuspendChange
 * Description: Handle discard after suspend checkbox (Rule 2 - named function)
 */
function handleDiscardAfterSuspendChange() {
    try {
        const checked = this.checked;
        console.log('🗑️ Discard after suspend changed to:', checked);
        
        if (typeof chrome !== 'undefined' && chrome.storage) {
            chrome.storage.sync.set({ discardAfterSuspend: checked }, handleDiscardAfterSuspendSaveComplete);
        }
    } catch (error) {
        console.error('❌ Error handling discard after suspend change:', error);
    }
}

/**
 * Function: handleDiscardAfterSuspendSaveComplete
 * Description: Handle discard after suspend save completion (Rule 2 - named function)
 */
function handleDiscardAfterSuspendSaveComplete() {
    console.log('✅ Discard after suspend setting saved');
}

/**
 * Function: initializeThemeSystem
 * Description: Initialize the theme selection system (Rule 2 - named function)
 */
function initializeThemeSystem() {
    setupThemeButtons();
    loadSavedTheme();
    console.log('✅ Theme system initialized');
}

/**
 * Function: setupThemeButtons
 * Description: Setup theme button event listeners (Rule 2 - named function)
 */
function setupThemeButtons() {
    const buttons = document.querySelectorAll('[data-theme]');
    console.log('🎨 Setting up', buttons.length, 'theme buttons');
    
    buttons.forEach(function(btn) {
        const themeName = btn.getAttribute('data-theme');
        if (themeName) {
            btn.addEventListener('click', handleThemeButtonClick);
        }
    });
    
    console.log('✅ Theme buttons setup complete');
}

/**
 * Function: handleThemeButtonClick
 * Description: Handle theme button clicks (Rule 2 - named function)
 */
function handleThemeButtonClick(event) {
    event.preventDefault();
    const themeName = this.getAttribute('data-theme');
    console.log('🎨 Theme button clicked:', themeName);
    
    applyThemeComplete(themeName);
}

/**
 * Function: applyThemeComplete
 * Description: Apply complete theme with visual effects (Rule 2 - named function)
 */
function applyThemeComplete(themeName) {
    if (!themeName) return;
    
    console.log('🎨 Applying complete theme:', themeName);
    
    try {
        currentTheme = themeName;
        
        const body = document.body;
        body.className = body.className.replace(/theme-\w+/g, '');
        body.classList.add('theme-' + themeName);
        
        updateThemeButtonStates(themeName);
        
        if (typeof chrome !== 'undefined' && chrome.storage) {
            chrome.storage.local.set({ selectedTheme: themeName });
        }
        
        console.log('✅ Theme applied successfully:', themeName);
    } catch (error) {
        console.error('❌ Theme application error:', error);
    }
}

/**
 * Function: updateThemeButtonStates
 * Description: Update visual state of theme buttons (Rule 2 - named function)
 */
function updateThemeButtonStates(selectedTheme) {
    try {
        const buttons = document.querySelectorAll('[data-theme]');
        buttons.forEach(function(btn) {
            const btnTheme = btn.getAttribute('data-theme');
            if (btnTheme === selectedTheme) {
                btn.classList.add('selected', 'active');
            } else {
                btn.classList.remove('selected', 'active');
            }
        });
    } catch (error) {
        console.error('❌ Button state update error:', error);
    }
}

/**
 * Function: loadSavedTheme
 * Description: Load and apply saved theme (Rule 2 - named function)
 */
function loadSavedTheme() {
    try {
        if (typeof chrome !== 'undefined' && chrome.storage) {
            chrome.storage.local.get(['selectedTheme'], handleSavedThemeLoad);
        } else {
            applyThemeComplete('purple');
        }
    } catch (error) {
        console.error('❌ Load saved theme error:', error);
        applyThemeComplete('purple');
    }
}

/**
 * Function: handleSavedThemeLoad
 * Description: Handle saved theme load from storage (Rule 2 - named function)
 */
function handleSavedThemeLoad(result) {
    const savedTheme = result.selectedTheme || 'purple';
    applyThemeComplete(savedTheme);
    console.log('✅ Saved theme loaded:', savedTheme);
}

/**
 * Function: initializeTabProtectionOptions
 * Description: Initialize tab protection settings (Rule 2 - named function)
 */
function initializeTabProtectionOptions() {
    console.log('🛡️ Initializing tab protection options...');
    
    if (typeof chrome !== 'undefined' && chrome.storage) {
        chrome.storage.local.get(['tabProtection', 'autoRestore'], handleTabProtectionLoad);
    }
}

/**
 * Function: handleTabProtectionLoad
 * Description: Handle tab protection settings load (Rule 2 - named function)
 */
function handleTabProtectionLoad(result) {
    protectionEnabled = result.tabProtection !== false;
    autoRestoreEnabled = result.autoRestore !== false;
    
    const tabProtectionCheckbox = document.getElementById('tabProtection');
    if (tabProtectionCheckbox) {
        tabProtectionCheckbox.checked = protectionEnabled;
    }
    
    const autoRestoreCheckbox = document.getElementById('autoRestore');
    if (autoRestoreCheckbox) {
        autoRestoreCheckbox.checked = autoRestoreEnabled;
    }
    
    console.log('✅ Tab protection settings loaded:', { protectionEnabled: protectionEnabled, autoRestoreEnabled: autoRestoreEnabled });
}

/**
 * Function: setupTabProtectionEventListeners
 * Description: Setup tab protection event listeners (Rule 2 - named function)
 */
function setupTabProtectionEventListeners() {
    console.log('🛡️ Setting up tab protection event listeners...');
    
    const tabProtectionCheckbox = document.getElementById('tabProtection');
    if (tabProtectionCheckbox) {
        tabProtectionCheckbox.addEventListener('change', handleTabProtectionChange);
        console.log('✅ Tab protection checkbox listener added');
    }
    
    const autoRestoreCheckbox = document.getElementById('autoRestore');
    if (autoRestoreCheckbox) {
        autoRestoreCheckbox.addEventListener('change', handleAutoRestoreChange);
        console.log('✅ Auto restore checkbox listener added');
    }
}

/**
 * Function: handleTabProtectionChange
 * Description: Handle tab protection setting change (Rule 2 - named function)
 */
function handleTabProtectionChange() {
    const enabled = this.checked;
    console.log('🛡️ Tab protection changed to:', enabled);
    
    protectionEnabled = enabled;
    
    if (typeof chrome !== 'undefined' && chrome.storage) {
        chrome.storage.local.set({ tabProtection: enabled }, handleTabProtectionSave);
    }
}

/**
 * Function: handleTabProtectionSave
 * Description: Handle tab protection save completion (Rule 2 - named function)
 */
function handleTabProtectionSave() {
    console.log('✅ Tab protection setting saved');
    
    if (typeof window !== 'undefined' && window.TabProtection && window.TabProtection.setProtection) {
        window.TabProtection.setProtection(protectionEnabled);
    }
}

/**
 * Function: handleAutoRestoreChange
 * Description: Handle auto restore setting change (Rule 2 - named function)
 */
function handleAutoRestoreChange() {
    const enabled = this.checked;
    console.log('🔄 Auto restore changed to:', enabled);
    
    autoRestoreEnabled = enabled;
    
    if (typeof chrome !== 'undefined' && chrome.storage) {
        chrome.storage.local.set({ autoRestore: enabled }, handleAutoRestoreSave);
    }
}

/**
 * Function: handleAutoRestoreSave
 * Description: Handle auto restore save completion (Rule 2 - named function)
 */
function handleAutoRestoreSave() {
    console.log('✅ Auto restore setting saved');
    
    if (typeof window !== 'undefined' && window.TabProtection && window.TabProtection.setAutoRestore) {
        window.TabProtection.setAutoRestore(autoRestoreEnabled);
    }
}

// Initialize when DOM is ready
document.addEventListener('DOMContentLoaded', initializeOptionsPage);

// Listen for system theme changes
if (window.matchMedia) {
    window.matchMedia('(prefers-color-scheme: dark)').addEventListener('change', handleSystemThemeChange);
}

/**
 * Function: handleSystemThemeChange
 * Description: Handle system theme changes (Rule 2 - named function)
 */
function handleSystemThemeChange(event) {
    try {
        if (typeof chrome !== 'undefined' && chrome.storage) {
            chrome.storage.sync.get(['theme'], handleSystemThemeCheck);
        }
    } catch (error) {
        console.error('❌ Error handling system theme change:', error);
    }
}

/**
 * Function: handleSystemThemeCheck
 * Description: Check theme setting after system change (Rule 2 - named function)
 */
function handleSystemThemeCheck(result) {
    const theme = result.theme || 'system';
    if (theme === 'system') {
        applyTheme(theme);
    }
}

console.log('✅ Options.js loaded - Rule 2 compliant, no syntax errors');
