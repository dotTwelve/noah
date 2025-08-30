// Noah Scripts Loader v2.0
// (c) 2025 NOAH Natural Products s.r.o.

(function() {
    'use strict';
    
    console.log('Noah: Inicializuji loader...');
    
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
            script.onload = function() {
                console.log('Noah: Načten skript:', src);
                resolve();
            };
            script.onerror = function() {
                console.error('Noah: Chyba při načítání:', src);
                reject();
            };
            
            // Najdeme tento skript a vložíme nový hned za něj
            const currentScript = document.querySelector('script[src*="dotTwelve/noah"][src*="index.js"]') || 
                                 document.querySelector('script[src*="noah@main/index.js"]') ||
                                 document.querySelector('script[src*="noah"][src*="index"]');
            
            if (currentScript && currentScript.parentNode) {
                // Vložíme hned ZA index.js
                currentScript.parentNode.insertBefore(script, currentScript.nextSibling);
                console.log('Noah: Skript vložen za index.js');
            } else {
                // Fallback - přidáme na konec body
                document.body.appendChild(script);
                console.log('Noah: Skript vložen na konec body (fallback)');
            }
        });
    }
    
    async function init() {
        try {
            // Kontrola jQuery
            if (typeof jQuery === 'undefined') {
                console.log('Noah: Čekám na jQuery...');
                setTimeout(init, 100);
                return;
            }
            
            console.log('Noah: jQuery dostupné, načítám skripty...');
            
            // Načteme všechny skripty
            for (const script of config.scripts) {
                await loadScript(script);
            }
            
            console.log('Noah: Všechny skripty načteny úspěšně!');
        } catch (error) {
            console.error('Noah: Chyba při načítání skriptů:', error);
        }
    }
    
    // Spustíme inicializaci
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', function() {
            console.log('Noah: DOM ready, spouštím init...');
            setTimeout(init, 100);
        });
    } else {
        console.log('Noah: DOM už je ready, spouštím init...');
        setTimeout(init, 100);
    }
})();
