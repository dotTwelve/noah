/**
 * Product Slider for NOAH Natural Products
 * Převádí grid produktů na interaktivní slider pomocí Swiper.js
 * 
 * @version 1.0.0
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
            swiperCSS: 'https://cdn.jsdelivr.net/npm/swiper@11/swiper-bundle.min.css',
            enabledBreakpoint: null, // null = vždy aktivní, číslo = aktivní pod touto šířkou
            autoplay: false,
            loop: false,
            slidesPerView: {
                320: 1,  // 320-575px: 1 produkt
                576: 2,  // 576-767px: 2 produkty
                768: 3,  // 768-1023px: 3 produkty
                1024: 4, // 1024-1199px: 4 produkty
                1200: 5  // 1200px+: 5 produktů
            }
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
                self.bindEvents();
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
            
            // Přidej třídu pro aktivaci stylů
            $container.addClass('slider-active');
            $grid.addClass('swiper');
            
            // Vytvoř wrapper pro slidy
            const $items = $grid.find(this.config.itemSelector);
            const $wrapper = $('<div class="swiper-wrapper"></div>');
            
            $items.each(function() {
                $(this).addClass('swiper-slide').appendTo($wrapper);
            });
            
            $grid.empty().append($wrapper);
            
            // Přidej navigaci
            const $prevBtn = $('<div class="swiper-button-prev"></div>');
            const $nextBtn = $('<div class="swiper-button-next"></div>');
            $grid.append($prevBtn).append($nextBtn);
            
            // Přidej pagination
            const $pagination = $('<div class="swiper-pagination"></div>');
            $container.append($pagination);
            
            // Inicializuj Swiper
            const swiperInstance = new Swiper('#' + sliderId, {
                slidesPerView: 1,
                spaceBetween: 0, // Žádné extra mezery - používají se původní marginy
                watchOverflow: true,
                centerInsufficientSlides: true,
                loop: this.config.loop,
                
                // Autoplay
                ...(this.config.autoplay && {
                    autoplay: {
                        delay: 5000,
                        disableOnInteraction: false,
                        pauseOnMouseEnter: true
                    }
                }),
                
                // Navigace
                navigation: {
                    nextEl: '#' + sliderId + ' .swiper-button-next',
                    prevEl: '#' + sliderId + ' .swiper-button-prev',
                },
                
                // Pagination
                pagination: {
                    el: $pagination[0],
                    clickable: true,
                    dynamicBullets: true
                },
                
                // Responzivní nastavení
                breakpoints: this.config.slidesPerView,
                
                // Události
                on: {
                    init: function() {
                        console.log('ProductSlider: Slider ' + index + ' inicializován');
                        self.handleLazyLoad(this);
                    },
                    slideChange: function() {
                        self.handleLazyLoad(this);
                    }
                }
            });
            
            // Ulož instanci
            this.instances.push({
                id: sliderId,
                container: $container[0],
                swiper: swiperInstance
            });
            
            // Přidej CSS styly
            this.addStyles();
        },

        /**
         * Lazy loading obrázků
         */
        handleLazyLoad: function(swiper) {
            const activeIndex = swiper.activeIndex;
            const slidesPerView = swiper.params.slidesPerView;
            
            // Načti obrázky v aktuálních a následujících slidech
            for (let i = activeIndex; i < activeIndex + slidesPerView + 1; i++) {
                if (swiper.slides[i]) {
                    const $slide = $(swiper.slides[i]);
                    const $images = $slide.find('img[loading="lazy"]');
                    
                    $images.each(function() {
                        const $img = $(this);
                        if (!$img.attr('data-loaded')) {
                            $img.attr('data-loaded', 'true');
                        }
                    });
                }
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
                    /* Základní styly pro slider */
                    .slider-active .card-group.swiper {
                        overflow: hidden;
                        position: relative;
                        /* Zachovává původní marginy */
                    }
                    
                    .slider-active .swiper-wrapper {
                        display: flex !important;
                        transition-property: transform;
                    }
                    
                    .slider-active .card-item.swiper-slide {
                        flex-shrink: 0;
                        width: 100%;
                        height: auto;
                        display: block !important;
                    }
                    
                    /* Navigační šipky */
                    .swiper-button-prev,
                    .swiper-button-next {
                        position: absolute;
                        top: 50%;
                        transform: translateY(-50%);
                        width: 44px;
                        height: 44px;
                        background: white;
                        border-radius: 50%;
                        box-shadow: 0 2px 8px rgba(0,0,0,0.15);
                        transition: all 0.3s ease;
                        z-index: 10;
                    }
                    
                    .swiper-button-prev:after,
                    .swiper-button-next:after {
                        font-size: 18px;
                        color: #333;
                        font-weight: bold;
                    }
                    
                    .swiper-button-prev:hover,
                    .swiper-button-next:hover {
                        box-shadow: 0 4px 12px rgba(0,0,0,0.2);
                        transform: translateY(-50%) scale(1.1);
                    }
                    
                    .swiper-button-disabled {
                        opacity: 0.35;
                        cursor: auto;
                    }
                    
                    /* Pagination */
                    .swiper-pagination {
                        position: relative;
                        text-align: center;
                        margin-top: 20px;
                    }
                    
                    .swiper-pagination-bullet {
                        width: 8px;
                        height: 8px;
                        background: #ccc;
                        opacity: 1;
                        margin: 0 4px;
                        transition: all 0.3s ease;
                    }
                    
                    .swiper-pagination-bullet-active {
                        background: #27ae60;
                        width: 25px;
                        border-radius: 4px;
                    }
                    
                    /* Responzivní styly */
                    @media (max-width: 768px) {
                        .swiper-button-prev,
                        .swiper-button-next {
                            width: 36px;
                            height: 36px;
                        }
                        
                        .swiper-button-prev:after,
                        .swiper-button-next:after {
                            font-size: 14px;
                        }
                    }
                    
                    @media (max-width: 480px) {
                        /* Negativní marginy pro card-group na mobilech */
                        .slider-active .card-group.swiper {
                        }
                        
                        .swiper-button-prev,
                        .swiper-button-next {
                            width: 30px;
                            height: 30px;
                        }
                        
                        .swiper-button-prev:after,
                        .swiper-button-next:after {
                            font-size: 12px;
                        }
                    }
                </style>
            `;
            
            $('head').append(styles);
        },

        /**
         * Bind události
         */
        bindEvents: function() {
            const self = this;
            
            // Responzivní přepínání (pokud je nastaveno)
            if (this.config.enabledBreakpoint) {
                $(window).on('resize', this.debounce(function() {
                    self.handleResponsive();
                }, 250));
            }
            
            // Reinicializace při dynamickém přidání obsahu
            $(document).on('contentUpdated', function() {
                self.initSliders();
            });
        },

        /**
         * Responzivní zpracování
         */
        handleResponsive: function() {
            const windowWidth = $(window).width();
            const shouldBeActive = !this.config.enabledBreakpoint || 
                                  windowWidth <= this.config.enabledBreakpoint;
            
            this.instances.forEach(instance => {
                const isActive = $(instance.container).hasClass('slider-active');
                
                if (shouldBeActive && !isActive) {
                    this.enableSlider(instance);
                } else if (!shouldBeActive && isActive) {
                    this.disableSlider(instance);
                }
            });
        },

        /**
         * Aktivace slideru
         */
        enableSlider: function(instance) {
            if (instance.swiper) {
                instance.swiper.enable();
                $(instance.container).addClass('slider-active');
            }
        },

        /**
         * Deaktivace slideru
         */
        disableSlider: function(instance) {
            if (instance.swiper) {
                instance.swiper.disable();
                $(instance.container).removeClass('slider-active');
            }
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
        },

        /**
         * Debounce helper
         */
        debounce: function(func, wait) {
            let timeout;
            return function executedFunction(...args) {
                const later = () => {
                    clearTimeout(timeout);
                    func(...args);
                };
                clearTimeout(timeout);
                timeout = setTimeout(later, wait);
            };
        }
    };

    // Automatická inicializace při načtení stránky
    $(document).ready(function() {
        ProductSlider.init();
    });

    // Export pro globální použití
    window.ProductSlider = ProductSlider;

})(jQuery);
