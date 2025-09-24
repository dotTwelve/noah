// Product Description First Sentence Separator
// Skript pro oddělení první věty v popisu produktu (.pd-shrt-desc)
// (c) 2025
(function() {
    'use strict';
    
    // Funkce pro extrakci první věty
    function getFirstSentence(text) {
        if (!text || text.trim() === '') return { first: '', rest: '' };
        
        // Normalizovat text (odstranit nadbytečné mezery)
        text = text.trim().replace(/\s+/g, ' ');
        
        // Regulární výraz pro nalezení první věty
        // Hledá tečku, vykřičník nebo otazník následované mezerou a velkým písmenem
        const sentenceRegex = /^([^.!?]*[.!?])(\s+.*)$/;
        const match = text.match(sentenceRegex);
        
        if (match) {
            return {
                first: match[1].trim(),
                rest: match[2].trim()
            };
        }
        
        // Pokud není nalezena standardní interpunkce, vrátí celý text jako první větu
        return {
            first: text,
            rest: ''
        };
    }
    
    // Funkce pro úpravu elementů
    function separateFirstSentence() {
        const elements = document.querySelectorAll('.pd-shrt-desc');
        let count = 0;
        
        elements.forEach(element => {
            // Zkontrolovat, jestli už nebyl element upraven
            if (element.hasAttribute('data-separated')) {
                return;
            }
            
            const originalText = element.textContent;
            const sentences = getFirstSentence(originalText);
            
            // Pouze pokud existuje nějaký text
            if (sentences.first !== '') {
                // Označit element jako zpracovaný
                element.setAttribute('data-separated', 'true');
                
                // Vytvořit nový obsah
                element.innerHTML = '';
                
                // Vytvořit <p> element pro první větu s třídou fs-4
                const firstSentenceParagraph = document.createElement('p');
                firstSentenceParagraph.className = 'fs-4';
                firstSentenceParagraph.textContent = sentences.first;
                element.appendChild(firstSentenceParagraph);
                
                // Pokud existuje zbytek textu, přidat ho také
                if (sentences.rest !== '') {
                    // Můžete vybrat jednu z variant:
                    
                    // Varianta 1: Zbytek textu také v <p>
                    const restParagraph = document.createElement('p');
                    restParagraph.textContent = sentences.rest;
                    element.appendChild(restParagraph);
                    
                    // Varianta 2: Zbytek textu jako prostý text (zakomentováno)
                    // const restTextNode = document.createTextNode(' ' + sentences.rest);
                    // element.appendChild(restTextNode);
                }
                
                count++;
            }
        });
        
        // Debug info do konzole (můžete zakomentovat)
        if (count > 0) {
            console.log(`[Product Desc Separator] Upraveno ${count} elementů .pd-shrt-desc`);
        }
    }
    
    // Spustit po načtení DOM
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', separateFirstSentence);
    } else {
        // DOM už je načtený
        separateFirstSentence();
    }
    
    // Sledovat dynamicky přidávané elementy
    const observer = new MutationObserver(function(mutations) {
        let shouldProcess = false;
        
        mutations.forEach(function(mutation) {
            if (mutation.type === 'childList') {
                mutation.addedNodes.forEach(function(node) {
                    if (node.nodeType === 1) { // Element node
                        // Zkontrolovat, jestli je to element .pd-shrt-desc
                        if (node.classList && node.classList.contains('pd-shrt-desc')) {
                            shouldProcess = true;
                        }
                        // Zkontrolovat potomky
                        if (node.querySelectorAll && node.querySelectorAll('.pd-shrt-desc').length > 0) {
                            shouldProcess = true;
                        }
                    }
                });
            }
        });
        
        if (shouldProcess) {
            // Malé zpoždění pro zajištění, že DOM je plně nastaven
            setTimeout(separateFirstSentence, 10);
        }
    });
    
    // Sledovat změny v celém dokumentu
    if (document.body) {
        observer.observe(document.body, {
            childList: true,
            subtree: true
        });
    }
    
})();
