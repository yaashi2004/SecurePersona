// Debug script to help with content script testing
console.log('Test form loaded');

// Check if content script is loaded
setTimeout(() => {
    console.log('=== SecurePersona Debug Check ===');
    
    if (window.securePersonaContent) {
        console.log('✅ SecurePersona content script is loaded and working!');
        console.log('Content script instance:', window.securePersonaContent);
    } else {
        console.log('❌ SecurePersona content script is not loaded');
        console.log('Available window properties:', Object.keys(window).filter(key => key.includes('secure') || key.includes('persona')));
        
        // Check if Chrome extension APIs are available
        console.log('Chrome runtime available:', typeof chrome !== 'undefined' && typeof chrome.runtime !== 'undefined');
        console.log('Chrome extension ID:', typeof chrome !== 'undefined' && chrome.runtime ? chrome.runtime.id : 'Not available');
        
        // Check if we're in a content script context
        console.log('Document URL:', document.URL);
        console.log('Document ready state:', document.readyState);
        
        // List all script tags to see what's loaded
        const scripts = document.querySelectorAll('script');
        console.log('Scripts loaded:', Array.from(scripts).map(s => s.src || 'inline'));
    }
    
    // Test the global test function if available
    if (typeof window.testSecurePersona === 'function') {
        console.log('Testing with global function...');
        window.testSecurePersona();
    } else {
        console.log('Global test function not available');
    }
    
    console.log('=== End Debug Check ===');
}, 2000);

// Additional check after 5 seconds
setTimeout(() => {
    console.log('=== 5 Second Check ===');
    if (window.securePersonaContent) {
        console.log('✅ SecurePersona still loaded after 5 seconds');
    } else {
        console.log('❌ SecurePersona still not loaded after 5 seconds');
        
        // Try to manually inject the content script
        console.log('Attempting manual content script injection...');
        try {
            const script = document.createElement('script');
            script.src = chrome.runtime.getURL('content.js');
            script.onload = () => console.log('Manual injection successful');
            script.onerror = (e) => console.log('Manual injection failed:', e);
            document.head.appendChild(script);
        } catch (error) {
            console.log('Manual injection error:', error);
        }
    }
}, 5000); 