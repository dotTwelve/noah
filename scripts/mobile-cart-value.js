/**
 * Mobile Cart Value Display for NOAH Natural Products
 * Zobrazuje celkovou hodnotu košíku na mobilních a tabletech
 * 
 * @version 1.4.0 - Opravené selektory a lepší debugging
 * @requires upgates (NOAH cart system)
 */

(function() {
    'use strict';
    
    const MobileCartValue = {
        // Konfigurace
        config: {
            maxWidth: 1200,
            elementClass: 'mobile-cart-value',
            debug: true // Zapnout pro debugging
        },
        
        observer: null,
        
        /**
         * Inicializace
         */
        init: function() {
            this.log('Initializing MobileCartValue');
            
            // Přidat styly
            this.addStyles();
            
            // Počkat na načtení upgates
            this.waitForUpgates(() => {
                // První zobrazení
                this.updateDisplay();
                
                // Nastavit observery
                this.setupObservers();
                
                // Nastavit event listenery
                this.setupEventListeners();
                
                // Reagovat na resize
                window.addEventListener('resize', () => this.updateDisplay());
            });
        },
        
        /**
         * Debug log
         */
        log: function(...args) {
            if (this.config.debug) {
                console.log('[MobileCartValue]', ...args);
            }
        },
        
        /**
         * Čekání na načtení upgates objektu
         */
        waitForUpgates: function(callback) {
            if (typeof upgates !== 'undefined') {
                callback();
            } else {
                setTimeout(() => this.waitForUpgates(callback), 100);
            }
        },
        
        /**
         * Získání hodnoty košíku
         */
        getCartValue: function() {
            // Metoda 1: Z upgates objektu
            if (typeof upgates !== 'undefined' && upgates.cart) {
                let total = 0;
                if (upgates.cart.products && Array.isArray(upgates.cart.products)) {
                    upgates.cart.products.forEach(product => {
                        if (product.price && product.price.withVat) {
                            total += product.price.withVat;
                        }
                    });
                }
                if (total > 0) {
                    this.log('Cart value from upgates:', total);
                    return total;
                }
            }
            
            // Metoda 2: Z DOM elementů
            const selectors = [
                '.uc-amount',
                '.BasketTotalPrice', 
                '#userCartDropdown2 .uc-amount',
                '#userCartDropdown .uc-amount',
                '.user-cart .uc-amount',
                '.hdr-crt-btn' // Tlačítko v hlavičce
            ];
            
            for (let selector of selectors) {
                const elements = document.querySelectorAll(selector);
                for (let element of elements) {
                    const text = element.textContent || element.innerText;
                    if (text) {
                        // Extrahovat číslo z textu
                        const match = text.match(/(\d[\d\s]*)/);
                        if (match) {
                            const value = parseFloat(match[1].replace(/\s/g, ''));
                            if (!isNaN(value) && value > 0) {
                                this.log('Cart value from DOM:', value, 'from:', selector);
                                return value;
                            }
                        }
                    }
                }
            }
            
            this.log('No cart value found');
            return 0;
        },
        
        /**
         * Aktualizace zobrazení
         */
        updateDisplay: function() {
            this.log('Updating display, window width:', window.innerWidth);
            
            // Pouze do 1200px
            if (window.innerWidth > this.config.maxWidth) {
                this.log('Window too wide, removing display');
                this.removeDisplay();
                return;
            }
            
            // Najít správný element
            const targetElement = this.findTargetElement();
            if (!targetElement) {
                this.log('Target element not found');
                return;
            }
            
            const cartValue = this.getCartValue();
            if (cartValue <= 0) {
                this.log('Cart is empty');
                this.removeDisplay();
                return;
            }
            
            // Najít nebo vytvořit span
            let valueSpan = targetElement.querySelector('.' + this.config.elementClass);
            
            if (!valueSpan) {
                valueSpan = document.createElement('span');
                valueSpan.className = this.config.elementClass;
                
                // Najít správné místo pro vložení
                const icon = targetElement.querySelector('svg, i.fa, .ic');
                
                if (icon) {
                    // Vložit za ikonu
                    if (icon.nextSibling) {
                        icon.parentNode.insertBefore(valueSpan, icon.nextSibling);
                    } else {
                        icon.parentNode.appendChild(valueSpan);
                    }
                } else {
                    // Vložit před badge nebo na konec
                    const badge = targetElement.querySelector('.badge');
                    if (badge) {
                        targetElement.insertBefore(valueSpan, badge);
                    } else {
                        targetElement.appendChild(valueSpan);
                    }
                }
                
                this.log('Created value span');
            }
            
            // Aktualizovat text
            const formattedPrice = this.formatPrice(cartValue);
            valueSpan.textContent = ` ${formattedPrice} Kč`;
            valueSpan.style.display = 'inline';
            
            this.log('Updated cart value display:', formattedPrice);
        },
        
        /**
         * Najít cílový element
         */
        findTargetElement: function() {
            // Prioritizované selektory
            const selectors = [
                '#userCartDropdown2 > a.navbar-toggler',
                '#userCartDropdown2 > a.nt-cart-ico',
                'a.nt-cart-ico[href="/cart"]',
                '.user-cart-ico > a',
                '#userCartDropdown2 a[href="/cart"]'
            ];
            
            for (let selector of selectors) {
                const element = document.querySelector(selector);
                if (element && !element.closest('.dropdown-menu')) {
                    this.log('Found target element:', selector);
                    return element;
                }
            }
            
            return null;
        },
        
        /**
         * Formátování ceny
         */
        formatPrice: function(price) {
            return Math.round(price).toString().replace(/\B(?=(\d{3})+(?!\d))/g, ' ');
        },
        
        /**
         * Odstranění zobrazení
         */
        removeDisplay: function() {
            document.querySelectorAll('.' + this.config.elementClass).forEach(el => {
                el.remove();
                this.log('Removed value span');
            });
        },
        
        /**
         * Nastavení MutationObserver
         */
        setupObservers: function() {
            const self = this;
            
            this.observer = new MutationObserver(function(mutations) {
                let shouldUpdate = false;
                
                mutations.forEach(mutation => {
                    // Sledovat změny v košíku
                    if (mutation.target.id === 'snippet--basketNavbarAjax' ||
                        mutation.target.id === 'snippet--basketFixedAjax' ||
                        mutation.target.id === 'snippet--basketTotalAjax') {
                        shouldUpdate = true;
                    }
                    
                    // Sledovat přidání nových elementů
                    mutation.addedNodes.forEach(node => {
                        if (node.nodeType === 1 && node.classList) {
                            if (node.classList.contains('uc-amount') ||
                                node.id === 'userCartDropdown2') {
                                shouldUpdate = true;
                            }
                        }
                    });
                });
                
                if (shouldUpdate) {
                    self.log('DOM changed, updating display');
                    setTimeout(() => self.updateDisplay(), 100);
                }
            });
            
            // Sledovat více elementů
            const targets = [
                document.getElementById('snippet--basketNavbarAjax'),
                document.getElementById('snippet--basketFixedAjax'),
                document.getElementById('snippet--basketTotalAjax'),
                document.body
            ];
            
            targets.forEach(target => {
                if (target) {
                    this.observer.observe(target, {
                        childList: true,
                        subtree: true,
                        characterData: true
                    });
                }
            });
            
            this.log('Observers set up');
        },
        
        /**
         * Nastavení event listenerů
         */
        setupEventListeners: function() {
            const self = this;
            
            // UPGATES eventy
            if (typeof upgates !== 'undefined' && upgates.on) {
                const events = ['cart.add', 'cart.remove', 'cart.update', 'cart', 'cartUpdate'];
                events.forEach(event => {
                    upgates.on(event, () => {
                        self.log('Upgates event:', event);
                        self.updateDisplay();
                    });
                });
            }
            
            // jQuery eventy
            if (typeof jQuery !== 'undefined') {
                jQuery(document).on('cart.updated added_to_cart removed_from_cart', () => {
                    self.log('jQuery cart event');
                    self.updateDisplay();
                });
            }
            
            // Click eventy
            document.addEventListener('click', function(e) {
                const target = e.target.closest('.AddToCartButton, .btn-to-cart, [data-action*="cart"]');
                if (target) {
                    self.log('Cart button clicked');
                    setTimeout(() => self.updateDisplay(), 1000);
                }
            });
            
            this.log('Event listeners set up');
        },
        
        /**
         * Přidání stylů
         */
        addStyles: function() {
            if (document.getElementById('mobile-cart-value-styles')) return;
            
            const styles = `
                <style id="mobile-cart-value-styles">
                    @media (max-width: 1200px) {
                        .mobile-cart-value {
                            display: inline !important;
                            font-weight: 600;
                            color: #27ae60;
                            margin-left: 8px;
                            margin-right: 8px;
                            white-space: nowrap;
                        }
                        
                        #userCartDropdown2 > a {
                            white-space: nowrap;
                            display: flex;
                            align-items: center;
                        }
                        
                        /* Skrýt při rozbalení dropdown menu */
                        #userCartDropdown2.show .mobile-cart-value,
                        .dropdown-menu .mobile-cart-value {
                            display: none !important;
                        }
                    }
                    
                    @media (min-width: 1201px) {
                        .mobile-cart-value {
                            display: none !important;
                        }
                    }
                </style>
            `;
            
            document.head.insertAdjacentHTML('beforeend', styles);
            this.log('Styles added');
        }
    };
    
    // Inicializace
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', () => MobileCartValue.init());
    } else {
        // Počkat chvíli pro načtení AJAX obsahu
        setTimeout(() => MobileCartValue.init(), 100);
    }
    
    // Export pro debugging
    window.MobileCartValue = MobileCartValue;
    
})();
