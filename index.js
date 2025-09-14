/**
 * Product Slider for NOAH Natural Products
 * Převádí grid produktů na interaktivní slider pomocí Swiper.js
 * 
 * @version 2.1.0
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
         * Vytvoření jednotlivého slideru
         */
        createSlider: function($container, $grid, index) {
            const self = this;
            
            // Přidej identifikátor
            const sliderId = 'product-slider-' + index;
            $grid.attr('id', sliderId);
            
            // Najdi produkty
            const $items = $grid.find(this.config.itemSelector);
            const totalItems = $items.length;
            
            if (totalItems === 0) {
                return;
            }
            
            // Přidej třídy bez změny struktury
            $container.addClass('slider-active');
            $grid.addClass('swiper swiper-initialized');
            
            // Přidej třídu každému produktu
            $items.addClass('swiper-slide');
            
            // Obal existující produkty do wrapper
            $items.wrapAll('<div class="swiper-wrapper"></div>');
            
            // Přidej navigaci
            $grid.append('<div class="swiper-button-prev"></div>');
            $grid.append('<div class="swiper-button-next"></div>');
            
            // Přidej pagination
            $container.append('<div class="swiper-pagination"></div>');
            
            // Přidej CSS styly
            this.addStyles();
            
            // Počkej na DOM update
            setTimeout(function() {
                // Konfigurace Swiperu
                const swiperConfig = {
                    // Základní nastavení
                    slidesPerView: 2,
                    slidesPerGroup: 2,
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
                    
                    // Pagination - custom pro skupiny
                    pagination: {
                        el: $container.find('.swiper-pagination')[0],
                        clickable: true,
                        type: 'custom',
                        renderCustom: function (swiper, current, total) {
                            const currentGroup = Math.floor((current - 1) / swiper.params.slidesPerGroup) + 1;
                            const totalGroups = Math.ceil(swiper.slides.length / swiper.params.slidesPerGroup);
                            
                            let bullets = '';
                            for (let i = 1; i <= totalGroups; i++) {
                                const slideIndex = (i - 1) * swiper.params.slidesPerGroup;
                                const activeClass = (i === currentGroup) ? ' swiper-pagination-bullet-active' : '';
                                bullets += '<span class="swiper-pagination-bullet' + activeClass + 
                                          '" data-slide-to="' + slideIndex + '"></span>';
                            }
                            return bullets;
                        }
                    },
                    
                    // Responzivní breakpointy
                    breakpoints: {
                        0: {
                            slidesPerView: 2,
                            slidesPerGroup: 2,
                            spaceBetween: 8
                        },
                        768: {
                            slidesPerView: 3,
                            slidesPerGroup: 3,
                            spaceBetween: 16
                        },
                        1024: {
                            slidesPerView: 4,
                            slidesPerGroup: 4,
                            spaceBetween: 16
                        },
                        1200: {
                            slidesPerView: 5,
                            slidesPerGroup: 5,
                            spaceBetween: 16
                        }
                    },
                    
                    // Události
                    on: {
                        init: function() {
                            // Zajisti správné nastavení skupin
                            if (this.params.slidesPerGroup !== this.params.slidesPerView) {
                                this.params.slidesPerGroup = this.params.slidesPerView;
                                this.update();
                            }
                        },
                        breakpoint: function() {
                            // Ujisti se, že slidesPerGroup = slidesPerView při změně breakpointu
                            if (this.params.slidesPerGroup !== this.params.slidesPerView) {
                                this.params.slidesPerGroup = this.params.slidesPerView;
                                this.update();
                            }
                        }
                    }
                };
                
                // Inicializuj Swiper
                const swiperInstance = new Swiper('#' + sliderId, swiperConfig);
                
                // Přidej click event pro custom pagination
                $container.find('.swiper-pagination').on('click', '.swiper-pagination-bullet', function() {
                    const slideToIndex = parseInt($(this).attr('data-slide-to'));
                    swiperInstance.slideTo(slideToIndex);
                });
                
                // Ulož instanci
                self.instances.push({
                    id: sliderId,
                    container: $container[0],
                    swiper: swiperInstance,
                    totalItems: totalItems
                });
                
            }, 50);
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
                    
                    /* Slides */
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
                        transition: all 0.3s ease;
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
                    
                    .swiper-button-prev:hover,
                    .swiper-button-next:hover {
                        box-shadow: 0 4px 12px rgba(0,0,0,0.2);
                        transform: scale(1.1);
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
                        
                        .swiper-pagination-bullet {
                            width: 6px;
                            height: 6px;
                            margin: 0 3px;
                        }
                        
                        .swiper-pagination-bullet-active {
                            width: 20px;
                        }
                    }
                </style>
            `;
            
            $('head').append(styles);
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

    // Export pro globální použití
    window.ProductSlider = ProductSlider;

})(jQuery);
