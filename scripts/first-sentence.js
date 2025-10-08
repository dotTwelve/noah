// Show Only First Sentence Script - Oddělení první věty
// Skript pro oddělení první věty v elementech .p-i-desc se zachováním formátování
// (c) 2025
(function() {
    'use strict';
    
    // Funkce pro extrakci první věty
    function getFirstSentence(text) {
        if (!text || text.trim() === '') return { first: '', rest: '' };
        
        // Normalizovat mezery, ale zachovat strukturu
        text = text.trim();
        
        // Regulární výraz pro nalezení první věty
        const sentenceRegex = /^[^.!?]*[.!?](?=\s+[A-ZČŘŠŽÝÁÍÉÚŮŇŤĎ]|$)/;
        const match = text.match(sentenceRegex);
        
        if (match) {
            const firstSentence = match[0].trim();
            const restText = text.substring(match[0].length).trim();
            return { first: firstSentence, rest: restText };
        }
        
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
            
            // Uložit původní HTML
            const originalHTML = element.innerHTML;
            const originalText = element.textContent;
            
            const { first, rest } = getFirstSentence(originalText);
            
            // Pouze pokud existuje zbytek textu
            if (rest !== '') {
                // Najít pozici konce první věty v původním HTML
                const firstSentenceLength = first.length;
                
                // Projít HTML a najít, kde končí první věta
                let charCount = 0;
                let htmlPos = 0;
                let inTag = false;
                
                for (let i = 0; i < originalHTML.length; i++) {
                    if (originalHTML[i] === '<') {
                        inTag = true;
                    } else if (originalHTML[i] === '>') {
                        inTag = false;
                    } else if (!inTag) {
                        charCount++;
                        if (charCount === firstSentenceLength) {
                            // Najít konec věty včetně interpunkce a mezery
                            htmlPos = i + 1;
                            // Přeskočit mezery za větou
                            while (htmlPos < originalHTML.length && 
                                   (originalHTML[htmlPos] === ' ' || originalHTML[htmlPos] === '\n')) {
                                htmlPos++;
                            }
                            break;
                        }
                    }
                }
                
                if (htmlPos > 0) {
                    const firstPart = originalHTML.substring(0, htmlPos);
                    const restPart = originalHTML.substring(htmlPos);
                    
                    // Uložit původní HTML jako atribut
                    element.setAttribute('data-original-html', originalHTML);
                    element.setAttribute('data-separated', 'true');
                    
                    // Vytvořit novou strukturu
                    element.innerHTML = `<span class="first-sentence">${firstPart}</span>${restPart}`;
                    count++;
                }
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
            const originalHTML = element.getAttribute('data-original-html');
            if (originalHTML) {
                element.innerHTML = originalHTML;
                element.removeAttribute('data-separated');
                element.removeAttribute('data-original-html');
            }
        });
        console.log(`[First Sentence] Obnoveno ${elements.length} elementů`);
    };
    
})();
