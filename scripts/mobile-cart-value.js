/**
 * Aktualizace mobilního košíku při AJAX změnách
 * Verze 6.0 - Permanentní element s data atributy
 */
(function() {
    'use strict';
    
    const MobileCartUpdater = {
        init() {
            console.log('[MobileCartUpdater] Starting v6.0...');
            this.addStyles();
            this.setupPriceElements();
            this.startMonitoring();
        },
        
        setupPriceElements() {
            // Najít všechny mobilní košíky a označit je
            const mobileLinks = document.querySelectorAll('a[href="/cart"].navbar-toggler, #userCartDropdown2 > a[href="/cart"]');
            
            mobileLinks.forEach((link, index) => {
                // Skip dropdown items
                if (link.closest('.dropdown-menu')) return;
                
                // Označit link pro snadné nalezení
                link.setAttribute('data-mobile-cart', index);
                
                // Pokud už má price element, skip
                if (link.querySelector('[data-price-display]')) return;
                
                // Vytvořit permanentní element
                const priceEl = document.createElement('span');
                priceEl.setAttribute('data-price-display', '');
                priceEl.setAttribute('data-current-value', '0');
                priceEl.style.cssText = 'display: inline-block; min-width: 70px; margin: 0 5px;';
                priceEl.textContent = 'načítám...';
                
                // Vložit za ikonu
                const icon = link.querySelector('svg, i');
                if (icon) {
                    // Obalit ikonu a cenu do wrapperu
                    const wrapper = document.createElement('span');
                    wrapper.style.cssText = 'display: inline-flex; align-items: center;';
                    icon.parentNode.insertBefore(wrapper, icon);
                    wrapper.appendChild(icon);
                    wrapper.appendChild(priceEl);
                } else {
                    // Jen přidat na začátek
                    link.insertBefore(priceEl, link.firstChild);
                }
                
                console.log(`[MobileCartUpdater] Created element for cart ${index}`);
            });
            
            // Hned aktualizovat cenu
            this.updatePrices();
        },
        
        updatePrices() {
            // Získat aktuální cenu
            const desktopBtn = document.querySelector('#snippet--basketTotalAjax .btn, #userCartDropdown .btn, .hdr-crt-btn');
            if (!desktopBtn) {
                console.log('[MobileCartUpdater] No desktop button');
                return;
            }
            
            const priceMatch = desktopBtn.textContent.match(/([\d\s]+[,.]?\d*)\s*Kč/);
            if (!priceMatch) {
                console.log('[MobileCartUpdater] No price found');
                return;
            }
            
            const priceText = priceMatch[0].trim();
            const priceNum = parseFloat(priceMatch[1].replace(/\s/g, '').replace(',', '.'));
            
            console.log(`[MobileCartUpdater] Found price: ${priceText} (${priceNum})`);
            
            // Aktualizovat všechny price elementy
            document.querySelectorAll('[data-price-display]').forEach(el => {
                const oldValue = parseFloat(el.getAttribute('data-current-value') || '0');
                
                if (Math.abs(oldValue - priceNum) < 0.01) {
                    // Cena se nezměnila
                    return;
                }
                
                if (oldValue === 0) {
                    // První nastavení
                    el.textContent = priceText;
                    el.setAttribute('data-current-value', priceNum);
                    console.log('[MobileCartUpdater] Set initial price');
                } else {
                    // Animovat změnu
                    console.log(`[MobileCartUpdater] Animating: ${oldValue} -> ${priceNum}`);
                    this.animateChange(el, oldValue, priceNum, priceText);
                }
            });
        },
        
        animateChange(element, from, to, finalText) {
            const steps = 20;
            const stepTime = 30;
            let step = 0;
            
            const interval = setInterval(() => {
                step++;
                const progress = step / steps;
                const current = from + (to - from) * progress;
                
                // Formátovat
                let formatted = current.toFixed(finalText.includes(',') ? 2 : 0);
                formatted = formatted.replace('.', ',');
                // Přidat mezery pro tisíce
                const parts = formatted.split(',');
                parts[0] = parts[0].replace(/\B(?=(\d{3})+(?!\d))/g, ' ');
                formatted = parts.join(',');
                
                element.textContent = formatted + ' Kč';
                
                if (step >= steps) {
                    clearInterval(interval);
                    element.textContent = finalText;
                    element.setAttribute('data-current-value', to);
                    console.log('[MobileCartUpdater] Animation complete');
                }
            }, stepTime);
        },
        
        startMonitoring() {
            // Sledovat změny pomocí setInterval (nejspolehlivější)
            setInterval(() => {
                // Zkontrolovat jestli elementy stále existují
                const elements = document.querySelectorAll('[data-price-display]');
                if (elements.length === 0) {
                    console.log('[MobileCartUpdater] Elements missing, recreating...');
                    this.setupPriceElements();
                } else {
                    this.updatePrices();
                }
            }, 500);
            
            // Také sledovat AJAX
            if (typeof jQuery !== 'undefined') {
                jQuery(document).ajaxComplete(() => {
                    console.log('[MobileCartUpdater] AJAX detected');
                    setTimeout(() => this.updatePrices(), 100);
                });
            }
        },
        
        addStyles() {
            if (document.getElementById('mcu-styles')) return;
            
            const style = document.createElement('style');
            style.id = 'mcu-styles';
            style.textContent = `
                @media (max-width: 1200px) {
                    [data-price-display] {
                        font-variant-numeric: tabular-nums !important;
                        white-space: nowrap !important;
                    }
                    .dropdown-menu [data-price-display] {
                        display: none !important;
                    }
                }
                @media (min-width: 1201px) {
                    [data-price-display] {
                        display: none !important;
                    }
                }
            `;
            document.head.appendChild(style);
        },
        
        // Debug funkce
        debug() {
            console.log('=== MobileCartUpdater Debug ===');
            console.log('Mobile carts found:', document.querySelectorAll('[data-mobile-cart]').length);
            console.log('Price displays found:', document.querySelectorAll('[data-price-display]').length);
            
            document.querySelectorAll('[data-price-display]').forEach((el, i) => {
                console.log(`Display ${i}:`, {
                    text: el.textContent,
                    value: el.getAttribute('data-current-value'),
                    parent: el.parentElement,
                    visible: el.offsetParent !== null
                });
            });
            
            const desktop = document.querySelector('#snippet--basketTotalAjax .btn, #userCartDropdown .btn');
            console.log('Desktop button:', desktop?.textContent);
        }
    };
    
    // Start
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', () => MobileCartUpdater.init());
    } else {
        MobileCartUpdater.init();
    }
    
    window.MobileCartUpdater = MobileCartUpdater;
})();
