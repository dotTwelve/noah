/**
 * Mobile Cart Value Display for NOAH Natural Products
 * Zobrazuje celkovou hodnotu košíku na mobilních a tabletech
 * 
 * @version 1.3.0 - Rozšířeno do 1200px, sledování dynamických změn
 * @requires upgates (NOAH cart system)
 */

(function() {
    'use strict';
    
    const MobileCartValue = {
        // Konfigurace
        config: {
            maxWidth: 1200, // Změněno z 768 na 1200
            targetSelector: '#userCartDropdown2 > a', // Přímý odkaz v dropdown
            amountSelector: '.uc-amount',
            elementClass: 'mobile-cart-value',
            currencyMap: {
                'CZK': 'Kč',
                'EUR': '€',
                'USD': '$',
                'GBP': '£'
            }
        },
        
        observer: null,
        
        /**
         * Inicializace
         */
        init: function() {
            // Přidat styly
            this.addStyles();
            
            // První zobrazení
            this.updateDisplay();
            
            // Nastavit observery pro dynamické změny
            this.setupObservers();
            
            // Nastavit event listenery
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
            return 'Kč';
        },
        
        /**
         * Získání hodnoty košíku z DOM
         */
        getCartValue: function() {
            // Najít .uc-amount element
            const amountEl = document.querySelector(this.config.amountSelector);
            
            if (amountEl) {
                const text = amountEl.textContent || amountEl.innerText;
                // Odstranit mezery, &nbsp; a další znaky
                const cleanedText = text.replace(/\s/g, '').replace(/&nbsp;/g, '').replace(/[^\d,.-]/g, '').replace(',', '.');
                const value = parseFloat(cleanedText);
                return isNaN(value) ? 0 : value;
            }
            
            return 0;
        },
        
        /**
         * Aktualizace zobrazení
         */
        updateDisplay: function() {
            // Pouze do 1200px
            if (window.innerWidth > this.config.maxWidth) {
                this.removeDisplay();
                return;
            }
            
            // Najít odkaz
            const targetLink = document.querySelector(this.config.targetSelector);
            if (!targetLink) return;
            
            const cartValue = this.getCartValue();
            const currencySymbol = this.getCurrencySymbol();
            
            // Najít nebo vytvořit span
            let valueSpan = targetLink.querySelector('.' + this.config.elementClass);
            
            if (!valueSpan) {
                valueSpan = document.createElement('span');
                valueSpan.className = this.config.elementClass;
                
                // Najít ikonu (SVG nebo i element)
                const icon = targetLink.querySelector('svg, i, .ic');
                
                if (icon && icon.nextSibling) {
                    // Vložit za ikonu
                    icon.parentNode.insertBefore(valueSpan, icon.nextSibling);
                } else {
                    // Vložit před badge nebo na konec
                    const badge = targetLink.querySelector('.badge');
                    if (badge) {
                        targetLink.insertBefore(valueSpan, badge);
                    } else {
                        targetLink.appendChild(valueSpan);
                    }
                }
            }
            
            // Zobrazit/skrýt hodnotu
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
         * Nastavení MutationObserver pro sledování AJAX změn
         */
        setupObservers: function() {
            const self = this;
            
            // Observer pro sledování změn
            this.observer = new MutationObserver(function(mutations) {
                let shouldUpdate = false;
                
                mutations.forEach(mutation => {
                    // Pokud se změnil obsah snippet--basketFixedAjax
                    if (mutation.target.id === 'snippet--basketFixedAjax') {
                        shouldUpdate = true;
                    }
                    
                    // Nebo pokud byly přidány/změněny potomci tohoto snippetu
                    mutation.addedNodes.forEach(node => {
                        if (node.nodeType === 1) {
                            if (node.id === 'userCartDropdown2' || 
                                node.querySelector && (node.querySelector('#userCartDropdown2') || node.querySelector('.uc-amount'))) {
                                shouldUpdate = true;
                            }
                        }
                    });
                    
                    // Kontrola změn textu v .uc-amount
                    if (mutation.type === 'characterData' || mutation.type === 'childList') {
                        const target = mutation.target;
                        if (target.nodeType === 1 && target.classList && target.classList.contains('uc-amount')) {
                            shouldUpdate = true;
                        }
                    }
                });
                
                if (shouldUpdate) {
                    // Krátké zpoždění pro dokončení DOM změn
                    setTimeout(() => self.updateDisplay(), 100);
                }
            });
            
            // Sledovat specificky snippet--basketFixedAjax a celý body
            const basketSnippet = document.getElementById('snippet--basketFixedAjax');
            if (basketSnippet) {
                this.observer.observe(basketSnippet, {
                    childList: true,
                    subtree: true,
                    characterData: true
                });
            }
            
            // Také sledovat body pro případné další změny
            this.observer.observe(document.body, {
                childList: true,
                subtree: true,
                characterData: true
            });
        },
        
        /**
         * Nastavení event listenerů
         */
        setupEventListeners: function() {
            const self = this;
            
            // UPGATES eventy
            if (typeof upgates !== 'undefined' && upgates.on) {
                upgates.on('cart', () => self.updateDisplay());
                upgates.on('cartUpdate', () => self.updateDisplay());
                upgates.on('addToCart', () => self.updateDisplay());
                upgates.on('removeFromCart', () => self.updateDisplay());
            }
            
            // jQuery eventy
            if (typeof jQuery !== 'undefined') {
                jQuery(document).on('cart.updated', () => self.updateDisplay());
                jQuery(document).on('added_to_cart', () => self.updateDisplay());
                jQuery(document).on('removed_from_cart', () => self.updateDisplay());
            }
            
            // Interceptování AJAX
            const originalFetch = window.fetch;
            window.fetch = function(...args) {
                return originalFetch.apply(this, args).then(response => {
                    const url = args[0].toString();
                    if (url.includes('cart') || url.includes('kosik') || url.includes('basket')) {
                        setTimeout(() => self.updateDisplay(), 100);
                    }
                    return response;
                });
            };
            
            // Click eventy na tlačítka košíku
            document.addEventListener('click', function(e) {
                const target = e.target;
                if (target.matches('.add-to-cart, .remove-from-cart, [data-action*="cart"], .btn-to-cart')) {
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
                    @media (max-width: 1200px) {
                        .mobile-cart-value {
                            display: inline;
                            font-weight: 600;
                            color: #27ae60;
                            margin-left: 8px;
                            margin-right: 8px;
                        }
                        
                        #userCartDropdown2 > a {
                            white-space: nowrap;
                            display: flex;
                            align-items: center;
                        }
                        
                        /* Skrýt při rozbalení dropdown menu */
                        #userCartDropdown2.show .mobile-cart-value {
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
        }
    };
    
    // Inicializace
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', () => MobileCartValue.init());
    } else {
        MobileCartValue.init();
    }
    
    // Export
    window.MobileCartValue = {
        update: () => MobileCartValue.updateDisplay(),
        getValue: () => MobileCartValue.getCartValue(),
        getCurrency: () => MobileCartValue.getCurrencySymbol(),
        destroy: () => {
            if (MobileCartValue.observer) {
                MobileCartValue.observer.disconnect();
            }
            MobileCartValue.removeDisplay();
        }
    };
    
})();
