/**
 * Aktualizace mobilního košíku při AJAX změnách
 * Verze 5.0 - Kompletně přepsaná verze s důrazem na stabilitu
 */
(function() {
    'use strict';
    
    // Pomocná třída pro animaci čísel
    class NumberAnimator {
        constructor(element, startValue, endValue, duration = 600) {
            this.element = element;
            this.startValue = startValue;
            this.endValue = endValue;
            this.duration = duration;
            this.startTime = null;
        }
        
        animate() {
            if (!this.startTime) {
                this.startTime = performance.now();
            }
            
            const elapsed = performance.now() - this.startTime;
            const progress = Math.min(elapsed / this.duration, 1);
            
            // Easing funkce - plynulé zpomalení
            const easeOut = 1 - Math.pow(1 - progress, 3);
            
            const currentValue = this.startValue + (this.endValue - this.startValue) * easeOut;
            
            // Formátování čísla
            this.element.textContent = this.formatPrice(currentValue);
            
            if (progress < 1) {
                requestAnimationFrame(() => this.animate());
            } else {
                // Finální hodnota
                this.element.textContent = this.formatPrice(this.endValue);
            }
        }
        
        formatPrice(value) {
            // Formátování s mezerami jako tisícové oddělovače
            const formatted = Math.round(value).toString().replace(/\B(?=(\d{3})+(?!\d))/g, ' ');
            
            // Pokud má číslo desetinná místa
            if (value % 1 !== 0) {
                const decimal = (value % 1).toFixed(2).substring(1); // Získat .25 část
                return formatted + decimal.replace('.', ',') + ' Kč';
            }
            
            return formatted + ' Kč';
        }
    }
    
    // Hlavní objekt
    const MobileCartUpdater = {
        // Stav
        initialized: false,
        elements: new WeakMap(),
        currentPrice: 0,
        updateScheduled: false,
        
        // Selektory
        selectors: {
            desktopCart: '#snippet--basketTotalAjax .btn, #userCartDropdown .btn, .hdr-crt-btn',
            mobileLinks: [
                '#snippet--basketNavbarAjax > a[href="/cart"]',
                '#userCartDropdown2 > a[href="/cart"]',
                '.navbar-toggler.nt-cart-ico[href="/cart"]'
            ].join(', ')
        },
        
        // Inicializace
        init() {
            if (this.initialized) return;
            
            console.log('[MobileCart v5.0] Initializing...');
            
            this.addStyles();
            this.setupEventListeners();
            this.performInitialUpdate();
            
            this.initialized = true;
            console.log('[MobileCart v5.0] Ready');
        },
        
        // Přidání stylů
        addStyles() {
            if (document.getElementById('mobile-cart-styles-v5')) return;
            
            const style = document.createElement('style');
            style.id = 'mobile-cart-styles-v5';
            style.textContent = `
                @media (max-width: 1200px) {
                    .mobile-cart-price {
                        display: inline-block !important;
                        margin: 0 6px;
                        font-variant-numeric: tabular-nums;
                        white-space: nowrap;
                        min-width: 60px;
                    }
                    
                    /* Skrýt v dropdown menu */
                    .dropdown-menu .mobile-cart-price {
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
        
        // Nastavení event listenerů
        setupEventListeners() {
            const self = this;
            
            // Interceptovat AJAX requesty
            this.interceptAjax();
            
            // MutationObserver pouze pro desktop košík
            const desktopCart = document.querySelector('#snippet--basketTotalAjax, #userCartDropdown');
            if (desktopCart) {
                const observer = new MutationObserver(() => {
                    self.scheduleUpdate();
                });
                
                observer.observe(desktopCart, {
                    childList: true,
                    subtree: true,
                    characterData: true
                });
            }
            
            // Záložní interval pro kontrolu integrity
            setInterval(() => {
                self.checkIntegrity();
            }, 3000);
        },
        
        // Interceptace AJAX requestů
        interceptAjax() {
            const self = this;
            
            // jQuery AJAX
            if (typeof jQuery !== 'undefined') {
                jQuery(document).ajaxComplete(() => {
                    console.log('[MobileCart v5.0] jQuery AJAX complete');
                    self.scheduleUpdate();
                });
            }
            
            // Vanilla XHR
            const originalOpen = XMLHttpRequest.prototype.open;
            XMLHttpRequest.prototype.open = function() {
                this.addEventListener('loadend', () => {
                    console.log('[MobileCart v5.0] XHR complete');
                    self.scheduleUpdate();
                });
                return originalOpen.apply(this, arguments);
            };
            
            // Fetch API
            const originalFetch = window.fetch;
            if (originalFetch) {
                window.fetch = function(...args) {
                    return originalFetch.apply(this, args).then(response => {
                        console.log('[MobileCart v5.0] Fetch complete');
                        self.scheduleUpdate();
                        return response;
                    });
                };
            }
        },
        
        // Naplánování updatu (debounced)
        scheduleUpdate() {
            if (this.updateScheduled) return;
            
            this.updateScheduled = true;
            setTimeout(() => {
                this.updateScheduled = false;
                this.updateMobileCart();
            }, 100);
        },
        
        // První update při načtení
        performInitialUpdate() {
            this.updateMobileCart(true);
        },
        
        // Hlavní update funkce
        updateMobileCart(skipAnimation = false) {
            // Získat aktuální cenu z desktop košíku
            const priceData = this.extractPrice();
            if (!priceData) {
                console.log('[MobileCart v5.0] No price found');
                return;
            }
            
            const { text, value } = priceData;
            
            // Kontrola změny
            const priceChanged = Math.abs(this.currentPrice - value) > 0.01;
            if (!priceChanged && !skipAnimation) {
                console.log('[MobileCart v5.0] Price unchanged:', value);
                return;
            }
            
            console.log('[MobileCart v5.0] Updating price:', this.currentPrice, '→', value);
            
            // Najít a aktualizovat mobilní linky
            const mobileLinks = document.querySelectorAll(this.selectors.mobileLinks);
            
            mobileLinks.forEach((link, index) => {
                // Skip dropdown items
                if (link.closest('.dropdown-menu')) return;
                
                // Získat nebo vytvořit price element
                let priceEl = this.getPriceElement(link);
                if (!priceEl) {
                    priceEl = this.createPriceElement(link);
                    console.log('[MobileCart v5.0] Created price element for link', index);
                }
                
                // Aktualizovat hodnotu
                if (skipAnimation || !this.elements.has(link)) {
                    // Bez animace
                    priceEl.textContent = text;
                    this.elements.set(link, value);
                } else {
                    // S animací
                    const oldValue = this.elements.get(link) || 0;
                    if (Math.abs(oldValue - value) > 0.01) {
                        console.log('[MobileCart v5.0] Animating:', oldValue, '→', value);
                        const animator = new NumberAnimator(priceEl, oldValue, value);
                        animator.animate();
                        this.elements.set(link, value);
                    }
                }
            });
            
            this.currentPrice = value;
        },
        
        // Extrakce ceny z desktop košíku
        extractPrice() {
            const desktopBtn = document.querySelector(this.selectors.desktopCart);
            if (!desktopBtn) return null;
            
            const match = desktopBtn.textContent.match(/([\d\s]+(?:,\d+)?)\s*Kč/);
            if (!match) return null;
            
            const text = match[0].trim();
            const value = parseFloat(match[1].replace(/\s/g, '').replace(',', '.'));
            
            return { text, value };
        },
        
        // Získat price element z linku
        getPriceElement(link) {
            // Hledat pouze přímého potomka
            return link.querySelector(':scope > .mobile-cart-price');
        },
        
        // Vytvořit nový price element
        createPriceElement(link) {
            const priceEl = document.createElement('span');
            priceEl.className = 'mobile-cart-price';
            
            // Najít nejlepší pozici pro vložení
            const icon = link.querySelector('svg, i.fa, .fa');
            const badge = link.querySelector('.badge');
            
            if (icon && !icon.nextElementSibling?.classList.contains('badge')) {
                // Vložit za ikonu
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
        
        // Kontrola integrity elementů
        checkIntegrity() {
            const mobileLinks = document.querySelectorAll(this.selectors.mobileLinks);
            let needsUpdate = false;
            
            mobileLinks.forEach(link => {
                if (link.closest('.dropdown-menu')) return;
                
                const priceEl = this.getPriceElement(link);
                if (!priceEl && this.currentPrice > 0) {
                    console.log('[MobileCart v5.0] Missing price element detected');
                    needsUpdate = true;
                }
            });
            
            if (needsUpdate) {
                this.updateMobileCart(true);
            }
        }
    };
    
    // Automatická inicializace
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', () => {
            MobileCartUpdater.init();
        });
    } else {
        // Počkat chvíli na načtení všech elementů
        setTimeout(() => {
            MobileCartUpdater.init();
        }, 100);
    }
    
    // Export pro debugging
    window.MobileCartUpdater = MobileCartUpdater;
    
})()
