// Test script - remove after debugging
console.log('🧪 Testing export functionality...');

// Test if chrome.runtime is available
if (typeof chrome !== 'undefined' && chrome.runtime) {
    console.log('✅ Chrome runtime available');
    
    // Test message sending
    chrome.runtime.sendMessage({action: "exportTabs"}, function(response) {
        console.log('🧪 Test export response:', response);
        
        if (chrome.runtime.lastError) {
            console.error('🧪 Test runtime error:', chrome.runtime.lastError);
        }
        
        if (response && response.tabs) {
            console.log('✅ Background script responded correctly with', response.tabs.length, 'tabs');
        } else {
            console.error('❌ Background script response invalid:', response);
        }
    });
} else {
    console.error('❌ Chrome runtime not available');
}
