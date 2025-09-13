#!/bin/bash
# filepath: /home/linux/Documents/GitHub/thegreatsuspender-notrack/fix_part4.sh

REPO_DIR="/home/linux/Documents/GitHub/thegreatsuspender-notrack"
SRC_DIR="$REPO_DIR/src"
MANIFEST="$SRC_DIR/manifest.json"
OPTIONS_JS="$SRC_DIR/js/options.js"

echo "🔧 Part 4: Adding extension pinning and default theme settings..."

# 1. Add action to manifest.json to make extension pinnable
if ! grep -q '"action"' "$MANIFEST"; then
    sed -i '/"permissions":/i\
  "action": {\
    "default_popup": "popup.html",\
    "default_title": "The Great Suspender (NoTrack)",\
    "default_icon": {\
      "16": "img/icon16.png",\
      "48": "img/icon48.png",\
      "128": "img/icon128.png"\
    }\
  },' "$MANIFEST"
    echo "✅ Added action to manifest.json for pinning"
fi

# 2. Fix default theme to "Follow System Theme"
if [ -f "$OPTIONS_JS" ]; then
    # Set default theme behavior
    sed -i '/function initializeOptions/,/}$/{
        /gsUtils.setTheme/d
        /}$/i\
        \
        // FIXED: Set default theme to "Follow System Theme"\
        chrome.storage.sync.get(["theme"], function(result) {\
            if (!result.theme) {\
                // No theme set, default to system theme\
                chrome.storage.sync.set({ theme: "system" }, function() {\
                    console.log("✅ Default theme set to: Follow System Theme");\
                    gsUtils.setTheme("system");\
                });\
            } else {\
                gsUtils.setTheme(result.theme);\
            }\
        });
    }' "$OPTIONS_JS"
    
    # Also fix the theme dropdown default selection
    sed -i '/function updateOptionsFormFromStorage/,/}$/{
        /themeSelect.value =/c\
            themeSelect.value = items.theme || "system"; // Default to system theme
    }' "$OPTIONS_JS"
    
    echo "✅ Set default theme to 'Follow System Theme'"
fi

# 3. Add installation script to auto-pin extension (requires user action)
cat > "$SRC_DIR/js/install-helper.js" << 'JSEOF'
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
JSEOF

# Add the install helper to manifest.json background scripts
if ! grep -q 'install-helper.js' "$MANIFEST"; then
    sed -i '/"background":/,/"type": "module"/{
        /"scripts":/,/\]/{
            /\]/i\
      "js/install-helper.js",
        }
    }' "$MANIFEST"
    echo "✅ Added install helper for auto-pin reminder"
fi

echo ""
echo "✅ Part 4 Complete: Extension pinning and default theme setup"
echo ""
echo "🔧 What was added:"
echo "   📌 Extension can now be pinned to toolbar"
echo "   🎨 Default theme: 'Follow System Theme'"
echo "   🔔 Install notification with pin reminder"
echo "   📖 Auto-opens options page on first install"
echo ""
echo "🔄 Please reload your extension to apply all changes!"
echo ""
echo "✅ ALL PARTS COMPLETE - Test all functionality!"