/**
 * Aktualizace mobilního košíku při AJAX změnách
 * Verze 4.1 - Oprava mizení ceny při DOM změnách
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
        currentPriceText: '',
        isUpdating: false,
        
        init() {
            console.log('[MobileCartUpdater] Initializing v4.1...');
            this.addStyles();
            this.hookIntoAjax();
            this.updateMobileCart(true); // První update bez animace
        },
        
        updateMobileCart(skipAnimation = false) {
            // Zabránit vícenásobným současným updatem
            if (this.isUpdating && !skipAnimation) {
                console.log('[MobileCartUpdater] Update already in progress');
                return;
            }
            
            this.isUpdating = true;
            
            try {
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
                
                // Uložit aktuální cenu pro případ, že by elementy zmizely
                this.currentPriceText = priceText;
                
                // Kontrola změny
                if (!skipAnimation && this.lastPrice === priceNum) {
                    console.log('[MobileCartUpdater] Price unchanged');
                    return;
                }
                
                const oldPrice = this.lastPrice;
                this.lastPrice = priceNum;
                
                // Najít mobilní linky - POUZE ty hlavní, ne v dropdown menu
                const mobileLinks = document.querySelectorAll(
                    '#snippet--basketNavbarAjax > a[href="/cart"], ' +
                    '#userCartDropdown2 > a[href="/cart"], ' +
                    '.navbar-toggler.nt-cart-ico[href="/cart"]'
                );
                
                console.log('[MobileCartUpdater] Found mobile links:', mobileLinks.length);
                
                mobileLinks.forEach((link, index) => {
                    // Skip dropdown items
                    if (link.closest('.dropdown-menu')) {
                        return;
                    }
                    
                    // Vždy najít nebo vytvořit element
                    let priceEl = link.querySelector('.mobile-price-display');
                    
                    if (!priceEl) {
                        priceEl = this.createPriceElement(link);
                        console.log('[MobileCartUpdater] Created element for link', index);
                    } else {
                        // Element existuje, zkontrolovat že má správnou hodnotu
                        console.log('[MobileCartUpdater] Existing element found for link', index);
                    }
                    
                    // Ujistit se, že element je viditelný
                    priceEl.style.display = 'inline-block';
                    
                    // Aktualizovat cenu
                    if (skipAnimation) {
                        // První načtení - bez animace
                        priceEl.textContent = priceText;
                    } else if (oldPrice !== null && oldPrice !== priceNum) {
                        // Animovat změnu
                        console.log('[MobileCartUpdater] Animating from', oldPrice, 'to', priceNum);
                        this.animateValue(priceEl, priceNum);
                    } else {
                        // Jen aktualizovat text pro jistotu
                        priceEl.textContent = priceText;
                    }
                    
                    // Přidat data atribut pro kontrolu
                    priceEl.setAttribute('data-price', priceNum);
                });
            } finally {
                this.isUpdating = false;
            }
        },
        
        createPriceElement(link) {
            const priceEl = document.createElement('span');
            priceEl.className = 'mobile-price-display';
            
            // Nastavit aktuální cenu, pokud ji máme
            if (this.currentPriceText) {
                priceEl.textContent = this.currentPriceText;
            }
            
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
            // Přidat třídu pro animaci
            element.classList.add('price-updating');
            
            // Použít naši jednoduchou CountUp implementaci
            const counter = new SimpleCountUp(element, newValue, {
                duration: 0.6,
                separator: ' ',
                decimal: ',',
                suffix: ' Kč'
            });
            
            counter.start(() => {
                // Po dokončení animace
                element.classList.remove('price-updating');
                element.classList.add('price-updated');
                
                setTimeout(() => {
                    element.classList.remove('price-updated');
                }, 500);
            });
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
            
            // MutationObserver pro mobilní navigaci
            const observer = new MutationObserver((mutations) => {
                // Zkontrolovat, zda se změnil mobilní košík
                let shouldUpdate = false;
                
                for (const mutation of mutations) {
                    // Kontrolovat změny v mobilní navigaci
                    if (mutation.target.id === 'snippet--basketNavbarAjax' || 
                        mutation.target.id === 'userCartDropdown2' ||
                        mutation.target.closest('#snippet--basketNavbarAjax') ||
                        mutation.target.closest('#userCartDropdown2')) {
                        shouldUpdate = true;
                        break;
                    }
                    
                    // Kontrolovat, zda zmizely naše price elementy
                    for (const removed of mutation.removedNodes) {
                        if (removed.nodeType === 1 && 
                            (removed.classList?.contains('mobile-price-display') ||
                             removed.querySelector?.('.mobile-price-display'))) {
                            console.log('[MobileCartUpdater] Price element was removed, will recreate');
                            shouldUpdate = true;
                            break;
                        }
                    }
                }
                
                if (shouldUpdate) {
                    scheduleUpdate();
                }
            });
            
            // Sledovat pouze desktop košík pro změny ceny
            const targets = [
                document.getElementById('snippet--basketTotalAjax'),
                document.getElementById('userCartDropdown')
            ].filter(Boolean);
            
            targets.forEach(target => {
                observer.observe(target, {
                    childList: true,
                    subtree: true,
                    characterData: true
                });
            });
            
            // Pravidelná kontrola každé 2 sekundy pro jistotu
            setInterval(() => {
                const priceEls = document.querySelectorAll('.mobile-price-display');
                if (priceEls.length === 0 && this.currentPriceText) {
                    console.log('[MobileCartUpdater] Price elements missing, recreating...');
                    this.updateMobileCart(true);
                }
            }, 2000);
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
