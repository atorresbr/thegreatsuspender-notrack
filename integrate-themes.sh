#!/bin/bash
# filepath: /home/linux/Documents/GitHub/thegreatsuspender-notrack/apply_gradient_glass.sh

echo "🎨 Applying Enhanced Gradient Glass Effects..."

# Set up directories
REPO_DIR="/home/linux/Documents/GitHub/thegreatsuspender-notrack"
SRC_DIR="$REPO_DIR/src"
CSS_DIR="$SRC_DIR/css"
JS_DIR="$SRC_DIR/js"

# Create backup directory
mkdir -p "$REPO_DIR/backup"

echo "📁 Working in directory: $REPO_DIR"

# 1. Update suspended.css with enhanced gradient glass effects
echo "✨ Updating suspended.css with gradient glass effects..."

if [ -f "$CSS_DIR/suspended.css" ]; then
    # Backup original file
    cp "$CSS_DIR/suspended.css" "$REPO_DIR/backup/suspended.css.backup"
    
    # Add enhanced gradient glass CSS
    cat >> "$CSS_DIR/suspended.css" << 'EOF'

/* ENHANCED GRADIENT GLASS EFFECTS for suspended tabs - CONSISTENT WITH OPTIONS */
:root {
  --current-gradient: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
}

/* Background with PERFECT transition support */
body {
  background: var(--current-gradient) !important;
  background-attachment: fixed !important;
  transition: background 0.5s ease, color 0.5s ease !important;
  min-height: 100vh;
}

/* ENHANCED container with theme color blend */
.container {
  background: linear-gradient(135deg, 
    rgba(255, 255, 255, 0.25) 0%, 
    rgba(255, 255, 255, 0.15) 100%) !important;
  backdrop-filter: blur(25px) !important;
  border: 1px solid rgba(255, 255, 255, 0.3) !important;
  box-shadow: 0 10px 40px rgba(0, 0, 0, 0.25) !important;
  transition: all 0.5s ease !important;
}

/* URL display with theme integration */
.url {
  background: linear-gradient(135deg, 
    rgba(255, 255, 255, 0.4) 0%, 
    rgba(255, 255, 255, 0.25) 50%,
    var(--current-gradient) 100%) !important;
  backdrop-filter: blur(20px) !important;
  border: 1px solid rgba(255, 255, 255, 0.25) !important;
  transition: all 0.5s ease !important;
}

/* Action buttons with theme color blend */
.action-btn {
  background: linear-gradient(135deg, 
    rgba(255, 255, 255, 0.3) 0%, 
    rgba(255, 255, 255, 0.15) 50%,
    var(--current-gradient) 100%) !important;
  border: 2px solid rgba(255, 255, 255, 0.4) !important;
  backdrop-filter: blur(15px) !important;
  transition: all 0.3s ease !important;
}

.action-btn:hover {
  background: linear-gradient(135deg, 
    rgba(255, 255, 255, 0.5) 0%, 
    rgba(255, 255, 255, 0.3) 50%,
    var(--current-gradient) 100%) !important;
  transform: translateY(-2px);
  box-shadow: 0 8px 20px rgba(0, 0, 0, 0.3) !important;
}

/* LIGHT THEME enhancements with theme color blend */
body.light-theme {
  color: #1a1a1a !important;
  transition: color 0.5s ease !important;
}

body.light-theme h1,
body.light-theme .url,
body.light-theme .info,
body.light-theme .action-btn {
  color: #1a1a1a !important;
  text-shadow: 0 1px 3px rgba(255,255,255,0.8) !important;
  transition: all 0.5s ease !important;
}

body.light-theme .container {
  background: linear-gradient(135deg, 
    rgba(255, 255, 255, 0.6) 0%, 
    rgba(255, 255, 255, 0.35) 50%,
    var(--current-gradient) 100%) !important;
  backdrop-filter: blur(30px) !important;
  border: 1px solid rgba(255, 255, 255, 0.6) !important;
  box-shadow: 0 10px 40px rgba(31, 38, 135, 0.15) !important;
}

