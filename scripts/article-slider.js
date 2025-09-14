/**
 * Article Slider for NOAH Natural Products
 * Převádí seznam článků na interaktivní slider pomocí Swiper.js
 * 
 * @version 1.0.0
 * @requires jQuery 3.4.1+
 * @requires Swiper 11+
 */

(function($) {
    'use strict';

    const ArticleSlider = {
        // Konfigurace
        config: {
            containerSelector: '.bic-artcl',           // Hlavní kontejner sekce
            wrapperSelector: '.artcl-wrap',            // Wrapper obsahující články
            itemSelector: 'article',                   // Jednotlivé články
            hrSelector: 'hr',                          // HR elementy mezi články
            swiperCDN: 'https://cdn.jsdelivr.net/npm/swiper@11/swiper-bundle.min.js',
            swiperCSS: 'https://cdn.jsdelivr.net/npm/swiper@11/swiper-bundle.min.css',
            enabledBreakpoint: null, // null = vždy aktivní, číslo = aktivní pod touto šířkou
            autoplay: false,
            loop: false,
            slidesPerView: {
                320: 1,   // 320-767px: 1 článek
                768: 2,   // 768-1199px: 2 články
                1200: 3   // 1200px+: 3 články
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
                console.error('ArticleSlider: jQuery není načteno');
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
                    console.error('ArticleSlider: Nepodařilo se načíst Swiper');
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
                const $wrapper = $container.find(self.config.wrapperSelector);
                
                if (!$wrapper.length || $wrapper.hasClass('swiper-initialized')) {
                    return;
                }

                self.createSlider($container, $wrapper, index);
            });
        },

        /**
         * Vytvoření jednotlivého slideru
         */
        createSlider: function($container, $wrapper, index) {
            const self = this;
            
            // Přidej identifikátor
            const sliderId = 'article-slider-' + index;
            $wrapper.attr('id', sliderId);
            
            // Přidej třídu pro aktivaci stylů
            $container.addClass('article-slider-active');
            $wrapper.addClass('swiper');
            
            // Najdi články a odstraň HR elementy
            const $articles = $wrapper.find(this.config.itemSelector);
            const $hrs = $wrapper.find(this.config.hrSelector);
            const totalArticles = $articles.length;
            
            console.log('ArticleSlider: Nalezeno ' + totalArticles + ' článků pro slider ' + index);
            
            // Kontrola počtu položek
            if (totalArticles === 0) {
                console.warn('ArticleSlider: Žádné články nenalezeny');
                return;
            }
            
            // Odstraň HR elementy (nebudou potřeba ve slideru)
            $hrs.remove();
            
            // Vytvoř swiper wrapper
            const $swiperWrapper = $('<div class="swiper-wrapper"></div>');
            
            // Přesuň články do swiper wrapper
            $articles.each(function(itemIndex) {
                const $article = $(this);
                // Zachovej původní třídy a přidej swiper-slide
                $article.addClass('swiper-slide')
                       .attr('data-slide-index', itemIndex);
                // Odstraň animační třídy, které by mohly interferovat se sliderem
                $article.removeClass('anim-i anim-fade-up anim-y')
                       .removeClass(function(index, className) {
                           return (className.match(/anim-delay-\d+/g) || []).join(' ');
                       });
                $swiperWrapper.append($article);
            });
            
            // Vyprázdni wrapper a přidej swiper wrapper
            $wrapper.empty().append($swiperWrapper);
            
            // Přidej navigaci
            const $navigation = $('<div class="article-slider-navigation"></div>');
            const $prevBtn = $('<div class="swiper-button-prev"><svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="15 18 9 12 15 6"></polyline></svg></div>');
            const $nextBtn = $('<div class="swiper-button-next"><svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="9 18 15 12 9 6"></polyline></svg></div>');
            $navigation.append($prevBtn).append($nextBtn);
            $wrapper.after($navigation);
            
            // Přidej pagination
            const $pagination = $('<div class="swiper-pagination"></div>');
            $wrapper.after($pagination);
            
            // Přidej označení pro debugování
            $wrapper.addClass('swiper-initialized');
            
            // Inicializuj Swiper
            const swiperInstance = new Swiper('#' + sliderId, {
                // Základní nastavení
                slidesPerView: 1,
                spaceBetween: 30,
                watchOverflow: true,
                centerInsufficientSlides: false,
                loop: this.config.loop,
                
                // Observer pro dynamické změny
                observer: true,
                observeParents: true,
                observeSlideChildren: true,
                
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
                    nextEl: $nextBtn[0],
                    prevEl: $prevBtn[0],
                },
                
                // Pagination
                pagination: {
                    el: $pagination[0],
                    clickable: true,
                    dynamicBullets: true,
                    dynamicMainBullets: 3
                },
                
                // Responzivní nastavení
                breakpoints: this.config.slidesPerView,
                
                // Události
                on: {
                    init: function() {
                        console.log('ArticleSlider: Slider ' + index + ' inicializován');
                        console.log('Počet slidů:', this.slides.length);
                        self.handleLazyLoad(this);
                    },
                    slideChange: function() {
                        self.handleLazyLoad(this);
                    },
                    resize: function() {
                        this.update();
                    }
                }
            });
            
            // Ulož instanci
            this.instances.push({
                id: sliderId,
                container: $container[0],
                swiper: swiperInstance,
                totalItems: totalArticles
            });
            
            // Přidej CSS styly
            this.addStyles();
        },

        /**
         * Lazy loading obrázků
         */
        handleLazyLoad: function(swiper) {
            const activeIndex = swiper.activeIndex;
            const slidesPerView = Math.ceil(swiper.params.slidesPerView);
            
            // Načti obrázky v aktuálních a následujících slidech
            for (let i = activeIndex; i < Math.min(activeIndex + slidesPerView + 1, swiper.slides.length); i++) {
                if (swiper.slides[i]) {
                    const $slide = $(swiper.slides[i]);
                    const $images = $slide.find('img[loading="lazy"], img[data-src]');
                    
                    $images.each(function() {
                        const $img = $(this);
                        if (!$img.attr('data-loaded')) {
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
            if ($('#article-slider-styles').length) {
                return;
            }

            const styles = `
                <style id="article-slider-styles">
                    /* Základní styly pro article slider */
                    .article-slider-active .artcl-wrap.swiper {
                        overflow: hidden;
                        position: relative;
                        padding: 0;
                    }
                    
                    .article-slider-active .swiper-wrapper {
                        display: flex !important;
                        flex-direction: row !important;
                        gap: 0 !important;
                    }
                    
                    .article-slider-active article.swiper-slide {
                        flex-shrink: 0;
                        width: 100%;
                        height: auto;
                        margin: 0 !important;
                        padding: 20px;
                        box-sizing: border-box;
                    }
                    
                    /* Úprava layoutu článku ve slideru */
                    .article-slider-active article.swiper-slide {
                        display: flex !important;
                        flex-direction: column !important;
                        gap: 20px;
                    }
                    
                    .article-slider-active article.swiper-slide figure {
                        width: 100%;
                        margin: 0;
                    }
                    
                    .article-slider-active article.swiper-slide figure img {
                        width: 100%;
                        height: auto;
                        object-fit: cover;
                        aspect-ratio: 16/9;
                    }
                    
                    /* Navigační kontejner */
                    .article-slider-navigation {
                        position: relative;
                        height: 0;
                        z-index: 10;
                    }
                    
                    /* Navigační šipky */
                    .article-slider-active .swiper-button-prev,
                    .article-slider-active .swiper-button-next {
                        position: absolute;
                        top: 50%;
                        transform: translateY(-50%);
                        width: 48px;
                        height: 48px;
                        background: white;
                        border-radius: 50%;
                        box-shadow: 0 2px 12px rgba(0,0,0,0.1);
                        transition: all 0.3s ease;
                        display: flex;
                        align-items: center;
                        justify-content: center;
                        cursor: pointer;
                        color: #333;
                    }
                    
                    .article-slider-active .swiper-button-prev {
                        left: -24px;
                    }
                    
                    .article-slider-active .swiper-button-next {
                        right: -24px;
                    }
                    
                    .article-slider-active .swiper-button-prev:after,
                    .article-slider-active .swiper-button-next:after {
                        display: none;
                    }
                    
                    .article-slider-active .swiper-button-prev svg,
                    .article-slider-active .swiper-button-next svg {
                        width: 20px;
                        height: 20px;
                    }
                    
                    .article-slider-active .swiper-button-prev:hover,
                    .article-slider-active .swiper-button-next:hover {
                        background: #27ae60;
                        color: white;
                        box-shadow: 0 4px 16px rgba(39, 174, 96, 0.3);
                        transform: translateY(-50%) scale(1.1);
                    }
                    
                    .article-slider-active .swiper-button-disabled {
                        opacity: 0.35;
                        cursor: default;
                        pointer-events: none;
                    }
                    
                    /* Pagination */
                    .article-slider-active .swiper-pagination {
                        position: relative;
                        text-align: center;
                        margin-top: 30px;
                        margin-bottom: 20px;
                    }
                    
                    .article-slider-active .swiper-pagination-bullet {
                        width: 10px;
                        height: 10px;
                        background: #ddd;
                        opacity: 1;
                        margin: 0 5px;
                        transition: all 0.3s ease;
                        border: 2px solid transparent;
                    }
                    
                    .article-slider-active .swiper-pagination-bullet-active {
                        background: #27ae60;
                        width: 30px;
                        border-radius: 5px;
                    }
                    
                    /* Responzivní styly */
                    @media (min-width: 768px) {
                        .article-slider-active article.swiper-slide {
                            flex-direction: row !important;
                            align-items: center;
                        }
                        
                        .article-slider-active article.swiper-slide figure {
                            flex-shrink: 0;
                            width: 280px;
                        }
                        
                        .article-slider-active article.swiper-slide .gapy-3 {
                            flex: 1;
                        }
                    }
                    
                    @media (min-width: 1200px) {
                        .article-slider-active article.swiper-slide {
                            flex-direction: column !important;
                        }
                        
                        .article-slider-active article.swiper-slide figure {
                            width: 100%;
                        }
                    }
                    
                    @media (max-width: 768px) {
                        .article-slider-active .swiper-button-prev,
                        .article-slider-active .swiper-button-next {
                            width: 40px;
                            height: 40px;
                        }
                        
                        .article-slider-active .swiper-button-prev {
                            left: 10px;
                        }
                        
                        .article-slider-active .swiper-button-next {
                            right: 10px;
                        }
                        
                        .article-slider-active .swiper-button-prev svg,
                        .article-slider-active .swiper-button-next svg {
                            width: 16px;
                            height: 16px;
                        }
                    }
                    
                    /* Animace při přechodu */
                    .article-slider-active .swiper-slide-active article {
                        opacity: 1;
                        transform: scale(1);
                    }
                    
                    .article-slider-active .swiper-slide-next article,
                    .article-slider-active .swiper-slide-prev article {
                        opacity: 0.8;
                        transform: scale(0.95);
                    }
                    
                    /* Hover efekty */
                    .article-slider-active article.swiper-slide:hover {
                        transform: translateY(-5px);
                        transition: transform 0.3s ease;
                    }
                    
                    .article-slider-active article.swiper-slide:hover img {
                        transform: scale(1.05);
                        transition: transform 0.3s ease;
                    }
                    
                    .article-slider-active article.swiper-slide figure {
                        overflow: hidden;
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
            $(document).on('contentUpdated articlesLoaded', function() {
                self.initSliders();
            });
            
            // Debug tlačítko
            $(document).on('keydown', function(e) {
                // Ctrl+Shift+A pro debug info článků
                if (e.ctrlKey && e.shiftKey && e.keyCode === 65) {
                    self.debugSliders();
                }
            });
        },

        /**
         * Debug funkce
         */
        debugSliders: function() {
            console.group('ArticleSlider Debug Info');
            this.instances.forEach((instance, index) => {
                console.group('Slider ' + index);
                console.log('ID:', instance.id);
                console.log('Total articles:', instance.totalItems);
                console.log('Current index:', instance.swiper.activeIndex);
                console.log('Slides count:', instance.swiper.slides.length);
                console.log('Is Beginning:', instance.swiper.isBeginning);
                console.log('Is End:', instance.swiper.isEnd);
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
                const isActive = $(instance.container).hasClass('article-slider-active');
                
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
                $(instance.container).addClass('article-slider-active');
            }
        },

        /**
         * Deaktivace slideru
         */
        disableSlider: function(instance) {
            if (instance.swiper) {
                instance.swiper.disable();
                $(instance.container).removeClass('article-slider-active');
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
            $('#article-slider-styles').remove();
        },

        /**
         * Refresh slideru
         */
        refresh: function() {
            this.instances.forEach(instance => {
                if (instance.swiper) {
                    instance.swiper.update();
                }
            });
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
        // Počkej krátce na dokončení všech animací
        setTimeout(function() {
            ArticleSlider.init();
        }, 100);
    });

    // Export pro globální použití
    window.ArticleSlider = ArticleSlider;

})(jQuery);
