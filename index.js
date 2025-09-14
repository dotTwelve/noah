/**
 * Product Slider for NOAH Natural Products - Simplified Version
 * Převádí grid produktů na interaktivní slider pomocí Swiper.js
 * 
 * @version 2.0.0
 * @requires jQuery 3.4.1+
 * @requires Swiper 11+
 */

(function($) {
    'use strict';

    const ProductSlider = {
        // Konfigurace
        config: {
            containerSelector: '.products-cart-recommend',
            gridSelector: '.card-group',
            itemSelector: '.card-item',
            swiperCDN: 'https://cdn.jsdelivr.net/npm/swiper@11/swiper-bundle.min.js',
            swiperCSS: 'https://cdn.jsdelivr.net/npm/swiper@11/swiper-bundle.min.css'
        },

        // Sledování inicializovaných sliderů
        instances: [],

        /**
         * Inicializace modulu
         */
        init: function() {
            const self = this;
            
            // Zkontroluj jQuery
            if (typeof $ === 'undefined') {
                console.error('ProductSlider: jQuery není načteno');
                return;
            }

            // Načti Swiper a inicializuj
            this.loadSwiper(function() {
                self.initSliders();
            });
        },

        /**
         * Načtení Swiper knihovny
         */
        loadSwiper: function(callback) {
            // Pokud už je Swiper načten
            if (typeof Swiper !== 'undefined') {
                callback();
                return;
            }

            // Načti CSS
            if (!$('link[href*="swiper-bundle.min.css"]').length) {
                $('<link>')
                    .attr('rel', 'stylesheet')
                    .attr('href', this.config.swiperCSS)
                    .appendTo('head');
            }

            // Načti JS
            $.getScript(this.config.swiperCDN)
                .done(callback)
                .fail(function() {
                    console.error('ProductSlider: Nepodařilo se načíst Swiper');
                });
        },

        /**
         * Inicializace všech sliderů na stránce
         */
        initSliders: function() {
            const self = this;
            const $containers = $(this.config.containerSelector);

            $containers.each(function(index) {
                const $container = $(this);
                const $grid = $container.find(self.config.gridSelector);
                
                if (!$grid.length || $grid.hasClass('swiper-initialized')) {
                    return;
                }

                self.createSlider($container, $grid, index);
            });
        },

        /**
         * Vytvoření jednotlivého slideru - MINIMÁLNÍ DOM MANIPULACE
         */
        createSlider: function($container, $grid, index) {
            const self = this;
            
            // Přidej identifikátor
            const sliderId = 'product-slider-' + index;
            $grid.attr('id', sliderId);
            
            // Najdi produkty
            const $items = $grid.find(this.config.itemSelector);
            const totalItems = $items.length;
            
            console.log('ProductSlider: Nalezeno ' + totalItems + ' produktů pro slider ' + index);
            
            if (totalItems === 0) {
                console.warn('ProductSlider: Žádné produkty nenalezeny');
                return;
            }
            
            // Přidej třídy bez změny struktury
            $container.addClass('slider-active');
            $grid.addClass('swiper swiper-initialized');
            
            // Přidej třídu každému produktu
            $items.addClass('swiper-slide');
            
            // Obal existující produkty do wrapper (zachová všechny elementy)
            $items.wrapAll('<div class="swiper-wrapper"></div>');
            
            // Přidej navigaci MIMO wrapper
            $grid.append('<div class="swiper-button-prev"></div>');
            $grid.append('<div class="swiper-button-next"></div>');
            
            // Přidej pagination pod slider
            $container.append('<div class="swiper-pagination"></div>');
            
            // Přidej CSS styly
            this.addStyles();
            
            // Počkej na DOM update
            // Počkej na DOM update
setTimeout(function() {
    // Konfigurace Swiperu
    const swiperConfig = {
        // Základní nastavení
        slidesPerView: 2,
        slidesPerGroup: 2, // MUSÍ být stejné jako slidesPerView
        spaceBetween: 10,
        watchOverflow: true,
        threshold: 10,
        speed: 600,
        grabCursor: true,
        
        // Navigace
        navigation: {
            nextEl: '#' + sliderId + ' .swiper-button-next',
            prevEl: '#' + sliderId + ' .swiper-button-prev',
        },
        
        // Pagination
        pagination: {
            el: $container.find('.swiper-pagination')[0],
            clickable: true,
            type: 'bullets'
        },
        
        // Responzivní breakpointy - DŮLEŽITÉ: musí obsahovat slidesPerGroup
        breakpoints: {
            0: {  // Změna z 320 na 0 pro jistotu
                slidesPerView: 2,
                slidesPerGroup: 2,
                spaceBetween: 10
            },
            768: {
                slidesPerView: 3,
                slidesPerGroup: 3,
                spaceBetween: 15
            },
            1024: {
                slidesPerView: 4,
                slidesPerGroup: 4,
                spaceBetween: 20
            },
            1200: {
                slidesPerView: 5,
                slidesPerGroup: 5,
                spaceBetween: 20
            }
        },
        
        // Události
        on: {
            init: function() {
                console.log('Slider inicializován:');
                console.log('- Slides per group:', this.params.slidesPerGroup);
                
                // Force update skupinového posunu
                if (this.params.slidesPerGroup !== this.params.slidesPerView) {
                    console.warn('⚠️ Opravuji slidesPerGroup');
                    this.params.slidesPerGroup = this.params.slidesPerView;
                    this.update();
                }
                
                self.checkSlides(this);
            },
            slideChange: function() {
                const currentGroup = Math.floor(this.activeIndex / this.params.slidesPerGroup);
                const totalGroups = Math.ceil(this.slides.length / this.params.slidesPerGroup);
                console.log('Skupina:', currentGroup + 1, '/', totalGroups);
            }
        }
    };
    
    // Debug konfigurace před inicializací
    console.log('Inicializuji Swiper s konfigurací:', {
        slidesPerView: swiperConfig.slidesPerView,
        slidesPerGroup: swiperConfig.slidesPerGroup
    });
    
    // Inicializuj Swiper
    const swiperInstance = new Swiper('#' + sliderId, swiperConfig);
    
    // Vlastní navigace pokud slidesPerGroup stále nefunguje
    // ... (zbytek kódu pro vlastní navigaci)
}, 50);
        },

        /**
         * Kontrola slidů
         */
        checkSlides: function(swiper) {
            let emptyCount = 0;
            for (let i = 0; i < swiper.slides.length; i++) {
                const $slide = $(swiper.slides[i]);
                const hasContent = $slide.find('a, img, h4').length > 0;
                
                if (!hasContent) {
                    console.warn('Prázdný slide na pozici:', i);
                    emptyCount++;
                } else {
                    // Ujisti se, že slide je viditelný
                    $slide.css({
                        'visibility': 'visible',
                        'display': 'block'
                    });
                }
            }
            
            if (emptyCount > 0) {
                console.error('Nalezeno ' + emptyCount + ' prázdných slidů!');
                // Pokus o opravu
                swiper.update();
                swiper.updateSlides();
            }
        },

        /**
         * Přidání stylů
         */
        addStyles: function() {
            if ($('#product-slider-styles').length) {
                return;
            }

            const styles = `
                <style id="product-slider-styles">
                    /* Container */
                    .slider-active {
                        position: relative;
                    }
                    
                    /* Swiper container */
                    .slider-active .swiper {
                        overflow: hidden;
                        position: relative;
                    }
                    
                    /* Wrapper */
                    .slider-active .swiper-wrapper {
                        display: flex !important;
                        position: relative;
                        width: 100%;
                        height: 100%;
                        z-index: 1;
                        transition-property: transform;
                        box-sizing: content-box;
                    }
                    
                    /* Slides - DŮLEŽITÉ */
                    .slider-active .swiper-slide {
                        flex-shrink: 0;
                        width: 100%;
                        height: 100%;
                        position: relative;
                        transition-property: transform;
                        display: block !important;
                        visibility: visible !important;
                    }
                    
                    /* Zachovat původní styly card-item */
                    .slider-active .card-item {
                        height: 100%;
                        display: flex !important;
                    }
                    
                    /* Zajistit viditelnost všech vnořených elementů */
                    .slider-active .swiper-slide * {
                        visibility: visible !important;
                    }
                    
                    /* Navigační šipky */
                    .swiper-button-prev,
                    .swiper-button-next {
                        position: absolute;
                        top: 40%;
                        width: 40px;
                        height: 40px;
                        margin-top: -20px;
                        z-index: 10;
                        cursor: pointer;
                        display: flex;
                        align-items: center;
                        justify-content: center;
                        background: white;
                        border-radius: 50%;
                        box-shadow: 0 2px 8px rgba(0,0,0,0.15);
                    }
                    
                    .swiper-button-prev {
                        left: 10px;
                    }
                    
                    .swiper-button-next {
                        right: 10px;
                    }
                    
                    .swiper-button-prev:after,
                    .swiper-button-next:after {
                        font-size: 16px;
                        color: #333;
                        font-weight: bold;
                    }
                    
                    .swiper-button-disabled {
                        opacity: 0.35;
                        cursor: auto;
                        pointer-events: none;
                    }
                    
                    /* Pagination */
                    .swiper-pagination {
                        position: relative;
                        text-align: center;
                        margin-top: 20px;
                        line-height: 1;
                    }
                    
                    .swiper-pagination-bullet {
                        width: 8px;
                        height: 8px;
                        display: inline-block;
                        border-radius: 50%;
                        background: #ccc;
                        opacity: 1;
                        margin: 0 4px;
                        cursor: pointer;
                        transition: all 0.3s;
                    }
                    
                    .swiper-pagination-bullet-active {
                        background: #27ae60;
                        width: 24px;
                        border-radius: 4px;
                    }
                    
                    /* Responzivní úpravy */
                    @media (max-width: 768px) {
                        .swiper-button-prev,
                        .swiper-button-next {
                            width: 32px;
                            height: 32px;
                        }
                        
                        .swiper-button-prev:after,
                        .swiper-button-next:after {
                            font-size: 12px;
                        }
                        
                        .swiper-button-prev {
                            left: 5px;
                        }
                        
                        .swiper-button-next {
                            right: 5px;
                        }
                    }
                    
                    /* Debug helper */
                    .slider-debug .swiper-slide {
                        border: 2px solid red !important;
                    }
                </style>
            `;
            
            $('head').append(styles);
        },

        /**
         * Debug všech sliderů
         */
        debug: function() {
            console.group('🔍 ProductSlider Debug');
            
            this.instances.forEach((instance, index) => {
                console.group('Slider ' + index);
                console.log('ID:', instance.id);
                console.log('Total items:', instance.totalItems);
                
                if (instance.swiper) {
                    const swiper = instance.swiper;
                    console.log('Swiper initialized:', true);
                    console.log('Current index:', swiper.activeIndex);
                    console.log('Slides count:', swiper.slides.length);
                    console.log('Slides per view:', swiper.params.slidesPerView);
                    console.log('Slides per group:', swiper.params.slidesPerGroup);
                    console.log('Is beginning:', swiper.isBeginning);
                    console.log('Is end:', swiper.isEnd);
                    
                    // Kontrola prázdných slidů
                    const emptySlides = [];
                    for (let i = 0; i < swiper.slides.length; i++) {
                        const $slide = $(swiper.slides[i]);
                        if ($slide.find('a, img, h4').length === 0) {
                            emptySlides.push(i);
                        }
                    }
                    
                    if (emptySlides.length > 0) {
                        console.warn('⚠️ Prázdné slidy:', emptySlides);
                    } else {
                        console.log('✅ Všechny slidy mají obsah');
                    }
                    
                    // Force update
                    console.log('Provádím update...');
                    swiper.update();
                } else {
                    console.error('❌ Swiper není inicializován!');
                }
                
                console.groupEnd();
            });
            
            console.groupEnd();
        },

        /**
         * Zničení všech sliderů
         */
        destroy: function() {
            this.instances.forEach(instance => {
                if (instance.swiper) {
                    instance.swiper.destroy(true, true);
                }
            });
            this.instances = [];
            $('#product-slider-styles').remove();
            $('.slider-active').removeClass('slider-active');
            $('.swiper-initialized').removeClass('swiper-initialized');
        }
    };

    // Automatická inicializace
    $(document).ready(function() {
        ProductSlider.init();
    });

    // Export pro globální použití a debug
    window.ProductSlider = ProductSlider;

})(jQuery);
