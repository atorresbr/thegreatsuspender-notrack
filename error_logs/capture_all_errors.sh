#!/bin/bash

LOG_DIR="/home/linux/Documents/GitHub/thegreatsuspender-notrack/error_logs"
TIMESTAMP=$(date '+%Y%m%d_%H%M%S')

echo "🔍 COMPREHENSIVE ERROR CAPTURE - $TIMESTAMP"
echo "============================================"

# 1. SYNTAX ERRORS LOG
echo "📝 Capturing JavaScript syntax errors..."
cat > "$LOG_DIR/syntax_errors_$TIMESTAMP.log" << 'SYNTAX_EOF'
=== JAVASCRIPT SYNTAX ERRORS ANALYSIS ===
Date: $(date)

=== BACKGROUND-WRAPPER.JS ANALYSIS ===
SYNTAX_EOF

# Find and analyze background-wrapper.js
BG_FILE=$(find /home/linux/Documents/GitHub/thegreatsuspender-notrack -name "background-wrapper.js" -type f | head -1)
if [ -f "$BG_FILE" ]; then
    echo "File location: $BG_FILE" >> "$LOG_DIR/syntax_errors_$TIMESTAMP.log"
    echo "" >> "$LOG_DIR/syntax_errors_$TIMESTAMP.log"
    echo "=== LINES 1-50 (where errors occur) ===" >> "$LOG_DIR/syntax_errors_$TIMESTAMP.log"
    head -50 "$BG_FILE" | nl >> "$LOG_DIR/syntax_errors_$TIMESTAMP.log"
    echo "" >> "$LOG_DIR/syntax_errors_$TIMESTAMP.log"
    echo "=== SPECIFIC ERROR LINES ===" >> "$LOG_DIR/syntax_errors_$TIMESTAMP.log"
    echo "Line 24:" >> "$LOG_DIR/syntax_errors_$TIMESTAMP.log"
    sed -n '24p' "$BG_FILE" >> "$LOG_DIR/syntax_errors_$TIMESTAMP.log"
    echo "Line 26:" >> "$LOG_DIR/syntax_errors_$TIMESTAMP.log"
    sed -n '26p' "$BG_FILE" >> "$LOG_DIR/syntax_errors_$TIMESTAMP.log"
    echo "Line 27:" >> "$LOG_DIR/syntax_errors_$TIMESTAMP.log"
    sed -n '27p' "$BG_FILE" >> "$LOG_DIR/syntax_errors_$TIMESTAMP.log"
    echo "" >> "$LOG_DIR/syntax_errors_$TIMESTAMP.log"
    echo "=== BRACE/PARENTHESIS ANALYSIS ===" >> "$LOG_DIR/syntax_errors_$TIMESTAMP.log"
    grep -n -E '[\{\}\(\)]' "$BG_FILE" | head -30 >> "$LOG_DIR/syntax_errors_$TIMESTAMP.log"
else
    echo "ERROR: background-wrapper.js not found!" >> "$LOG_DIR/syntax_errors_$TIMESTAMP.log"
fi

# 2. SERVICE WORKER ERRORS LOG
echo "📝 Capturing service worker registration errors..."
cat > "$LOG_DIR/service_worker_errors_$TIMESTAMP.log" << 'SW_EOF'
=== SERVICE WORKER REGISTRATION ERRORS ===
Date: $(date)

=== MANIFEST.JSON ANALYSIS ===
SW_EOF

MANIFEST_FILE=$(find /home/linux/Documents/GitHub/thegreatsuspender-notrack -name "manifest.json" -type f | head -1)
if [ -f "$MANIFEST_FILE" ]; then
    echo "Manifest location: $MANIFEST_FILE" >> "$LOG_DIR/service_worker_errors_$TIMESTAMP.log"
    echo "" >> "$LOG_DIR/service_worker_errors_$TIMESTAMP.log"
    echo "=== FULL MANIFEST CONTENT ===" >> "$LOG_DIR/service_worker_errors_$TIMESTAMP.log"
    cat "$MANIFEST_FILE" >> "$LOG_DIR/service_worker_errors_$TIMESTAMP.log"
    echo "" >> "$LOG_DIR/service_worker_errors_$TIMESTAMP.log"
    echo "=== BACKGROUND SECTION ===" >> "$LOG_DIR/service_worker_errors_$TIMESTAMP.log"
    grep -A 5 -B 2 "background" "$MANIFEST_FILE" >> "$LOG_DIR/service_worker_errors_$TIMESTAMP.log"
    echo "" >> "$LOG_DIR/service_worker_errors_$TIMESTAMP.log"
    
    # Check if service worker path exists
    SW_PATH=$(grep -o '"service_worker": "[^"]*"' "$MANIFEST_FILE" | sed 's/"service_worker": "//; s/"//')
    MANIFEST_DIR=$(dirname "$MANIFEST_FILE")
    FULL_SW_PATH="$MANIFEST_DIR/$SW_PATH"
    echo "Expected service worker path: $FULL_SW_PATH" >> "$LOG_DIR/service_worker_errors_$TIMESTAMP.log"
    if [ -f "$FULL_SW_PATH" ]; then
        echo "✅ Service worker file exists" >> "$LOG_DIR/service_worker_errors_$TIMESTAMP.log"
    else
        echo "❌ Service worker file NOT FOUND" >> "$LOG_DIR/service_worker_errors_$TIMESTAMP.log"
    fi
else
    echo "ERROR: manifest.json not found!" >> "$LOG_DIR/service_worker_errors_$TIMESTAMP.log"
