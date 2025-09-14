/**
 * Mobile Cart Value Display for NOAH Natural Products
 * Zobrazuje celkovou hodnotu košíku v dropdown menu na mobilních zařízeních
 * 
 * @version 1.0.0
 * @requires upgates (NOAH cart system)
 */

(function() {
    'use strict';
    
    const MobileCartValue = {
        // Konfigurace
        config: {
            maxWidth: 768,
            targetSelector: '#userCartDropdown2',
            currencySymbol: 'Kč',
            decimalSeparator: ',',
            thousandsSeparator: ' ',
            elementClass: 'mobile-cart-value',
            debug: false
        },
        
        // Stav
        observer: null,
        isInitialized: false,
        
        /**
         * Inicializace modulu
         */
        init: function() {
            if (this.isInitialized) return;
            
            this.log('Inicializace Mobile Cart Value');
            
            // Přidat styly
            this.addStyles();
            
            // První aktualizace
            this.updateDisplay();
            
            // Nastavit observery
            this.setupObservers();
            
            // Reagovat na změnu velikosti okna
            this.setupResizeHandler();
            
            this.isInitialized = true;
            this.log('Mobile Cart Value inicializován', 'success');
        },
        
        /**
         * Logging
         */
        log: function(message, type = 'info') {
            if (!this.config.debug) return;
            
            const styles = {
                info: 'color: #3498db',
                success: 'color: #27ae60',
                error: 'color: #e74c3c'
            };
            
            console.log(`%c[MobileCartValue] ${message}`, styles[type] || '');
        },
        
        /**
         * Formátování ceny
         */
        formatPrice: function(price) {
            const parts = price.toFixed(2).split('.');
            parts[0] = parts[0].replace(/\B(?=(\d{3})+(?!\d))/g, this.config.thousandsSeparator);
            const formatted = parts.join(this.config.decimalSeparator);
            return formatted.replace(/,00$/, '');
        },
        
        /**
         * Získání hodnoty košíku z dataLayer
         */
        getCartValueFromDataLayer: function() {
            if (typeof upgates !== 'undefined' && upgates.cart && upgates.cart.products) {
                let total = 0;
                
                upgates.cart.products.forEach(product => {
                    if (product.price && product.price.withVat && product.quantity) {
                        total += product.price.withVat * product.quantity;
                    }
                });
                
                this.log(`Hodnota z dataLayer: ${total}`);
                return total;
            }
            return null;
        },
        
        /**
         * Získání hodnoty košíku z DOM
         */
        getCartValueFromDOM: function() {
            const amountElement = document.querySelector('.uc-amount');
            if (amountElement) {
                const text = amountElement.textContent || amountElement.innerText;
                const cleanedText = text.replace(/[^\d,.-]/g, '').replace(',', '.');
                const value = parseFloat(cleanedText);
                
                if (!isNaN(value)) {
                    this.log(`Hodnota z DOM: ${value}`);
                    return value;
                }
            }
            return null;
        },
        
        /**
         * Získání celkové hodnoty košíku
         */
        getCartValue: function() {
            let value = this.getCartValueFromDataLayer();
            
            if (value === null || value === 0) {
                value = this.getCartValueFromDOM();
            }
            
            return value;
        },
        
        /**
         * Aktualizace zobrazení
         */
        updateDisplay: function() {
            // Kontrola, zda jsme na mobilu
            if (window.innerWidth > this.config.maxWidth) {
                this.removeDisplay();
                return;
            }
            
            const targetElement = document.querySelector(this.config.targetSelector);
            if (!targetElement) {
                this.log('Target element nenalezen', 'error');
                return;
            }
            
            const cartValue = this.getCartValue();
            
            // Najít nebo vytvořit element
            let valueElement = targetElement.querySelector('.' + this.config.elementClass);
            
            if (!valueElement) {
                valueElement = document.createElement('div');
                valueElement.className = this.config.elementClass;
                
                // Vložit na začátek dropdown menu
                if (targetElement.firstChild) {
                    targetElement.insertBefore(valueElement, targetElement.firstChild);
                } else {
                    targetElement.appendChild(valueElement);
                }
            }
            
            // Aktualizovat hodnotu
            if (cartValue !== null && cartValue > 0) {
                valueElement.innerHTML = `
                    <div class="cart-total-label">Celkem v košíku:</div>
                    <div class="cart-total-value">${this.formatPrice(cartValue)} ${this.config.currencySymbol}</div>
                `;
                valueElement.style.display = 'block';
                this.log(`Zobrazena hodnota: ${cartValue}`);
            } else {
                valueElement.style.display = 'none';
                this.log('Košík je prázdný');
            }
        },
        
        /**
         * Odstranění zobrazení
         */
        removeDisplay: function() {
            const elements = document.querySelectorAll('.' + this.config.elementClass);
            elements.forEach(element => element.remove());
        },
        
        /**
         * Nastavení observerů
         */
        setupObservers: function() {
            const self = this;
            
            // MutationObserver pro sledování změn
            this.observer = new MutationObserver(function(mutations) {
                let shouldUpdate = false;
                
                mutations.forEach(mutation => {
                    // Kontrola relevantních změn
                    const target = mutation.target;
                    
                    if (target.nodeType === 1) { // Element node
                        // Kontrola změn v košíku nebo dropdown
                        if (target.classList && 
                            (target.classList.contains('uc-amount') ||
                             target.closest('.uc-amount') ||
                             target.id === 'userCartDropdown2' ||
                             target.closest('#userCartDropdown2'))) {
                            shouldUpdate = true;
                        }
                    }
                    
                    // Kontrola přidaných nodů
                    mutation.addedNodes.forEach(node => {
                        if (node.nodeType === 1 && node.querySelector) {
                            if (node.classList && 
                                (node.classList.contains('uc-amount') ||
                                 node.querySelector('.uc-amount'))) {
                                shouldUpdate = true;
                            }
                        }
                    });
                });
                
                if (shouldUpdate) {
                    self.log('Detekována změna košíku');
                    self.updateDisplay();
                }
            });
            
            // Sledovat celý body
            this.observer.observe(document.body, {
                childList: true,
                subtree: true,
                characterData: true,
                attributes: true,
                attributeFilter: ['class', 'style']
            });
            
            // Upgates event listenery
            if (typeof upgates !== 'undefined' && upgates.on) {
                upgates.on('cart', () => this.updateDisplay());
                upgates.on('cartUpdate', () => this.updateDisplay());
                upgates.on('addToCart', () => this.updateDisplay());
                upgates.on('removeFromCart', () => this.updateDisplay());
            }
            
            // Interceptování AJAX požadavků
            this.interceptAjax();
        },
        
        /**
         * Interceptování AJAX požadavků
         */
        interceptAjax: function() {
            const self = this;
            
            // Fetch API
            const originalFetch = window.fetch;
            window.fetch = function(...args) {
                return originalFetch.apply(this, args).then(response => {
                    if (args[0] && args[0].toString().match(/cart|kosik|add-to-cart/i)) {
                        setTimeout(() => self.updateDisplay(), 50);
                    }
                    return response;
                });
            };
            
            // XMLHttpRequest
            const originalOpen = XMLHttpRequest.prototype.open;
            XMLHttpRequest.prototype.open = function(method, url) {
                this.addEventListener('load', function() {
                    if (url && url.match(/cart|kosik|add-to-cart/i)) {
                        setTimeout(() => self.updateDisplay(), 50);
                    }
                });
                return originalOpen.apply(this, arguments);
            };
        },
        
        /**
         * Handler pro změnu velikosti okna
         */
        setupResizeHandler: function() {
            let resizeTimeout;
            window.addEventListener('resize', () => {
                clearTimeout(resizeTimeout);
                resizeTimeout = setTimeout(() => this.updateDisplay(), 250);
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
                            padding: 12px 15px;
                            background: linear-gradient(135deg, #f8f9fa 0%, #e9ecef 100%);
                            border-bottom: 2px solid #dee2e6;
                            text-align: center;
                            font-size: 14px;
                            box-shadow: 0 2px 4px rgba(0,0,0,0.05);
                        }
                        
                        .mobile-cart-value .cart-total-label {
                            color: #6c757d;
                            font-size: 12px;
                            margin-bottom: 4px;
                            text-transform: uppercase;
                            letter-spacing: 0.5px;
                        }
                        
                        .mobile-cart-value .cart-total-value {
                            color: #27ae60;
                            font-size: 18px;
                            font-weight: 700;
                        }
                        
                        #userCartDropdown2 .mobile-cart-value:first-child {
                            border-top: none;
                            margin-bottom: 10px;
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
        },
        
        /**
         * Destruktor
         */
        destroy: function() {
            if (this.observer) {
                this.observer.disconnect();
                this.observer = null;
            }
            
            this.removeDisplay();
            
            const styles = document.getElementById('mobile-cart-value-styles');
            if (styles) {
                styles.remove();
            }
            
            this.isInitialized = false;
            this.log('Mobile Cart Value zničen');
        },
        
        /**
         * Debug funkce
         */
        debug: function(enabled = true) {
            this.config.debug = enabled;
            this.log('Debug mód ' + (enabled ? 'zapnut' : 'vypnut'));
        }
    };
    
    // Inicializace při načtení DOM
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', () => MobileCartValue.init());
    } else {
        MobileCartValue.init();
    }
    
    // Export pro globální použití
    window.MobileCartValue = MobileCartValue;
    
})();
