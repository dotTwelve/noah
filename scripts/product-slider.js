/**
 * Product Slider for NOAH Natural Products
 * Převádí grid produktů na interaktivní slider pomocí Swiper.js
 * 
 * @version 1.0.2
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
            loop: false, // Vypnuto - způsobuje problémy s duplicitními slidy
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
            const totalItems = $items.length;
            
            console.log('ProductSlider: Nalezeno ' + totalItems + ' produktů pro slider ' + index);
            
            // Kontrola počtu položek
            if (totalItems === 0) {
                console.warn('ProductSlider: Žádné produkty nenalezeny');
                return;
            }
            
            const $wrapper = $('<div class="swiper-wrapper"></div>');
            
            // Klonuj položky místo přesouvání - zachová původní DOM strukturu
            $items.each(function(itemIndex) {
                const $item = $(this).clone();
                $item.addClass('swiper-slide')
                     .attr('data-slide-index', itemIndex);
                $wrapper.append($item);
            });
            
            // Vyprázdni grid a přidej wrapper
            $grid.empty().append($wrapper);
            
            // Přidej navigaci
            const $prevBtn = $('<div class="swiper-button-prev"></div>');
            const $nextBtn = $('<div class="swiper-button-next"></div>');
            $grid.append($prevBtn).append($nextBtn);
            
            // Přidej pagination
            const $pagination = $('<div class="swiper-pagination"></div>');
            $container.append($pagination);
            
            // Přidej označení pro debugování
            $grid.addClass('swiper-initialized');
            
            // Inicializuj Swiper s upravenými parametry
            const swiperInstance = new Swiper('#' + sliderId, {
                // Základní nastavení
                slidesPerView: 1,
                spaceBetween: 0,
                watchOverflow: true,
                centerInsufficientSlides: false, // Změněno na false
                loop: false, // Důležité - loop může způsobit problémy s velkým počtem slidů
                
                // Důležité pro správné zobrazení všech slidů
                observer: true,
                observeParents: true,
                observeSlideChildren: true,
                
                // Virtuální slidy pro velké množství produktů
                virtual: totalItems > 20 ? {
                    enabled: true,
                    addSlidesAfter: 2,
                    addSlidesBefore: 2,
                    cache: true
                } : false,
                
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
                    dynamicBullets: true,
                    dynamicMainBullets: 3 // Omezit počet viditelných bullets
                },
                
                // Responzivní nastavení
                breakpoints: this.config.slidesPerView,
                
                // Události
                on: {
                    init: function() {
                        console.log('ProductSlider: Slider ' + index + ' inicializován');
                        console.log('Počet slidů:', this.slides.length);
                        console.log('Virtual slides enabled:', this.params.virtual.enabled);
                        console.log('Slides per view:', this.params.slidesPerView);
                        self.handleLazyLoad(this);
                        self.checkSliderIntegrity(this);
                    },
                    slideChange: function() {
                        console.log('Slide změněn na index:', this.activeIndex);
                        console.log('Real index:', this.realIndex);
                        console.log('Slides per view:', this.params.slidesPerView);
                        self.handleLazyLoad(this);
                    },
                    reachEnd: function() {
                        console.log('Dosažen konec slideru');
                        console.log('Poslední viditelný index:', this.activeIndex);
                    },
                    resize: function() {
                        console.log('Slider resized, updating...');
                        this.update();
                    }
                }
            });
            
            // Ulož instanci
            this.instances.push({
                id: sliderId,
                container: $container[0],
                swiper: swiperInstance,
                totalItems: totalItems
            });
            
            // Přidej CSS styly
            this.addStyles();
        },

        /**
         * Kontrola integrity slideru
         */
        checkSliderIntegrity: function(swiper) {
            const slides = swiper.slides;
            const visibleSlides = [];
            
            for (let i = 0; i < slides.length; i++) {
                const slide = slides[i];
                const hasContent = $(slide).find('*').length > 0;
                
                if (!hasContent) {
                    console.warn('ProductSlider: Prázdný slide na pozici ' + i);
                } else {
                    visibleSlides.push(i);
                }
            }
            
            console.log('ProductSlider: Viditelné slidy:', visibleSlides.length + '/' + slides.length);
        },

        /**
         * Oprava problémů se sliderem
         */
        fixSliderIssues: function(swiper) {
            // Force update slideru
            swiper.update();
            
            // Přepočítej velikosti
            swiper.updateSize();
            swiper.updateSlides();
            swiper.updateProgress();
            swiper.updateSlidesClasses();
            
            // Pokud je slider na konci ale jsou prázdné slidy, vrať se
            if (swiper.isEnd && swiper.activeIndex > 0) {
                const $activeSlide = $(swiper.slides[swiper.activeIndex]);
                if ($activeSlide.find('*').length === 0) {
                    console.log('ProductSlider: Detekován prázdný slide, vracím se zpět');
                    swiper.slideTo(0);
                }
            }
        },

        /**
         * Lazy loading obrázků
         */
        handleLazyLoad: function(swiper) {
            const activeIndex = swiper.activeIndex;
            const slidesPerView = Math.ceil(swiper.params.slidesPerView);
            
            // Načti obrázky v aktuálních a následujících slidech
            for (let i = activeIndex; i < Math.min(activeIndex + slidesPerView + 2, swiper.slides.length); i++) {
                if (swiper.slides[i]) {
                    const $slide = $(swiper.slides[i]);
                    const $images = $slide.find('img[loading="lazy"], img[data-src]');
                    
                    $images.each(function() {
                        const $img = $(this);
                        if (!$img.attr('data-loaded')) {
                            // Pokud má data-src, použij to
                            const dataSrc = $img.attr('data-src');
                            if (dataSrc && !$img.attr('src')) {
                                $img.attr('src', dataSrc);
                            }
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
                        margin-left: -16px;
                        margin-right: -16px;
                    }
                    
                    .slider-active .swiper-wrapper {
                        display: flex !important;
                        transition-property: transform;
                        position: relative;
                        width: 100%;
                        height: 100%;
                        z-index: 1;
                    }
                    
                    .slider-active .card-item.swiper-slide {
                        flex-shrink: 0;
                        width: 100%;
                        height: auto;
                        display: block !important;
                        position: relative;
                        transition-property: transform;
                    }
                    
                    /* Zajistit viditelnost obsahu */
                    .slider-active .swiper-slide > * {
                        display: block !important;
                        visibility: visible !important;
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
                        pointer-events: none;
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
                        display: inline-block;
                        border-radius: 50%;
                        cursor: pointer;
                    }
                    
                    .swiper-pagination-bullet-active {
                        background: #27ae60;
                        width: 25px;
                        border-radius: 4px;
                    }
                    
                    /* Virtual slides support */
                    .swiper-virtual .swiper-slide {
                        height: auto !important;
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
                        .slider-active .card-group.swiper {
                            margin-left: 0;
                            margin-right: 0;
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
            
            // Debug tlačítko pro testování
            $(document).on('keydown', function(e) {
                // Ctrl+Shift+D pro debug info
                if (e.ctrlKey && e.shiftKey && e.keyCode === 68) {
                    self.debugSliders();
                }
            });
        },

        /**
         * Debug funkce pro kontrolu sliderů
         */
        debugSliders: function() {
            console.group('ProductSlider Debug Info');
            this.instances.forEach((instance, index) => {
                console.group('Slider ' + index);
                console.log('ID:', instance.id);
                console.log('Total items:', instance.totalItems);
                console.log('Current index:', instance.swiper.activeIndex);
                console.log('Real index:', instance.swiper.realIndex);
                console.log('Slides count:', instance.swiper.slides.length);
                console.log('Is Beginning:', instance.swiper.isBeginning);
                console.log('Is End:', instance.swiper.isEnd);
                
                // Kontrola prázdných slidů
                let emptySlides = [];
                for (let i = 0; i < instance.swiper.slides.length; i++) {
                    const $slide = $(instance.swiper.slides[i]);
                    if ($slide.find('*').length === 0) {
                        emptySlides.push(i);
                    }
                }
                if (emptySlides.length > 0) {
                    console.warn('Prázdné slidy na pozicích:', emptySlides);
                }
                
                console.groupEnd();
            });
            console.groupEnd();
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
                instance.swiper.update();
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
