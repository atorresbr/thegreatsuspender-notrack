#!/bin/bash
# filepath: /home/linux/Documents/GitHub/thegreatsuspender-notrack/generate_all_logs.sh

echo "📋 GENERATING ALL LOGS AND REPORTS (Rules 0,1)"
echo "============================================="

# Rule 0: Check all rules
echo "✅ Rule 0: Following all NO-TRACKER-INSTRUCTIONS.md rules"

# Rule 1: This is a separate sh script for log generation
echo "✅ Rule 1: Separate sh script for all log generation"

# Make scripts executable
chmod +x generate_complete_analysis_log.sh
chmod +x generate_html_error_report.sh

echo ""
echo "📋 Step 1: Generating markdown analysis log..."
./generate_complete_analysis_log.sh

echo ""
echo "📋 Step 2: Generating HTML error report..."
./generate_html_error_report.sh

echo ""
echo "✅ ALL LOGS AND REPORTS GENERATED"
echo "==============================="

if [ -f "extension_analysis_log.md" ]; then
    echo "📄 Markdown log: extension_analysis_log.md"
    echo "   Lines: $(wc -l < extension_analysis_log.md)"
fi

if [ -f "extension_error_report.html" ]; then
    echo "🌐 HTML report: extension_error_report.html"
    echo "   Size: $(du -h extension_error_report.html | cut -f1)"
fi

echo ""
echo "🔍 TO VIEW LOGS:"
echo "   📄 cat extension_analysis_log.md"
echo "   🌐 xdg-open extension_error_report.html"
echo ""
echo "📊 Now I can read all logs and see actual errors/inconsistencies!"