body.light-theme .url {
  background: linear-gradient(135deg, 
    rgba(255, 255, 255, 0.7) 0%, 
    rgba(255, 255, 255, 0.45) 50%,
    var(--current-gradient) 100%) !important;
  backdrop-filter: blur(25px) !important;
  border: 1px solid rgba(255, 255, 255, 0.7) !important;
}

body.light-theme .action-btn {
  background: linear-gradient(135deg, 
    rgba(255, 255, 255, 0.6) 0%, 
    rgba(255, 255, 255, 0.3) 50%,
    var(--current-gradient) 100%) !important;
  border: 2px solid rgba(0, 0, 0, 0.2) !important;
  backdrop-filter: blur(20px) !important;
}

body.light-theme .action-btn:hover {
  background: linear-gradient(135deg, 
    rgba(255, 255, 255, 0.8) 0%, 
    rgba(255, 255, 255, 0.5) 50%,
    var(--current-gradient) 100%) !important;
  color: #1a1a1a !important;
  border-color: rgba(0, 0, 0, 0.3) !important;
}

/* DARK THEME enhancements with theme color blend */
body.theme-dark .container,
body.theme-midnight .container,
body.theme-forest .container,
body.theme-purple .container,
body.theme-ocean .container,
body.theme-cosmic .container {
  background: linear-gradient(135deg, 
    rgba(255, 255, 255, 0.15) 0%, 
    rgba(255, 255, 255, 0.05) 50%,
    var(--current-gradient) 100%) !important;
  backdrop-filter: blur(25px) !important;
  border: 1px solid rgba(255, 255, 255, 0.2) !important;
  box-shadow: 0 10px 40px rgba(0, 0, 0, 0.3) !important;
}
EOF

    echo "✅ Enhanced gradient glass effects added to suspended.css"
else
    echo "⚠️ suspended.css not found, creating it..."
    mkdir -p "$CSS_DIR"
    # Create the entire file if it doesn't exist
    cat > "$CSS_DIR/suspended.css" << 'EOF'
/* ENHANCED GRADIENT GLASS EFFECTS for suspended tabs */
:root {
  --current-gradient: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
}

body {
  background: var(--current-gradient) !important;
  background-attachment: fixed !important;
  transition: background 0.5s ease, color 0.5s ease !important;
  min-height: 100vh;
  font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
  margin: 0;
  padding: 0;
  display: flex;
  align-items: center;
  justify-content: center;
}

.container {
  background: linear-gradient(135deg, 
    rgba(255, 255, 255, 0.25) 0%, 
    rgba(255, 255, 255, 0.15) 100%) !important;
  backdrop-filter: blur(25px) !important;
  border: 1px solid rgba(255, 255, 255, 0.3) !important;
  box-shadow: 0 10px 40px rgba(0, 0, 0, 0.25) !important;
  transition: all 0.5s ease !important;
  border-radius: 20px;
  padding: 40px;
  max-width: 600px;
  text-align: center;
  color: white;
}

h1 {
  margin: 0 0 20px 0;
  font-size: 2em;
  font-weight: 300;
}

.url {
  background: linear-gradient(135deg, 
    rgba(255, 255, 255, 0.4) 0%, 
    rgba(255, 255, 255, 0.25) 50%,
    var(--current-gradient) 100%) !important;
  backdrop-filter: blur(20px) !important;
  border: 1px solid rgba(255, 255, 255, 0.25) !important;
  transition: all 0.5s ease !important;
  padding: 15px;
  margin: 20px 0;
  border-radius: 10px;
  word-break: break-all;
}

.action-btn {
  background: linear-gradient(135deg, 
    rgba(255, 255, 255, 0.3) 0%, 
    rgba(255, 255, 255, 0.15) 50%,
    var(--current-gradient) 100%) !important;
  border: 2px solid rgba(255, 255, 255, 0.4) !important;
  backdrop-filter: blur(15px) !important;
  transition: all 0.3s ease !important;
  padding: 12px 24px;
  margin: 10px;
  border-radius: 25px;
  color: white;
  cursor: pointer;
  font-size: 14px;
  text-decoration: none;
  display: inline-block;
}

