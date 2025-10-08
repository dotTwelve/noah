// Show Only First Sentence Script - Oddělení první věty
// Skript pro oddělení první věty v elementech .p-i-desc
// (c) 2025
(function() {
    'use strict';
    
    // Funkce pro extrakci první věty
    function getFirstSentence(text) {
        if (!text || text.trim() === '') return { first: '', rest: '' };
        
        // Normalizovat text (odstranit nadbytečné mezery)
        text = text.trim().replace(/\s+/g, ' ');
        
        // Regulární výraz pro nalezení první věty
        const sentenceRegex = /^[^.!?]*[.!?](?=\s+[A-ZČŘŠŽÝÁÍÉÚŮŇŤĎ]|$)/;
        const match = text.match(sentenceRegex);
        
        if (match) {
            const firstSentence = match[0].trim();
            const restText = text.substring(match[0].length).trim();
            return { first: firstSentence, rest: restText };
        }
        
        // Pokud není nalezena interpunkce, vrátí celý text jako první větu
        return { first: text, rest: '' };
    }
    
    // Funkce pro úpravu elementů
    function separateFirstSentence() {
        const elements = document.querySelectorAll('.p-i-desc');
        let count = 0;
        
        elements.forEach(element => {
            // Zkontrolovat, jestli už nebyl element upraven
            if (element.hasAttribute('data-separated')) {
                return;
            }
            
            const originalText = element.textContent;
            const { first, rest } = getFirstSentence(originalText);
            
            // Pouze pokud existuje zbytek textu
            if (rest !== '') {
                // Uložit původní text jako atribut
                element.setAttribute('data-original-text', originalText);
                element.setAttribute('data-separated', 'true');
                
                // Vytvořit novou strukturu s oddělenou první větou
                element.innerHTML = `<span class="first-sentence">${first}</span> ${rest}`;
                count++;
            }
        });
        
        // Debug info do konzole
        if (count > 0) {
            console.log(`[First Sentence] Odděleno ${count} elementů .p-i-desc`);
        }
    }
    
    // Spustit po načtení DOM
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', separateFirstSentence);
    } else {
        separateFirstSentence();
    }
    
    // Sledovat dynamicky přidávané elementy
    const observer = new MutationObserver(function(mutations) {
        let shouldProcess = false;
        
        mutations.forEach(function(mutation) {
            if (mutation.type === 'childList') {
                mutation.addedNodes.forEach(function(node) {
                    if (node.nodeType === 1) {
                        if (node.classList && node.classList.contains('p-i-desc')) {
                            shouldProcess = true;
                        }
                        if (node.querySelectorAll && node.querySelectorAll('.p-i-desc').length > 0) {
                            shouldProcess = true;
                        }
                    }
                });
            }
        });
        
        if (shouldProcess) {
            setTimeout(separateFirstSentence, 10);
        }
    });
    
    // Sledovat změny v celém dokumentu
    observer.observe(document.body, {
        childList: true,
        subtree: true
    });
    
    // Volitelná funkce pro obnovení původního textu
    window.restoreOriginalText = function() {
        const elements = document.querySelectorAll('.p-i-desc[data-separated="true"]');
        elements.forEach(element => {
            const originalText = element.getAttribute('data-original-text');
            if (originalText) {
                element.textContent = originalText;
                element.removeAttribute('data-separated');
                element.removeAttribute('data-original-text');
            }
        });
        console.log(`[First Sentence] Obnoveno ${elements.length} elementů`);
    };
    
})();
