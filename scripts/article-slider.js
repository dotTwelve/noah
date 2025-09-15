/**
 * Article Slider for NOAH Natural Products
 * Převádí seznam článků na interaktivní slider pomocí Swiper.js
 * Založeno na ProductSlider v2.2.0
 * 
 * @version 6.2.0 - Přidána kontrola pro přeskočení inicializace na .page-site a .is-category stránkách
 * @requires jQuery 3.4.1+
 * @requires Swiper 11+
 */

(function($) {
    'use strict';

    const ArticleSlider = {
        // Konfigurace
        config: {
            containerSelector: '.bic-artcl, #articles.tab-pane',
            wrapperSelector: '.artcl-wrap',
            itemSelector: 'article',
            hrSelector: 'hr',
            nextButtonSelector: '.SNInextButton',
            descriptionMaxLength: 150, // Maximální počet znaků v popisu
            allArticlesUrl: '/clanky-o-zdravi', // URL na všechny články
            swiperCDN: 'https://cdn.jsdelivr.net/npm/swiper@11/swiper-bundle.min.js',
            swiperCSS: 'https://cdn.jsdelivr.net/npm/swiper@11/swiper-bundle.min.css',
            skipOnBodyClasses: ['page-site', 'is-category'] // Třídy body, kde se slider neinicializuje
        },

        // Sledování inicializovaných sliderů
        instances: [],

        /**
         * Kontrola, zda má být slider přeskočen na aktuální stránce
         */
        shouldSkipPage: function() {
            const $body = $('body');
            
            // Kontrola, zda má body některou z tříd pro přeskočení
            for (let className of this.config.skipOnBodyClasses) {
                if ($body.hasClass(className)) {
                    console.log('ArticleSlider: Přeskakuji inicializaci - nalezena třída body.' + className);
                    return true;
                }
            }
            
            return false;
        },

        /**
         * Zkrácení textu na určitý počet znaků
         */
        truncateText: function(text, maxLength) {
            if (text.length <= maxLength) return text;
            
            // Najdi poslední mezeru před limitem
            const truncated = text.substr(0, maxLength);
            const lastSpace = truncated.lastIndexOf(' ');
            
            if (lastSpace > 0) {
                return truncated.substr(0, lastSpace) + '...';
            }
            return truncated + '...';
        },

        /**
         * Inicializace modulu
         */
        init: function() {
            const self = this;
            
            if (typeof $ === 'undefined') {
                console.error('ArticleSlider: jQuery není načteno');
                return;
            }

            // Kontrola, zda má být slider na této stránce přeskočen
            if (this.shouldSkipPage()) {
                return;
            }

            this.loadSwiper(function() {
                self.initSliders();
            });
        },

        /**
         * Načtení Swiper knihovny
         */
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
        createSlider: function($container, $wrapper, index) {
            const self = this;
            
            const sliderId = 'article-slider-' + index;
            $wrapper.attr('id', sliderId);
            
            const $articles = $wrapper.find(this.config.itemSelector);
            const $hrs = $wrapper.find(this.config.hrSelector);
            const totalItems = $articles.length;
            
            if (totalItems === 0) {
                return;
            }
            
            // Odstraň HR elementy
            $hrs.remove();
            
            // Odstraň tlačítko "Další" pokud existuje
            const $nextButton = $container.find(this.config.nextButtonSelector);
            if ($nextButton.length) {
                $nextButton.remove();
            }
            
            // Zobraz všechny skryté články
            $articles.removeClass('hidden').show();
            
            // Přidej třídy
            $container.addClass('article-slider-active');
            $wrapper.addClass('swiper swiper-initialized');
            
            // Zpracuj každý článek
            $articles.each(function() {
                const $article = $(this);
                
                // Přidej swiper třídu a odstraň animační třídy
                $article
                    .addClass('swiper-slide')
                    .removeClass('anim-i anim-fade-up anim-y SNIitem')
                    .removeClass(function(index, className) {
                        return (className.match(/anim-delay-\d+/g) || []).join(' ');
                    });
                
                // Zkrať popis článku
                const $description = $article.find('.text p');
                if ($description.length) {
                    const originalText = $description.text();
                    const truncatedText = self.truncateText(originalText, self.config.descriptionMaxLength);
                    
                    // Ulož původní text jako data atribut a zobraz zkrácený
                    $description
                        .attr('data-original-text', originalText)
                        .attr('title', originalText)
                        .text(truncatedText);
                }
                
                // Získej href odkaz z figure nebo h3
                let articleHref = '';
                const $figureLink = $article.find('figure[data-href]');
                const $headingLink = $article.find('h3 a[href]');
                
                if ($figureLink.length) {
                    articleHref = $figureLink.attr('data-href');
                } else if ($headingLink.length) {
                    articleHref = $headingLink.attr('href');
                }
                
                // Vytvoř wrapper pro centrování tlačítka BEZ ŠIPKY
                const $textWrapper = $article.find('.gapy-3');
                if ($textWrapper.length && articleHref && !$textWrapper.find('.btn-to-cart').length) {
                    // Vytvoř kontejner pro tlačítko s inline stylem pro centrování
                    const $buttonWrapper = $('<div class="article-button-wrapper" style="text-align: center; width: 100%;"></div>');
                    const $discoverBtn = $('<a>')
                        .attr('href', articleHref)
                        .attr('class', 'btn fg sh-md ou bg-se fs-lg-3 fs-1 ca-c')
                        .text('Číst'); // BEZ ŠIPKY
                    
                    $buttonWrapper.append($discoverBtn);
                    $textWrapper.append($buttonWrapper);
                }
            });
            
            // Obal články do wrapper
            $articles.wrapAll('<div class="swiper-wrapper"></div>');
            
            // Přidej navigaci
            $wrapper.append('<div class="swiper-button-prev"></div>');
            $wrapper.append('<div class="swiper-button-next"></div>');
            
            // Přidej pagination
            $container.append('<div class="swiper-pagination"></div>');
            
            // PŘIDEJ TLAČÍTKO "VŠECHNY ČLÁNKY" POD SLIDER
            if (!$container.find('.all-articles-wrapper').length) {
                const $allArticlesWrapper = $('<div class="all-articles-wrapper"></div>');
                const $allArticlesBtn = $('<a>')
                    .attr('href', this.config.allArticlesUrl)
                    .attr('class', 'btn fg sh-md fw-b bg-su fs-ms-1 fs-md-1 fs-xl-3 fs-lg-3 ff-adv fs-1 ca-c td-n mt-4')
                    .html('Všechny články →'); // SE ŠIPKOU
                
                $allArticlesWrapper.append($allArticlesBtn);
                $container.append($allArticlesWrapper);
            }
            
            // Přidej CSS styly
            this.addStyles();
            
            // Počkej na DOM update
            setTimeout(function() {
                const swiperConfig = {
                    slidesPerView: 1,
                    slidesPerGroup: 1,
                    spaceBetween: 30,
                    watchOverflow: true,
                    threshold: 10,
                    speed: 600,
                    grabCursor: true,
                    
                    navigation: {
                        nextEl: '#' + sliderId + ' .swiper-button-next',
                        prevEl: '#' + sliderId + ' .swiper-button-prev',
                    },
                    
                    pagination: {
                        el: $container.find('.swiper-pagination')[0],
                        clickable: true,
                        type: 'bullets',
                        dynamicBullets: false,
                        renderBullet: function (index, className) {
                            const isFirstInGroup = index % this.params.slidesPerGroup === 0;
                            if (isFirstInGroup) {
                                return '<span class="' + className + '" data-slide-index="' + index + '"></span>';
                            }
                            return '';
                        }
                    },
                    
                    breakpoints: {
                        0: {
                            slidesPerView: 1,
                            slidesPerGroup: 1,
                            spaceBetween: 8
                        },
                        768: {
                            slidesPerView: 2,
                            slidesPerGroup: 2,
                            spaceBetween: 8
                        },
                        1200: {
                            slidesPerView: 4,
                            slidesPerGroup: 4,
                            spaceBetween: 16
                        }
                    },
                    
                    on: {
                        init: function() {
                            if (this.params.slidesPerGroup !== this.params.slidesPerView) {
                                this.params.slidesPerGroup = this.params.slidesPerView;
                                this.update();
                            }
                            self.updatePagination(this);
                            self.checkNavigationNeeded(this); // Kontrola navigace při inicializaci
                            console.log('ArticleSlider: Slider ' + index + ' inicializován s ' + this.slides.length + ' články');
                        },
                        
                        slideChange: function() {
                            self.updatePaginationActive(this);
                            self.handleLazyLoad(this);
                        },
                        
                        breakpoint: function() {
                            if (this.params.slidesPerGroup !== this.params.slidesPerView) {
                                this.params.slidesPerGroup = this.params.slidesPerView;
                                this.update();
                            }
                            setTimeout(() => {
                                self.updatePagination(this);
                                self.checkNavigationNeeded(this); // Kontrola navigace při změně breakpointu
                            }, 100);
                        },
                        
                        resize: function() {
                            // Kontrola navigace při změně velikosti okna
                            self.checkNavigationNeeded(this);
                        }
                    }
                };
                
                const swiperInstance = new Swiper('#' + sliderId, swiperConfig);
                
                self.instances.push({
                    id: sliderId,
                    container: $container[0],
                    swiper: swiperInstance,
                    totalItems: totalItems
                });
                
            }, 50);
        },

        /**
         * Aktualizace pagination
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
            
            $pagination.empty();
            
            for (let i = 0; i < totalGroups; i++) {
                const slideIndex = i * swiper.params.slidesPerGroup;
                const $bullet = $('<span class="swiper-pagination-bullet" data-slide-index="' + slideIndex + '"></span>');
                
                $bullet.on('click', function() {
                    swiper.slideTo(slideIndex);
                });
                
                $pagination.append($bullet);
            }
            
            this.updatePaginationActive(swiper);
        },

        /**
         * Aktualizace aktivního bullet
         */
        updatePaginationActive: function(swiper) {
            const currentGroup = Math.floor(swiper.activeIndex / swiper.params.slidesPerGroup);
            const $pagination = $(swiper.pagination.el);
            
            $pagination.find('.swiper-pagination-bullet').removeClass('swiper-pagination-bullet-active');
            $pagination.find('.swiper-pagination-bullet').eq(currentGroup).addClass('swiper-pagination-bullet-active');
        },

        /**
         * Lazy loading obrázků
         */
        handleLazyLoad: function(swiper) {
            const activeIndex = swiper.activeIndex;
            const slidesPerView = Math.ceil(swiper.params.slidesPerView);
            
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
                    
                    /* ČLÁNKY S POZADÍM #f7f7ef BEZ HOVER EFEKTU */
                    .article-slider-active article {
                        height: 100%;
                        display: flex !important;
                        flex-direction: column;
                        gap: 20px;
                        background: #f7f7ef;
                        padding: 0 0 20px 0;
                        border-radius: 8px;
                        overflow: hidden;
                    }
                    
                    /* Článek bez obrázku */
                    .article-slider-active article:not(:has(figure)) {
                        padding: 20px;
                        justify-content: center;
                    }
                    
                    /* Viditelnost elementů */
                    .article-slider-active .swiper-slide * {
                        visibility: visible !important;
                    }
                    
                    /* OBRÁZKY NA PLNOU ŠÍŘKU */
                    .article-slider-active article figure {
                        margin: 0;
                        padding: 0;
                        flex-shrink: 0;
                        overflow: hidden;
                        width: 100%;
                    }
                    
                    .article-slider-active article figure img {
                        width: 100%;
                        height: auto;
                        object-fit: cover;
                        display: block;
                    }
                    
                    /* Text článků */
                    .article-slider-active article .gapy-3 {
                        flex: 1;
                        display: flex;
                        flex-direction: column;
                        gap: 12px;
                        padding: 0 20px;
                        width: 100%;
                    }
                    
                    /* Zkrácený popis */
                    .article-slider-active article .text {
                        overflow: hidden;
                        display: -webkit-box;
                        -webkit-line-clamp: 3;
                        -webkit-box-orient: vertical;
                    }
                    
                    /* CENTROVÁNÍ TLAČÍTKA OBJEVIT */
                    .article-slider-active .article-button-wrapper {
                        display: flex !important;
                        justify-content: center !important;
                        align-items: center !important;
                        margin-top: 15px;
                        width: 100% !important;
                        text-align: center !important;
                    }
                    
                    .article-slider-active .article-button-wrapper .btn-to-cart {
                        display: inline-block !important;
                        margin: 0 auto !important;
                    }
                    
                    /* CENTROVÁNÍ TLAČÍTKA VŠECHNY ČLÁNKY */
                    .article-slider-active + .all-articles-wrapper,
                    .all-articles-wrapper {
                        display: flex;
                    }
                    
                    .all-articles-wrapper .btn-to-cart {
                        display: inline-block !important;
                        margin: 0 auto !important;
                    }
                    
                    /* NAVIGAČNÍ ŠIPKY - STEJNÉ JAKO ProductSlider */
                    .article-slider-active .swiper-button-prev,
                    .article-slider-active .swiper-button-next {
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
                    
                    .article-slider-active .swiper-button-prev {
                        left: 10px;
                    }
                    
                    .article-slider-active .swiper-button-next {
                        right: 10px;
                    }
                    
                    .article-slider-active .swiper-button-prev:after,
                    .article-slider-active .swiper-button-next:after {
                        font-size: 16px;
                        color: #333;
                        font-weight: bold;
                    }
                    
                    .article-slider-active .swiper-button-prev:hover,
                    .article-slider-active .swiper-button-next:hover {
                        box-shadow: 0 4px 12px rgba(0,0,0,0.2);
                        transform: scale(1.1);
                    }
                    
                    .article-slider-active .swiper-button-disabled {
                        opacity: 0.35;
                        cursor: auto;
                        pointer-events: none;
                    }
                    
                    /* PAGINATION - stejná jako ProductSlider */
                    .article-slider-active .swiper-pagination {
                        position: relative;
                        text-align: center;
                        margin-top: 20px;
                        line-height: 1;
                        z-index: 10;
                    }
                    
                    .article-slider-active .swiper-pagination-bullet {
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
                    
                    .article-slider-active .swiper-pagination-bullet:hover {
                        background: #999;
                    }
                    
                    .article-slider-active .swiper-pagination-bullet-active {
                        background: #27ae60;
                        width: 24px;
                        border-radius: 4px;
                    }
                    
                    /* RESPONZIVNÍ - MOBILY */
                    @media (max-width: 768px) {
                        .article-slider-active .swiper {
                        }
                    
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
         * Debug funkce
         */
        debug: function() {
            console.log('ArticleSlider v6.2 Debug:');
            console.log('Body classes:', $('body').attr('class'));
            console.log('Should skip page:', this.shouldSkipPage());
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
        setTimeout(function() {
            ArticleSlider.init();
        }, 100);
    });

    // Export pro globální použití
    window.ArticleSlider = ArticleSlider;

})(jQuery);