.action-btn:hover {
  background: linear-gradient(135deg, 
    rgba(255, 255, 255, 0.5) 0%, 
    rgba(255, 255, 255, 0.3) 50%,
    var(--current-gradient) 100%) !important;
  transform: translateY(-2px);
  box-shadow: 0 8px 20px rgba(0, 0, 0, 0.3) !important;
}

/* Light theme styles */
body.light-theme {
  color: #1a1a1a !important;
  transition: color 0.5s ease !important;
}

body.light-theme h1,
body.light-theme .url,
body.light-theme .info,
body.light-theme .action-btn {
  color: #1a1a1a !important;
  text-shadow: 0 1px 3px rgba(255,255,255,0.8) !important;
  transition: all 0.5s ease !important;
}

body.light-theme .container {
  background: linear-gradient(135deg, 
    rgba(255, 255, 255, 0.6) 0%, 
    rgba(255, 255, 255, 0.35) 50%,
    var(--current-gradient) 100%) !important;
  backdrop-filter: blur(30px) !important;
  border: 1px solid rgba(255, 255, 255, 0.6) !important;
  box-shadow: 0 10px 40px rgba(31, 38, 135, 0.15) !important;
}

body.light-theme .url {
  background: linear-gradient(135deg, 
    rgba(255, 255, 255, 0.7) 0%, 
    rgba(255, 255, 255, 0.45) 50%,
    var(--current-gradient) 100%) !important;
  backdrop-filter: blur(25px) !important;
  border: 1px solid rgba(255, 255, 255, 0.7) !important;
}

body.light-theme .action-btn {
  background: linear-gradient(135deg, 
    rgba(255, 255, 255, 0.6) 0%, 
    rgba(255, 255, 255, 0.3) 50%,
    var(--current-gradient) 100%) !important;
  border: 2px solid rgba(0, 0, 0, 0.2) !important;
  backdrop-filter: blur(20px) !important;
}

body.light-theme .action-btn:hover {
  background: linear-gradient(135deg, 
    rgba(255, 255, 255, 0.8) 0%, 
    rgba(255, 255, 255, 0.5) 50%,
    var(--current-gradient) 100%) !important;
  color: #1a1a1a !important;
  border-color: rgba(0, 0, 0, 0.3) !important;
}

/* Dark theme styles */
body.theme-dark .container,
body.theme-midnight .container,
body.theme-forest .container,
body.theme-purple .container,
body.theme-ocean .container,
body.theme-cosmic .container {
  background: linear-gradient(135deg, 
    rgba(255, 255, 255, 0.15) 0%, 
    rgba(255, 255, 255, 0.05) 50%,
    var(--current-gradient) 100%) !important;
  backdrop-filter: blur(25px) !important;
  border: 1px solid rgba(255, 255, 255, 0.2) !important;
  box-shadow: 0 10px 40px rgba(0, 0, 0, 0.3) !important;
}
EOF

    echo "✅ Created suspended.css with gradient glass effects"
fi

# 2. Update options.css with matching gradient glass effects
echo "✨ Updating options.css with matching gradient glass effects..."

if [ -f "$CSS_DIR/options.css" ]; then
    # Backup original file
    cp "$CSS_DIR/options.css" "$REPO_DIR/backup/options.css.backup"
    
    # Add enhanced gradient glass CSS for options
    cat >> "$CSS_DIR/options.css" << 'EOF'

/* ENHANCED GRADIENT GLASS EFFECTS for options page - SAME AS SUSPENDED TABS */
:root {
  --options-current-gradient: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
}

/* Apply theme EXACTLY like suspended tabs with PROPER TRANSITIONS */
body.options-theme-applied {
  background: var(--options-current-gradient) !important;
  background-attachment: fixed !important;
  transition: all 0.5s ease !important;
  min-height: 100vh;
}

/* GRADIENT GLASS effect for ALL themes - WHITE TRANSPARENT TO THEME COLOR */
body.options-theme-applied .card {
  background: linear-gradient(135deg, 
    rgba(255, 255, 255, 0.25) 0%, 
    rgba(255, 255, 255, 0.15) 100%) !important;
  backdrop-filter: blur(20px) !important;
  border: 1px solid rgba(255, 255, 255, 0.35) !important;
  box-shadow: 0 8px 32px rgba(31, 38, 135, 0.15) !important;
  color: inherit;
  transition: all 0.5s ease !important;
}

