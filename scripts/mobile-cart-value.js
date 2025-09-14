/**
 * Mobile Cart Value Display for NOAH Natural Products
 * Zobrazuje celkovou hodnotu košíku na mobilních zařízeních
 * 
 * @version 1.2.0 - Dynamická měna z upgates.currency
 * @requires upgates (NOAH cart system)
 */

(function() {
    'use strict';
    
    const MobileCartValue = {
        // Konfigurace
        config: {
            maxWidth: 768,
            targetSelector: '#userCartDropdown2',
            elementClass: 'mobile-cart-value',
            currencyMap: {
                'CZK': 'Kč',
                'EUR': '€',
                'USD': '$',
                'GBP': '£'
            }
        },
        
        /**
         * Inicializace
         */
        init: function() {
            // Přidat styly
            this.addStyles();
            
            // První zobrazení
            this.updateDisplay();
            
            // Nastavit event listenery pro upgates systém
            this.setupEventListeners();
            
            // Reagovat na resize
            window.addEventListener('resize', () => this.updateDisplay());
        },
        
        /**
         * Formátování ceny
         */
        formatPrice: function(price) {
            return price.toFixed(0).replace(/\B(?=(\d{3})+(?!\d))/g, ' ');
        },
        
        /**
         * Získání symbolu měny
         */
        getCurrencySymbol: function() {
            // Získat měnu z upgates
            if (typeof upgates !== 'undefined' && upgates.currency) {
                return this.config.currencyMap[upgates.currency] || upgates.currency;
            }
            return 'Kč'; // Výchozí měna
        },
        
        /**
         * Získání hodnoty košíku
         */
        getCartValue: function() {
            // Získat hodnotu z DOM elementu .uc-amount (vždy aktuální)
            const amountEl = document.querySelector('.uc-amount');
            if (amountEl) {
                const text = amountEl.textContent || amountEl.innerText;
                // Odstranit všechny nečíselné znaky kromě čárky a tečky
                const cleanedText = text.replace(/[^\d,.-]/g, '').replace(',', '.');
                const value = parseFloat(cleanedText);
                return isNaN(value) ? 0 : value;
            }
            
            return 0;
        },
        
        /**
         * Aktualizace zobrazení
         */
        updateDisplay: function() {
            // Pouze na mobilu
            if (window.innerWidth > this.config.maxWidth) {
                this.removeDisplay();
                return;
            }
            
            // Najít odkaz
            const targetLink = document.querySelector(this.config.targetSelector + ' a');
            if (!targetLink) return;
            
            const cartValue = this.getCartValue();
            const currencySymbol = this.getCurrencySymbol();
            
            // Najít nebo vytvořit span
            let valueSpan = targetLink.querySelector('.' + this.config.elementClass);
            
            if (!valueSpan) {
                valueSpan = document.createElement('span');
                valueSpan.className = this.config.elementClass;
                
                // Vložit za ikonu nebo na konec
                const icon = targetLink.querySelector('i, svg, .icon');
                if (icon && icon.nextSibling) {
                    icon.parentNode.insertBefore(valueSpan, icon.nextSibling);
                } else {
                    targetLink.appendChild(valueSpan);
                }
            }
            
            // Zobrazit/skrýt hodnotu BEZ ZÁVOREK
            if (cartValue > 0) {
                valueSpan.textContent = ` ${this.formatPrice(cartValue)} ${currencySymbol}`;
                valueSpan.style.display = 'inline';
            } else {
                valueSpan.style.display = 'none';
            }
        },
        
        /**
         * Odstranění zobrazení
         */
        removeDisplay: function() {
            document.querySelectorAll('.' + this.config.elementClass).forEach(el => el.remove());
        },
        
        /**
         * Nastavení event listenerů
         */
        setupEventListeners: function() {
            const self = this;
            
            // 1. UPGATES EVENTY - hlavní způsob aktualizace
            if (typeof upgates !== 'undefined' && upgates.on) {
                upgates.on('cart', () => self.updateDisplay());
                upgates.on('cartUpdate', () => self.updateDisplay());
                upgates.on('addToCart', () => self.updateDisplay());
                upgates.on('removeFromCart', () => self.updateDisplay());
            }
            
            // 2. JQUERY EVENTY - pokud používáte jQuery pro košík
            if (typeof jQuery !== 'undefined') {
                jQuery(document).on('cart.updated', () => self.updateDisplay());
                jQuery(document).on('added_to_cart', () => self.updateDisplay());
                jQuery(document).on('removed_from_cart', () => self.updateDisplay());
            }
            
            // 3. INTERCEPTOVÁNÍ AJAX - zachytí všechny požadavky na košík
            const originalFetch = window.fetch;
            window.fetch = function(...args) {
                return originalFetch.apply(this, args).then(response => {
                    const url = args[0].toString();
                    if (url.includes('cart') || url.includes('kosik')) {
                        setTimeout(() => self.updateDisplay(), 100);
                    }
                    return response;
                });
            };
            
            // 4. CUSTOM EVENTY - můžete volat odkudkoliv
            document.addEventListener('cartValueUpdate', () => self.updateDisplay());
            
            // 5. CLICK EVENTY - aktualizace při kliknutí na tlačítka košíku
            document.addEventListener('click', function(e) {
                const target = e.target;
                if (target.matches('.add-to-cart, .remove-from-cart, [data-action*="cart"]')) {
                    setTimeout(() => self.updateDisplay(), 500);
                }
            });
        },
        
        /**
         * Přidání stylů
         */
        addStyles: function() {
            if (document.getElementById('mobile-cart-value-styles')) return;
            
            const styles = `
                <style id="mobile-cart-value-styles">
                    @media (max-width: 768px) {
                        .mobile-cart-value {
                            display: inline;
                            font-weight: 600;
                            color: #27ae60;
                            margin-left: 8px;
                        }
                        
                        #userCartDropdown2 a {
                            white-space: nowrap;
                            display: flex;
                            align-items: center;
                        }
                    }
                    
                    @media (min-width: 769px) {
                        .mobile-cart-value {
                            display: none !important;
                        }
                    }
                </style>
            `;
            
            document.head.insertAdjacentHTML('beforeend', styles);
        }
    };
    
    // Inicializace
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', () => MobileCartValue.init());
    } else {
        MobileCartValue.init();
    }
    
    // Export + pomocné funkce
    window.MobileCartValue = {
        update: () => MobileCartValue.updateDisplay(),
        getValue: () => MobileCartValue.getCartValue(),
        getCurrency: () => MobileCartValue.getCurrencySymbol(),
        destroy: () => MobileCartValue.removeDisplay()
    };
    
})();
