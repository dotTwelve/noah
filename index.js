// Noah Scripts Loader
// (c) 2025 NOAH Natural Products s.r.o.

(function() {
    'use strict';
    
    const config = {
        baseUrl: 'https://dottwelve.github.io/noah/',
        scripts: [
            'scripts/quantity-selector.js',
            'scripts/empty-href-remover.js'
            // Další skripty můžeš přidat zde
        ]
    };
    
    function loadScript(src) {
        return new Promise((resolve, reject) => {
            const script = document.createElement('script');
            script.src = config.baseUrl + src;
            script.onload = resolve;
            script.onerror = reject;
            
            const currentScript = document.querySelector('script[src*="noah/index.js"]') || 
                                 document.currentScript;
            
            if (currentScript && currentScript.parentNode) {
                currentScript.parentNode.insertBefore(script, currentScript.nextSibling);
            } else {
                document.body.appendChild(script);
            }
        });
    }
    
    async function init() {
        try {
            if (typeof jQuery === 'undefined') {
                setTimeout(init, 100);
                return;
            }
            
            for (const script of config.scripts) {
                await loadScript(script);
            }
        } catch (error) {
            // Tiché selhání
        }
    }
    
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', function() {
            setTimeout(init, 100);
        });
    } else {
        setTimeout(init, 100);
    }
})();
