/**
 * Product Slider for NOAH Natural Products
 * Převádí grid produktů na interaktivní slider pomocí Swiper.js
 * 
 * @version 3.0.0 - Navigační šipky mimo swiper kontejner
 * @requires jQuery 3.4.1+
 * @requires Swiper 11+
 */

(function($) {
    'use strict';

    const ProductSlider = {
        // Konfigurace
        config: {
            containerSelector: '.products-cart-recommend, .bic-prcs',
            gridSelector: '.card-group',
            itemSelector: '.card-item',
            swiperCDN: 'https://cdn.jsdelivr.net/npm/swiper@11/swiper-bundle.min.js',
            swiperCSS: 'https://cdn.jsdelivr.net/npm/swiper@11/swiper-bundle.min.css',
            svgIconsPath: '/images/icons/fa/solid.svg?1757317552'
        },

        instances: [],

        init: function() {
            const self = this;
            
            if (typeof $ === 'undefined') {
                console.error('ProductSlider: jQuery není načteno');
                return;
            }

            this.loadSwiper(function() {
                self.initSliders();
            });
        },

        loadSwiper: function(callback) {
            if (typeof Swiper !== 'undefined') {
                callback();
                return;
            }

            if (!$('link[href*="swiper-bundle.min.css"]').length) {
                $('<link>')
                    .attr('rel', 'stylesheet')
                    .attr('href', this.config.swiperCSS)
                    .appendTo('head');
            }

            $.getScript(this.config.swiperCDN)
                .done(callback)
                .fail(function() {
                    console.error('ProductSlider: Nepodařilo se načíst Swiper');
                });
        },

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

        createCustomNavigation: function(sliderId) {
            const prevButton = `
                <button type="button" 
                   class="carousel-nav carousel-prev btn fg ico-md sh-md ml-0 NoScroll bg-de swiper-button-prev-custom" 
                   aria-label="Předchozí">
                    <svg class="ic ic-sm" aria-hidden="true">
                        <use href="${this.config.svgIconsPath}#angle-left"></use>
                    </svg>
                    <span class="sr-only">Předchozí</span>
                </button>
            `;
            
            const nextButton = `
                <button type="button" 
                   class="carousel-nav carousel-next btn fg ico-md sh-md mr-0 NoScroll bg-de swiper-button-next-custom" 
                   aria-label="Další">
                    <svg class="ic ic-sm" aria-hidden="true">
                        <use href="${this.config.svgIconsPath}#angle-right"></use>
                    </svg>
                    <span class="sr-only">Další</span>
                </button>
            `;
            
            return {
                prevButton: prevButton,
                nextButton: nextButton
            };
        },

        createSlider: function($container, $grid, index) {
            const self = this;
            
            const sliderId = 'product-slider-' + index;
            $grid.attr('id', sliderId);
            
            const $items = $grid.find(this.config.itemSelector);
            const totalItems = $items.length;
            
            if (totalItems === 0) {
                return;
            }
            
            // Přidej třídy
            $container.addClass('slider-active');
            $grid.addClass('swiper swiper-initialized carousel');
            
            // Přidej třídu každému produktu
            $items.addClass('swiper-slide');
            
            // Obal produkty do wrapper
            $items.wrapAll('<div class="swiper-wrapper"></div>');
            
            // Vytvoř wrapper pro celý slider s navigací
            const $sliderWrapper = $('<div class="product-slider-wrapper"></div>');
            $grid.wrap($sliderWrapper);
            
            // Vytvoř custom navigační šipky
            const navigation = this.createCustomNavigation(sliderId);
            
            // Přidej navigaci do wrapper (mimo swiper)
            $grid.parent().append(navigation.prevButton);
            $grid.parent().append(navigation.nextButton);
            
            // Přidej pagination
            $container.append('<div class="swiper-pagination"></div>');
            
            // Přidej CSS styly
            this.addStyles();
            
            // Inicializuj Swiper
            setTimeout(function() {
                const $prevEl = $grid.parent().find('.swiper-button-prev-custom')[0];
                const $nextEl = $grid.parent().find('.swiper-button-next-custom')[0];
                
                const swiperInstance = new Swiper('#' + sliderId, {
                    // Základní nastavení - začni s 2 produkty na mobilu
                    slidesPerView: 2,
                    slidesPerGroup: 2,
                    spaceBetween: 10,
                    
                    // Obecné nastavení
                    watchOverflow: true,
                    threshold: 10,
                    speed: 600,
                    grabCursor: true,
                    
                    // Navigace
                    navigation: {
                        nextEl: $nextEl,
                        prevEl: $prevEl,
                    },
                    
                    // Pagination
                    pagination: {
                        el: $container.find('.swiper-pagination')[0],
                        clickable: true,
                        type: 'bullets'
                    },
                    
                    // Responzivní breakpointy
                    breakpoints: {
                        768: {
                            slidesPerView: 3,
                            slidesPerGroup: 3,
                            spaceBetween: 15
                        },
                        1024: {
                            slidesPerView: 4,
                            slidesPerGroup: 4,
                            spaceBetween: 15
                        },
                        1200: {
                            slidesPerView: 5,
                            slidesPerGroup: 5,
                            spaceBetween: 15
                        }
                    },
                    
                    // Události
                    on: {
                        init: function() {
                            self.checkNavigationNeeded(this);
                            self.updateNavigationState(this);
                            console.log('ProductSlider: Slider ' + index + ' inicializován s ' + this.slides.length + ' produkty');
                        },
                        
                        slideChange: function() {
                            self.updateNavigationState(this);
                        },
                        
                        resize: function() {
                            self.checkNavigationNeeded(this);
                            self.updateNavigationState(this);
                        },
                        
                        breakpoint: function(swiper) {
                            self.checkNavigationNeeded(swiper);
                            self.updateNavigationState(swiper);
                        }
                    }
                });
                
                self.instances.push({
                    id: sliderId,
                    container: $container[0],
                    swiper: swiperInstance,
                    totalItems: totalItems
                });
                
            }, 100);
        },

        checkNavigationNeeded: function(swiper) {
            const totalSlides = swiper.slides.length;
            const slidesPerView = Math.ceil(swiper.params.slidesPerView);
            const needsNavigation = totalSlides > slidesPerView;
            
            const $prevButton = $(swiper.navigation.prevEl);
            const $nextButton = $(swiper.navigation.nextEl);
            
            if (needsNavigation) {
                $prevButton.show();
                $nextButton.show();
            } else {
                $prevButton.hide();
                $nextButton.hide();
            }
            
            return needsNavigation;
        },

        updateNavigationState: function(swiper) {
            const $prevButton = $(swiper.navigation.prevEl);
            const $nextButton = $(swiper.navigation.nextEl);
            
            if (swiper.isBeginning) {
                $prevButton.addClass('disabled').attr('aria-disabled', 'true');
            } else {
                $prevButton.removeClass('disabled').attr('aria-disabled', 'false');
            }
            
            if (swiper.isEnd) {
                $nextButton.addClass('disabled').attr('aria-disabled', 'true');
            } else {
                $nextButton.removeClass('disabled').attr('aria-disabled', 'false');
            }
        },

        addStyles: function() {
            if ($('#product-slider-styles').length) {
                return;
            }

            const styles = `
                <style id="product-slider-styles">
                    /* Wrapper pro slider s navigací */
                    .product-slider-wrapper {
                        position: relative;
                    }
                    
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
                    
                    /* Navigační šipky - specifické pro product slider */
                    .product-slider-wrapper .carousel-nav {
                        position: absolute;
                        top: 50%;
                        transform: translateY(-50%);
                        z-index: 10;
                    }
                    
                    .product-slider-wrapper .carousel-prev {
                        left: -20px;
                    }
                    
                    .product-slider-wrapper .carousel-next {
                        right: -20px;
                    }
                    
                    /* Disabled stav */
                    .product-slider-wrapper .carousel-nav.disabled {
                        opacity: 0.35;
                        cursor: not-allowed;
                        pointer-events: none;
                    }
                    
                    /* Hover efekt */
                    .product-slider-wrapper .carousel-nav:not(.disabled):hover {
                        transform: translateY(-50%) scale(1.1);
                    }
                    
                    /* Pagination */
                    .slider-active .swiper-pagination {
                        position: relative;
                        text-align: center;
                        margin-top: 20px;
                        line-height: 1;
                        z-index: 10;
                    }
                    
                    .slider-active .swiper-pagination-bullet {
                        width: 8px;
                        height: 8px;
                        display: inline-block;
                        border-radius: 50%;
                        background: #ccc;
                        opacity: 1;
                        margin: 0 4px;
                        cursor: pointer;
                        transition: all 0.3s;
                        border: none;
                        padding: 0;
                    }
                    
                    .slider-active .swiper-pagination-bullet:hover {
                        background: #999;
                    }
                    
                    .slider-active .swiper-pagination-bullet-active {
                        background: #27ae60;
                        width: 24px;
                        border-radius: 4px;
                    }
                    
                    /* Responzivní úpravy */
                    @media (max-width: 768px) {
                        .product-slider-wrapper .carousel-prev {
                            left: 10px;
                        }
                        
                        .product-slider-wrapper .carousel-next {
                            right: 10px;
                        }
                        
                        .slider-active .swiper-pagination-bullet {
                            width: 6px;
                            height: 6px;
                            margin: 0 3px;
                        }
                        
                        .slider-active .swiper-pagination-bullet-active {
                            width: 20px;
                        }
                    }
                    
                    @media (max-width: 1200px) {
                        .product-slider-wrapper .carousel-nav {
                            opacity: 1;
                        }
                    }
                </style>
            `;
            
            $('head').append(styles);
        },

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
            $('.product-slider-wrapper').children().unwrap();
        },

        debug: function() {
            console.log('ProductSlider v3.0 Debug:');
            console.log('Instances:', this.instances);
            this.instances.forEach((instance, index) => {
                const swiper = instance.swiper;
                console.log(`Slider ${index}:`, {
                    id: instance.id,
                    totalItems: instance.totalItems,
                    activeIndex: swiper.activeIndex,
                    slidesPerGroup: swiper.params.slidesPerGroup,
                    slidesPerView: swiper.params.slidesPerView
                });
            });
        }
    };

    // Automatická inicializace
    $(document).ready(function() {
        ProductSlider.init();
    });

    // Export pro globální použití
    window.ProductSlider = ProductSlider;

})(jQuery);
