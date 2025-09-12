/**
 * EXTENSION TESTING SUITE
 * Run this in browser console to test all functionality
 */

console.log('🧪 Starting extension test suite...');

async function testExtensionFunctionality() {
    const tests = [];
    
    // Test 1: Check if extension is loaded
    tests.push({
        name: 'Extension Loading',
        test: async () => {
            return new Promise((resolve) => {
                chrome.runtime.sendMessage({ action: 'getCurrentSessionId' }, (response) => {
                    resolve(response && response.success);
                });
            });
        }
    });
    
    // Test 2: Test theme system
    tests.push({
        name: 'Theme System',
        test: async () => {
            return new Promise((resolve) => {
                chrome.storage.local.set({ selectedTheme: 'ocean' }, () => {
                    chrome.storage.local.get(['selectedTheme'], (result) => {
                        resolve(result.selectedTheme === 'ocean');
                    });
                });
            });
        }
    });
    
    // Test 3: Test session creation
    tests.push({
        name: 'Session Management',
        test: async () => {
            return new Promise((resolve) => {
                chrome.runtime.sendMessage({ action: 'createNewSession' }, (response) => {
                    resolve(response && response.success && response.sessionId);
                });
            });
        }
    });
    
    // Test 4: Test backup functionality
    tests.push({
        name: 'Backup System',
        test: async () => {
            return new Promise((resolve) => {
                chrome.runtime.sendMessage({ 
                    action: 'backupAllTabs', 
                    backupName: 'Test Backup' 
                }, (response) => {
                    resolve(response && response.success);
                });
            });
        }
    });
    
    // Test 5: Test suspended tabs count
    tests.push({
        name: 'Statistics System',
        test: async () => {
            return new Promise((resolve) => {
                chrome.runtime.sendMessage({ action: 'getSuspendedCount' }, (response) => {
                    resolve(response && response.success && typeof response.count === 'number');
                });
            });
        }
    });
    
    // Run all tests
    let passed = 0;
    let failed = 0;
    
    console.log('🧪 Running ' + tests.length + ' tests...');
    
    for (const test of tests) {
        try {
            const result = await test.test();
            if (result) {
                console.log('✅ ' + test.name + ': PASSED');
                passed++;
            } else {
                console.log('❌ ' + test.name + ': FAILED');
                failed++;
            }
        } catch (error) {
            console.log('❌ ' + test.name + ': ERROR -', error.message);
            failed++;
        }
    }
    
    console.log('\n🎯 TEST RESULTS:');
    console.log('✅ Passed:', passed);
    console.log('❌ Failed:', failed);
    console.log('📊 Success Rate:', Math.round((passed / tests.length) * 100) + '%');
    
    if (failed === 0) {
        console.log('🎉 ALL TESTS PASSED! Extension is working perfectly! 🌟');
    } else {
        console.log('⚠️ Some tests failed. Check console for details.');
    }
}

// Run tests
testExtensionFunctionality();
