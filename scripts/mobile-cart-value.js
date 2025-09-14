/**
 * Aktualizace mobilního košíku při AJAX změnách
 */
(function() {
    'use strict';
    
    const MobileCartUpdater = {
        init() {
            this.hookIntoAjax();
            this.addStyles();
        },
        
        updateMobileCart() {
            // Získat hodnotu z desktop košíku
            const desktopBtn = document.querySelector('#snippet--basketTotalAjax .btn, #userCartDropdown .btn');
            if (!desktopBtn) return;
            
            // Extrahovat cenu
            const match = desktopBtn.textContent.match(/(\d[\d\s]*)\s*Kč/);
            if (!match) return;
            
            const price = match[0].trim();
            
            // Aktualizovat mobilní košík
            const mobileLink = document.querySelector('#snippet--basketNavbarAjax a[href="/cart"]');
            if (!mobileLink) return;
            
            // Aktualizovat existující text nebo přidat nový
            let priceEl = mobileLink.querySelector('.mobile-price');
            
            if (!priceEl) {
                // Vytvořit element pro cenu
                priceEl = document.createElement('span');
                priceEl.className = 'mobile-price';
                
                // Vložit za ikonu
                const icon = mobileLink.querySelector('svg');
                if (icon) {
                    icon.after(priceEl);
                } else {
                    // Nebo před badge
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
        },
        
        hookIntoAjax() {
            const self = this;
            
            // Hook na Nette AJAX (pokud používáte nette.ajax.js)
            if (window.jQuery && window.jQuery.nette) {
                jQuery.nette.ext('mobileCartUpdate', {
                    success: function() {
                        setTimeout(() => self.updateMobileCart(), 50);
                    }
                });
            }
            
            // Hook na jQuery AJAX
            if (window.jQuery) {
                jQuery(document).ajaxComplete(function(event, xhr, settings) {
                    if (settings.url && (settings.url.includes('cart') || settings.url.includes('basket'))) {
                        setTimeout(() => self.updateMobileCart(), 50);
                    }
                });
            }
            
            // Hook na native fetch
            const originalFetch = window.fetch;
            window.fetch = function(...args) {
                return originalFetch.apply(this, args).then(response => {
                    const url = args[0].toString();
                    if (url.includes('cart') || url.includes('basket')) {
                        setTimeout(() => self.updateMobileCart(), 50);
                    }
                    return response;
                });
            };
            
            // MutationObserver pro jistotu
            const observer = new MutationObserver((mutations) => {
                for (let mutation of mutations) {
                    if (mutation.target.id === 'snippet--basketTotalAjax') {
                        // Desktop košík se změnil, aktualizovat mobilní
                        setTimeout(() => self.updateMobileCart(), 50);
                        break;
                    }
                }
            });
            
            // Sledovat desktop snippet
            const desktopSnippet = document.getElementById('snippet--basketTotalAjax');
            if (desktopSnippet) {
                observer.observe(desktopSnippet, {
                    childList: true,
                    subtree: true,
                    characterData: true
                });
            }
            
            // První aktualizace
            this.updateMobileCart();
        },
        
        addStyles() {
            const style = document.createElement('style');
            style.textContent = `
                @media (max-width: 1200px) {
                    .mobile-price {
                        color: #27ae60;
                        font-weight: 600;
                        white-space: nowrap;
                    }
                }
                @media (min-width: 1201px) {
                    .mobile-price {
                        display: none !important;
                    }
                }
            `;
            document.head.appendChild(style);
        }
    };
    
    // Čekat na jQuery a inicializovat
    function waitAndInit() {
        if (document.readyState === 'complete' || document.readyState === 'interactive') {
            // Dát stránce čas na načtení AJAX knihoven
            setTimeout(() => MobileCartUpdater.init(), 100);
        } else {
            document.addEventListener('DOMContentLoaded', () => {
                setTimeout(() => MobileCartUpdater.init(), 100);
            });
        }
    }
    
    waitAndInit();
    
    // Export pro debugging
    window.MobileCartUpdater = MobileCartUpdater;
})();
