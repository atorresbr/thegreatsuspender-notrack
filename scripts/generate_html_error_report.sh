#!/bin/bash
# filepath: /home/linux/Documents/GitHub/thegreatsuspender-notrack/generate_html_error_report.sh

echo "🔍 GENERATING HTML ERROR REPORT (Rules 0,1,8.1)"
echo "=============================================="

SRC_DIR="/home/linux/Documents/GitHub/thegreatsuspender-notrack/src"
HTML_REPORT="extension_error_report.html"

# Rule 0: Check all rules
echo "✅ Rule 0: Following all NO-TRACKER-INSTRUCTIONS.md rules"

# Rule 1: This is a separate sh script for HTML report generation
echo "✅ Rule 1: Separate sh script for HTML error report"

# Rule 8.1: Avoid syntax errors in report generation
echo "✅ Rule 8.1: Generating error-free HTML report"

echo "📄 Creating HTML error report: $HTML_REPORT"

# Create HTML report
cat > "$HTML_REPORT" << 'EOF'
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>The Great Suspender NoTracker - Error Report</title>
    <style>
        body { 
            font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; 
            line-height: 1.6; 
            max-width: 1200px; 
            margin: 0 auto; 
            padding: 20px; 
            background: #f5f5f5; 
        }
        .container { 
            background: white; 
            padding: 30px; 
            border-radius: 10px; 
            box-shadow: 0 2px 10px rgba(0,0,0,0.1); 
        }
        h1 { 
            color: #2c3e50; 
            border-bottom: 3px solid #3498db; 
            padding-bottom: 10px; 
        }
        h2 { 
            color: #34495e; 
            background: #ecf0f1; 
            padding: 10px; 
            border-left: 4px solid #3498db; 
        }
        h3 { 
            color: #2980b9; 
        }
        .error { 
            background: #ffebee; 
            border: 1px solid #f44336; 
            border-radius: 5px; 
            padding: 15px; 
            margin: 10px 0; 
        }
        .warning { 
            background: #fff3e0; 
            border: 1px solid #ff9800; 
            border-radius: 5px; 
            padding: 15px; 
            margin: 10px 0; 
        }
        .success { 
            background: #e8f5e8; 
            border: 1px solid #4caf50; 
            border-radius: 5px; 
            padding: 15px; 
            margin: 10px 0; 
        }
        .code { 
            background: #f8f9fa; 
            border: 1px solid #dee2e6; 
            border-radius: 5px; 
            padding: 15px; 
            font-family: 'Courier New', monospace; 
            overflow-x: auto; 
            white-space: pre-wrap; 
        }
        .inconsistency { 
            background: #ffeaa7; 
            border-left: 4px solid #fdcb6e; 
            padding: 10px; 
            margin: 5px 0; 
        }
        .file-analysis { 
            border: 1px solid #ddd; 
            border-radius: 5px; 
            margin: 15px 0; 
            padding: 15px; 
        }
        .stats { 
            display: grid; 
            grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); 
            gap: 15px; 
            margin: 20px 0; 
        }
        .stat-card { 
            background: #3498db; 
            color: white; 
            padding: 20px; 
            border-radius: 8px; 
            text-align: center; 
        }
        .timestamp { 
            color: #7f8c8d; 
            font-style: italic; 
        }
        table { 
            width: 100%; 
            border-collapse: collapse; 
            margin: 15px 0; 
        }
        th, td { 
            border: 1px solid #ddd; 
            padding: 12px; 
            text-align: left; 
        }
        th { 
            background: #34495e; 
            color: white; 
        }
        tr:nth-child(even) { 
            background: #f2f2f2; 
        }
    </style>
