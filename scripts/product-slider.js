/**
 * Product Slider for NOAH Natural Products
 * Převádí grid produktů na interaktivní slider pomocí Swiper.js
 * 
 * @version 4.2.0 - Konfigurovatelné breakpointy
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
            skipOnBodyClasses: ['page-site', 'is-product-list', 'page-manufacturer'],
            svgIconsPath: '/images/icons/fa/solid.svg?1757317552',
            
            // Konfigurace breakpointů a počtu zobrazených produktů
            // Formát: { minWidth: počet produktů }
            // DŮLEŽITÉ: Breakpointy musí být seřazené od nejmenšího po největší
            breakpoints: {
                0: 2,      // xs (výchozí) - 2 produkty
                576: 2,    // sm - 2 produkty
                768: 2,    // md - 2 produkty
                992: 3,    // lg - 3 produkty
                1204: 4,   // xl - 4 produkty
                1502: 5    // xxl - 5 produktů
            },
            
            // Mezery mezi slidy pro různé breakpointy
            // Formát: { minWidth: mezera v px }
            spacing: {
                0: 0,      // xs
                576: 0,    // sm
                768: 0,    // md
                992: 0,    // lg
                1204: 0,   // xl
                1502: 0    // xxl
            }
        },

        instances: [],

        /**
         * Získá počet produktů pro aktuální šířku okna
         * @param {number} windowWidth - Šířka okna v px
         * @returns {number} Počet produktů k zobrazení
         */
        getSlidesPerView: function(windowWidth) {
            let slidesPerView = 2; // výchozí hodnota
            
            // Projdi breakpointy od nejmenšího a najdi odpovídající hodnotu
            for (let breakpoint in this.config.breakpoints) {
                if (windowWidth >= parseInt(breakpoint)) {
                    slidesPerView = this.config.breakpoints[breakpoint];
                }
            }
            
            return slidesPerView;
        },
        
        /**
         * Získá mezeru mezi slidy pro aktuální šířku okna
         * @param {number} windowWidth - Šířka okna v px
         * @returns {number} Mezera v px
         */
        getSpaceBetween: function(windowWidth) {
            let spaceBetween = 0;
            
            for (let breakpoint in this.config.spacing) {
                if (windowWidth >= parseInt(breakpoint)) {
                    spaceBetween = this.config.spacing[breakpoint];
                }
            }
            
            return spaceBetween;
        },
        
        /**
         * Vytvoří konfiguraci breakpointů pro Swiper
         * @returns {Object} Konfigurace breakpointů pro Swiper
         */
        getSwiperBreakpoints: function() {
            const swiperBreakpoints = {};
            
            // Přeskoč první breakpoint (0), protože to je výchozí hodnota
            const breakpointKeys = Object.keys(this.config.breakpoints);
            for (let i = 1; i < breakpointKeys.length; i++) {
                const breakpoint = breakpointKeys[i];
                swiperBreakpoints[breakpoint] = {
                    slidesPerView: this.config.breakpoints[breakpoint],
                    slidesPerGroup: 1,
                    spaceBetween: this.config.spacing[breakpoint] || 0
                };
            }
            
            return swiperBreakpoints;
        },

        shouldSkipPage: function() {
            const $body = $('body');
            
            for (let className of this.config.skipOnBodyClasses) {
                if ($body.hasClass(className)) {
                    console.log('ProductSlider: Přeskakuji inicializaci - nalezena třída body.' + className);
                    return true;
                }
            }
            
            return false;
        },

        init: function() {
            const self = this;
            
            if (typeof $ === 'undefined') {
                console.error('ProductSlider: jQuery není načteno');
                return;
            }

            if (this.shouldSkipPage()) {
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
            
            // Přidej listener pro změnu velikosti okna
            $(window).on('resize.productSlider', self.debounce(function() {
                self.handleResize();
            }, 250));
        },
        
        handleResize: function() {
            const self = this;
            
            // Projdi všechny kontejnery znovu
            $(this.config.containerSelector).each(function(index) {
                const $container = $(this);
                const $grid = $container.find(self.config.gridSelector);
                const totalItems = $grid.find(self.config.itemSelector).length;
                
                // Zjisti kolik produktů se vejde podle aktuální šířky okna
                const windowWidth = window.innerWidth;
                const expectedSlidesPerView = self.getSlidesPerView(windowWidth);
                
                const hasSlider = $grid.hasClass('swiper-initialized');
                const needsSlider = totalItems > expectedSlidesPerView;
                
                // Pokud nemá slider a potřebuje ho, vytvoř ho
                if (!hasSlider && needsSlider) {
                    if ($grid.parent().hasClass('product-slider-wrapper')) {
                        $grid.unwrap();
                    }
                    $grid.find('.swiper-wrapper').children().unwrap();
                    $grid.find('.swiper-slide').removeClass('swiper-slide');
                    $container.find('.swiper-pagination').remove();
                    $container.find('.carousel-nav').remove();
                    $grid.removeClass('swiper swiper-initialized carousel');
                    $container.removeClass('slider-active');
                    
                    self.createSlider($container, $grid, index);
                }
            });
        },
        
        debounce: function(func, wait) {
            let timeout;
            return function executedFunction() {
                const context = this;
                const args = arguments;
                const later = function() {
                    timeout = null;
                    func.apply(context, args);
                };
                clearTimeout(timeout);
                timeout = setTimeout(later, wait);
            };
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
            
            // Zjisti kolik produktů se vejde podle aktuální šířky okna
            const windowWidth = window.innerWidth;
            const expectedSlidesPerView = this.getSlidesPerView(windowWidth);
            
            // Pokud se všechny produkty vejdou, neinicializuj slider
            if (totalItems <= expectedSlidesPerView) {
                console.log('ProductSlider: Slider ' + index + ' přeskočen - všech ' + totalItems + ' produktů se vejde na obrazovku');
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
                
                // Získej výchozí hodnoty z konfigurace
                const defaultSlidesPerView = self.config.breakpoints[0];
                const defaultSpaceBetween = self.config.spacing[0];
                
                const swiperInstance = new Swiper('#' + sliderId, {
                    // Základní nastavení - výchozí hodnoty z konfigurace
                    slidesPerView: defaultSlidesPerView,
                    slidesPerGroup: 1,
                    spaceBetween: defaultSpaceBetween,
                    
                    // Infinite loop
                    loop: true,
                    loopFillGroupWithBlank: false,
                    
                    // Automatická výška
                    autoHeight: false, // Zajistí stejnou výšku všech slidů
                    
                    // Obecné nastavení
                    watchOverflow: false, // Musí být false pro loop
                    threshold: 10,
                    speed: 600,
                    grabCursor: true,
                    allowTouchMove: true,
                    
                    // Navigace
                    navigation: {
                        nextEl: $nextEl,
                        prevEl: $prevEl,
                    },
                    
                    // Pagination
                    pagination: {
                        el: $container.find('.swiper-pagination')[0],
                        clickable: true,
                        type: 'bullets',
                        dynamicBullets: false,
                    },
                    
                    // Responzivní breakpointy z konfigurace
                    breakpoints: self.getSwiperBreakpoints(),
                    
                    // Události
                    on: {
                        init: function() {
                            self.updateNavigationVisibility(this);
                            console.log('ProductSlider: Slider ' + index + ' inicializován');
                            console.log('- Celkem produktů: ' + totalItems);
                            console.log('- Zobrazeno produktů: ' + this.params.slidesPerView);
                            console.log('- Loop mode: ' + (this.params.loop ? 'zapnuto' : 'vypnuto'));
                            console.log('- Aktuální breakpoint: ' + window.innerWidth + 'px');
                        },
                        
                        resize: function() {
                            // Při změně velikosti okna zkontroluj, jestli je slider stále potřeba
                            const windowWidth = window.innerWidth;
                            const expectedSlidesPerView = self.getSlidesPerView(windowWidth);
                            
                            // Pokud se teď všechny produkty vejdou, skryj navigaci
                            if (totalItems <= expectedSlidesPerView) {
                                $(this.navigation.prevEl).hide();
                                $(this.navigation.nextEl).hide();
                                $(this.pagination.el).hide();
                                this.allowTouchMove = false;
                                this.allowSlideNext = false;
                                this.allowSlidePrev = false;
                            } else {
                                this.allowTouchMove = true;
                                this.allowSlideNext = true;
                                this.allowSlidePrev = true;
                                self.updateNavigationVisibility(this);
                            }
                        },
                        
                        breakpoint: function(swiper) {
                            self.updateNavigationVisibility(swiper);
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

        updateNavigationVisibility: function(swiper) {
            // Při loop mode jsou navigační prvky vždy viditelné
            const totalSlides = swiper.slides.length - (swiper.loopedSlides * 2); // Odečti duplikované slidy
            const slidesPerView = Math.ceil(swiper.params.slidesPerView);
            const needsNavigation = totalSlides > slidesPerView || swiper.params.loop;
            
            const $prevButton = $(swiper.navigation.prevEl);
            const $nextButton = $(swiper.navigation.nextEl);
            const $pagination = $(swiper.pagination.el);
            
            if (needsNavigation) {
                $prevButton.show();
                $nextButton.show();
                $pagination.show();
            } else {
                $prevButton.hide();
                $nextButton.hide();
                $pagination.hide();
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
                        overflow: visible !important;
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
                    
                    /* Zachovat původní styly card-item a zajistit správnou výšku */
                    .slider-active .card-item {
                        height: auto;
                        display: flex !important;
                    }
                    
                    /* Zajistit viditelnost všech vnořených elementů */
                    .slider-active .swiper-slide * {
                        visibility: visible !important;
                    }
                    
                    /* Navigační šipky */
                    .product-slider-wrapper .carousel-nav {
                        position: absolute;
                        top: 50%;
                        transform: translateY(-50%);
                        z-index: 10;
                        transition: all 0.3s;
                        opacity: 0.5;
                    }
                    
                    .product-slider-wrapper .carousel-prev {
                        left: -20px;
                    }
                    
                    .product-slider-wrapper .carousel-next {
                        right: -20px;
                    }
                    
                    /* Hover efekt na celém wrapperu - zobrazí šipky */
                    .product-slider-wrapper:hover .carousel-nav {
                        opacity: 1;
                    }
                    
                    /* Hover efekt na samotné šipce */
                    .product-slider-wrapper .carousel-nav:hover {
                        transform: translateY(-50%) scale(1.1);
                        opacity: 1;
                    }
                    
                    /* Touch zařízení - vždy plná opacita */
                    @media (hover: none) and (pointer: coarse) {
                        .product-slider-wrapper .carousel-nav {
                            opacity: 1;
                        }
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
                        .slider-active .swiper-pagination-bullet {
                            width: 6px;
                            height: 6px;
                            margin: 0 3px;
                        }
                        
                        .slider-active .swiper-pagination-bullet-active {
                            width: 20px;
                        }
                    }
                </style>
            `;
            
            $('head').append(styles);
        },

        destroy: function() {
            // Odstraň event listener
            $(window).off('resize.productSlider');
            
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
            console.log('ProductSlider v4.2 Debug:');
            console.log('Window width:', window.innerWidth + 'px');
            console.log('Body classes:', $('body').attr('class'));
            console.log('Skip on classes:', this.config.skipOnBodyClasses);
            console.log('Should skip:', this.shouldSkipPage());
            console.log('Configured breakpoints:', this.config.breakpoints);
            console.log('Instances:', this.instances);
            this.instances.forEach((instance, index) => {
                const swiper = instance.swiper;
                console.log(`Slider ${index}:`, {
                    id: instance.id,
                    totalItems: instance.totalItems,
                    activeIndex: swiper.activeIndex,
                    slidesPerGroup: swiper.params.slidesPerGroup,
                    slidesPerView: swiper.params.slidesPerView,
                    loop: swiper.params.loop,
                    realIndex: swiper.realIndex,
                    currentBreakpoint: swiper.currentBreakpoint
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
