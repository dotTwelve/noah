// Show Only First Sentence Script
// Skript pro zobrazení pouze první věty v elementech .p-i-desc
// (c) 2025
(function() {
    'use strict';
    
    // Funkce pro extrakci první věty
    function getFirstSentence(text) {
        if (!text || text.trim() === '') return '';
        
        // Normalizovat text (odstranit nadbytečné mezery)
        text = text.trim().replace(/\s+/g, ' ');
        
        // Regulární výraz pro nalezení první věty
        // Hledá tečku, vykřičník nebo otazník následované mezerou a velkým písmenem
        // nebo na konci textu
        const sentenceRegex = /^[^.!?]*[.!?](?=\s+[A-ZČŘŠŽÝÁÍÉÚŮŇŤĎ]|$)/;
        const match = text.match(sentenceRegex);
        
        if (match) {
            return match[0].trim();
        }
        
        // Pokud není nalezena standardní interpunkce, vrátí celý text
        // (pro případy, kdy text neobsahuje tečku)
        return text;
    }
    
    // Funkce pro úpravu elementů
    function truncateToFirstSentence() {
        const elements = document.querySelectorAll('.p-i-desc');
        let count = 0;
        
        elements.forEach(element => {
            // Zkontrolovat, jestli už nebyl element upraven
            if (element.hasAttribute('data-truncated')) {
                return;
            }
            
            const originalText = element.textContent;
            const firstSentence = getFirstSentence(originalText);
            
            // Pouze pokud se první věta liší od původního textu
            if (firstSentence !== originalText && firstSentence !== '') {
                // Uložit původní text jako atribut (pro případnou obnovu)
                element.setAttribute('data-original-text', originalText);
                element.setAttribute('data-truncated', 'true');
                
                // Nastavit nový text
                element.textContent = firstSentence;
                count++;
            }
        });
        
        // Debug info do konzole (můžete zakomentovat)
        if (count > 0) {
            console.log(`[First Sentence] Upraveno ${count} elementů .p-i-desc`);
        }
    }
    
    // Spustit po načtení DOM
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', truncateToFirstSentence);
    } else {
        // DOM už je načtený
        truncateToFirstSentence();
    }
    
    // Sledovat dynamicky přidávané elementy
    const observer = new MutationObserver(function(mutations) {
        let shouldProcess = false;
        
        mutations.forEach(function(mutation) {
            if (mutation.type === 'childList') {
                mutation.addedNodes.forEach(function(node) {
                    if (node.nodeType === 1) { // Element node
                        // Zkontrolovat, jestli je to element .p-i-desc
                        if (node.classList && node.classList.contains('p-i-desc')) {
                            shouldProcess = true;
                        }
                        // Zkontrolovat potomky
                        if (node.querySelectorAll && node.querySelectorAll('.p-i-desc').length > 0) {
                            shouldProcess = true;
                        }
                    }
                });
            }
        });
        
        if (shouldProcess) {
            // Malé zpoždění pro zajištění, že DOM je plně nastaven
            setTimeout(truncateToFirstSentence, 10);
        }
    });
    
    // Sledovat změny v celém dokumentu
    observer.observe(document.body, {
        childList: true,
        subtree: true
    });
    
    // Volitelná funkce pro obnovení původního textu (pro debugging)
    window.restoreOriginalText = function() {
        const elements = document.querySelectorAll('.p-i-desc[data-truncated="true"]');
        elements.forEach(element => {
            const originalText = element.getAttribute('data-original-text');
            if (originalText) {
                element.textContent = originalText;
                element.removeAttribute('data-truncated');
                element.removeAttribute('data-original-text');
            }
        });
        console.log(`[First Sentence] Obnoveno ${elements.length} elementů`);
    };
    
})();
