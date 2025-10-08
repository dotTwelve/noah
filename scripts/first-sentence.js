// Show Only First Sentence Script - Oddělení první věty se zachováním formátování
// Skript pro oddělení první věty v elementech .p-i-desc
// (c) 2025
(function() {
    'use strict';
    
    // Funkce pro nalezení konce první věty v textu
    function findFirstSentenceEnd(text) {
        if (!text || text.trim() === '') return -1;
        
        // Regulární výraz pro nalezení první věty
        const sentenceRegex = /^[^.!?]*[.!?]/;
        const match = text.match(sentenceRegex);
        
        if (match) {
            return match[0].length;
        }
        
        return -1;
    }
    
    // Funkce pro získání textového obsahu až do určité pozice
    function getTextUpToPosition(element, targetPos) {
        let currentPos = 0;
        let foundNode = null;
        let positionInNode = 0;
        
        // Rekurzivní procházení textových uzlů
        function traverse(node) {
            if (foundNode) return;
            
            if (node.nodeType === Node.TEXT_NODE) {
                const textLength = node.textContent.length;
                if (currentPos + textLength >= targetPos) {
                    foundNode = node;
                    positionInNode = targetPos - currentPos;
                    return;
                }
                currentPos += textLength;
            } else if (node.nodeType === Node.ELEMENT_NODE) {
                for (let child of node.childNodes) {
                    traverse(child);
                    if (foundNode) return;
                }
            }
        }
        
        traverse(element);
        return { node: foundNode, position: positionInNode };
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
            
            const fullText = element.textContent;
            const firstSentenceEnd = findFirstSentenceEnd(fullText);
            
            if (firstSentenceEnd === -1 || firstSentenceEnd >= fullText.length) {
                return; // Není co oddělovat
            }
            
            // Najít textový uzel a pozici, kde končí první věta
            const { node, position } = getTextUpToPosition(element, firstSentenceEnd);
            
            if (!node) return;
            
            // Uložit původní HTML
            element.setAttribute('data-original-html', element.innerHTML);
            element.setAttribute('data-separated', 'true');
            
            // Vytvořit wrapper pro první větu
            const firstSentenceSpan = document.createElement('span');
            firstSentenceSpan.className = 'first-sentence';
            
            // Rozdělit textový uzel
            if (position < node.textContent.length) {
                const beforeText = node.textContent.substring(0, position);
                const afterText = node.textContent.substring(position);
                
                // Vytvořit nové textové uzly
                const beforeNode = document.createTextNode(beforeText);
                const afterNode = document.createTextNode(afterText);
                
                // Najít všechny uzly před tímto uzlem
                const walker = document.createTreeWalker(
                    element,
                    NodeFilter.SHOW_ALL,
                    null
                );
                
                let currentNode;
                const nodesToWrap = [];
                
                while (currentNode = walker.nextNode()) {
                    if (currentNode === node) {
                        break;
                    }
                    if (currentNode.nodeType === Node.TEXT_NODE || 
                        currentNode.nodeType === Node.ELEMENT_NODE) {
                        nodesToWrap.push(currentNode);
                    }
                }
                
                // Vložit wrapper před první textový uzel
                element.insertBefore(firstSentenceSpan, element.firstChild);
                
                // Přesunout uzly do wrapperu
                nodesToWrap.forEach(n => {
                    if (n.parentNode === element) {
                        firstSentenceSpan.appendChild(n);
                    }
                });
                
                // Přidat část textu do wrapperu
                firstSentenceSpan.appendChild(beforeNode);
                
                // Nahradit původní uzel zbytkem textu
                node.parentNode.replaceChild(afterNode, node);
                
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
