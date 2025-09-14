/**
 * Aktualizace mobilního košíku při AJAX změnách
 * Verze 6.0 - Snippet-aware verze pro Nette
 */
(function() {
    'use strict';
    
    const MobileCartUpdater = {
        // Stav
        lastPrice: 0,
        priceText: '',
        
        // Selektory
        selectors: {
            desktopCart: '#snippet--basketTotalAjax .btn, #userCartDropdown .btn, .hdr-crt-btn',
            mobileLinks: [
                '#snippet--basketNavbarAjax a[href="/cart"]',
                '#snippet--basketFixedAjax a[href="/cart"]', 
                '#userCartDropdown2 > a[href="/cart"]',
                '.navbar-toggler.nt-cart-ico[href="/cart"]'
            ].join(', ')
        },
        
        // Inicializace
        init() {
            console.log('[MobileCart v6.0] Initializing...');
            
            this.addStyles();
            this.setupAjaxInterception();
            this.updatePrice();
            
            // První aplikace ceny (bez animace)
            setTimeout(() => {
                this.applyPriceToElements(true);
            }, 100);
            
            console.log('[MobileCart v6.0] Ready');
        },
        
        // Přidání stylů
        addStyles() {
            if (document.getElementById('mobile-cart-styles-v6')) return;
            
            const style = document.createElement('style');
            style.id = 'mobile-cart-styles-v6';
            style.textContent = `
                @media (max-width: 1200px) {
                    .mobile-cart-price {
                        display: inline-block !important;
                        margin: 0 6px;
                        font-variant-numeric: tabular-nums;
                        white-space: nowrap;
                    }
                    
                    /* Animace čísel */
                    @keyframes priceUpdate {
                        0% { opacity: 0.3; }
                        100% { opacity: 1; }
                    }
                    
                    .mobile-cart-price.updating {
                        animation: priceUpdate 0.6s ease;
                    }
                    
                    /* Skrýt v dropdown menu */
                    .dropdown-menu .mobile-cart-price {
                        display: none !important;
                    }
                    
                    /* Skrýt uc-amount v mobilní navigaci */
                    #snippet--basketNavbarAjax .uc-amount {
                        display: none !important;
                    }
                }
                
                @media (min-width: 1201px) {
                    .mobile-cart-price {
                        display: none !important;
                    }
                }
            `;
            document.head.appendChild(style);
        },
        
        // Nastavení AJAX interception
        setupAjaxInterception() {
            const self = this;
            
            // Pro Nette - zachytit snippet update
            if (typeof jQuery !== 'undefined') {
                // Před AJAX - uložit cenu
                jQuery(document).ajaxSend(() => {
                    self.updatePrice();
                });
                
                // Po AJAX - aplikovat cenu na nové elementy
                jQuery(document).ajaxComplete((event, xhr, settings) => {
                    console.log('[MobileCart v6.0] AJAX complete');
                    
                    // Počkat na DOM update
                    setTimeout(() => {
                        self.updatePrice();
                        self.applyPriceToElements(false);
                    }, 50);
                });
            }
            
            // Vanilla XHR jako záloha
            const origOpen = XMLHttpRequest.prototype.open;
            XMLHttpRequest.prototype.open = function() {
                this.addEventListener('loadend', () => {
                    setTimeout(() => {
                        self.updatePrice();
                        self.applyPriceToElements(false);
                    }, 50);
                });
                return origOpen.apply(this, arguments);
            };
        },
        
        // Aktualizovat cenu z desktop košíku
        updatePrice() {
            const desktopBtn = document.querySelector(this.selectors.desktopCart);
            if (!desktopBtn) return false;
            
            const match = desktopBtn.textContent.match(/([\d\s]+(?:,\d+)?)\s*Kč/);
            if (!match) return false;
            
            this.priceText = match[0].trim();
            const newPrice = parseFloat(match[1].replace(/\s/g, '').replace(',', '.'));
            
            const changed = Math.abs(this.lastPrice - newPrice) > 0.01;
            this.lastPrice = newPrice;
            
            console.log('[MobileCart v6.0] Price:', this.priceText, 'Changed:', changed);
            return changed;
        },
        
        // Aplikovat cenu na elementy
        applyPriceToElements(immediate = false) {
            if (!this.priceText) return;
            
            const mobileLinks = document.querySelectorAll(this.selectors.mobileLinks);
            
            mobileLinks.forEach((link, index) => {
                // Skip dropdown items
                if (link.closest('.dropdown-menu')) return;
                
                // Najít nebo vytvořit price element
                let priceEl = link.querySelector(':scope > .mobile-cart-price');
                
                if (!priceEl) {
                    priceEl = this.createPriceElement(link);
                    console.log('[MobileCart v6.0] Created price element for link', index);
                }
                
                // Nastavit text
                if (immediate) {
                    // Okamžitě, bez animace
                    priceEl.textContent = this.priceText;
                } else {
                    // S lehkou animací opacity
                    priceEl.classList.add('updating');
                    
                    // Použít setTimeout pro plynulou změnu
                    setTimeout(() => {
                        priceEl.textContent = this.priceText;
                    }, 50);
                    
                    setTimeout(() => {
                        priceEl.classList.remove('updating');
                    }, 650);
                }
            });
        },
        
        // Vytvořit price element
        createPriceElement(link) {
            const priceEl = document.createElement('span');
            priceEl.className = 'mobile-cart-price';
            priceEl.textContent = this.priceText || '';
            
            // Najít nejlepší pozici
            const icon = link.querySelector('svg, i.fa, .fa');
            const badge = link.querySelector('.badge');
            
            if (icon && !icon.nextElementSibling?.classList.contains('badge')) {
                icon.after(priceEl);
            } else if (badge) {
                link.insertBefore(priceEl, badge);
            } else {
                link.appendChild(priceEl);
            }
            
            return priceEl;
        }
    };
    
    // Spustit po načtení DOM
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', () => {
            MobileCartUpdater.init();
        });
    } else {
        setTimeout(() => {
            MobileCartUpdater.init();
        }, 100);
    }
    
    // Export
    window.MobileCartUpdater = MobileCartUpdater;
    
})();