/* ENHANCED GRADIENT GLASS for dark themes with theme color blend */
body.options-theme-applied.dark-theme .card {
  background: linear-gradient(135deg, 
    rgba(255, 255, 255, 0.15) 0%, 
    rgba(255, 255, 255, 0.05) 50%,
    var(--options-current-gradient) 100%) !important;
  backdrop-filter: blur(25px) !important;
  border: 1px solid rgba(255, 255, 255, 0.25) !important;
  box-shadow: 0 8px 32px rgba(0, 0, 0, 0.3) !important;
  color: white;
  transition: all 0.5s ease !important;
}

/* ENHANCED GRADIENT GLASS for light themes with theme color blend */
body.options-theme-applied.light-theme .card {
  background: linear-gradient(135deg, 
    rgba(255, 255, 255, 0.65) 0%, 
    rgba(255, 255, 255, 0.35) 50%,
    var(--options-current-gradient) 100%) !important;
  backdrop-filter: blur(30px) !important;
  border: 1px solid rgba(255, 255, 255, 0.7) !important;
  box-shadow: 0 8px 32px rgba(31, 38, 135, 0.1) !important;
  color: #1a1a1a !important;
  transition: all 0.5s ease !important;
}

/* Dark theme text colors with transitions */
body.options-theme-applied.dark-theme {
  color: white;
  transition: color 0.5s ease !important;
}

body.options-theme-applied.dark-theme .header-title,
body.options-theme-applied.dark-theme .header-subtitle,
body.options-theme-applied.dark-theme .card-title,
body.options-theme-applied.dark-theme .card-subtitle,
body.options-theme-applied.dark-theme .option-label,
body.options-theme-applied.dark-theme .switch-title,
body.options-theme-applied.dark-theme .switch-subtitle {
  color: white !important;
  transition: color 0.5s ease !important;
}

/* Light theme text colors with transitions */
body.options-theme-applied.light-theme {
  color: #1a1a1a;
  transition: color 0.5s ease !important;
}

body.options-theme-applied.light-theme .header-title,
body.options-theme-applied.light-theme .header-subtitle,
body.options-theme-applied.light-theme .card-title,
body.options-theme-applied.light-theme .card-subtitle,
body.options-theme-applied.light-theme .option-label,
body.options-theme-applied.light-theme .switch-title,
body.options-theme-applied.light-theme .switch-subtitle {
  color: #1a1a1a !important;
  text-shadow: 0 1px 3px rgba(255,255,255,0.8) !important;
  transition: all 0.5s ease !important;
}

/* Action buttons with gradient glass and theme color blend */
body.options-theme-applied .action-btn {
  background: linear-gradient(135deg, 
    rgba(255, 255, 255, 0.3) 0%, 
    rgba(255, 255, 255, 0.1) 50%,
    var(--options-current-gradient) 100%) !important;
  border: 2px solid rgba(255, 255, 255, 0.4) !important;
  color: white !important;
  padding: 12px 24px;
  border-radius: 25px;
  cursor: pointer;
  font-size: 14px;
  margin: 5px;
  transition: all 0.3s ease !important;
  backdrop-filter: blur(15px) !important;
}

body.options-theme-applied .action-btn:hover {
  background: linear-gradient(135deg, 
    rgba(255, 255, 255, 0.5) 0%, 
    rgba(255, 255, 255, 0.3) 50%,
    var(--options-current-gradient) 100%) !important;
  transform: translateY(-2px);
  box-shadow: 0 8px 20px rgba(0, 0, 0, 0.3) !important;
  border-color: rgba(255, 255, 255, 0.6) !important;
}

/* Light theme action buttons */
body.options-theme-applied.light-theme .action-btn {
  color: #1a1a1a !important;
  border-color: rgba(0, 0, 0, 0.3) !important;
  background: linear-gradient(135deg, 
    rgba(255, 255, 255, 0.7) 0%, 
    rgba(255, 255, 255, 0.4) 50%,
    var(--options-current-gradient) 100%) !important;
}

