/**
 * Aktualizace mobilního košíku při AJAX změnách
 * Verze 3.1 - Plynulá animace bez mizení
 */
(function() {
    'use strict';
    
    const MobileCartUpdater = {
        priceElements: new Map(),
        
        init() {
            console.log('[MobileCartUpdater] Initializing v3.1...');
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
                    // První nastavení - bez animace
                    priceEl.textContent = ' ' + newPrice + ' ';
                    priceEl.dataset.currentPrice = newPrice;
                    console.log('[MobileCartUpdater] Initial price set:', newPrice);
                } else {
                    // Element existuje - zkontrolovat změnu
                    const oldPrice = priceEl.dataset.currentPrice;
                    if (oldPrice !== newPrice) {
                        // Cena se změnila - animovat
                        this.animatePrice(priceEl, oldPrice, newPrice);
                        priceEl.dataset.currentPrice = newPrice;
                    }
                }
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
        
        animatePrice(element, oldPriceStr, newPriceStr) {
            // Extrahovat číselné hodnoty
            const extractNumber = (str) => {
                const num = str.replace(/[^\d,.-]/g, '').replace(',', '.');
                return parseFloat(num) || 0;
            };
            
            const oldNum = extractNumber(oldPriceStr);
            const newNum = extractNumber(newPriceStr);
            
            console.log('[MobileCartUpdater] Animating from', oldNum, 'to', newNum);
            
            // Pokud nejsou čísla validní, jen vyměnit text
            if (oldNum === newNum) {
                element.textContent = ' ' + newPriceStr + ' ';
                return;
            }
            
            const duration = 600; // ms
            const fps = 30;
            const totalFrames = Math.floor(duration / (1000 / fps));
            let frame = 0;
            
            // Přidat třídu pro styling během animace
            element.classList.add('price-animating');
            
            const animate = () => {
                frame++;
                const progress = frame / totalFrames;
                
                // Easing - ease-in-out
                const eased = progress < 0.5 
                    ? 2 * progress * progress 
                    : 1 - Math.pow(-2 * progress + 2, 2) / 2;
                
                const currentNum = oldNum + (newNum - oldNum) * eased;
                
                // Formátovat zpět do českého formátu
                let formatted;
                if (currentNum % 1 === 0) {
                    formatted = Math.round(currentNum).toString();
                } else {
                    formatted = currentNum.toFixed(2).replace('.', ',');
                }
                
                element.textContent = ' ' + formatted + ' Kč ';
                
                if (frame < totalFrames) {
                    requestAnimationFrame(animate);
                } else {
                    // Nastavit finální hodnotu
                    element.textContent = ' ' + newPriceStr + ' ';
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
            
            // 1. Hook na jQuery AJAX
            if (typeof jQuery !== 'undefined') {
                jQuery(document).ajaxComplete(function(event, xhr, settings) {
                    console.log('[MobileCartUpdater] AJAX complete:', settings.url);
                    setTimeout(() => self.updateMobileCart(), 100);
                });
            }
            
            // 2. Hook na XMLHttpRequest
            const originalXHR = window.XMLHttpRequest.prototype.open;
            window.XMLHttpRequest.prototype.open = function() {
                this.addEventListener('load', function() {
                    console.log('[MobileCartUpdater] XHR complete');
                    setTimeout(() => self.updateMobileCart(), 100);
                });
                return originalXHR.apply(this, arguments);
            };
            
            // 3. Hook na fetch API
            const originalFetch = window.fetch;
            if (originalFetch) {
                window.fetch = function(...args) {
                    return originalFetch.apply(this, args).then(response => {
                        console.log('[MobileCartUpdater] Fetch complete:', args[0]);
                        setTimeout(() => self.updateMobileCart(), 100);
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
                    setTimeout(() => self.updateMobileCart(), 100);
                }
            });
            
            // Sledovat snippety
            const snippets = document.querySelectorAll('[id^="snippet--"], #userCartDropdown');
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
                        transition: transform 0.2s ease, color 0.2s ease;
                    }
                    
                    .mobile-price.price-animating {
                        color: #007bff;
                        transform: scale(1.05);
                    }
                    
                    .mobile-price.price-updated {
                        animation: flash 0.4s ease;
                    }
                    
                    /* Skrýt v rozbalovacím menu */
                    .dropdown-menu .mobile-price {
                        display: none !important;
                    }
                    
                    @keyframes flash {
                        0%, 100% {
                            background-color: transparent;
                        }
                        50% {
                            background-color: rgba(40, 167, 69, 0.15);
                            border-radius: 3px;
                            padding: 0 2px;
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
            console.log('[MobileCartUpdater] Current price elements:', this.priceElements);
            this.priceElements.forEach((el, link) => {
                console.log('Price:', el.dataset.currentPrice, 'Element:', el, 'Link:', link);
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
