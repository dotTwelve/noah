/**
 * Synchronizace hodnoty košíku mezi snippety
 */
(function() {
    'use strict';
    
    const CartSync = {
        init() {
            this.syncValue();
            this.watchChanges();
            this.addStyles();
        },
        
        getValue() {
            // Zkusit všechny možné zdroje
            const sources = [
                '#snippet--basketTotalAjax .btn',
                '#userCartDropdown .btn',
                '.hdr-crt-btn',
                '.uc-amount'
            ];
            
            for (let selector of sources) {
                const el = document.querySelector(selector);
                if (el) {
                    const match = el.textContent.match(/(\d[\d\s]*)\s*Kč/);
                    if (match) {
                        return match[0].trim();
                    }
                }
            }
            return null;
        },
        
        syncValue() {
            const value = this.getValue();
            if (!value) return;
            
            // Najít všechny mobilní košíky
            const targets = document.querySelectorAll('#snippet--basketNavbarAjax a[href="/cart"]');
            
            targets.forEach(target => {
                let span = target.querySelector('.synced-price');
                if (!span) {
                    span = document.createElement('span');
                    span.className = 'synced-price';
                    const icon = target.querySelector('svg');
                    if (icon) {
                        icon.after(span);
                    }
                }
                span.textContent = ' ' + value;
            });
        },
        
        watchChanges() {
            // Interceptovat Nette AJAX
            if (window.jQuery && window.jQuery.nette) {
                jQuery.nette.ext('cartSync', {
                    success: () => {
                        setTimeout(() => this.syncValue(), 100);
                    }
                });
            }
            
            // MutationObserver jako záloha
            const observer = new MutationObserver(() => {
                this.syncValue();
            });
            
            document.querySelectorAll('[id*="snippet"]').forEach(el => {
                observer.observe(el, {
                    childList: true,
                    subtree: true
                });
            });
        },
        
        addStyles() {
            const css = `
                @media (max-width: 1200px) {
                    .synced-price {
                        color: #27ae60;
                        font-weight: 600;
                        margin: 0 8px;
                    }
                }
                @media (min-width: 1201px) {
                    .synced-price { display: none !important; }
                }
            `;
            const style = document.createElement('style');
            style.textContent = css;
            document.head.appendChild(style);
        }
    };
    
    // Inicializace
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', () => CartSync.init());
    } else {
        CartSync.init();
    }
    
    window.CartSync = CartSync;
})();
