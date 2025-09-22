#!/bin/bash
set -euo pipefail

ROOT="/home/linux/Documents/GitHub/thegreatsuspender-notrack"
SRC="$ROOT/src"
JS_DIR="$SRC/js"
OPTIONS_JS="$JS_DIR/options.js"
OPTIONS_HTML="$SRC/options.html"
POPUP_JS="$JS_DIR/popup.js"
SUSPENDED_JS="$JS_DIR/suspended.js"

function fail() {
    echo "ERROR: $1" >&2
    exit 1
}

function check_files() {
    echo "Checking required files under: $ROOT"
    [ -f "$OPTIONS_JS" ] || fail "Missing file: $OPTIONS_JS"
    [ -f "$OPTIONS_HTML" ] || fail "Missing file: $OPTIONS_HTML"
    echo " - Found: $OPTIONS_JS"
    echo " - Found: $OPTIONS_HTML"
    if [ -f "$POPUP_JS" ]; then echo " - Found optional: $POPUP_JS"; else echo " - Optional file missing: $POPUP_JS"; fi
    if [ -f "$SUSPENDED_JS" ]; then echo " - Found optional: $SUSPENDED_JS"; else echo " - Optional file missing: $SUSPENDED_JS"; fi
}

function check_ids() {
    echo ""
    echo "Validating getElementById(...) references in $OPTIONS_JS exist in $OPTIONS_HTML"
    IDS=$(grep -oP "getElementById\s*\(\s*['\"]\K[^'\"]+(?=['\"]\s*\))" "$OPTIONS_JS" | sort -u || true)
    if [ -z "$IDS" ]; then
        echo " - No getElementById() references found."
        return 0
    fi
    local missing=0
    echo "$IDS" | while IFS= read -r id; do
        if ! grep -qE "id\s*=\s*['\"]${id}['\"]" "$OPTIONS_HTML"; then
            echo "   MISSING id in HTML: \"$id\""
            missing=1
        else
            echo "   OK id present: \"$id\""
        fi
    done
    if [ "${missing:-0}" -ne 0 ]; then
        fail "One or more element IDs referenced by options.js are missing in options.html"
    fi
}

function check_datatheme() {
    echo ""
    echo "Checking data-theme usage consistency"
    if grep -q "data-theme" "$OPTIONS_JS"; then
        if grep -q "data-theme" "$OPTIONS_HTML"; then
            echo " - data-theme referenced in JS and present in HTML (OK)"
        else
            fail "options.js references data-theme but options.html contains no data-theme attributes"
        fi
    else
        echo " - options.js does not reference data-theme (no check needed)"
    fi
}

function check_storage_namespace() {
    echo ""
    echo "Checking chrome.storage usage in relevant JS files"
    echo " - options.js namespaces:"
    grep -nE "chrome\.storage\.(sync|local)" "$OPTIONS_JS" || echo "   (none found)"
    echo " - popup.js namespaces (if present):"
    [ -f "$POPUP_JS" ] && (grep -nE "chrome\.storage\.(sync|local)" "$POPUP_JS" || echo "   (none found or file empty)")
    echo " - suspended.js namespaces (if present):"
    [ -f "$SUSPENDED_JS" ] && (grep -nE "chrome\.storage\.(sync|local)" "$SUSPENDED_JS" || echo "   (none found or file empty)")
    echo ""
    echo "Recommendation: ensure all pages read the same storage namespace/key (e.g., chrome.storage.sync 'theme' or chrome.storage.local 'selectedTheme')."
}

function list_themes_and_keys() {
    echo ""
    echo "Listing data-theme values in options.html:"
    grep -oP 'data-theme\s*=\s*"(.*?)"' "$OPTIONS_HTML" 2>/dev/null | sed 's/data-theme=//' | tr -d '"' | sort -u | sed -e 's/^/   - /' || echo "   (none found)"

    if [ -f "$SUSPENDED_JS" ]; then
        echo ""
        echo "Attempting to find theme keys in suspended.js (themeGradients or similar):"
        grep -nE "themeGradients|themeList|themes" "$SUSPENDED_JS" || echo "   (no obvious theme object found)"
    fi
}

function main() {
    check_files
    check_ids
    check_datatheme
    check_storage_namespace
    list_themes_and_keys
    echo ""
    echo "Precheck finished: if no errors above, run the annotate script to insert comments safely."
}

main