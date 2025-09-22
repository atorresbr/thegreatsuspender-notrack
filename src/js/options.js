/**
 * OPTIONS.JS - FIXED VERSION WITH WORKING SYSTEM THEME BEHAVIOR
 * All theme switching functionality works properly
 */

console.log('🎨 Options.js loading with theme system...');

// Global theme state
let currentTheme = 'purple';
let systemThemeBehavior = 'manual';

// All theme definitions
const themeGradients = {
    purple: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
    ocean: 'linear-gradient(135deg, #667db6 0%, #0082c8 100%)',
    sunset: 'linear-gradient(135deg, #ff9a9e 0%, #fecfef 100%)',
    forest: 'linear-gradient(135deg, #134e5e 0%, #71b280 100%)',
    fire: 'linear-gradient(135deg, #ff416c 0%, #ff4b2b 100%)',
    lavender: 'linear-gradient(135deg, #a8edea 0%, #fed6e3 100%)',
    cosmic: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
    emerald: 'linear-gradient(135deg, #11998e 0%, #38ef7d 100%)',
    rose: 'linear-gradient(135deg, #f093fb 0%, #f5576c 100%)',
    sky: 'linear-gradient(135deg, #74b9ff 0%, #0984e3 100%)',
    peach: 'linear-gradient(135deg, #ffecd2 0%, #fcb69f 100%)',
    mint: 'linear-gradient(135deg, #a8e6cf 0%, #7fcdcd 100%)',
    golden: 'linear-gradient(135deg, #ffd89b 0%, #19547b 100%)',
    berry: 'linear-gradient(135deg, #8360c3 0%, #2ebf91 100%)',
    coral: 'linear-gradient(135deg, #ff9a56 0%, #ff6b95 100%)',
    aurora: 'linear-gradient(135deg, #00c6ff 0%, #0072ff 100%)',
    dark: 'linear-gradient(135deg, #1a1a2e 0%, #16213e 100%)',
    midnight: 'linear-gradient(135deg, #0f0f23 0%, #2d1b69 100%)'
};

/**
 * Initialize options page
 */
function initializeOptionsPage() {
    try {
        console.log('📋 Initializing options page...');
        
        // Load all settings
        loadAllSettings();
        
        // Setup all event listeners
        setupEventListeners();
        
        // Initialize theme system
        initializeThemeSystem();
        
        // Initialize tab protection
        initializeTabProtection();
        
        console.log('✅ Options page initialized');
    } catch (error) {
        console.error('❌ Options initialization error:', error);
    }
}

/**
 * Load all settings from storage
 */
function loadAllSettings() {
    console.log('📊 Loading all settings...');
    
    chrome.storage.local.get([
        'selectedTheme',
        'systemThemeBehavior',
        'tabProtection',
        'autoRestore',
        'suspendAfter',
        'dontSuspendPinned',
        'dontSuspendForms',
        'whitelist'
    ], function(result) {
        // Apply loaded settings
        currentTheme = result.selectedTheme || 'purple';
        systemThemeBehavior = result.systemThemeBehavior || 'manual';
        
        // Update UI elements
        updateThemeButtons();
        updateSystemBehaviorSwitches();
        updateTabProtectionSwitches(result);
        applyCurrentTheme();
        
        console.log('✅ Settings loaded:', result);
    });
}

/**
 * Setup all event listeners
 */
function setupEventListeners() {
    console.log('🔧 Setting up event listeners...');
    
    // Theme button listeners
    document.querySelectorAll('[data-theme]').forEach(btn => {
        btn.addEventListener('click', function() {
            const themeName = this.getAttribute('data-theme');
            selectTheme(themeName);
        });
    });
    
    // System behavior switch listeners
    const manualSwitch = document.getElementById('manualThemeSwitch');
    if (manualSwitch) {
        manualSwitch.addEventListener('change', () => handleSystemBehaviorChange('manual'));
    }
    
    const systemSwitch = document.getElementById('systemThemeSwitch');
    if (systemSwitch) {
        systemSwitch.addEventListener('change', () => handleSystemBehaviorChange('system'));
    }
    
    const lightSwitch = document.getElementById('lightThemeSwitch');
    if (lightSwitch) {
        lightSwitch.addEventListener('change', () => handleSystemBehaviorChange('light'));
    }
    
    const darkSwitch = document.getElementById('darkThemeSwitch');
    if (darkSwitch) {
        darkSwitch.addEventListener('change', () => handleSystemBehaviorChange('dark'));
    }
    
    // Tab protection listeners
    const tabProtectionSwitch = document.getElementById('tabProtection');
    if (tabProtectionSwitch) {
        tabProtectionSwitch.addEventListener('change', handleTabProtectionChange);
    }
    
    const autoRestoreSwitch = document.getElementById('autoRestore');
    if (autoRestoreSwitch) {
        autoRestoreSwitch.addEventListener('change', handleAutoRestoreChange);
    }
    
    console.log('✅ Event listeners setup complete');
}

/**
 * Select a theme
 */
