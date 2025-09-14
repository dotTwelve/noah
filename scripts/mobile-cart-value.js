/**
 * Aktualizace mobilního košíku při AJAX změnách
 * Verze 3.0 - Plynulá aktualizace bez blikání
 */
(function() {
    'use strict';
    
    const MobileCartUpdater = {
        currentPrice: null,
        priceElements: new Map(), // Uchování reference na price elementy
        
        init() {
            console.log('[MobileCartUpdater] Initializing v3.0...');
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
            
            // Pokud se cena nezměnila, nic nedělat
            if (this.currentPrice === newPrice) {
                console.log('[MobileCartUpdater] Price unchanged:', newPrice);
                return;
            }
            
            const oldPrice = this.currentPrice;
            this.currentPrice = newPrice;
            
            // Najít mobilní košík
            const mobileLinks = document.querySelectorAll('#snippet--basketNavbarAjax a[href="/cart"], #userCartDropdown2 > a');
            
            mobileLinks.forEach(mobileLink => {
                if (!mobileLink || mobileLink.closest('.dropdown-menu')) {
                    return; // Skip if in dropdown menu
                }
                
                // Získat nebo vytvořit price element
                let priceEl = this.priceElements.get(mobileLink);
                
                if (!priceEl || !mobileLink.contains(priceEl)) {
                    // Element neexistuje nebo byl odstraněn z DOM
                    priceEl = this.createPriceElement(mobileLink);
                    this.priceElements.set(mobileLink, priceEl);
                }
                
                // Aktualizovat cenu s animací
                this.animatePriceChange(priceEl, oldPrice, newPrice);
            });
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
        
        animatePriceChange(element, oldPrice, newPrice) {
            if (!oldPrice) {
                // První nastavení ceny - bez animace
                element.textContent = ' ' + newPrice + ' ';
                element.classList.add('price-initialized');
                console.log('[MobileCartUpdater] Initial price set:', newPrice);
            } else {
                // Změna ceny - s animací
                element.classList.add('price-updating');
                
                // Postupná změna opacity
                element.style.opacity = '0.3';
                
                setTimeout(() => {
                    element.textContent = ' ' + newPrice + ' ';
                    element.style.opacity = '1';
                    element.classList.add('price-changed');
                    
                    // Pulzující efekt pro upozornění na změnu
                    setTimeout(() => {
                        element.classList.remove('price-changed');
                        element.classList.remove('price-updating');
                    }, 600);
                }, 150);
                
                console.log('[MobileCartUpdater] Price updated from', oldPrice, 'to', newPrice);
            }
        },
        
        hookIntoAjax() {
            const self = this;
            
            // 1. Hook na jQuery AJAX
            if (typeof jQuery !== 'undefined') {
                jQuery(document).ajaxComplete(function(event, xhr, settings) {
                    console.log('[MobileCartUpdater] AJAX complete:', settings.url);
                    // Kratší zpoždění pro rychlejší odezvu
                    setTimeout(() => self.updateMobileCart(), 50);
                });
            }
            
            // 2. Hook na XMLHttpRequest
            const originalXHR = window.XMLHttpRequest.prototype.open;
            window.XMLHttpRequest.prototype.open = function() {
                this.addEventListener('load', function() {
                    console.log('[MobileCartUpdater] XHR complete');
                    setTimeout(() => self.updateMobileCart(), 50);
                });
                return originalXHR.apply(this, arguments);
            };
            
            // 3. Hook na fetch API
            const originalFetch = window.fetch;
            if (originalFetch) {
                window.fetch = function(...args) {
                    return originalFetch.apply(this, args).then(response => {
                        console.log('[MobileCartUpdater] Fetch complete:', args[0]);
                        setTimeout(() => self.updateMobileCart(), 50);
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
                        mutation.target.id === 'snippet--basketNavbarAjax' ||
                        mutation.target.id === 'userCartDropdown') {
                        shouldUpdate = true;
                    }
                    
                    // Sledovat změny textu v desktop košíku
                    if (mutation.type === 'characterData' && 
                        mutation.target.parentElement && 
                        mutation.target.parentElement.closest('.btn')) {
                        shouldUpdate = true;
                    }
                });
                
                if (shouldUpdate) {
                    console.log('[MobileCartUpdater] DOM mutation detected');
                    setTimeout(() => self.updateMobileCart(), 50);
                }
            });
            
            // Sledovat snippety
            const snippets = document.querySelectorAll('[id^="snippet--"], #userCartDropdown');
            snippets.forEach(snippet => {
                observer.observe(snippet, {
                    childList: true,
                    subtree: true,
                    characterData: true
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
                        display: inline !important;
                        transition: color 0.3s ease;
                        font-variant-numeric: tabular-nums;
                        letter-spacing: 0.5px;
                    }
                    
                    .mobile-price.price-initialized {
                        animation: fadeIn 0.3s ease;
                    }
                    
                    .mobile-price.price-updating {
                        color: #007bff;
                        font-weight: 600;
                    }
                    
                    .mobile-price.price-changed {
                        animation: highlight 0.3s ease;
                    }
                    
                    /* Skrýt v rozbalovacím menu */
                    .dropdown-menu .mobile-price {
                        display: none !important;
                    }
                    
                    @keyframes fadeIn {
                        from {
                            opacity: 0;
                            transform: translateY(-2px);
                        }
                        to {
                            opacity: 1;
                            transform: translateY(0);
                        }
                    }
                    
                    @keyframes highlight {
                        0% {
                            background: linear-gradient(90deg, transparent, rgba(40, 167, 69, 0.1), transparent);
                            background-size: 200% 100%;
                            background-position: -100% 0;
                        }
                        100% {
                            background-position: 100% 0;
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
        
        // Pomocná metoda pro ruční refresh (pro debugging)
        refresh() {
            this.currentPrice = null; // Vynutit aktualizaci
            this.updateMobileCart();
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