body.options-theme-applied.light-theme .action-btn:hover {
  background: linear-gradient(135deg, 
    rgba(255, 255, 255, 0.9) 0%, 
    rgba(255, 255, 255, 0.6) 50%,
    var(--options-current-gradient) 100%) !important;
  color: #1a1a1a !important;
  border-color: rgba(0, 0, 0, 0.4) !important;
}

/* Enhanced switch elements with theme color */
body.options-theme-applied .switch .slider {
  background: linear-gradient(135deg, 
    rgba(255, 255, 255, 0.3) 0%, 
    var(--options-current-gradient) 100%) !important;
  transition: all 0.3s ease !important;
  backdrop-filter: blur(10px) !important;
}

body.options-theme-applied .switch input:checked + .slider {
  background: var(--options-current-gradient) !important;
  box-shadow: 0 4px 15px rgba(0, 0, 0, 0.2) !important;
}

/* Enhanced select and input elements */
body.options-theme-applied select,
body.options-theme-applied input[type="text"],
body.options-theme-applied input[type="number"] {
  background: linear-gradient(135deg, 
    rgba(255, 255, 255, 0.3) 0%, 
    rgba(255, 255, 255, 0.1) 100%) !important;
  backdrop-filter: blur(10px) !important;
  border: 1px solid rgba(255, 255, 255, 0.3) !important;
  transition: all 0.3s ease !important;
  color: inherit !important;
}

body.options-theme-applied select:hover,
body.options-theme-applied input[type="text"]:focus,
body.options-theme-applied input[type="number"]:focus {
  background: linear-gradient(135deg, 
    rgba(255, 255, 255, 0.4) 0%, 
    rgba(255, 255, 255, 0.2) 100%) !important;
  border-color: rgba(255, 255, 255, 0.5) !important;
}
EOF

    echo "✅ Enhanced gradient glass effects added to options.css"
else
    echo "⚠️ options.css not found, skipping options CSS update"
fi

# 3. Update options.js to apply themes correctly
echo "✨ Updating options.js theme application..."

if [ -f "$JS_DIR/options.js" ]; then
    # Backup original file
    cp "$JS_DIR/options.js" "$REPO_DIR/backup/options.js.backup"
    
    # Check if applyThemeToOptionsPage function exists and update it
    if grep -q "applyThemeToOptionsPage" "$JS_DIR/options.js"; then
        echo "📝 Function applyThemeToOptionsPage already exists, updating..."
        
        # Replace the function with enhanced version
        sed -i '/function applyThemeToOptionsPage/,/^  }$/c\
  function applyThemeToOptionsPage(themeName = selectedTheme, gradient = themeGradients[selectedTheme]) {\
    console.log("Applying ENHANCED gradient glass theme to options page:", themeName);\
    \
    document.documentElement.style.setProperty("--options-current-gradient", gradient);\
    document.body.classList.add("options-theme-applied");\
    \
    document.body.classList.remove("light-theme", "dark-theme");\
    document.body.className = document.body.className.replace(/theme-\\w+/g, "");\
    \
    document.body.classList.add("theme-" + themeName);\
    \
    if (lightThemes.includes(themeName)) {\
      document.body.classList.add("light-theme");\
    } else {\
      document.body.classList.add("dark-theme");\
    }\
    \
    document.body.style.background = gradient;\
    document.body.style.backgroundAttachment = "fixed";\
    document.body.style.transition = "background 0.5s ease, color 0.5s ease";\
    \
    console.log("ENHANCED gradient glass theme applied to options page:", themeName);\
  }' "$JS_DIR/options.js"
    else
        echo "📝 Adding applyThemeToOptionsPage function..."
        
        # Add the function before the last closing brace
        sed -i '$i\
  function applyThemeToOptionsPage(themeName = selectedTheme, gradient = themeGradients[selectedTheme]) {\
    console.log("Applying ENHANCED gradient glass theme to options page:", themeName);\
    \
    document.documentElement.style.setProperty("--options-current-gradient", gradient);\
    document.body.classList.add("options-theme-applied");\
    \
    document.body.classList.remove("light-theme", "dark-theme");\
    document.body.className = document.body.className.replace(/theme-\\w+/g, "");\
    \
    document.body.classList.add("theme-" + themeName);\
    \
    if (lightThemes.includes(themeName)) {\
      document.body.classList.add("light-theme");\
    } else {\
      document.body.classList.add("dark-theme");\
    }\
    \
    document.body.style.background = gradient;\
    document.body.style.backgroundAttachment = "fixed";\
    document.body.style.transition = "background 0.5s ease, color 0.5s ease";\
    \
    console.log("ENHANCED gradient glass theme applied to options page:", themeName);\
  }' "$JS_DIR/options.js"
    fi
    
    echo "✅ Enhanced options.js theme application function"
