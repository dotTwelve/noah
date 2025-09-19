/**
 * Aktualizace mobilního košíku při AJAX změnách
 * Verze 6.1 - Čte cenu z uc-amount elementu
 */
(function() {
    'use strict';
    
    const MobileCartUpdater = {
        // Konfigurace
        config: {
            // Breakpointy pro dokumentaci
            breakpoints: {
                xs: 0,      // výchozí - 1 článek
                sm: 576,    // 2 články
                md: 768,    // 2 články  
                lg: 992,    // 3 články
                xl: 1204,   // 3 články - desktop breakpoint
                xxl: 1502   // 3 články
            }
            // Poznámka: Desktop je od xl breakpointu (1204px), pod tím je mobilní
        },
        
        // Stav
        lastPrice: 0,
        priceText: '',
        
        // Selektory
        selectors: {
            // Čteme z uc-amount elementu v UserCart
            priceSource: '#snippet--basketTotalAjax .uc-amount, #snippet--basketNavbarAjax .uc-amount',
            // Všechny UserCart komponenty kde zobrazujeme cenu
            cartComponents: [
                '#snippet--basketTotalAjax #userCart',           // Desktop dropdown toggle
                '#snippet--basketNavbarAjax #userCartDropdown2'  // Mobilní
            ].join(', ')
        },
        
        // Inicializace
        init() {
            console.log('[MobileCart v6.1] Initializing...');
            
            this.addStyles();
            this.setupAjaxInterception();
            this.updatePrice();
            
            // První aplikace ceny (bez animace)
            setTimeout(() => {
                this.applyPriceToElements(true);
            }, 100);
            
            console.log('[MobileCart v6.1] Ready');
        },
        
        // Přidání stylů
        addStyles() {
            if (document.getElementById('mobile-cart-styles-v6')) return;
            
            const style = document.createElement('style');
            style.id = 'mobile-cart-styles-v6';
            style.textContent = `
                /* Mobilní (do 1203px) */
                @media (max-width: 1203px) {
                    .mobile-cart-price {
                        display: inline-block !important;
                        margin: 0 6px;
                        font-variant-numeric: tabular-nums;
                        white-space: nowrap;
                    }
                    
                    /* Skrýt původní uc-amount v mobilní navigaci */
                    #snippet--basketNavbarAjax .uc-amount {
                        display: none !important;
                    }
                }
                
                /* Desktop (od 1204px - xl breakpoint) */
                @media (min-width: 1204px) {
                    .mobile-cart-price {
                        display: inline-block !important;
                        margin: 0 6px;
                        font-variant-numeric: tabular-nums;
                        white-space: nowrap;
                    }
                    
                    /* Skrýt původní uc-amount v desktop košíku */
                    #snippet--basketTotalAjax .uc-amount {
                        display: none !important;
                    }
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
                    console.log('[MobileCart v6.1] AJAX complete');
                    
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
        
        // Aktualizovat cenu z uc-amount elementu
        updatePrice() {
            const priceElement = document.querySelector(this.selectors.priceSource);
            if (!priceElement) {
                console.log('[MobileCart v6.1] No uc-amount element found');
                return false;
            }
            
            // Získat text přímo z uc-amount
            const priceText = priceElement.textContent.trim();
            if (!priceText) {
                console.log('[MobileCart v6.1] Empty uc-amount text');
                return false;
            }
            
            // Extrahovat číslo pro porovnání změn
            const match = priceText.match(/([\d\s]+(?:,\d+)?)/);
            const newPrice = match ? parseFloat(match[1].replace(/\s/g, '').replace(',', '.')) : 0;
            
            const changed = Math.abs(this.lastPrice - newPrice) > 0.01;
            this.lastPrice = newPrice;
            this.priceText = priceText;
            
            console.log('[MobileCart v6.1] Price from uc-amount:', this.priceText, 'Changed:', changed);
            return changed;
        },
        
        // Aplikovat cenu na elementy
        applyPriceToElements(immediate = false) {
            if (!this.priceText) return;
            
            const cartLinks = document.querySelectorAll(this.selectors.cartComponents);
            
            cartLinks.forEach((link, index) => {
                // Skip dropdown items
                if (link.closest('.dropdown-menu')) return;
                
                // Najít nebo vytvořit price element
                let priceEl = link.querySelector(':scope > .mobile-cart-price');
                
                if (!priceEl) {
                    priceEl = this.createPriceElement(link);
                    console.log('[MobileCart v6.1] Created price element for cart component', index);
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
            
            // Pokud je to userCartDropdown2, odstranit ico-* třídy
            if (link.id === 'userCartDropdown2') {
                const classes = Array.from(link.classList);
                classes.forEach(cls => {
                    if (cls.startsWith('ico-')) {
                        link.classList.remove(cls);
                        console.log('[MobileCart v6.1] Removed class:', cls, 'from userCartDropdown2');
                    }
                });
            }
            
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
