// Noah Scripts Loader
// (c) 2025 NOAH Natural Products s.r.o.

(function() {
    'use strict';
    
    const config = {
        baseUrl: 'https://cdn.jsdelivr.net/gh/dotTwelve/noah@main/',
        scripts: [
            'scripts/quantity-selector.js'
        ]
    };
    
    function loadScript(src) {
        return new Promise((resolve, reject) => {
            const script = document.createElement('script');
            script.src = config.baseUrl + src;
            script.onload = resolve;
            script.onerror = reject;
            document.head.appendChild(script);
        });
    }
    
    function ensureJQuery() {
        if (typeof jQuery === 'undefined') {
            return loadScript('https://code.jquery.com/jquery-3.4.1.min.js');
        }
        return Promise.resolve();
    }
    
    async function init() {
        try {
            await ensureJQuery();
            
            for (const script of config.scripts) {
                await loadScript(script);
            }
        } catch (error) {
            console.error('Error loading Noah scripts:', error);
        }
    }
    
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', init);
    } else {
        init();
    }
})();
