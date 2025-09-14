/**
 * Aktualizace mobilního košíku při AJAX změnách
 * Verze 3.2 - Oprava duplicit a animací
 */
(function() {
    'use strict';
    
    const MobileCartUpdater = {
        priceElements: new WeakMap(), // WeakMap pro lepší správu paměti
        
        init() {
            console.log('[MobileCartUpdater] Initializing v3.2...');
            this.hookIntoAjax();
            this.addStyles();
            // První aktualizace
            this.updateMobileCart();
        },
        
        updateMobileCart() {
            // Získat hodnotu z desktop košíku
            const desktopBtn = document.querySelector('#snippet--basketTotalAjax .btn, #userCartDropdown .btn, .hdr-crt-btn');
            if (!desktopBtn) {
                console.log('[MobileCartUpdater] Desktop button not found');
                return;
            }
            
            // Extrahovat cenu - včetně desetinných míst
            const match = desktopBtn.textContent.match(/([\d\s]+[,.]?\d*)\s*Kč/);
            if (!match) {
                console.log('[MobileCartUpdater] Price not found in text:', desktopBtn.textContent);
                return;
            }
            
            const newPrice = match[0].trim();
            console.log('[MobileCartUpdater] Detected price:', newPrice);
            
            // Najít UNIKÁTNÍ mobilní košíky (odstranit duplicity)
            const mobileLinksNodeList = document.querySelectorAll('#snippet--basketNavbarAjax a[href="/cart"], #userCartDropdown2 > a');
            const processedLinks = new Set();
            
            mobileLinksNodeList.forEach(mobileLink => {
                if (!mobileLink || mobileLink.closest('.dropdown-menu')) {
                    return; // Skip if in dropdown menu
                }
                
                // Kontrola duplicit pomocí jedinečného identifikátoru
                const linkId = this.getLinkIdentifier(mobileLink);
                if (processedLinks.has(linkId)) {
                    return; // Už zpracováno
                }
                processedLinks.add(linkId);
                
                // Získat nebo vytvořit price element
                let priceEl = mobileLink.querySelector('.mobile-price');
                
                if (!priceEl) {
                    // Element neexistuje - vytvořit
                    priceEl = this.createPriceElement(mobileLink);
                    // První nastavení - bez animace
                    priceEl.textContent = ' ' + newPrice + ' ';
                    priceEl.setAttribute('data-price-value', this.extractNumericValue(newPrice));
                    console.log('[MobileCartUpdater] Initial price set:', newPrice);
                } else {
                    // Element existuje - zkontrolovat změnu
                    const oldNumericValue = parseFloat(priceEl.getAttribute('data-price-value') || '0');
                    const newNumericValue = this.extractNumericValue(newPrice);
                    
                    if (Math.abs(oldNumericValue - newNumericValue) > 0.01) {
                        // Cena se změnila - animovat
                        console.log('[MobileCartUpdater] Price changed from', oldNumericValue, 'to', newNumericValue);
                        this.animatePrice(priceEl, oldNumericValue, newNumericValue, newPrice);
                        priceEl.setAttribute('data-price-value', newNumericValue);
                    }
                }
            });
        },
        
        getLinkIdentifier(link) {
            // Vytvoř jedinečný identifikátor na základě pozice a tříd
            const parent = link.parentElement;
            const classes = link.className;
            return `${parent?.id || 'no-id'}-${classes}`;
        },
        
        extractNumericValue(priceStr) {
            // Extrahovat číselnou hodnotu z ceny
            const cleaned = priceStr.replace(/[^\d,.-]/g, '').replace(',', '.');
            return parseFloat(cleaned) || 0;
        },
        
        createPriceElement(mobileLink) {
            const priceEl = document.createElement('span');
            priceEl.className = 'mobile-price';
            
            // Najít správné místo pro vložení
            const icon = mobileLink.querySelector('svg, i.fa');
            if (icon) {
                // Vložit za ikonu
                if (icon.nextSibling && icon.nextSibling.classList && icon.nextSibling.classList.contains('badge')) {
                    // Vložit před badge
                    icon.parentNode.insertBefore(priceEl, icon.nextSibling);
                } else {
                    // Vložit za ikonu
                    icon.after(priceEl);
                }
            } else {
                // Vložit před badge nebo na konec
                const badge = mobileLink.querySelector('.badge');
                if (badge) {
                    mobileLink.insertBefore(priceEl, badge);
                } else {
                    mobileLink.appendChild(priceEl);
                }
            }
            
            console.log('[MobileCartUpdater] Created new price element');
            return priceEl;
        },
        
        animatePrice(element, oldNum, newNum, finalText) {
            console.log('[MobileCartUpdater] Starting animation from', oldNum, 'to', newNum);
            
            const duration = 500; // ms
            const startTime = performance.now();
            
            // Určit počet desetinných míst
            const decimals = finalText.includes(',') ? 2 : 0;
            
            // Přidat třídu pro styling během animace
            element.classList.add('price-animating');
            
            const animate = (currentTime) => {
                const elapsed = currentTime - startTime;
                const progress = Math.min(elapsed / duration, 1);
                
                // Easing funkce - ease-out-cubic
                const eased = 1 - Math.pow(1 - progress, 3);
                
                const currentNum = oldNum + (newNum - oldNum) * eased;
                
                // Formátovat zpět do českého formátu
                let formatted;
                if (decimals > 0) {
                    formatted = currentNum.toFixed(decimals).replace('.', ',');
                } else {
                    formatted = Math.round(currentNum).toString();
                }
                
                element.textContent = ' ' + formatted + ' Kč ';
                
                if (progress < 1) {
                    requestAnimationFrame(animate);
                } else {
                    // Nastavit finální hodnotu
                    element.textContent = ' ' + finalText + ' ';
                    element.classList.remove('price-animating');
                    
                    // Flash efekt na konci
                    element.classList.add('price-updated');
                    setTimeout(() => {
                        element.classList.remove('price-updated');
                    }, 400);
                }
            };
            
            requestAnimationFrame(animate);
        },
        
        hookIntoAjax() {
            const self = this;
            
            // Debounce funkce pro zabránění vícenásobným voláním
            let updateTimeout;
            const debouncedUpdate = () => {
                clearTimeout(updateTimeout);
                updateTimeout = setTimeout(() => self.updateMobileCart(), 100);
            };
            
            // 1. Hook na jQuery AJAX
            if (typeof jQuery !== 'undefined') {
                jQuery(document).ajaxComplete(function(event, xhr, settings) {
                    console.log('[MobileCartUpdater] AJAX complete:', settings.url);
                    debouncedUpdate();
                });
            }
            
            // 2. Hook na XMLHttpRequest
            const originalXHR = window.XMLHttpRequest.prototype.open;
            window.XMLHttpRequest.prototype.open = function() {
                this.addEventListener('load', function() {
                    console.log('[MobileCartUpdater] XHR complete');
                    debouncedUpdate();
                });
                return originalXHR.apply(this, arguments);
            };
            
            // 3. Hook na fetch API
            const originalFetch = window.fetch;
            if (originalFetch) {
                window.fetch = function(...args) {
                    return originalFetch.apply(this, args).then(response => {
                        console.log('[MobileCartUpdater] Fetch complete:', args[0]);
                        debouncedUpdate();
                        return response;
                    });
                };
            }
            
            // 4. MutationObserver pro zachycení DOM změn
            const observer = new MutationObserver((mutations) => {
                let shouldUpdate = false;
                
                mutations.forEach(mutation => {
                    // Sledovat změny v snippetech
                    if (mutation.target.id === 'snippet--basketTotalAjax' ||
                        mutation.target.id === 'snippet--basketFixedAjax' ||
                        mutation.target.id === 'userCartDropdown') {
                        shouldUpdate = true;
                    }
                });
                
                if (shouldUpdate) {
                    console.log('[MobileCartUpdater] DOM mutation detected');
                    debouncedUpdate();
                }
            });
            
            // Sledovat snippety
            const snippets = document.querySelectorAll('[id^="snippet--basketTotalAjax"], #userCartDropdown');
            snippets.forEach(snippet => {
                observer.observe(snippet, {
                    childList: true,
                    subtree: true
                });
            });
            
            console.log('[MobileCartUpdater] AJAX hooks installed');
        },
        
        addStyles() {
            if (document.getElementById('mobile-cart-updater-styles')) return;
            
            const style = document.createElement('style');
            style.id = 'mobile-cart-updater-styles';
            style.textContent = `
                @media (max-width: 1200px) {
                    .mobile-price {
                        white-space: nowrap;
                        display: inline-block !important;
                        font-variant-numeric: tabular-nums;
                        transition: color 0.3s ease;
                    }
                    
                    .mobile-price.price-animating {
                        color: #007bff !important;
                        font-weight: 600;
                    }
                    
                    .mobile-price.price-updated {
                        animation: priceFlash 0.4s ease;
                    }
                    
                    /* Skrýt v rozbalovacím menu */
                    .dropdown-menu .mobile-price {
                        display: none !important;
                    }
                    
                    @keyframes priceFlash {
                        0% {
                            background: transparent;
                        }
                        50% {
                            background: rgba(40, 167, 69, 0.2);
                            border-radius: 3px;
                            padding: 0 3px;
                        }
                        100% {
                            background: transparent;
                        }
                    }
                }
                
                @media (min-width: 1201px) {
                    .mobile-price {
                        display: none !important;
                    }
                }
            `;
            document.head.appendChild(style);
            console.log('[MobileCartUpdater] Styles added');
        },
        
        // Pomocná metoda pro debugging
        debug() {
            const elements = document.querySelectorAll('.mobile-price');
            console.log('[MobileCartUpdater] Found price elements:', elements.length);
            elements.forEach(el => {
                console.log('Element:', el, 'Value:', el.getAttribute('data-price-value'), 'Text:', el.textContent);
            });
        }
    };
    
    // Inicializace
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', () => {
            setTimeout(() => MobileCartUpdater.init(), 200);
        });
    } else {
        setTimeout(() => MobileCartUpdater.init(), 200);
    }
    
    // Export pro debugging
    window.MobileCartUpdater = MobileCartUpdater;
    
})();
