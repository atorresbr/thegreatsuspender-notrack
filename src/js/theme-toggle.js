// Dark & Light Theme Toggle
(function() {
    'use strict';
    
    let currentTheme = 'light';
    
    function init() {
        console.log('🌓 Theme toggle initializing...');
        
        // Load saved theme
        loadTheme();
        
        // Create toggle button
        createToggleButton();
        
        // Apply theme
        applyTheme(currentTheme);
    }
    
    function createToggleButton() {
        const toggle = document.createElement('button');
        toggle.className = 'theme-toggle';
        toggle.innerHTML = currentTheme === 'light' ? '🌙 Dark' : '☀️ Light';
        toggle.onclick = toggleTheme;
        document.body.appendChild(toggle);
    }
    
    function toggleTheme() {
        currentTheme = currentTheme === 'light' ? 'dark' : 'light';
        applyTheme(currentTheme);
        saveTheme();
        updateButton();
    }
    
    function applyTheme(theme) {
        if (theme === 'dark') {
            document.body.setAttribute('data-theme', 'dark');
        } else {
            document.body.removeAttribute('data-theme');
        }
    }
    
    function updateButton() {
        const button = document.querySelector('.theme-toggle');
        if (button) {
            button.innerHTML = currentTheme === 'light' ? '🌙 Dark' : '☀️ Light';
        }
    }
    
    function saveTheme() {
        try {
            localStorage.setItem('theme', currentTheme);
        } catch (e) {
            console.log('Could not save theme');
        }
    }
    
    function loadTheme() {
        try {
            const saved = localStorage.getItem('theme');
            if (saved) currentTheme = saved;
        } catch (e) {
            console.log('Could not load theme');
        }
    }
    
    // Initialize when DOM is ready
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', init);
    } else {
        init();
    }
})();
