/**
 * Article Slider for NOAH Natural Products
 * Převádí seznam článků na interaktivní slider pomocí Swiper.js
 * Založeno na ProductSlider v2.2.0
 * 
 * @version 2.1.0
 * @requires jQuery 3.4.1+
 * @requires Swiper 11+
 */

(function($) {
    'use strict';

    const ArticleSlider = {
        // Konfigurace
        config: {
            // Podporuje obě struktury - hlavní stránku i tab v product detail
            containerSelector: '.bic-artcl, #articles.tab-pane',
            wrapperSelector: '.artcl-wrap',
            itemSelector: 'article',
            hrSelector: 'hr',
            nextButtonSelector: '.SNInextButton', // Tlačítko "Další"
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
                console.error('ArticleSlider: jQuery není načteno');
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
            
            // Najdi články a HR elementy
            const $articles = $wrapper.find(this.config.itemSelector);
            const $hrs = $wrapper.find(this.config.hrSelector);
            const totalItems = $articles.length;
            
            if (totalItems === 0) {
                return;
            }
            
            // Odstraň HR elementy (nebudou potřeba ve slideru)
            $hrs.remove();
            
            // Odstraň tlačítko "Další" pokud existuje
            const $nextButton = $container.find(this.config.nextButtonSelector);
            if ($nextButton.length) {
                $nextButton.remove();
            }
            
            // Zobraz všechny skryté články (měly třídu .hidden)
            $articles.removeClass('hidden').show();
            
            // Přidej třídy bez změny struktury
            $container.addClass('article-slider-active');
            $wrapper.addClass('swiper swiper-initialized');
            
            // Přidej třídu každému článku a odstraň animační třídy
            $articles.each(function() {
                $(this)
                    .addClass('swiper-slide')
                    .removeClass('anim-i anim-fade-up anim-y SNIitem')
                    .removeClass(function(index, className) {
                        return (className.match(/anim-delay-\d+/g) || []).join(' ');
                    });
            });
            
            // Obal existující články do wrapper
            $articles.wrapAll('<div class="swiper-wrapper"></div>');
            
            // Přidej navigaci
            $wrapper.append('<div class="swiper-button-prev"></div>');
            $wrapper.append('<div class="swiper-button-next"></div>');
            
            // Přidej pagination
            $container.append('<div class="swiper-pagination"></div>');
            
            // Přidej CSS styly
            this.addStyles();
            
            // Počkej na DOM update
            setTimeout(function() {
                // Konfigurace Swiperu
                const swiperConfig = {
                    // Základní nastavení
                    slidesPerView: 1,
                    slidesPerGroup: 1,
                    spaceBetween: 30,
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
                            slidesPerView: 1,
                            slidesPerGroup: 1,
                            spaceBetween: 20
                        },
                        768: {
                            slidesPerView: 2,
                            slidesPerGroup: 2,
                            spaceBetween: 30
                        },
                        1200: {
                            slidesPerView: 3,
                            slidesPerGroup: 3,
                            spaceBetween: 30
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
                            
                            console.log('ArticleSlider: Slider ' + index + ' inicializován');
                            console.log('Počet článků:', this.slides.length);
                        },
                        
                        slideChange: function() {
                            // Aktualizuj aktivní bullet při změně slidu
                            self.updatePaginationActive(this);
                            
                            // Lazy load obrázků
                            self.handleLazyLoad(this);
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
                            }, 100);
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
                    /* Container */
                    .article-slider-active {
                        position: relative;
                    }
                    
                    /* Swiper container */
                    .article-slider-active .swiper {
                        overflow: hidden;
                        position: relative;
                    }
                    
                    /* Wrapper */
                    .article-slider-active .swiper-wrapper {
                        display: flex !important;
                        position: relative;
                        width: 100%;
                        height: 100%;
                        z-index: 1;
                        transition-property: transform;
                        box-sizing: content-box;
                        gap: 0 !important;
                    }
                    
                    /* Slides */
                    .article-slider-active .swiper-slide {
                        flex-shrink: 0;
                        width: 100%;
                        height: 100%;
                        position: relative;
                        transition-property: transform;
                        display: block !important;
                        visibility: visible !important;
                    }
                    
                    /* Zachovat layout článků */
                    .article-slider-active article {
                        height: 100%;
                        display: flex !important;
                        flex-direction: column;
                        gap: 20px;
                    }
                    
                    /* Oprava pro články bez obrázku (advisor články) */
                    .article-slider-active article:not(:has(figure)) {
                        justify-content: center;
                    }
                    
                    /* Zajistit viditelnost všech vnořených elementů */
                    .article-slider-active .swiper-slide * {
                        visibility: visible !important;
                    }
                    
                    /* Obrázky článků */
                    .article-slider-active article figure {
                        margin: 0;
                        flex-shrink: 0;
                        overflow: hidden;
                    }
                    
                    .article-slider-active article figure img {
                        width: 100%;
                        height: auto;
                        object-fit: cover;
                        transition: transform 0.3s ease;
                    }
                    
                    .article-slider-active article:hover figure img {
                        transform: scale(1.05);
                    }
                    
                    /* Text článků */
                    .article-slider-active article .gapy-3 {
                        flex: 1;
                        display: flex;
                        flex-direction: column;
                        gap: 12px;
                    }
                    
                    /* Navigační šipky */
                    .article-slider-active .swiper-button-prev,
                    .article-slider-active .swiper-button-next {
                        position: absolute;
                        top: 40%;
                        width: 44px;
                        height: 44px;
                        margin-top: -22px;
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
                    
                    .article-slider-active .swiper-button-prev {
                        left: -22px;
                    }
                    
                    .article-slider-active .swiper-button-next {
                        right: -22px;
                    }
                    
                    .article-slider-active .swiper-button-prev:after,
                    .article-slider-active .swiper-button-next:after {
                        font-size: 18px;
                        color: #333;
                        font-weight: bold;
                    }
                    
                    .article-slider-active .swiper-button-prev:hover,
                    .article-slider-active .swiper-button-next:hover {
                        background: #27ae60;
                        box-shadow: 0 4px 12px rgba(39, 174, 96, 0.3);
                        transform: scale(1.1);
                    }
                    
                    .article-slider-active .swiper-button-prev:hover:after,
                    .article-slider-active .swiper-button-next:hover:after {
                        color: white;
                    }
                    
                    .article-slider-active .swiper-button-disabled {
                        opacity: 0.35;
                        cursor: auto;
                        pointer-events: none;
                    }
                    
                    /* Pagination */
                    .article-slider-active .swiper-pagination {
                        position: relative;
                        text-align: center;
                        margin-top: 30px;
                        line-height: 1;
                        z-index: 10;
                    }
                    
                    .article-slider-active .swiper-pagination-bullet {
                        width: 10px;
                        height: 10px;
                        display: inline-block;
                        border-radius: 50%;
                        background: #ccc;
                        opacity: 1;
                        margin: 0 5px;
                        cursor: pointer;
                        transition: all 0.3s;
                        border: none;
                        padding: 0;
                    }
                    
                    .article-slider-active .swiper-pagination-bullet:hover {
                        background: #999;
                    }
                    
                    .article-slider-active .swiper-pagination-bullet-active {
                        background: #27ae60;
                        width: 30px;
                        border-radius: 5px;
                    }
                    
                    /* Responzivní úpravy pro tablety */
                    @media (min-width: 768px) and (max-width: 1199px) {
                        .article-slider-active article {
                            flex-direction: row;
                            align-items: flex-start;
                        }
                        
                        .article-slider-active article figure {
                            width: 200px;
                            flex-shrink: 0;
                        }
                        
                        .article-slider-active article figure img {
                            aspect-ratio: 1;
                        }
                        
                        /* Článek bez obrázku na tabletu */
                        .article-slider-active article:not(:has(figure)) {
                            align-items: center;
                        }
                    }
                    
                    /* Responzivní úpravy pro mobily */
                    @media (max-width: 767px) {
                        .article-slider-active .swiper-button-prev,
                        .article-slider-active .swiper-button-next {
                            width: 32px;
                            height: 32px;
                        }
                        
                        .article-slider-active .swiper-button-prev:after,
                        .article-slider-active .swiper-button-next:after {
                            font-size: 12px;
                        }
                        
                        .article-slider-active .swiper-button-prev {
                            left: 5px;
                        }
                        
                        .article-slider-active .swiper-button-next {
                            right: 5px;
                        }
                        
                        .article-slider-active .swiper-pagination-bullet {
                            width: 6px;
                            height: 6px;
                            margin: 0 3px;
                        }
                        
                        .article-slider-active .swiper-pagination-bullet-active {
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
            $('#article-slider-styles').remove();
            $('.article-slider-active').removeClass('article-slider-active');
            $('.swiper-initialized').removeClass('swiper-initialized');
        },

        /**
         * Debug funkce pro testování
         */
        debug: function() {
            console.log('ArticleSlider Debug Info:');
            console.log('Instances:', this.instances);
            this.instances.forEach((instance, index) => {
                console.log(`Slider ${index}:`, {
                    id: instance.id,
                    totalItems: instance.totalItems,
                    activeIndex: instance.swiper.activeIndex,
                    slidesPerGroup: instance.swiper.params.slidesPerGroup,
                    slidesPerView: instance.swiper.params.slidesPerView
                });
            });
        }
    };

    // Automatická inicializace
    $(document).ready(function() {
        // Počkej krátce na dokončení všech animací
        setTimeout(function() {
            ArticleSlider.init();
        }, 100);
    });

    // Export pro globální použití
    window.ArticleSlider = ArticleSlider;

})(jQuery);
