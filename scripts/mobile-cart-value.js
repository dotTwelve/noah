/**
 * Aktualizace mobilního košíku při AJAX změnách
 * Verze 2.0 - Opravená detekce knihoven
 */
(function() {
    'use strict';
    
    const MobileCartUpdater = {
        init() {
            console.log('[MobileCartUpdater] Initializing...');
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
            
            // Extrahovat cenu
            const match = desktopBtn.textContent.match(/(\d[\d\s]*)\s*Kč/);
            if (!match) {
                console.log('[MobileCartUpdater] Price not found in text:', desktopBtn.textContent);
                return;
            }
            
            const price = match[0].trim();
            
            // Najít mobilní košík
            const mobileLinks = document.querySelectorAll('#snippet--basketNavbarAjax a[href="/cart"], #userCartDropdown2 > a');
            
            mobileLinks.forEach(mobileLink => {
                if (!mobileLink || mobileLink.closest('.dropdown-menu')) {
                    return; // Skip if in dropdown menu
                }
                
                // Aktualizovat nebo přidat cenu
                let priceEl = mobileLink.querySelector('.mobile-price');
                
                if (!priceEl) {
                    priceEl = document.createElement('span');
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
                }
                
                priceEl.textContent = ' ' + price + ' ';
                console.log('[MobileCartUpdater] Updated price to:', price);
            });
        },
        
        hookIntoAjax() {
            const self = this;
            
            // 1. Hook na jQuery AJAX (nejběžnější)
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
            
            // 4. MutationObserver jako záloha
            const observer = new MutationObserver((mutations) => {
                let shouldUpdate = false;
                
                mutations.forEach(mutation => {
                    // Sledovat změny v snippetech
                    if (mutation.target.id === 'snippet--basketTotalAjax' ||
                        mutation.target.id === 'snippet--basketFixedAjax' ||
                        mutation.target.id === 'snippet--basketNavbarAjax') {
                        shouldUpdate = true;
                    }
                });
                
                if (shouldUpdate) {
                    console.log('[MobileCartUpdater] DOM mutation detected');
                    setTimeout(() => self.updateMobileCart(), 100);
                }
            });
            
            // Sledovat všechny snippety
            const snippets = document.querySelectorAll('[id^="snippet--"]');
            snippets.forEach(snippet => {
                observer.observe(snippet, {
                    childList: true,
                    subtree: true
                });
            });
            
            // Sledovat také body pro dynamicky přidané elementy
            observer.observe(document.body, {
                childList: true,
                subtree: true
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
                    }
                    
                    /* Skrýt v rozbalovacím menu */
                    .dropdown-menu .mobile-price {
                        display: none !important;
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
