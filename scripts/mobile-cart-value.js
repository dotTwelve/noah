/**
 * Aktualizace mobilního košíku při AJAX změnách
 * Verze 4.1 - Stabilní elementy s funkční animací
 */
(function() {
    'use strict';
    
    // Jednoduchá implementace CountUp efektu
    class SimpleCountUp {
        constructor(element, endVal, options = {}) {
            this.element = element;
            this.endVal = endVal;
            this.options = {
                duration: options.duration || 0.5,
                separator: options.separator || ' ',
                decimal: options.decimal || ',',
                suffix: options.suffix || ''
            };
            this.startVal = 0;
            this.frameVal = 0;
        }
        
        start(callback) {
            // Získat startovní hodnotu z elementu
            const currentText = this.element.textContent;
            const match = currentText.match(/([\d\s]+[,.]?\d*)/);
            if (match) {
                this.startVal = parseFloat(match[0].replace(/\s/g, '').replace(',', '.')) || 0;
            }
            
            const startTime = performance.now();
            const duration = this.options.duration * 1000;
            
            const count = (timestamp) => {
                const progress = Math.min((timestamp - startTime) / duration, 1);
                
                // Easing
                const easeOutQuart = 1 - Math.pow(1 - progress, 4);
                
                this.frameVal = this.startVal + (this.endVal - this.startVal) * easeOutQuart;
                
                // Format number
                const formattedVal = this.formatNumber(this.frameVal);
                this.element.textContent = formattedVal + this.options.suffix;
                
                if (progress < 1) {
                    requestAnimationFrame(count);
                } else {
                    // Finální hodnota
                    this.element.textContent = this.formatNumber(this.endVal) + this.options.suffix;
                    if (callback) callback();
                }
            };
            
            requestAnimationFrame(count);
        }
        
        formatNumber(num) {
            const parts = num.toFixed(2).split('.');
            let intPart = parts[0];
            const decPart = parts[1];
            
            // Přidat mezery jako tisícové oddělovače
            intPart = intPart.replace(/\B(?=(\d{3})+(?!\d))/g, this.options.separator);
            
            // Pokud je číslo celé, nepoužívat desetinná místa
            if (Math.floor(num) === num) {
                return intPart;
            } else {
                return intPart + this.options.decimal + decPart;
            }
        }
    }
    
    const MobileCartUpdater = {
        lastPrice: null,
        initialized: false,
        
        init() {
            if (this.initialized) return;
            this.initialized = true;
            
            console.log('[MobileCartUpdater] Initializing v4.1...');
            this.addStyles();
            this.ensureElements();
            this.hookIntoAjax();
            this.updateMobileCart(true); // První update bez animace
        },
        
        ensureElements() {
            // Vytvořit elementy POUZE pokud neexistují
            const mobileLinks = document.querySelectorAll(
                '#snippet--basketNavbarAjax > a[href="/cart"], ' +
                '#userCartDropdown2 > a[href="/cart"], ' +
                '.navbar-toggler.nt-cart-ico[href="/cart"]'
            );
            
            mobileLinks.forEach((link, index) => {
                // Skip dropdown items
                if (link.closest('.dropdown-menu')) {
                    return;
                }
                
                // Označit link unikátním ID
                if (!link.hasAttribute('data-cart-id')) {
                    link.setAttribute('data-cart-id', `cart-${index}`);
                }
                
                // Zkontrolovat existenci elementu
                let priceEl = link.querySelector('.mobile-price-display');
                if (!priceEl) {
                    priceEl = this.createPriceElement(link);
                    console.log('[MobileCartUpdater] Created element for cart', index);
                }
            });
        },
        
        updateMobileCart(skipAnimation = false) {
            // Získat hodnotu z desktop košíku
            const desktopBtn = document.querySelector('#snippet--basketTotalAjax .btn, #userCartDropdown .btn, .hdr-crt-btn');
            if (!desktopBtn) {
                console.log('[MobileCartUpdater] Desktop button not found');
                return;
            }
            
            // Extrahovat cenu
            const match = desktopBtn.textContent.match(/([\d\s]+[,.]?\d*)\s*Kč/);
            if (!match) {
                console.log('[MobileCartUpdater] Price not found');
                return;
            }
            
            const priceText = match[0].trim();
            const priceNum = parseFloat(match[1].replace(/\s/g, '').replace(',', '.'));
            
            console.log('[MobileCartUpdater] Price detected:', priceText, '(', priceNum, ')');
            
            // Kontrola změny
            if (!skipAnimation && this.lastPrice === priceNum) {
                console.log('[MobileCartUpdater] Price unchanged');
                return;
            }
            
            const oldPrice = this.lastPrice;
            this.lastPrice = priceNum;
            
            // Nejdřív zajistit, že elementy existují
            this.ensureElements();
            
            // Najít všechny price elementy
            const priceElements = document.querySelectorAll('.mobile-price-display');
            
            priceElements.forEach((priceEl) => {
                // Skip dropdown items
                if (priceEl.closest('.dropdown-menu')) {
                    return;
                }
                
                // Získat aktuální hodnotu z data atributu
                const currentValue = parseFloat(priceEl.getAttribute('data-value') || '0');
                
                // Aktualizovat cenu
                if (skipAnimation || currentValue === 0) {
                    // První načtení - bez animace
                    priceEl.textContent = priceText;
                    priceEl.setAttribute('data-value', priceNum);
                } else if (Math.abs(currentValue - priceNum) > 0.01) {
                    // Animovat změnu
                    console.log('[MobileCartUpdater] Animating from', currentValue, 'to', priceNum);
                    priceEl.setAttribute('data-value', priceNum);
                    this.animateValue(priceEl, priceNum);
                }
            });
        },
        
        createPriceElement(link) {
            const priceEl = document.createElement('span');
            priceEl.className = 'mobile-price-display';
            priceEl.setAttribute('data-value', '0');
            priceEl.textContent = '0 Kč';
            
            // Najít ikonu nebo badge
            const icon = link.querySelector('svg, i.fa');
            const badge = link.querySelector('.badge');
            
            if (icon && icon.nextSibling !== badge) {
                // Vložit za ikonu (ale před badge pokud existuje)
                icon.after(priceEl);
            } else if (badge) {
                // Vložit před badge
                link.insertBefore(priceEl, badge);
            } else {
                // Přidat na konec
                link.appendChild(priceEl);
            }
            
            return priceEl;
        },
        
        animateValue(element, newValue) {
            // Použít naši jednoduchou CountUp implementaci
            const counter = new SimpleCountUp(element, newValue, {
                duration: 0.6,
                separator: ' ',
                decimal: ',',
                suffix: ' Kč'
            });
            
            counter.start();
        },
        
        hookIntoAjax() {
            const self = this;
            let updateTimer = null;
            
            const scheduleUpdate = () => {
                clearTimeout(updateTimer);
                updateTimer = setTimeout(() => {
                    self.updateMobileCart(false);
                }, 150);
            };
            
            // jQuery AJAX
            if (typeof jQuery !== 'undefined') {
                jQuery(document).ajaxComplete((event, xhr, settings) => {
                    console.log('[MobileCartUpdater] AJAX complete');
                    scheduleUpdate();
                });
            }
            
            // Native XHR
            const origOpen = XMLHttpRequest.prototype.open;
            XMLHttpRequest.prototype.open = function() {
                this.addEventListener('loadend', () => {
                    console.log('[MobileCartUpdater] XHR complete');
                    scheduleUpdate();
                });
                return origOpen.apply(this, arguments);
            };
            
            // Fetch API
            const origFetch = window.fetch;
            if (origFetch) {
                window.fetch = function(...args) {
                    return origFetch.apply(this, args).then(response => {
                        console.log('[MobileCartUpdater] Fetch complete');
                        scheduleUpdate();
                        return response;
                    });
                };
            }
            
            // MutationObserver - sledovat odstranění elementů
            const observer = new MutationObserver((mutations) => {
                let needsUpdate = false;
                
                mutations.forEach(mutation => {
                    // Pokud byly odstraněny naše elementy
                    mutation.removedNodes.forEach(node => {
                        if (node.nodeType === 1) {
                            if (node.classList?.contains('mobile-price-display') || 
                                node.querySelector?.('.mobile-price-display')) {
                                needsUpdate = true;
                            }
                        }
                    });
                });
                
                if (needsUpdate) {
                    console.log('[MobileCartUpdater] Elements were removed, recreating...');
                    setTimeout(() => {
                        self.ensureElements();
                        self.updateMobileCart(true);
                    }, 50);
                }
            });
            
            // Sledovat změny v košíku
            observer.observe(document.body, {
                childList: true,
                subtree: true
            });
        },
        
        addStyles() {
            if (document.getElementById('mobile-cart-styles-v4')) return;
            
            const style = document.createElement('style');
            style.id = 'mobile-cart-styles-v4';
            style.textContent = `
                @media (max-width: 1200px) {
                    .mobile-price-display {
                        display: inline-block !important;
                        margin: 0 5px;
                        font-variant-numeric: tabular-nums;
                        white-space: nowrap;
                        min-width: 70px;
                    }
                    
                    /* Skrýt v dropdown menu */
                    .dropdown-menu .mobile-price-display {
                        display: none !important;
                    }
                }
                
                @media (min-width: 1201px) {
                    .mobile-price-display {
                        display: none !important;
                    }
                }
            `;
            document.head.appendChild(style);
        }
    };
    
    // Čekat na DOM
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', () => {
            MobileCartUpdater.init();
        });
    } else {
        setTimeout(() => MobileCartUpdater.init(), 100);
    }
    
    // Export
    window.MobileCartUpdater = MobileCartUpdater;
    
})();
