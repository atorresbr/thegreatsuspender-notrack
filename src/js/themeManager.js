/**
 * COMPLETE THEME MANAGEMENT SYSTEM
 * Fixes all theme issues including system theme behavior
 */
(function() {
  'use strict';

  console.log('Complete Theme Manager initializing...');

  // Theme definitions with proper gradients
  const themeGradients = {
    purple: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
    ocean: 'linear-gradient(135deg, #667db6 0%, #0082c8 100%)',
    sunset: 'linear-gradient(135deg, #ff9a9e 0%, #fecfef 50%, #fecfef 100%)',
    forest: 'linear-gradient(135deg, #134e5e 0%, #71b280 100%)',
    fire: 'linear-gradient(135deg, #ff416c 0%, #ff4b2b 100%)',
    lavender: 'linear-gradient(135deg, #a8edea 0%, #fed6e3 100%)',
    cosmic: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
    emerald: 'linear-gradient(135deg, #11998e 0%, #38ef7d 100%)',
    rose: 'linear-gradient(135deg, #f093fb 0%, #f5576c 100%)',
    sky: 'linear-gradient(135deg, #74b9ff 0%, #0084e3 100%)',
    peach: 'linear-gradient(135deg, #ffecd2 0%, #fcb69f 100%)',
    mint: 'linear-gradient(135deg, #a8e6cf 0%, #7fcdcd 100%)',
    golden: 'linear-gradient(135deg, #ffd89b 0%, #19547b 100%)',
    berry: 'linear-gradient(135deg, #8360c3 0%, #2ebf91 100%)',
    coral: 'linear-gradient(135deg, #ff9a56 0%, #ff6b95 100%)',
    aurora: 'linear-gradient(135deg, #00c6ff 0%, #0072ff 100%)',
    dark: 'linear-gradient(135deg, #1a1a2e 0%, #16213e 100%)',
    midnight: 'linear-gradient(135deg, #0f0f23 0%, #2d1b69 100%)'
  };

  const lightThemes = ['sunset', 'lavender', 'peach', 'mint'];

  // System theme detection
  function detectSystemTheme() {
    if (window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches) {
      return 'dark';
    }
    return 'light';
  }

  // Apply theme to any page (suspended tabs, options, etc.)
  function applyTheme(themeName, targetDocument = document) {
    console.log('Applying theme:', themeName);
    
    const gradient = themeGradients[themeName] || themeGradients.purple;
    const isLight = lightThemes.includes(themeName);
    
    // Remove all existing theme classes
    targetDocument.body.className = targetDocument.body.className.replace(/theme-\w+|light-theme|dark-theme/g, '');
    
    // Add new theme classes
    targetDocument.body.classList.add('theme-' + themeName);
    if (isLight) {
      targetDocument.body.classList.add('light-theme');
    } else {
      targetDocument.body.classList.add('dark-theme');
    }
    
    // Apply gradient background
    targetDocument.documentElement.style.setProperty('--current-gradient', gradient);
    targetDocument.body.style.background = gradient;
    targetDocument.body.style.backgroundAttachment = 'fixed';
    targetDocument.body.style.transition = 'all 0.5s ease';
    
    // Store theme preference
    chrome.storage.local.set({ 
      selectedTheme: themeName,
      themeGradient: gradient,
      isLightTheme: isLight
    });
    
    console.log('Theme applied successfully:', themeName);
  }

  // Handle system theme behavior
  function handleSystemThemeBehavior(behavior) {
    console.log('System theme behavior:', behavior);
    
    chrome.storage.local.get(['selectedTheme'], (result) => {
      let targetTheme = result.selectedTheme || 'purple';
      
      switch(behavior) {
        case 'follow-system':
          const systemTheme = detectSystemTheme();
          targetTheme = systemTheme === 'dark' ? 'dark' : 'sunset';
          break;
        case 'always-light':
          targetTheme = 'sunset';
          break;
        case 'always-dark':
          targetTheme = 'dark';
          break;
        default:
          // Use stored theme
          break;
      }
      
      applyTheme(targetTheme);
      
      // Store system behavior preference
      chrome.storage.local.set({ systemThemeBehavior: behavior });
    });
  }

  // Listen for system theme changes
  if (window.matchMedia) {
    window.matchMedia('(prefers-color-scheme: dark)').addEventListener('change', () => {
      chrome.storage.local.get(['systemThemeBehavior'], (result) => {
        if (result.systemThemeBehavior === 'follow-system') {
          handleSystemThemeBehavior('follow-system');
        }
      });
    });
  }

  // Initialize theme manager
  function initThemeManager() {
    chrome.storage.local.get(['selectedTheme', 'systemThemeBehavior'], (result) => {
      const behavior = result.systemThemeBehavior || 'manual';
      const theme = result.selectedTheme || 'purple';
      
      if (behavior === 'follow-system') {
        handleSystemThemeBehavior('follow-system');
      } else {
        applyTheme(theme);
      }
    });
  }

  // Export functions globally
  window.ThemeManager = {
    applyTheme,
    handleSystemThemeBehavior,
    themeGradients,
    lightThemes,
    detectSystemTheme,
    initThemeManager
  };

  // Auto-initialize
  initThemeManager();

  console.log('Complete Theme Manager ready!');
})();