fi

# 3. FILE STRUCTURE LOG
echo "📝 Capturing complete file structure..."
cat > "$LOG_DIR/file_structure_$TIMESTAMP.log" << 'STRUCT_EOF'
=== COMPLETE FILE STRUCTURE ANALYSIS ===
Date: $(date)

=== REPOSITORY STRUCTURE ===
STRUCT_EOF

find /home/linux/Documents/GitHub/thegreatsuspender-notrack -type f \( -name "*.js" -o -name "*.html" -o -name "*.json" -o -name "*.css" \) >> "$LOG_DIR/file_structure_$TIMESTAMP.log"

echo "" >> "$LOG_DIR/file_structure_$TIMESTAMP.log"
echo "=== SRC DIRECTORY CONTENTS ===" >> "$LOG_DIR/file_structure_$TIMESTAMP.log"
if [ -d "/home/linux/Documents/GitHub/thegreatsuspender-notrack/src" ]; then
    ls -la "/home/linux/Documents/GitHub/thegreatsuspender-notrack/src" >> "$LOG_DIR/file_structure_$TIMESTAMP.log"
    echo "" >> "$LOG_DIR/file_structure_$TIMESTAMP.log"
    echo "=== JS FILES IN SRC ===" >> "$LOG_DIR/file_structure_$TIMESTAMP.log"
    find "/home/linux/Documents/GitHub/thegreatsuspender-notrack/src" -name "*.js" -type f >> "$LOG_DIR/file_structure_$TIMESTAMP.log"
else
    echo "ERROR: src directory not found!" >> "$LOG_DIR/file_structure_$TIMESTAMP.log"
fi

# 4. CONSOLE ERRORS LOG (simulated)
echo "📝 Creating console errors template..."
cat > "$LOG_DIR/console_errors_$TIMESTAMP.log" << 'CONSOLE_EOF'
=== CONSOLE ERRORS (paste from browser) ===
Date: $(date)

INSTRUCTIONS: 
1. Open browser console (F12)
2. Go to extension's options page or popup
3. Copy ALL error messages and paste them here
4. Save this file after pasting

=== PASTE CONSOLE ERRORS BELOW ===

CONSOLE_EOF

# 5. OPTIONS/POPUP ERRORS LOG
echo "📝 Analyzing options.html and options.js..."
cat > "$LOG_DIR/options_errors_$TIMESTAMP.log" << 'OPTIONS_EOF'
=== OPTIONS PAGE ERRORS ANALYSIS ===
Date: $(date)

=== OPTIONS.HTML ANALYSIS ===
OPTIONS_EOF

OPTIONS_HTML=$(find /home/linux/Documents/GitHub/thegreatsuspender-notrack -name "options.html" -type f | head -1)
if [ -f "$OPTIONS_HTML" ]; then
    echo "Options HTML location: $OPTIONS_HTML" >> "$LOG_DIR/options_errors_$TIMESTAMP.log"
    echo "" >> "$LOG_DIR/options_errors_$TIMESTAMP.log"
    echo "=== INLINE EVENT HANDLERS (CSP violations) ===" >> "$LOG_DIR/options_errors_$TIMESTAMP.log"
    grep -n -E 'on[a-z]*=' "$OPTIONS_HTML" >> "$LOG_DIR/options_errors_$TIMESTAMP.log"
    echo "" >> "$LOG_DIR/options_errors_$TIMESTAMP.log"
    echo "=== SCRIPT TAGS ===" >> "$LOG_DIR/options_errors_$TIMESTAMP.log"
    grep -n -A 2 -B 2 "<script" "$OPTIONS_HTML" >> "$LOG_DIR/options_errors_$TIMESTAMP.log"
else
    echo "ERROR: options.html not found!" >> "$LOG_DIR/options_errors_$TIMESTAMP.log"
fi

OPTIONS_JS=$(find /home/linux/Documents/GitHub/thegreatsuspender-notrack -name "options.js" -type f | head -1)
if [ -f "$OPTIONS_JS" ]; then
    echo "" >> "$LOG_DIR/options_errors_$TIMESTAMP.log"
    echo "=== OPTIONS.JS ANALYSIS ===" >> "$LOG_DIR/options_errors_$TIMESTAMP.log"
    echo "Options JS location: $OPTIONS_JS" >> "$LOG_DIR/options_errors_$TIMESTAMP.log"
    echo "" >> "$LOG_DIR/options_errors_$TIMESTAMP.log"
    echo "=== FIRST 50 LINES ===" >> "$LOG_DIR/options_errors_$TIMESTAMP.log"
    head -50 "$OPTIONS_JS" | nl >> "$LOG_DIR/options_errors_$TIMESTAMP.log"
else
    echo "ERROR: options.js not found!" >> "$LOG_DIR/options_errors_$TIMESTAMP.log"
fi

echo ""
echo "✅ Error capture complete! Generated logs:"
echo "   📄 $LOG_DIR/syntax_errors_$TIMESTAMP.log"
echo "   📄 $LOG_DIR/service_worker_errors_$TIMESTAMP.log" 
echo "   📄 $LOG_DIR/file_structure_$TIMESTAMP.log"
echo "   📄 $LOG_DIR/console_errors_$TIMESTAMP.log (template)"
echo "   📄 $LOG_DIR/options_errors_$TIMESTAMP.log"
echo ""
echo "📋 Next steps:"
echo "   1. Review all generated log files"
echo "   2. Paste browser console errors into console_errors_*.log"
echo "   3. Share log files for analysis"
