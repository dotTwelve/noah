/**
 * Product Slider for NOAH Natural Products
 * Převádí grid produktů na interaktivní slider pomocí Swiper.js
 * 
 * @version 2.3.0 - Automatické skrývání navigačních šipek když není potřeba scrollovat
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
         * Kontrola, zda jsou potřeba navigační šipky
         */
        checkNavigationNeeded: function(swiper) {
            const totalSlides = swiper.slides.length;
            const slidesPerView = Math.floor(swiper.params.slidesPerView);
            
            // Skryj/zobraz navigaci podle potřeby
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
                    
                    // Pagination - použijeme bullets místo custom
                    pagination: {
                        el: $container.find('.swiper-pagination')[0],
                        clickable: true,
                        type: 'bullets',
                        dynamicBullets: false,
                        renderBullet: function (index, className) {
                            // Vypočítej číslo skupiny
                            const groupNumber = Math.floor(index / this.params.slidesPerGroup) + 1;
                            const isFirstInGroup = index % this.params.slidesPerGroup === 0;
                            
                            // Renderuj pouze první slide z každé skupiny
                            if (isFirstInGroup) {
                                return '<span class="' + className + '" data-slide-index="' + index + '"></span>';
                            }
                            return '';
                        }
                    },
                    
                    // Responzivní breakpointy
                    breakpoints: {
                        0: {
                            slidesPerView: 2,
                            slidesPerGroup: 2,
                            spaceBetween: 0
                        },
                        768: {
                            slidesPerView: 3,
                            slidesPerGroup: 3,
                            spaceBetween: 0
                        },
                        1024: {
                            slidesPerView: 4,
                            slidesPerGroup: 4,
                            spaceBetween: 0
                        },
                        1200: {
                            slidesPerView: 5,
                            slidesPerGroup: 5,
                            spaceBetween: 0
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
                            
                            // Oprav pagination po inicializaci
                            self.updatePagination(this);
                            // Kontrola navigace při inicializaci
                            self.checkNavigationNeeded(this);
                            
                            console.log('ProductSlider: Slider ' + index + ' inicializován s ' + this.slides.length + ' produkty');
                        },
                        
                        slideChange: function() {
                            // Aktualizuj aktivní bullet při změně slidu
                            self.updatePaginationActive(this);
                        },
                        
                        breakpoint: function() {
                            // Ujisti se, že slidesPerGroup = slidesPerView při změně breakpointu
                            if (this.params.slidesPerGroup !== this.params.slidesPerView) {
                                this.params.slidesPerGroup = this.params.slidesPerView;
                                this.update();
                            }
                            
                            // Aktualizuj pagination po změně breakpointu
                            setTimeout(() => {
                                self.updatePagination(this);
                                // Kontrola navigace při změně breakpointu
                                self.checkNavigationNeeded(this);
                            }, 100);
                        },
                        
                        resize: function() {
                            // Kontrola navigace při změně velikosti okna
                            self.checkNavigationNeeded(this);
                        }
                    }
                };
                
                // Inicializuj Swiper
                const swiperInstance = new Swiper('#' + sliderId, swiperConfig);
                
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
         * Aktualizace pagination po inicializaci nebo změně breakpointu
         */
        updatePagination: function(swiper) {
            const totalGroups = Math.ceil(swiper.slides.length / swiper.params.slidesPerGroup);
            const $pagination = $(swiper.pagination.el);
            
            // Skryj pagination pokud je jen jedna skupina
            if (totalGroups <= 1) {
                $pagination.hide();
                return;
            } else {
                $pagination.show();
            }
            
            // Vyčisti existující bullets
            $pagination.empty();
            
            // Vytvoř nové bullets pro každou skupinu
            for (let i = 0; i < totalGroups; i++) {
                const slideIndex = i * swiper.params.slidesPerGroup;
                const $bullet = $('<span class="swiper-pagination-bullet" data-slide-index="' + slideIndex + '"></span>');
                
                // Přidej click handler
                $bullet.on('click', function() {
                    swiper.slideTo(slideIndex);
                });
                
                $pagination.append($bullet);
            }
            
            // Nastav aktivní bullet
            this.updatePaginationActive(swiper);
        },

        /**
         * Aktualizace aktivního bullet
         */
        updatePaginationActive: function(swiper) {
            const currentGroup = Math.floor(swiper.activeIndex / swiper.params.slidesPerGroup);
            const $pagination = $(swiper.pagination.el);
            
            // Odstraň aktivní třídu ze všech bullets
            $pagination.find('.swiper-pagination-bullet').removeClass('swiper-pagination-bullet-active');
            
            // Přidej aktivní třídu správnému bullet
            $pagination.find('.swiper-pagination-bullet').eq(currentGroup).addClass('swiper-pagination-bullet-active');
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
                        z-index: 10;
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
                        border: none;
                        padding: 0;
                    }
                    
                    .swiper-pagination-bullet:hover {
                        background: #999;
                    }
                    
                    .swiper-pagination-bullet-active {
                        background: #27ae60;
                        width: 24px;
                        border-radius: 4px;
                    }
                    
                    /* Responzivní úpravy */
                    @media (max-width: 768px) {
                        .slider-active .swiper {
                            margin-left: -16px;
                            margin-right: -16px;
                        }
                    
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
        },

        /**
         * Debug funkce pro testování
         */
        debug: function() {
            console.log('ProductSlider v2.3 Debug Info:');
            console.log('Instances:', this.instances);
            this.instances.forEach((instance, index) => {
                const swiper = instance.swiper;
                const needsNavigation = swiper.slides.length > Math.floor(swiper.params.slidesPerView);
                console.log(`Slider ${index}:`, {
                    id: instance.id,
                    totalItems: instance.totalItems,
                    activeIndex: swiper.activeIndex,
                    slidesPerGroup: swiper.params.slidesPerGroup,
                    slidesPerView: swiper.params.slidesPerView,
                    needsNavigation: needsNavigation,
                    navigationVisible: $(swiper.navigation.prevEl).is(':visible')
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