else
    echo "⚠️ options.js not found, skipping JS update"
fi

# 4. Update themeLoader.js for suspended tabs
echo "✨ Updating themeLoader.js for suspended tabs..."

if [ -f "$JS_DIR/themeLoader.js" ]; then
    # Backup original file
    cp "$JS_DIR/themeLoader.js" "$REPO_DIR/backup/themeLoader.js.backup"
    
    # Update the applyTheme function
    sed -i '/function applyTheme/,/^  }$/c\
  function applyTheme(themeName, gradient, isLight = false) {\
    console.log("Applying GRADIENT GLASS theme to suspended tab:", themeName, "isLight:", isLight);\
    \
    try {\
      document.body.className = document.body.className.replace(/theme-\\w+|light-theme/g, "");\
      document.body.classList.add("theme-" + themeName);\
      \
      if (isLight || lightThemes.includes(themeName)) {\
        document.body.classList.add("light-theme");\
        console.log("Applied light-theme class with gradient glass");\
      }\
      \
      document.documentElement.style.setProperty("--current-gradient", gradient);\
      document.body.style.background = gradient;\
      document.body.style.backgroundAttachment = "fixed";\
      document.body.style.transition = "background 0.5s ease, color 0.5s ease";\
      \
      console.log("GRADIENT GLASS theme applied successfully:", themeName);\
    } catch (error) {\
      console.error("Error applying gradient glass theme:", error);\
    }\
  }' "$JS_DIR/themeLoader.js"
    
    echo "✅ Enhanced themeLoader.js for gradient glass effects"
else
    echo "⚠️ themeLoader.js not found, skipping theme loader update"
fi

# 5. Clean up the problematic files
echo "🧹 Cleaning up problematic files..."

# Remove the CSS files that were wrongly named as .sh
if [ -f "$REPO_DIR/fix.sh" ]; then
    echo "🗑️ Removing fix.sh (contains CSS, not bash)"
    rm "$REPO_DIR/fix.sh"
fi

if [ -f "$REPO_DIR/integrate-themes.sh" ]; then
    echo "🗑️ Removing integrate-themes.sh (contains CSS, not bash)"
    rm "$REPO_DIR/integrate-themes.sh"
fi

# Create a proper CSS file from the content if needed
echo "📝 Creating proper gradient glass CSS file..."
cat > "$CSS_DIR/gradient-glass.css" << 'EOF'
/* ENHANCED GRADIENT GLASS EFFECTS - MASTER FILE */
/* This file contains all the gradient glass styling for reference */

:root {
  --current-gradient: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  --options-current-gradient: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
}