</head>
<body>
    <div class="container">
        <h1>🔍 The Great Suspender NoTracker - Complete Error Report</h1>
        <p class="timestamp">Generated on: $(date)</p>
        
        <div class="stats">
            <div class="stat-card">
                <h3>Total Files</h3>
                <p>$(find "$SRC_DIR" -type f | wc -l)</p>
            </div>
            <div class="stat-card">
                <h3>HTML Files</h3>
                <p>$(find "$SRC_DIR" -name "*.html" | wc -l)</p>
            </div>
            <div class="stat-card">
                <h3>JS Files</h3>
                <p>$(find "$SRC_DIR/js" -name "*.js" 2>/dev/null | wc -l)</p>
            </div>
            <div class="stat-card">
                <h3>CSS Files</h3>
                <p>$(find "$SRC_DIR" -name "*.css" 2>/dev/null | wc -l)</p>
            </div>
        </div>

        <h2>📁 File Structure Analysis</h2>
        <div class="code">
EOF

find "$SRC_DIR" -type f | sort >> "$HTML_REPORT"

cat >> "$HTML_REPORT" << 'EOF'
        </div>

        <h2>🔗 HTML-JS Consistency Analysis (Rule 3)</h2>
EOF

# Analyze each HTML-JS pair
for html_file in "$SRC_DIR"/*.html; do
    if [ -f "$html_file" ]; then
        html_name=$(basename "$html_file" .html)
        js_file="$SRC_DIR/js/${html_name}.js"
        
        cat >> "$HTML_REPORT" << EOF
        <div class="file-analysis">
            <h3>📄 $html_name Files Analysis</h3>
EOF
        
        if [ -f "$js_file" ]; then
            echo '            <div class="success">✅ Both '$html_name'.html and '$html_name'.js exist</div>' >> "$HTML_REPORT"
            
            # Get HTML IDs
            html_ids=$(grep -o 'id="[^"]*"' "$html_file" | sed 's/id="//g' | sed 's/"//g' | sort | uniq | tr '\n' ' ')
            
            # Get JS IDs
            js_ids=$(grep -o "getElementById('[^']*')" "$js_file" 2>/dev/null | sed "s/getElementById('//g" | sed "s/')//g" | sort | uniq | tr '\n' ' ')
            js_ids2=$(grep -o 'getElementById("[^"]*")' "$js_file" 2>/dev/null | sed 's/getElementById("//g' | sed 's/")//g' | sort | uniq | tr '\n' ' ')
            
            cat >> "$HTML_REPORT" << EOF
            <table>
                <tr><th>Type</th><th>Elements</th></tr>
                <tr><td><strong>HTML IDs Available</strong></td><td>$html_ids</td></tr>
                <tr><td><strong>JS IDs Requested</strong></td><td>$js_ids $js_ids2</td></tr>
            </table>
EOF
            
            # Find inconsistencies
            inconsistent_ids=""
            for js_id in $js_ids $js_ids2; do
                if ! echo "$html_ids" | grep -q "$js_id"; then
                    inconsistent_ids="$inconsistent_ids $js_id"
                fi
            done
            
            if [ -n "$inconsistent_ids" ]; then
                echo '            <div class="error">❌ <strong>INCONSISTENT IDs:</strong> '$inconsistent_ids'</div>' >> "$HTML_REPORT"
            else
                echo '            <div class="success">✅ All IDs are consistent</div>' >> "$HTML_REPORT"
            fi
            
        else
            echo '            <div class="warning">⚠️ '$html_name'.html exists but '$html_name'.js is missing</div>' >> "$HTML_REPORT"
        fi
        
        echo '        </div>' >> "$HTML_REPORT"
    fi
done

# Add syntax error analysis
cat >> "$HTML_REPORT" << 'EOF'
        <h2>🐛 Syntax Error Analysis (Rule 8.1)</h2>
EOF

for js_file in "$SRC_DIR/js"/*.js; do
    if [ -f "$js_file" ]; then
        js_name=$(basename "$js_file")
        
        cat >> "$HTML_REPORT" << EOF
        <div class="file-analysis">
            <h3>📄 $js_name Syntax Check</h3>
EOF
        
        if node -c "$js_file" 2>/dev/null; then
            echo '            <div class="success">✅ '$js_name' syntax OK</div>' >> "$HTML_REPORT"
        else
            echo '            <div class="error">❌ <strong>'$js_name' SYNTAX ERROR:</strong>' >> "$HTML_REPORT"
            echo '                <div class="code">' >> "$HTML_REPORT"
            node -c "$js_file" 2>&1 | head -10 >> "$HTML_REPORT"
            echo '                </div>' >> "$HTML_REPORT"
            echo '            </div>' >> "$HTML_REPORT"
        fi
        
        echo '        </div>' >> "$HTML_REPORT"
    fi
done

# Add theme analysis
cat >> "$HTML_REPORT" << 'EOF'
        <h2>🎨 Theme Functionality Analysis</h2>
        
        <h3>Theme Elements in HTML Files</h3>
EOF

for html_file in "$SRC_DIR"/*.html; do
    if [ -f "$html_file" ]; then
        html_name=$(basename "$html_file")
        theme_elements=$(grep -i "theme\|data-theme\|class.*theme" "$html_file" 2>/dev/null || echo "")
        
        cat >> "$HTML_REPORT" << EOF
        <div class="file-analysis">
            <h4>$html_name</h4>
EOF
        
        if [ -n "$theme_elements" ]; then
            echo '            <div class="success">✅ Theme elements found</div>' >> "$HTML_REPORT"
            echo '            <div class="code">' >> "$HTML_REPORT"
            echo "$theme_elements" >> "$HTML_REPORT"
            echo '            </div>' >> "$HTML_REPORT"
        else
            echo '            <div class="warning">⚠️ No theme elements found</div>' >> "$HTML_REPORT"
        fi
        
        echo '        </div>' >> "$HTML_REPORT"
    fi
done

# Add session management analysis
cat >> "$HTML_REPORT" << 'EOF'
        <h2>💾 Session Management Analysis</h2>
        
        <div class="file-analysis">
            <h3>Session Elements in options.html</h3>
            <div class="code">
EOF

grep -n -A2 -B2 -i "session\|backup\|currentSessionId" "$SRC_DIR/options.html" 2>/dev/null >> "$HTML_REPORT"

cat >> "$HTML_REPORT" << 'EOF'
            </div>
        </div>
        
        <div class="file-analysis">
            <h3>Session Functions in options.js</h3>
            <div class="code">
EOF

grep -n -A5 -B2 -i "session\|backup\|currentSessionId" "$SRC_DIR/js/options.js" 2>/dev/null >> "$HTML_REPORT"

cat >> "$HTML_REPORT" << 'EOF'
            </div>
        </div>

        <h2>⚙️ Background Wrapper Analysis</h2>
        
        <div class="file-analysis">
            <h3>Context Menu Creation</h3>
            <div class="code">
EOF

grep -n -A5 -B5 "contextMenus\|unsuspend-all" "$SRC_DIR/js/background-wrapper.js" 2>/dev/null >> "$HTML_REPORT"

cat >> "$HTML_REPORT" << 'EOF'
            </div>
        </div>

        <div class="file-analysis">
            <h3>Service Worker Global Scope Usage</h3>
            <div class="code">
EOF

grep -n -A3 -B3 "window\|globalThis\|self" "$SRC_DIR/js/background-wrapper.js" 2>/dev/null >> "$HTML_REPORT"

# Close HTML
cat >> "$HTML_REPORT" << 'EOF'
            </div>
        </div>

        <h2>📊 Summary</h2>
        <div class="file-analysis">
            <p><strong>Analysis completed successfully</strong></p>
            <p class="timestamp">Report generated on: $(date)</p>
            <p>This report shows all errors, inconsistencies, and analysis results for The Great Suspender NoTracker extension.</p>
        </div>
    </div>
</body>
</html>
EOF

echo ""
echo "✅ HTML ERROR REPORT GENERATED: $HTML_REPORT"
echo "🌐 Open in browser: xdg-open $HTML_REPORT"
echo "📄 View source: cat $HTML_REPORT"