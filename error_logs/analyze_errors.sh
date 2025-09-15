#!/bin/bash

LOG_DIR="/home/linux/Documents/GitHub/thegreatsuspender-notrack/error_logs"
TIMESTAMP=$(date '+%Y%m%d_%H%M%S')

echo "🔍 ANALYZING ALL ERROR LOGS"
echo "==========================="

# Find the latest log files
LATEST_SYNTAX=$(ls -t "$LOG_DIR"/syntax_errors_*.log 2>/dev/null | head -1)
LATEST_SW=$(ls -t "$LOG_DIR"/service_worker_errors_*.log 2>/dev/null | head -1)
LATEST_STRUCTURE=$(ls -t "$LOG_DIR"/file_structure_*.log 2>/dev/null | head -1)
LATEST_CONSOLE=$(ls -t "$LOG_DIR"/console_errors_*.log 2>/dev/null | head -1)
LATEST_OPTIONS=$(ls -t "$LOG_DIR"/options_errors_*.log 2>/dev/null | head -1)

# Create analysis report
ANALYSIS_FILE="$LOG_DIR/error_analysis_$TIMESTAMP.txt"

cat > "$ANALYSIS_FILE" << 'ANALYSIS_EOF'
=== COMPREHENSIVE ERROR ANALYSIS REPORT ===
Generated: $(date)

=== FINDINGS SUMMARY ===

ANALYSIS_EOF

echo "📊 Analyzing syntax errors..."
if [ -f "$LATEST_SYNTAX" ]; then
    echo "1. SYNTAX ERRORS ANALYSIS:" >> "$ANALYSIS_FILE"
    echo "   Source: $LATEST_SYNTAX" >> "$ANALYSIS_FILE"
    echo "" >> "$ANALYSIS_FILE"
    
    # Check for specific patterns
    if grep -q "Unexpected identifier 'defaults'" "$LATEST_SYNTAX" 2>/dev/null; then
        echo "   ❌ FOUND: 'Unexpected identifier defaults' error" >> "$ANALYSIS_FILE"
    fi
    
    if grep -q "Missing catch or finally" "$LATEST_SYNTAX" 2>/dev/null; then
        echo "   ❌ FOUND: Missing catch/finally error" >> "$ANALYSIS_FILE"
    fi
    
    if grep -q "Unexpected token ')'" "$LATEST_SYNTAX" 2>/dev/null; then
        echo "   ❌ FOUND: Unexpected token ')' error" >> "$ANALYSIS_FILE"
    fi
    
    echo "   📄 Line 24 content:" >> "$ANALYSIS_FILE"
    grep -A 1 "Line 24:" "$LATEST_SYNTAX" >> "$ANALYSIS_FILE" 2>/dev/null
    echo "" >> "$ANALYSIS_FILE"
fi

echo "📊 Analyzing service worker errors..."
if [ -f "$LATEST_SW" ]; then
    echo "2. SERVICE WORKER ERRORS ANALYSIS:" >> "$ANALYSIS_FILE"
    echo "   Source: $LATEST_SW" >> "$ANALYSIS_FILE"
    echo "" >> "$ANALYSIS_FILE"
    
    if grep -q "Service worker file NOT FOUND" "$LATEST_SW" 2>/dev/null; then
        echo "   ❌ FOUND: Service worker file path mismatch" >> "$ANALYSIS_FILE"
    fi
    
    if grep -q "Service worker file exists" "$LATEST_SW" 2>/dev/null; then
        echo "   ✅ FOUND: Service worker file exists at correct path" >> "$ANALYSIS_FILE"
    fi
    echo "" >> "$ANALYSIS_FILE"
fi

echo "📊 Analyzing file structure..."
if [ -f "$LATEST_STRUCTURE" ]; then
    echo "3. FILE STRUCTURE ANALYSIS:" >> "$ANALYSIS_FILE"
    echo "   Source: $LATEST_STRUCTURE" >> "$ANALYSIS_FILE"
    echo "" >> "$ANALYSIS_FILE"
    
    # Count files
    JS_COUNT=$(grep -c "\.js$" "$LATEST_STRUCTURE" 2>/dev/null || echo "0")
    HTML_COUNT=$(grep -c "\.html$" "$LATEST_STRUCTURE" 2>/dev/null || echo "0")
    
    echo "   📊 Found $JS_COUNT JavaScript files" >> "$ANALYSIS_FILE"
    echo "   📊 Found $HTML_COUNT HTML files" >> "$ANALYSIS_FILE"
    echo "" >> "$ANALYSIS_FILE"
fi

echo "📊 Checking for console errors..."
if [ -f "$LATEST_CONSOLE" ] && [ -s "$LATEST_CONSOLE" ]; then
    echo "4. CONSOLE ERRORS ANALYSIS:" >> "$ANALYSIS_FILE"
    echo "   Source: $LATEST_CONSOLE" >> "$ANALYSIS_FILE"
    echo "   📊 Console errors file exists and has content" >> "$ANALYSIS_FILE"
    echo "" >> "$ANALYSIS_FILE"
else
    echo "4. CONSOLE ERRORS ANALYSIS:" >> "$ANALYSIS_FILE"
    echo "   ⚠️  Console errors file is empty - please paste browser console errors" >> "$ANALYSIS_FILE"
    echo "" >> "$ANALYSIS_FILE"
fi

echo "=== RECOMMENDED ACTIONS ===" >> "$ANALYSIS_FILE"
echo "" >> "$ANALYSIS_FILE"
echo "Based on the analysis above, create targeted fix scripts for:" >> "$ANALYSIS_FILE"
echo "1. Syntax errors in background-wrapper.js" >> "$ANALYSIS_FILE"
echo "2. Service worker registration issues" >> "$ANALYSIS_FILE"
echo "3. Any file path inconsistencies" >> "$ANALYSIS_FILE"
echo "4. Console-specific errors (once provided)" >> "$ANALYSIS_FILE"

echo ""
echo "✅ Analysis complete!"
echo "📄 Report saved to: $ANALYSIS_FILE"
echo ""
echo "📋 To view the analysis:"
echo "   cat $ANALYSIS_FILE"
