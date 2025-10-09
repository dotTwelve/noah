// Jednoduchý skript pro oddělení první věty v .pd-shrt-desc
(function() {
    'use strict';
    
    function separateFirstSentence() {
        // Najít všechny elementy s třídou pd-shrt-desc
        const elements = document.querySelectorAll('.pd-shrt-desc');
        
        elements.forEach(element => {
            // Pokud už byl upraven, přeskočit
            if (element.hasAttribute('data-separated')) {
                return;
            }
            
            // Získat celý text
            const fullText = element.textContent.trim();
            
            // Najít pozici první tečky následované mezerou a velkým písmenem
            const match = fullText.match(/\.\s+(?=[A-ZČŘŠŽÝÁÍÉÚŮŇŤĎĚÓ])/);
            
            if (!match) {
                console.log('První věta nenalezena');
                return;
            }
            
            // Rozdělit text na první větu a zbytek
            const splitPosition = match.index + 1; // +1 pro tečku
            const firstSentence = fullText.substring(0, splitPosition).trim();
            const restText = fullText.substring(splitPosition).trim();
            
            // Pokud není zbytek, nepokračovat
            if (!restText) {
                return;
            }
            
            // Označit jako upravený
            element.setAttribute('data-separated', 'true');
            
            // Vytvořit novou strukturu
            element.innerHTML = `
                <p class="fs-4 bg-de">${firstSentence}</p>
                <p>${restText}</p>
            `;
            
            console.log('✓ První věta oddělena');
        });
    }
    
    // Spustit po načtení stránky
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', separateFirstSentence);
    } else {
        separateFirstSentence();
    }
    
    // Sledovat nové elementy
    const observer = new MutationObserver(function(mutations) {
        let hasNewElements = false;
        
        mutations.forEach(function(mutation) {
            mutation.addedNodes.forEach(function(node) {
                if (node.nodeType === 1 && 
                    (node.classList?.contains('pd-shrt-desc') || 
                     node.querySelector?.('.pd-shrt-desc'))) {
                    hasNewElements = true;
                }
            });
        });
        
        if (hasNewElements) {
            setTimeout(separateFirstSentence, 50);
        }
    });
    
    if (document.body) {
        observer.observe(document.body, {
            childList: true,
            subtree: true
        });
    }
    
})();
