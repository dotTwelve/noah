/**
 * Aktualizace mobilního košíku při AJAX změnách
 * Verze 5.0 - Stabilní element bez mizení
 */
(function() {
    'use strict';
    
    const MobileCartUpdater = {
        initialized: false,
        currentPrice: null,
        
        init() {
            if (this.initialized) return;
            this.initialized = true;
            
            console.log('[MobileCartUpdater] Initializing v5.0...');
            this.addStyles();
            this.createPriceElements();
            this.hookIntoAjax();
            this.updatePrice();
        },
        
        createPriceElements() {
            // Najít všechny mobilní košíky a IHNED vytvořit price elementy
            const mobileLinks = document.querySelectorAll(
                '#snippet--basketNavbarAjax > a[href="/cart"], ' +
                '#userCartDropdown2 > a[href="/cart"], ' +
                '.navbar-toggler.nt-cart-ico[href="/cart"]'
            );
            
            mobileLinks.forEach(link => {
                if (link.closest('.dropdown-menu')) return;
                
                // Zkontrolovat, zda už element neexistuje
                if (!link.querySelector('.mobile-price-value')) {
                    const priceEl = document.createElement('span');
                    priceEl.className = 'mobile-price-value';
                    priceEl.textContent = ' '; // Prázdný space, aby element měl velikost
                    priceEl.style.minWidth = '60px'; // Minimální šířka aby se layout nehýbal
                    priceEl.style.display = 'inline-block';
                    
                    // Najít správné místo
                    const icon = link.querySelector('svg, i.fa');
                    const badge = link.querySelector('.badge');
                    
                    if (icon && icon.nextSibling !== badge) {
                        icon.after(priceEl);
                    } else if (badge) {
                        link.insertBefore(priceEl, badge);
                    } else {
                        link.appendChild(priceEl);
                    }
                    
                    console.log('[MobileCartUpdater] Created price element');
                }
            });
        },
        
        updatePrice() {
            // Získat cenu z desktop košíku
            const desktopBtn = document.querySelector('#snippet--basketTotalAjax .btn, #userCartDropdown .btn, .hdr-crt-btn');
            if (!desktopBtn) {
                console.log('[MobileCartUpdater] Desktop button not found');
                return;
            }
            
            const match = desktopBtn.textContent.match(/([\d\s]+[,.]?\d*)\s*Kč/);
            if (!match) {
                console.log('[MobileCartUpdater] Price not found');
                return;
            }
            
            const newPrice = match[0].trim();
            const newPriceNum = parseFloat(match[1].replace(/\s/g, '').replace(',', '.'));
            
            // Najít všechny price elementy
            const priceElements = document.querySelectorAll('.mobile-price-value');
            
            priceElements.forEach(element => {
                // Získat aktuální hodnotu
                const currentText = element.textContent.trim();
                const currentMatch = currentText.match(/([\d\s]+[,.]?\d*)/);
                const currentNum = currentMatch ? 
                    parseFloat(currentMatch[1].replace(/\s/g, '').replace(',', '.')) : 0;
                
                // Pokud je to první nastavení nebo se cena změnila
                if (!currentText || currentText === ' ' || currentNum !== newPriceNum) {
                    if (!currentText || currentText === ' ') {
                        // První nastavení - bez animace
                        element.textContent = newPrice;
                        console.log('[MobileCartUpdater] Initial price set:', newPrice);
                    } else if (Math.abs(currentNum - newPriceNum) > 0.01) {
                        // Změna ceny - s animací
                        console.log('[MobileCartUpdater] Animating from', currentNum, 'to', newPriceNum);
                        this.animatePrice(element, currentNum, newPriceNum, newPrice);
                    }
                }
            });
            
            this.currentPrice = newPrice;
        },
        
        animatePrice(element, fromValue, toValue, finalText) {
            const duration = 600;
            const startTime = performance.now();
            const hasDecimals = finalText.includes(',');
            
            const animate = (currentTime) => {
                const elapsed = currentTime - startTime;
                const progress = Math.min(elapsed / duration, 1);
                
                // Easing funkce
                const eased = 1 - Math.pow(1 - progress, 3);
                
                const currentValue = fromValue + (toValue - fromValue) * eased;
                
                // Formátovat číslo
                let formatted;
                if (hasDecimals) {
                    formatted = currentValue.toFixed(2).replace('.', ',');
                } else {
                    formatted = Math.round(currentValue).toString();
                }
                
                // Přidat mezery pro tisíce
                formatted = formatted.replace(/\B(?=(\d{3})+(?!\d))/g, ' ');
                
                element.textContent = formatted + ' Kč';
                
                if (progress < 1) {
                    requestAnimationFrame(animate);
                } else {
                    element.textContent = finalText;
                }
            };
            
            requestAnimationFrame(animate);
        },
        
        hookIntoAjax() {
            const self = this;
            let updateTimer = null;
            
            const scheduleUpdate = () => {
                clearTimeout(updateTimer);
                updateTimer = setTimeout(() => {
                    // Znovu vytvořit elementy pokud byly smazány a pak aktualizovat cenu
                    self.createPriceElements();
                    self.updatePrice();
                }, 200);
            };
            
            // jQuery AJAX
            if (typeof jQuery !== 'undefined') {
                jQuery(document).ajaxComplete(() => {
                    console.log('[MobileCartUpdater] AJAX complete');
                    scheduleUpdate();
                });
            }
            
            // Native XHR
            const origOpen = XMLHttpRequest.prototype.open;
            XMLHttpRequest.prototype.open = function() {
                this.addEventListener('loadend', () => {
                    console.log('[MobileCartUpdater] XHR complete');
                    scheduleUpdate();
                });
                return origOpen.apply(this, arguments);
            };
            
            // Fetch API
            const origFetch = window.fetch;
            if (origFetch) {
                window.fetch = function(...args) {
                    return origFetch.apply(this, args).then(response => {
                        console.log('[MobileCartUpdater] Fetch complete');
                        scheduleUpdate();
                        return response;
                    });
                };
            }
            
            // MutationObserver - sledovat změny v košíku
            const observer = new MutationObserver((mutations) => {
                let shouldUpdate = false;
                
                for (const mutation of mutations) {
                    // Pokud se změnil obsah košíku
                    if (mutation.target.id === 'snippet--basketTotalAjax' ||
                        mutation.target.id === 'snippet--basketNavbarAjax' ||
                        mutation.target.closest('#userCartDropdown')) {
                        shouldUpdate = true;
                        break;
                    }
                    
                    // Pokud byly odstraněny naše price elementy
                    for (const node of mutation.removedNodes) {
                        if (node.nodeType === 1 && 
                            (node.classList?.contains('mobile-price-value') ||
                             node.querySelector?.('.mobile-price-value'))) {
                            console.log('[MobileCartUpdater] Price element was removed, recreating...');
                            shouldUpdate = true;
                            break;
                        }
                    }
                }
                
                if (shouldUpdate) {
                    scheduleUpdate();
                }
            });
            
            // Sledovat celý dokument pro zachycení všech změn
            observer.observe(document.body, {
                childList: true,
                subtree: true
            });
        },
        
        addStyles() {
            if (document.getElementById('mobile-cart-styles-v5')) return;
            
            const style = document.createElement('style');
            style.id = 'mobile-cart-styles-v5';
            style.textContent = `
                @media (max-width: 1200px) {
                    .mobile-price-value {
                        display: inline-block !important;
                        margin: 0 5px;
                        font-variant-numeric: tabular-nums;
                        white-space: nowrap;
                        min-width: 60px;
                        text-align: left;
                    }
                    
                    /* Skrýt v dropdown menu */
                    .dropdown-menu .mobile-price-value {
                        display: none !important;
                    }
                }
                
                @media (min-width: 1201px) {
                    .mobile-price-value {
                        display: none !important;
                    }
                }
            `;
            document.head.appendChild(style);
        }
    };
    
    // Inicializace
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', () => {
            MobileCartUpdater.init();
        });
    } else {
        setTimeout(() => MobileCartUpdater.init(), 100);
    }
    
    // Export
    window.MobileCartUpdater = MobileCartUpdater;
    
})();
