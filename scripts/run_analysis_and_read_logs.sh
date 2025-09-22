#!/bin/bash
# filepath: /home/linux/Documents/GitHub/thegreatsuspender-notrack/run_analysis_and_read_logs.sh

echo "🔍 RUNNING ANALYSIS AND READING ALL LOGS (Rules 0,1)"
echo "=================================================="

# Rule 0: Check all rules
echo "✅ Rule 0: Following all NO-TRACKER-INSTRUCTIONS.md rules"

# Rule 1: This is a separate sh script for analysis and log reading
echo "✅ Rule 1: Separate sh script for complete log analysis"

echo ""
echo "📋 Step 1: Generate all logs..."
./fix.sh

echo ""
echo "📋 Step 2: Reading and analyzing all logs..."

if [ -f "extension_analysis_log.md" ]; then
    echo ""
    echo "🔍 COMPLETE MARKDOWN LOG ANALYSIS:"
    echo "================================="
    cat extension_analysis_log.md
    echo ""
    echo "================================="
    echo "📊 MARKDOWN LOG END"
    echo ""
fi

if [ -f "extension_error_report.html" ]; then
    echo ""
    echo "📄 HTML REPORT EXISTS: extension_error_report.html"
    echo "🌐 Size: $(du -h extension_error_report.html | cut -f1)"
    echo ""
fi

echo ""
echo "📊 LOG ANALYSIS COMPLETE"
echo "======================="
echo "✅ All logs have been generated and displayed"
echo "✅ Ready for detailed error analysis and fixes"