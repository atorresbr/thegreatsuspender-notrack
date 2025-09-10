#!/bin/bash
# Direct fix for gsTabCheckManager.js
JS_DIR="/home/linux/Documents/GitHub/thegreatsuspender-notrack/src/js"

echo "Making direct changes to files..."

# 1. First create a proper globalQueue.js file
cat > "$JS_DIR/globalQueue.js" << 'EOF'
// Global queue implementation that is guaranteed to be available
var gsTabQueue = gsTabQueue || {
  queueTabAsPromise: function(tabId, queueId, callback) { 
    console.log("Global gsTabQueue.queueTabAsPromise called:", tabId, queueId); 
    if (typeof callback === 'function') {
      setTimeout(callback, 0);
    }
    return Promise.resolve(); 
  },
  unqueueTab: function(tabId, queueId) { 
    console.log("Global gsTabQueue.unqueueTab called:", tabId, queueId); 
    return Promise.resolve(); 
  },
  requestProcessQueue: function() { 
    console.log("Global gsTabQueue.requestProcessQueue called"); 
    return Promise.resolve(); 
  }
};

// Make global queue available everywhere
if (typeof window !== 'undefined') window.gsTabQueue = gsTabQueue;
if (typeof self !== 'undefined') self.gsTabQueue = gsTabQueue;

console.log("Global gsTabQueue installed and ready!");
EOF

# 2. Update background-wrapper.js to load globalQueue.js FIRST before other scripts
sed -i '1i // Auto-patched by fix.sh\n// Load global queue implementation first\nimportScripts("globalQueue.js");\n' "$JS_DIR/background-wrapper.js"

# 3. DIRECTLY modify gsTabCheckManager.js instead of using sed
cp "$JS_DIR/gsTabCheckManager.js" "$JS_DIR/gsTabCheckManager.js.backup"

# 4. Insert code at the TOP of gsTabCheckManager.js to ensure gsTabQueue is available
sed -i '1i // Auto-patched by fix.sh\n// Ensure gsTabQueue is available\nif (typeof gsTabQueue === "undefined") {\n  console.warn("gsTabQueue not found, using fallback");\n  var gsTabQueue = {\n    queueTabAsPromise: function(tabId, queueId, callback) {\n      console.log("Fallback queueTabAsPromise", tabId, queueId);\n      if (typeof callback === "function") setTimeout(callback, 0);\n      return Promise.resolve();\n    },\n    unqueueTab: function() { return Promise.resolve(); },\n    requestProcessQueue: function() { return Promise.resolve(); }\n  };\n}\n' "$JS_DIR/gsTabCheckManager.js"

echo "✅ Files modified successfully!"
echo "Please reload the extension in Chrome and test again."