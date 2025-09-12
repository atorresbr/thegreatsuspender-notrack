/**
 * ENHANCED Dynamic theme loader with GRADIENT GLASS EFFECTS
 */
(function() {
  'use strict';

  console.log('ThemeLoader with GRADIENT GLASS EFFECTS initializing...');

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

  const lightThemes = ['sunset', 'lavender', 'peach', 'mint', 'coral', 'golden'];

  function applyTheme(themeName, gradient, isLight = false) {
    console.log("Applying GRADIENT GLASS theme to suspended tab:", themeName, "isLight:", isLight);
    
    try {
      document.body.className = document.body.className.replace(/theme-\w+|light-theme/g, "");
      document.body.classList.add("theme-" + themeName);
      
      if (isLight || lightThemes.includes(themeName)) {
        document.body.classList.add("light-theme");
        console.log("Applied light-theme class with gradient glass");
      }
      
      document.documentElement.style.setProperty("--current-gradient", gradient);
      document.body.style.background = gradient;
      document.body.style.backgroundAttachment = "fixed";
      document.body.style.transition = "background 0.5s ease, color 0.5s ease";
      
      console.log("GRADIENT GLASS theme applied successfully:", themeName);
    } catch (error) {
      console.error("Error applying gradient glass theme:", error);
    }
  }

  function loadDynamicTheme() {
    console.log('Loading dynamic GRADIENT GLASS theme from storage...');
    
    if (chrome && chrome.storage && chrome.storage.local) {
      chrome.storage.local.get(['selectedTheme', 'themeGradient', 'systemBehavior', 'effectiveTheme', 'effectiveGradient'], function(result) {
        const selectedTheme = result.selectedTheme || 'purple';
        const systemBehavior = result.systemBehavior || 'force';
        
        const effectiveTheme = result.effectiveTheme || selectedTheme;
        const effectiveGradient = result.effectiveGradient || result.themeGradient || themeGradients[selectedTheme] || themeGradients.purple;
        
        console.log('Retrieved GRADIENT GLASS theme from storage:', {
          selectedTheme,
          effectiveTheme,
          systemBehavior,
          effectiveGradient
        });
        
        let finalGradient = effectiveGradient;
        let finalTheme = effectiveTheme;
        
        if (systemBehavior === 'auto' && effectiveTheme === selectedTheme) {
          if (window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches) {
            if (!['dark', 'midnight', 'forest', 'purple', 'ocean', 'cosmic', 'emerald', 'fire', 'berry', 'sky', 'aurora', 'rose'].includes(selectedTheme)) {
              finalGradient = themeGradients.dark;
              finalTheme = 'dark';
            }
          }
        } else if (systemBehavior === 'time' && effectiveTheme === selectedTheme) {
          const hour = new Date().getHours();
          if (hour < 6 || hour > 20) {
            if (!['dark', 'midnight', 'forest', 'purple', 'ocean', 'cosmic', 'emerald', 'fire', 'berry', 'sky', 'aurora', 'rose'].includes(selectedTheme)) {
              finalGradient = themeGradients.midnight;
              finalTheme = 'midnight';
            }
          }
        }
        
        const isLightTheme = lightThemes.includes(finalTheme);
        applyTheme(finalTheme, finalGradient, isLightTheme);
      });
    } else {
      console.warn('Chrome storage not available, using default gradient glass theme');
      applyTheme('purple', themeGradients.purple, false);
    }
  }

  function setupMessageListener() {
    console.log('Setting up GRADIENT GLASS message listener...');
    
    if (chrome && chrome.runtime && chrome.runtime.onMessage) {
      chrome.runtime.onMessage.addListener(function(request, sender, sendResponse) {
        console.log('Received GRADIENT GLASS message:', request);
        
        if (request.action === 'updateTheme') {
          console.log('Processing gradient glass theme update:', request.theme, 'isLight:', request.isLight);
          applyTheme(request.theme, request.gradient, request.isLight);
          sendResponse({success: true, theme: request.theme});
          return true;
        }
        return false;
      });
      console.log('GRADIENT GLASS message listener set up successfully');
    } else {
      console.warn('Chrome runtime messaging not available');
    }
  }

  function setupStorageListener() {
    console.log('Setting up GRADIENT GLASS storage listener...');
    
    if (chrome && chrome.storage && chrome.storage.onChanged) {
      chrome.storage.onChanged.addListener(function(changes, namespace) {
        if (namespace === 'local') {
          if (changes.selectedTheme || changes.themeGradient || changes.effectiveTheme || changes.effectiveGradient || changes.systemBehavior) {
            console.log('GRADIENT GLASS theme storage changed, reloading...', changes);
            setTimeout(loadDynamicTheme, 100);
          }
        }
      });
      console.log('GRADIENT GLASS storage listener set up successfully');
    } else {
      console.warn('Chrome storage change listener not available');
    }
  }

  window.loadDynamicTheme = loadDynamicTheme;
  window.applyTheme = applyTheme;

  function init() {
    console.log('Initializing GRADIENT GLASS theme loader...');
    loadDynamicTheme();
    setupMessageListener();
    setupStorageListener();
    console.log('GRADIENT GLASS theme loader initialized successfully');
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }

  setTimeout(() => {
    if (!document.body.classList.contains('theme-purple') && 
        !document.body.classList.contains('theme-ocean') && 
        !document.body.classList.contains('theme-sunset')) {
      console.log('GRADIENT GLASS theme not applied, retrying...');
      loadDynamicTheme();
    }
  }, 1000);
})();
