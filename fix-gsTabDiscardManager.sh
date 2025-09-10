#!/bin/bash
# Direct fix for gsTabDiscardManager.js - no patching, just direct replacement
JS_DIR="/home/linux/Documents/GitHub/thegreatsuspender-notrack/src/js"

# Create a backup
cp "$JS_DIR/gsTabDiscardManager.js" "$JS_DIR/gsTabDiscardManager.js.bak"

# Find the specific line with the error and replace it
sed -i 's/unqueueTabForDiscard: function(tabId) {/unqueueTabForDiscard: function(tabId) {\n    if (!gsTabQueue || typeof gsTabQueue.unqueueTab !== "function") {\n      console.warn("gsTabQueue not available");\n      return Promise.resolve();\n    }/' "$JS_DIR/gsTabDiscardManager.js"

echo "Fixed gsTabDiscardManager.js - reload extension"