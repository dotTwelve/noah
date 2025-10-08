/**
 * NOAH Scripts Loader
 * Hlavní loader pro všechny skripty e-shopu
 * 
 * @version 1.3.0
 */

(function() {
    'use strict';
    
    // Konfigurace
    const config = {
        baseUrl: 'https://dottwelve.github.io/noah/',
        scripts: [
            {
                name: 'quantity-selector',
                file: 'scripts/quantity-selector.js',
                enabled: true,
                description: 'Interaktivní výběr množství produktu'
            },
            {
                name: 'remove-hashbang-links',
                file: 'scripts/remove-hashbang-links.js',
                enabled: true,
                description: 'Odstranění prázdných odkazů'
            },/*
            {
                name: 'first-sentence',
                file: 'scripts/first-sentence.js',
                enabled: true,
                description: 'Ořezání popisu produktu v seznamu'
            },*/
            {
                name: 'product-desc-separator',
                file: 'scripts/product-desc-separator.js',
                enabled: true,
                description: 'Rozdělení krátkého popisu produktu v detailu na dvě vety'
            },
            {
                name: 'product-slider',
                file: 'scripts/product-slider.js',
                enabled: true,
                description: 'Převod gridu produktů na slider',
                dependencies: ['jquery']
            },
            {
                name: 'article-slider',
                file: 'scripts/article-slider.js',
                enabled: true,
                description: 'Převod gridu článků na slider',
                dependencies: ['jquery']
            },
            {
                name: 'mobile-cart-value',
                file: 'scripts/mobile-cart-value.js',
                enabled: true,
                description: 'Zobrazení hodnoty košíku na mobilu',
                dependencies: ['upgates']
            }
        ],
        version: '1.3.0',
        debug: false
    };
    
    // Najít aktuální skript (index.js)
    const getCurrentScript = function() {
        // Pokud je dostupný document.currentScript
        if (document.currentScript) {
            return document.currentScript;
        }
        
        // Fallback - najít skript podle src obsahující 'index.js'
        const scripts = document.getElementsByTagName('script');
        for (let script of scripts) {
            if (script.src && script.src.includes('index.js')) {
                return script;
            }
        }
        
        // Pokud nenajdeme, vrátit poslední skript (pravděpodobně tento)
        return scripts[scripts.length - 1];
    };
    
    // Získat referenci na aktuální skript hned při načtení
    const currentScript = getCurrentScript();
    
    // Logging funkce
    const log = function(message, type = 'info') {
        if (!config.debug && type !== 'error') return;
        
        const prefix = '[NOAH Scripts]';
        const styles = {
            info: 'color: #3498db',
            success: 'color: #27ae60',
            warning: 'color: #f39c12',
            error: 'color: #e74c3c'
        };
        
        console.log(`%c${prefix} ${message}`, styles[type] || '');
    };
    
    // Kontrola závislostí
    const checkDependencies = function(script) {
        if (!script.dependencies) return true;
        
        for (let dep of script.dependencies) {
            if (dep === 'jquery' && typeof jQuery === 'undefined') {
                log(`Skript ${script.name} vyžaduje jQuery`, 'warning');
                return false;
            }
            if (dep === 'upgates' && typeof upgates === 'undefined') {
                log(`Skript ${script.name} vyžaduje upgates (košíkový systém)`, 'warning');
                return false;
            }
            // Přidejte další kontroly závislostí podle potřeby
        }
        
        return true;
    };
    
    // Načtení skriptu
    const loadScript = function(script) {
        if (!script.enabled) {
            log(`Skript ${script.name} je vypnutý`, 'info');
            return Promise.resolve();
        }
        
        if (!checkDependencies(script)) {
            return Promise.resolve();
        }
        
        return new Promise((resolve, reject) => {
            const scriptElement = document.createElement('script');
            scriptElement.src = config.baseUrl + script.file;
            scriptElement.async = true;
            scriptElement.setAttribute('data-noah-script', script.name);
            
            scriptElement.onload = () => {
                log(`Skript ${script.name} načten`, 'success');
                resolve();
            };
            
            scriptElement.onerror = () => {
                log(`Chyba při načítání skriptu ${script.name}`, 'error');
                reject(new Error(`Failed to load ${script.name}`));
            };
            
            // Vložit skript hned za index.js
            if (currentScript && currentScript.parentNode) {
                // Vložit za aktuální skript
                currentScript.parentNode.insertBefore(scriptElement, currentScript.nextSibling);
            } else {
                // Fallback - vložit do head nebo body
                (document.head || document.body).appendChild(scriptElement);
                log('Použit fallback pro vložení skriptu', 'warning');
            }
        });
    };
    
    // Načtení všech skriptů
    const loadAllScripts = async function() {
        log(`Inicializace v${config.version}`, 'info');
        
        // Informace o umístění
        if (currentScript) {
            log(`Loader nalezen: ${currentScript.src || 'inline script'}`, 'info');
        }
        
        for (let script of config.scripts) {
            try {
                await loadScript(script);
            } catch (error) {
                log(`Chyba: ${error.message}`, 'error');
            }
        }
        
        log('Všechny skripty načteny', 'success');
        
        // Trigger custom event
        if (typeof jQuery !== 'undefined') {
            jQuery(document).trigger('noah-scripts-loaded');
        }
    };
    
    // Kontrola, zda je DOM připraven
    const ready = function(fn) {
        if (document.readyState !== 'loading') {
            fn();
        } else {
            document.addEventListener('DOMContentLoaded', fn);
        }
    };
    
    // Export konfigurace pro debugging
    window.NOAHScripts = {
        config: config,
        version: config.version,
        reload: loadAllScripts,
        debug: function(enabled = true) {
            config.debug = enabled;
            log('Debug mód ' + (enabled ? 'zapnut' : 'vypnut'), 'info');
        },
        getCurrentScript: function() {
            return currentScript;
        },
        // Přístup k jednotlivým modulům
        modules: {
            mobileCartValue: function() {
                return window.MobileCartValue || null;
            }
        }
    };
    
    // Spustit načítání
    ready(loadAllScripts);
    
})();
