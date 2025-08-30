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
            
            // Najdeme aktuální index.js skript
            const currentScript = document.querySelector('script[src*="dotTwelve/noah"][src*="index.js"]') || 
                                 document.currentScript ||
                                 document.querySelector('script[src*="noah@main/index.js"]');
            
            // Vložíme nový skript hned za index.js
            if (currentScript && currentScript.parentNode) {
                currentScript.parentNode.insertBefore(script, currentScript.nextSibling);
            } else {
                // Fallback - přidáme na konec body
                document.body.appendChild(script);
            }
        });
    }
    
    async function init() {
        try {
            // Počkáme až bude jQuery určitě ready
            if (typeof jQuery !== 'undefined') {
                for (const script of config.scripts) {
                    await loadScript(script);
                }
            } else {
                // Pokud jQuery ještě není ready, počkáme
                setTimeout(init, 100);
            }
        } catch (error) {
            console.error('Error loading Noah scripts:', error);
        }
    }
    
    // Spustíme až když je DOM ready
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', init);
    } else {
        // Přidáme malé zpoždění pro jistotu
        setTimeout(init, 100);
    }
})();
