/**
 * Product Slider for NOAH Natural Products
 * Převádí grid produktů na interaktivní slider pomocí Swiper.js
 * 
 * @version 4.1.0 - Přidána kontrola body classes pro přeskočení inicializace
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
            skipOnBodyClasses: [], // Zde můžete přidat třídy, na kterých se má slider přeskočit
            svgIconsPath: '/images/icons/fa/solid.svg?1757317552'
        },

        instances: [],

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
                
                // Zjisti kolik produktů se vejde
                const windowWidth = window.innerWidth;
                let expectedSlidesPerView = 2;
                
                if (windowWidth >= 1502) {
                    expectedSlidesPerView = 5;
                } else if (windowWidth >= 1204) {
                    expectedSlidesPerView = 4;
                } else if (windowWidth >= 992) {
                    expectedSlidesPerView = 3;
                }
                
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
            let expectedSlidesPerView = 2; // výchozí pro xs
            
            if (windowWidth >= 1502) {
                expectedSlidesPerView = 5; // xxl
            } else if (windowWidth >= 1204) {
                expectedSlidesPerView = 4; // xl
            } else if (windowWidth >= 992) {
                expectedSlidesPerView = 3; // lg
            } else if (windowWidth >= 768) {
                expectedSlidesPerView = 2; // md
            } else if (windowWidth >= 576) {
                expectedSlidesPerView = 2; // sm
            }
            
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
                
                const swiperInstance = new Swiper('#' + sliderId, {
                    // Základní nastavení - začni s 2 produkty na mobilu (xs)
                    slidesPerView: 2,
                    slidesPerGroup: 1, // DŮLEŽITÉ: Změněno na 1 pro správnou pagination
                    spaceBetween: 0,
                    
                    // Infinite loop
                    loop: true,
                    loopFillGroupWithBlank: false, // Nevyplňovat prázdnými slidy
                    
                    // Automatická výška
                    autoHeight: false, // DŮLEŽITÉ: false zajistí stejnou výšku všech slidů
                    
                    // Obecné nastavení
                    watchOverflow: false, // Musí být false pro loop
                    threshold: 10,
                    speed: 600,
                    grabCursor: true,
                    allowTouchMove: true, // Povolit swipe gesta
                    
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
                        dynamicBullets: false, // Vypnuto pro jasné zobrazení jedné aktivní kuličky
                    },
                    
                    // Responzivní breakpointy
                    breakpoints: {
                        576: {  // sm
                            slidesPerView: 2,
                            slidesPerGroup: 1,
                            spaceBetween: 0
                        },
                        768: {  // md
                            slidesPerView: 2,
                            slidesPerGroup: 1,
                            spaceBetween: 0
                        },
                        992: {  // lg
                            slidesPerView: 3,
                            slidesPerGroup: 1,
                            spaceBetween: 0
                        },
                        1204: { // xl
                            slidesPerView: 4,
                            slidesPerGroup: 1,
                            spaceBetween: 0
                        },
                        1502: { // xxl
                            slidesPerView: 5,
                            slidesPerGroup: 1,
                            spaceBetween: 0
                        }
                    },
                    
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
                            let expectedSlidesPerView = 2;
                            
                            if (windowWidth >= 1502) {
                                expectedSlidesPerView = 5;
                            } else if (windowWidth >= 1204) {
                                expectedSlidesPerView = 4;
                            } else if (windowWidth >= 992) {
                                expectedSlidesPerView = 3;
                            } else if (windowWidth >= 768) {
                                expectedSlidesPerView = 2;
                            } else if (windowWidth >= 576) {
                                expectedSlidesPerView = 2;
                            }
                            
                            // Pokud se teď všechny produkty vejdou, možná by bylo dobré slider zrušit
                            // ale pro jednoduchost jen skryjeme navigaci
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
                    
                    /* Zachovat původní styly card-item a zajistit správnou výšku */
                    .slider-active .card-item {
                        height: auto; /* Automatická výška pro správné vyrovnání */
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
            console.log('ProductSlider v4.1 Debug:');
            console.log('Window width:', window.innerWidth + 'px');
            console.log('Body classes:', $('body').attr('class'));
            console.log('Skip on classes:', this.config.skipOnBodyClasses);
            console.log('Should skip:', this.shouldSkipPage());
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