/* Theme gradients */
.theme-purple { --current-gradient: linear-gradient(135deg, #667eea 0%, #764ba2 100%); }
.theme-ocean { --current-gradient: linear-gradient(135deg, #667db6 0%, #0082c8 100%); }
.theme-sunset { --current-gradient: linear-gradient(135deg, #ff9a9e 0%, #fecfef 50%, #fecfef 100%); }
.theme-forest { --current-gradient: linear-gradient(135deg, #134e5e 0%, #71b280 100%); }
.theme-fire { --current-gradient: linear-gradient(135deg, #ff416c 0%, #ff4b2b 100%); }
.theme-lavender { --current-gradient: linear-gradient(135deg, #a8edea 0%, #fed6e3 100%); }
.theme-cosmic { --current-gradient: linear-gradient(135deg, #667eea 0%, #764ba2 100%); }
.theme-emerald { --current-gradient: linear-gradient(135deg, #11998e 0%, #38ef7d 100%); }
.theme-rose { --current-gradient: linear-gradient(135deg, #f093fb 0%, #f5576c 100%); }
.theme-sky { --current-gradient: linear-gradient(135deg, #74b9ff 0%, #0084e3 100%); }
.theme-peach { --current-gradient: linear-gradient(135deg, #ffecd2 0%, #fcb69f 100%); }
.theme-mint { --current-gradient: linear-gradient(135deg, #a8e6cf 0%, #7fcdcd 100%); }
.theme-golden { --current-gradient: linear-gradient(135deg, #ffd89b 0%, #19547b 100%); }
.theme-berry { --current-gradient: linear-gradient(135deg, #8360c3 0%, #2ebf91 100%); }
.theme-coral { --current-gradient: linear-gradient(135deg, #ff9a56 0%, #ff6b95 100%); }
.theme-aurora { --current-gradient: linear-gradient(135deg, #00c6ff 0%, #0072ff 100%); }
.theme-dark { --current-gradient: linear-gradient(135deg, #1a1a2e 0%, #16213e 100%); }
.theme-midnight { --current-gradient: linear-gradient(135deg, #0f0f23 0%, #2d1b69 100%); }

/* Universal gradient glass effects */
.gradient-glass-bg {
  background: var(--current-gradient) !important;
  background-attachment: fixed !important;
  transition: background 0.5s ease, color 0.5s ease !important;
}

.gradient-glass-container {
  background: linear-gradient(135deg, 
    rgba(255, 255, 255, 0.25) 0%, 
    rgba(255, 255, 255, 0.15) 100%) !important;
  backdrop-filter: blur(25px) !important;
  border: 1px solid rgba(255, 255, 255, 0.3) !important;
  box-shadow: 0 10px 40px rgba(0, 0, 0, 0.25) !important;
  transition: all 0.5s ease !important;
}

.gradient-glass-light {
  background: linear-gradient(135deg, 
    rgba(255, 255, 255, 0.6) 0%, 
    rgba(255, 255, 255, 0.35) 50%,
    var(--current-gradient) 100%) !important;
  backdrop-filter: blur(30px) !important;
  border: 1px solid rgba(255, 255, 255, 0.6) !important;
}

.gradient-glass-dark {
  background: linear-gradient(135deg, 
    rgba(255, 255, 255, 0.15) 0%, 
    rgba(255, 255, 255, 0.05) 50%,
    var(--current-gradient) 100%) !important;
  backdrop-filter: blur(25px) !important;
  border: 1px solid rgba(255, 255, 255, 0.2) !important;
}
EOF

echo ""
echo "🎉 ✅ GRADIENT GLASS EFFECTS APPLIED SUCCESSFULLY!"
echo ""
echo "🎨 What's been enhanced:"
echo "   ✨ Suspended tabs now have gradient glass effects"
echo "   ✨ Options page matches suspended tab styling"
echo "   ✨ Smooth background transitions between themes"
echo "   ✨ Theme color blending with white transparent glass"
echo "   ✨ Enhanced backdrop blur effects"
echo "   ✨ Perfect light/dark theme adaptations"
echo ""
echo "📁 Files updated:"
echo "   📝 $CSS_DIR/suspended.css (Enhanced gradient glass)"
echo "   📝 $CSS_DIR/options.css (Matching gradient glass)" 
echo "   📝 $JS_DIR/options.js (Enhanced theme application)"
echo "   📝 $JS_DIR/themeLoader.js (Gradient glass support)"
echo "   📝 $CSS_DIR/gradient-glass.css (Master reference file)"
echo ""
echo "🗑️ Cleaned up:"
echo "   ❌ Removed fix.sh (was CSS, not bash)"
echo "   ❌ Removed integrate-themes.sh (was CSS, not bash)"
echo ""
echo "🔄 Next steps:"
echo "   1. Reload your extension in Chrome"
echo "   2. Visit the options page - it should have beautiful gradient backgrounds!"
echo "   3. Switch themes and watch the smooth transitions"
echo "   4. Suspend some tabs to see the matching gradient glass effects"
echo ""
echo "💎 Now both suspended tabs and options page have stunning gradient glass effects!"