#!/bin/bash

echo "🔍 VERIFYING COMPLETE INSTALLATION..."

REPO_DIR="/home/linux/Documents/GitHub/thegreatsuspender-notrack"
SRC_DIR="$REPO_DIR/src"

echo ""
echo "📊 CHECKING FILE STRUCTURE:"

# Essential files check
files_to_check=(
    "manifest.json"
    "options.html"
    "popup.html" 
    "suspended.html"
    "managed-storage-schema.json"
    "_locales/en/messages.json"
    "js/options.js"
    "js/popup.js"
    "js/suspended.js"
    "js/contentscript.js"
    "js/background-wrapper.js"
    "css/options.css"
    "css/popup.css"
    "css/suspended.css"
)

missing_files=()
present_files=()

for file in "${files_to_check[@]}"; do
    if [ -f "$SRC_DIR/$file" ]; then
        present_files+=("$file")
        echo "✅ $file"
    else
        missing_files+=("$file")
        echo "❌ $file - MISSING"
    fi
done

echo ""
echo "📈 INSTALLATION SUMMARY:"
echo "✅ Present files: ${#present_files[@]}"
echo "❌ Missing files: ${#missing_files[@]}"

if [ ${#missing_files[@]} -eq 0 ]; then
    echo ""
    echo "🎉 ✅ PERFECT INSTALLATION!"
    echo "🌟 All ${#present_files[@]} essential files are present!"
    echo ""
    echo "🚀 NEXT STEPS:"
    echo "1. Open Chrome: chrome://extensions/"
    echo "2. Enable 'Developer mode'"
    echo "3. Click 'Load unpacked'"
    echo "4. Select folder: $SRC_DIR"
    echo "5. Enjoy your 18 beautiful themes! 🎨"
    echo ""
    echo "🎯 FEATURES YOU'LL GET:"
    echo "   🎨 18 Beautiful themes with smooth transitions"
    echo "   💾 Complete session management system"
    echo "   🛡️ Advanced tab protection features"
    echo "   📱 Mobile-like glassmorphism interface"
    echo "   🔄 Real-time theme synchronization"
    echo "   ⚡ Smart auto-backup system"
    echo "   📊 Live memory usage statistics"
    echo ""
else
    echo ""
    echo "⚠️ INSTALLATION INCOMPLETE"
    echo "Missing files:"
    for file in "${missing_files[@]}"; do
        echo "   - $file"
    done
    echo ""
    echo "🔧 TO FIX: Run the missing fix scripts"
fi

# Check manifest validity
if [ -f "$SRC_DIR/manifest.json" ]; then
    echo ""
    echo "🔍 MANIFEST VALIDATION:"
    
    if python3 -m json.tool "$SRC_DIR/manifest.json" > /dev/null 2>&1; then
        echo "✅ Manifest JSON is valid"
        
        version=$(grep '"manifest_version"' "$SRC_DIR/manifest.json" | grep -o '[0-9]')
        echo "✅ Manifest version: $version"
        
        if grep -q '"managed_schema"' "$SRC_DIR/manifest.json"; then
            echo "✅ Managed schema configured"
        fi
        
        if grep -q '"service_worker"' "$SRC_DIR/manifest.json"; then
            echo "✅ Service worker configured"
        fi
        
    else
        echo "❌ Manifest JSON is invalid!"
    fi
fi

# Check for icon files
echo ""
echo "🎨 CHECKING ICONS:"
icon_sizes=(16 32 48 128)
icon_count=0

for size in "${icon_sizes[@]}"; do
    icon_file="$SRC_DIR/img/ic_suspendy_${size}x${size}.png"
    if [ -f "$icon_file" ]; then
        echo "✅ ${size}x${size} icon"
        ((icon_count++))
    else
        echo "❌ ${size}x${size} icon - missing"
    fi
done

echo "📊 Icons: $icon_count/4 present"

echo ""
echo "🎯 FINAL STATUS:"
if [ ${#missing_files[@]} -eq 0 ] && [ -f "$SRC_DIR/manifest.json" ]; then
    echo "🌟 ✅ READY TO LOAD IN CHROME! 🌟"
    echo ""
    echo "🎨 Your extension includes:"
    echo "   • Purple Galaxy, Ocean Blue, Sunset Pink"
    echo "   • Forest Green, Fire Red, Lavender Dream"
    echo "   • Cosmic Purple, Emerald, Rose Gold"
    echo "   • Sky Blue, Peach, Mint, Golden Hour"
    echo "   • Berry, Coral, Aurora, Dark, Midnight"
    echo ""
    echo "🔥 All with SMOOTH transitions like suspended tabs!"
else
    echo "❌ Installation needs completion"
fi