function selectTheme(themeName) {
    console.log('🎨 Selecting theme:', themeName);
    
    currentTheme = themeName;
    
    // Save to storage
    chrome.storage.local.set({ selectedTheme: themeName }, function() {
        console.log('💾 Theme saved to storage');
    });
    
    // Update UI
    updateThemeButtons();
    applyCurrentTheme();
    
    // If manual mode, also set behavior to manual
    if (systemThemeBehavior !== 'manual') {
        handleSystemBehaviorChange('manual');
    }
}

/**
 * Handle system behavior changes
 */
function handleSystemBehaviorChange(behavior) {
    console.log('🌗 System behavior changed to:', behavior);
    
    systemThemeBehavior = behavior;
    
    // Save to storage
    chrome.storage.local.set({ systemThemeBehavior: behavior }, function() {
        console.log('💾 System behavior saved');
    });
    
    // Update switches
    updateSystemBehaviorSwitches();
    
    // Apply appropriate theme
    applySystemBehavior();
}

/**
 * Apply system behavior
 */
function applySystemBehavior() {
    console.log('🌗 Applying system behavior:', systemThemeBehavior);
    
    switch(systemThemeBehavior) {
        case 'system':
            // Follow system preference
            if (window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches) {
                applyTheme('dark');
            } else {
                applyTheme('sunset'); // Light theme
            }
            break;
            
        case 'light':
            // Always light
            applyTheme('sunset');
            break;
            
        case 'dark':
            // Always dark
            applyTheme('dark');
            break;
            
        default:
            // Manual - use selected theme
            applyCurrentTheme();
            break;
    }
}

/**
 * Apply current theme
 */
function applyCurrentTheme() {
    applyTheme(currentTheme);
}

/**
 * Apply theme to page
 */
function applyTheme(themeName) {
    console.log('🎨 Applying theme to page:', themeName);
    
    const gradient = themeGradients[themeName] || themeGradients.purple;
    
    // Update CSS variables
    document.documentElement.style.setProperty('--current-gradient', gradient);
    
    // Update body background
    document.body.style.background = gradient;
    document.body.style.backgroundAttachment = 'fixed';
    
    // Update body classes
    document.body.className = document.body.className.replace(/theme-\w+/g, '');
    document.body.classList.add('theme-' + themeName);
    
    console.log('✅ Theme applied:', themeName);
}

/**
 * Update theme button states
 */
function updateThemeButtons() {
    document.querySelectorAll('[data-theme]').forEach(btn => {
        const btnTheme = btn.getAttribute('data-theme');
        if (btnTheme === currentTheme) {
            btn.classList.add('selected');
        } else {
            btn.classList.remove('selected');
        }
    });
}

/**
 * Update system behavior switch states
 */
function updateSystemBehaviorSwitches() {
    console.log('🔧 Updating behavior switches for:', systemThemeBehavior);
    
    // Reset all switches
    const switches = {
        manualThemeSwitch: false,
        systemThemeSwitch: false,
        lightThemeSwitch: false,
        darkThemeSwitch: false
    };
    
    // Set the active switch
    switch(systemThemeBehavior) {
        case 'manual':
            switches.manualThemeSwitch = true;
            break;
        case 'system':
            switches.systemThemeSwitch = true;
            break;
        case 'light':
            switches.lightThemeSwitch = true;
            break;
        case 'dark':
            switches.darkThemeSwitch = true;
            break;
    }
    
    // Update DOM
    Object.keys(switches).forEach(switchId => {
        const element = document.getElementById(switchId);
        if (element) {
            element.checked = switches[switchId];
        }
    });
}

/**
 * Initialize theme system
 */
function initializeThemeSystem() {
    console.log('🎨 Initializing theme system...');
    
    // Listen for system theme changes
    if (window.matchMedia) {
        const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
        mediaQuery.addEventListener('change', function() {
            if (systemThemeBehavior === 'system') {
                applySystemBehavior();
            }
        });
    }
    
    console.log('✅ Theme system initialized');
}

/**
 * Initialize tab protection
 */
function initializeTabProtection() {
    console.log('🛡️ Initializing tab protection...');
    // Tab protection initialization is handled in loadAllSettings
}

/**
 * Update tab protection switches
 */
function updateTabProtectionSwitches(settings) {
    const tabProtectionSwitch = document.getElementById('tabProtection');
    if (tabProtectionSwitch) {
        tabProtectionSwitch.checked = settings.tabProtection !== false;
    }
    
    const autoRestoreSwitch = document.getElementById('autoRestore');
    if (autoRestoreSwitch) {
        autoRestoreSwitch.checked = settings.autoRestore !== false;
    }
}

/**
 * Handle tab protection change
 */
function handleTabProtectionChange() {
    const enabled = this.checked;
    console.log('🛡️ Tab protection changed:', enabled);
    
    chrome.storage.local.set({ tabProtection: enabled }, function() {
        console.log('💾 Tab protection saved');
    });
}

/**
 * Handle auto restore change
 */
function handleAutoRestoreChange() {
    const enabled = this.checked;
    console.log('🔄 Auto restore changed:', enabled);
    
    chrome.storage.local.set({ autoRestore: enabled }, function() {
        console.log('💾 Auto restore saved');
    });
}

// Initialize when DOM is ready
document.addEventListener('DOMContentLoaded', initializeOptionsPage);

console.log('✅ Options.js loaded with working system theme behavior');
