// Remove href="#!" Links Script
// Samostatný skript pro odstranění odkazů s href="#!"
// (c) 2025

(function() {
    'use strict';
    
    // Funkce pro odstranění odkazů
    function removeHashBangLinks() {
        const links = document.querySelectorAll('a[href="#!"]');
        let count = 0;
        
        links.forEach(link => {
            // Nahradí element <a> jeho obsahem
            link.replaceWith(...link.childNodes);
            count++;
        });
        
        // Debug info do konzole (můžete zakomentovat)
        if (count > 0) {
            console.log(`[Remove HashBang] Odstraněno ${count} odkazů s href="#!"`);
        }
    }
    
    // Spustit po načtení DOM
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', removeHashBangLinks);
    } else {
        // DOM už je načtený
        removeHashBangLinks();
    }
    
    // Volitelně: Sledovat dynamicky přidávané odkazy (pokud se přidávají AJAXem)
    // Zakomentujte, pokud nepotřebujete
    const observer = new MutationObserver(function(mutations) {
        mutations.forEach(function(mutation) {
            if (mutation.type === 'childList') {
                mutation.addedNodes.forEach(function(node) {
                    if (node.nodeType === 1) { // Element node
                        // Zkontrolovat, jestli je to odkaz s href="#!"
                        if (node.tagName === 'A' && node.getAttribute('href') === '#!') {
                            node.replaceWith(...node.childNodes);
                        }
                        // Zkontrolovat potomky
                        const links = node.querySelectorAll('a[href="#!"]');
                        links.forEach(link => {
                            link.replaceWith(...link.childNodes);
                        });
                    }
                });
            }
        });
    });
    
    // Sledovat změny v celém dokumentu
    observer.observe(document.body, {
        childList: true,
        subtree: true
    });
    
})();
