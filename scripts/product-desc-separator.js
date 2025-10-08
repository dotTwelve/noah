// Product Description First Sentence Separator
// Skript pro oddělení první věty v popisu produktu (.pd-shrt-desc)
// Se zachováním původního HTML formátování
// (c) 2025
(function() {
    'use strict';
    
    // Funkce pro nalezení konce první věty v čistém textu
    function findFirstSentenceEnd(text) {
        if (!text || text.trim() === '') return -1;
        
        // NORMALIZOVAT pro detekci věty - nahradit všechny whitespace jednou mezerou
        const normalizedText = text.trim().replace(/\s+/g, ' ');
        
        // Vylepšený regex pro nalezení konce první věty
        const sentenceRegex = /[.!?](?=\s+[A-ZČŘŠŽÝÁÍÉÚŮŇŤĎĚÓĹĽ]|\s*$)/;
        const match = normalizedText.match(sentenceRegex);
        
        if (match) {
            const posInNormalized = match.index + 1;
            
            let charCountInOriginal = 0;
            let nonWhitespaceCount = 0;
            
            for (let i = 0; i < text.length; i++) {
                if (!/\s/.test(text[i])) {
                    nonWhitespaceCount++;
                }
                charCountInOriginal++;
                
                let nonWhitespaceInNormalized = 0;
                for (let j = 0; j < posInNormalized; j++) {
                    if (normalizedText[j] !== ' ') {
                        nonWhitespaceInNormalized++;
                    }
                }
                
                if (nonWhitespaceCount === nonWhitespaceInNormalized) {
                    if (text[i] === '.' || text[i] === '!' || text[i] === '?') {
                        return i + 1;
                    }
                    for (let k = i; k < text.length && k < i + 10; k++) {
                        if (text[k] === '.' || text[k] === '!' || text[k] === '?') {
                            return k + 1;
                        }
                    }
                    return charCountInOriginal;
                }
            }
            
            return charCountInOriginal;
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
            } else if (inTag) {
                if (html[i] === '>') {
                    inTag = false;
                }
            } else {
                charCount++;
                if (charCount === textPosition) {
                    htmlPosition = i + 1;
                    
                    // Přeskočit whitespace a VŠECHNY <br> tagy za větou
                    let keepSkipping = true;
                    while (keepSkipping && htmlPosition < html.length) {
                        const char = html[htmlPosition];
                        
                        if (char === ' ' || char === '\n' || char === '\r' || char === '\t') {
                            htmlPosition++;
                        } else if (char === '<') {
                            // Zkontrolovat jestli je to <br> tag
                            const nextChars = html.substring(htmlPosition, htmlPosition + 10).toLowerCase();
                            if (nextChars.startsWith('<br>') || 
                                nextChars.startsWith('<br/>') || 
                                nextChars.startsWith('<br ')) {
                                // Najít konec <br> tagu a přeskočit ho
                                const brEnd = html.indexOf('>', htmlPosition);
                                if (brEnd !== -1) {
                                    htmlPosition = brEnd + 1;
                                    // Pokračovat v hledání dalších <br> nebo whitespace
                                    continue;
                                }
                            }
                            // Není to <br>, tak končíme
                            keepSkipping = false;
                        } else {
                            // Není to whitespace ani <br>, končíme
                            keepSkipping = false;
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
            if (element.hasAttribute('data-separated')) {
                return;
            }
            
            const originalHTML = element.innerHTML;
            const originalText = element.textContent;
            
            // Debug
            console.log('[Product Desc Separator] Původní text:', originalText.substring(0, 200));
            
            const sentenceEnd = findFirstSentenceEnd(originalText);
            
            if (sentenceEnd === -1) {
                console.log('[Product Desc Separator] Nenalezena první věta');
                return;
            }
            
            console.log('[Product Desc Separator] První věta:', originalText.substring(0, sentenceEnd).trim());
            
            const split = splitHTMLAtPosition(originalHTML, sentenceEnd);
            
            if (!split || !split.rest) {
                console.log('[Product Desc Separator] Nepodařilo se rozdělit HTML nebo není zbytek');
                return;
            }
            
            element.setAttribute('data-separated', 'true');
            element.setAttribute('data-original-html', originalHTML);
            
            element.innerHTML = '';
            
            const firstSentenceParagraph = document.createElement('p');
            firstSentenceParagraph.className = 'fs-4 bg-de';
            firstSentenceParagraph.innerHTML = split.first;
            element.appendChild(firstSentenceParagraph);
            
            const restParagraph = document.createElement('p');
            restParagraph.innerHTML = split.rest;
            element.appendChild(restParagraph);
            
            count++;
        });
        
        if (count > 0) {
            console.log(`[Product Desc Separator] Upraveno ${count} elementů .pd-shrt-desc`);
        }
    }
    
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', separateFirstSentence);
    } else {
        separateFirstSentence();
    }
    
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
    
    if (document.body) {
        observer.observe(document.body, {
            childList: true,
            subtree: true
        });
    }
    
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
