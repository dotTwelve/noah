// Product Description First Sentence Separator
// Skript pro oddělení první věty v popisu produktu (.pd-shrt-desc)
// Se zachováním původního HTML formátování
// (c) 2025
(function() {
    'use strict';
    
    // Funkce pro nalezení konce první věty v čistém textu
    function findFirstSentenceEnd(text) {
        if (!text || text.trim() === '') return -1;
        
        // Normalizovat mezery pro hledání
        text = text.trim().replace(/\s+/g, ' ');
        
        // Regulární výraz pro nalezení konce první věty
        const sentenceRegex = /^[^.!?]*[.!?]/;
        const match = text.match(sentenceRegex);
        
        if (match) {
            return match[0].length;
        }
        
        return -1;
    }
    
    // Funkce pro rozdělení HTML na první větu a zbytek
    function splitHTMLAtPosition(html, textPosition) {
        let charCount = 0;
        let htmlPosition = 0;
        let inTag = false;
        
        // Projít HTML znak po znaku
        for (let i = 0; i < html.length; i++) {
            if (html[i] === '<') {
                inTag = true;
            } else if (html[i] === '>') {
                inTag = false;
            } else if (!inTag) {
                charCount++;
                if (charCount === textPosition) {
                    // Najít konец věty včetně mezer za ní
                    htmlPosition = i + 1;
                    // Přeskočit mezery a zalomení za větou
                    while (htmlPosition < html.length) {
                        const char = html[htmlPosition];
                        if (char === ' ' || char === '\n' || char === '\r' || char === '\t') {
                            htmlPosition++;
                        } else if (char === '<') {
                            // Zkontrolovat jestli je to <br>
                            if (html.substring(htmlPosition, htmlPosition + 4).toLowerCase() === '<br>' ||
                                html.substring(htmlPosition, htmlPosition + 5).toLowerCase() === '<br/>' ||
                                html.substring(htmlPosition, htmlPosition + 6).toLowerCase() === '<br />') {
                                // Najít konec <br> tagu
                                const brEnd = html.indexOf('>', htmlPosition);
                                if (brEnd !== -1) {
                                    htmlPosition = brEnd + 1;
                                    // Přeskočit i další whitespace za <br>
                                    while (htmlPosition < html.length && 
                                           (html[htmlPosition] === ' ' || 
                                            html[htmlPosition] === '\n' || 
                                            html[htmlPosition] === '\r' || 
                                            html[htmlPosition] === '\t')) {
                                        htmlPosition++;
                                    }
                                    continue;
                                }
                            }
                            break;
                        } else {
                            break;
                        }
                    }
                    break;
                }
            }
        }
        
        if (htmlPosition > 0 && htmlPosition < html.length) {
            return {
                first: html.substring(0, htmlPosition).trim(),
                rest: html.substring(htmlPosition).trim()
            };
        }
        
        return null;
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
            
            const originalHTML = element.innerHTML;
            const originalText = element.textContent;
            
            // Najít konec první věty
            const sentenceEnd = findFirstSentenceEnd(originalText);
            
            if (sentenceEnd === -1 || sentenceEnd >= originalText.trim().length) {
                // Není co oddělovat nebo je to jen jedna věta
                return;
            }
            
            // Rozdělit HTML
            const split = splitHTMLAtPosition(originalHTML, sentenceEnd);
            
            if (!split || !split.rest) {
                return;
            }
            
            // Označit element jako zpracovaný
            element.setAttribute('data-separated', 'true');
            element.setAttribute('data-original-html', originalHTML);
            
            // Vytvořit nový obsah
            element.innerHTML = '';
            
            // Vytvořit <p> element pro první větu s třídou fs-4 bg-de
            const firstSentenceParagraph = document.createElement('p');
            firstSentenceParagraph.className = 'fs-4 bg-de';
            firstSentenceParagraph.innerHTML = split.first;
            element.appendChild(firstSentenceParagraph);
            
            // Přidat zbytek textu (také v <p> elementu)
            const restParagraph = document.createElement('p');
            restParagraph.innerHTML = split.rest;
            element.appendChild(restParagraph);
            
            count++;
        });
        
        // Debug info do konzole
        if (count > 0) {
            console.log(`[Product Desc Separator] Upraveno ${count} elementů .pd-shrt-desc`);
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
                        if (node.classList && node.classList.contains('pd-shrt-desc')) {
                            shouldProcess = true;
                        }
                        if (node.querySelectorAll && node.querySelectorAll('.pd-shrt-desc').length > 0) {
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
    if (document.body) {
        observer.observe(document.body, {
            childList: true,
            subtree: true
        });
    }
    
    // Volitelná funkce pro obnovení původního textu (pro debugging)
    window.restoreOriginalDesc = function() {
        const elements = document.querySelectorAll('.pd-shrt-desc[data-separated="true"]');
        elements.forEach(element => {
            const originalHTML = element.getAttribute('data-original-html');
            if (originalHTML) {
                element.innerHTML = originalHTML;
                element.removeAttribute('data-separated');
                element.removeAttribute('data-original-html');
            }
        });
        console.log(`[Product Desc Separator] Obnoveno ${elements.length} elementů`);
    };
    
})();
