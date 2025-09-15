/**
 * Article Slider for NOAH Natural Products
 * Převádí seznam článků na interaktivní slider pomocí Swiper.js
 * 
 * @version 8.0.0 - Bootstrap grid breakpointy
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
            descriptionMaxLength: 150,
            allArticlesUrl: '/clanky-o-zdravi',
            swiperCDN: 'https://cdn.jsdelivr.net/npm/swiper@11/swiper-bundle.min.js',
            swiperCSS: 'https://cdn.jsdelivr.net/npm/swiper@11/swiper-bundle.min.css',
            skipOnBodyClasses: ['page-site', 'is-category'],
            svgIconsPath: '/images/icons/fa/solid.svg?1757317552'
        },

        instances: [],

        shouldSkipPage: function() {
            const $body = $('body');
            
            for (let className of this.config.skipOnBodyClasses) {
                if ($body.hasClass(className)) {
                    console.log('ArticleSlider: Přeskakuji inicializaci - nalezena třída body.' + className);
                    return true;
                }
            }
            
            return false;
        },

        truncateText: function(text, maxLength) {
            if (text.length <= maxLength) return text;
            
            const truncated = text.substr(0, maxLength);
            const lastSpace = truncated.lastIndexOf(' ');
            
            if (lastSpace > 0) {
                return truncated.substr(0, lastSpace) + '...';
            }
            return truncated + '...';
        },

        init: function() {
            const self = this;
            
            if (typeof $ === 'undefined') {
                console.error('ArticleSlider: jQuery není načteno');
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
                    console.error('ArticleSlider: Nepodařilo se načíst Swiper');
                });
        },

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
            
            // Přidej listener pro změnu velikosti okna
            $(window).on('resize.articleSlider', self.debounce(function() {
                self.handleResize();
            }, 250));
        },
        
        handleResize: function() {
            const self = this;
            
            // Projdi všechny kontejnery znovu
            $(this.config.containerSelector).each(function(index) {
                const $container = $(this);
                const $wrapper = $container.find(self.config.wrapperSelector);
                const totalItems = $wrapper.find(self.config.itemSelector).length;
                
                // Zjisti kolik článků se vejde podle aktuální šířky okna
                const windowWidth = window.innerWidth;
                let expectedSlidesPerView = 1; // xs
                
                if (windowWidth >= 1502) {
                    expectedSlidesPerView = 4; // xxl
                } else if (windowWidth >= 1204) {
                    expectedSlidesPerView = 3; // xl
                } else if (windowWidth >= 992) {
                    expectedSlidesPerView = 3; // lg
                } else if (windowWidth >= 768) {
                    expectedSlidesPerView = 2; // md
                } else if (windowWidth >= 576) {
                    expectedSlidesPerView = 2; // sm
                }
                
                const hasSlider = $wrapper.hasClass('swiper-initialized');
                const needsSlider = totalItems > expectedSlidesPerView;
                
                // Pokud nemá slider a potřebuje ho, vytvoř ho
                if (!hasSlider && needsSlider) {
                    // Vyčisti případné zbytky
                    if ($wrapper.parent().hasClass('article-slider-wrapper')) {
                        $wrapper.unwrap();
                    }
                    $wrapper.find('.swiper-wrapper').children().unwrap();
                    $wrapper.find('.swiper-slide').removeClass('swiper-slide');
                    $container.find('.swiper-pagination').remove();
                    $container.find('.carousel-nav').remove();
                    $wrapper.removeClass('swiper swiper-initialized carousel');
                    $container.removeClass('article-slider-active');
                    
                    // Vytvoř nový slider
                    self.createSlider($container, $wrapper, index);
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
            
            // Zjisti kolik článků se vejde podle aktuální šířky okna
            const windowWidth = window.innerWidth;
            let expectedSlidesPerView = 1; // výchozí pro xs
            
            if (windowWidth >= 1502) {
                expectedSlidesPerView = 4; // xxl
            } else if (windowWidth >= 1204) {
                expectedSlidesPerView = 3; // xl
            } else if (windowWidth >= 992) {
                expectedSlidesPerView = 3; // lg
            } else if (windowWidth >= 768) {
                expectedSlidesPerView = 2; // md
            } else if (windowWidth >= 576) {
                expectedSlidesPerView = 2; // sm
            }
            
            // Vyčisti HTML
            $hrs.remove();
            const $nextButton = $container.find(this.config.nextButtonSelector);
            if ($nextButton.length) {
                $nextButton.remove();
            }
            
            // Zobraz články
            $articles.removeClass('hidden').show();
            
            // Přidej třídy
            $container.addClass('article-slider-active');
            $wrapper.addClass('swiper swiper-initialized carousel');
            
            // Zpracuj články
            $articles.each(function() {
                const $article = $(this);
                
                $article
                    .addClass('swiper-slide')
                    .removeClass('anim-i anim-fade-up anim-y SNIitem')
                    .removeClass(function(index, className) {
                        return (className.match(/anim-delay-\d+/g) || []).join(' ');
                    });
                
                const $description = $article.find('.text p');
                if ($description.length) {
                    const originalText = $description.text();
                    const truncatedText = self.truncateText(originalText, self.config.descriptionMaxLength);
                    
                    $description
                        .attr('data-original-text', originalText)
                        .attr('title', originalText)
                        .text(truncatedText);
                }
                
                let articleHref = '';
                const $figureLink = $article.find('figure[data-href]');
                const $headingLink = $article.find('h3 a[href], h2 a[href]');
                
                if ($figureLink.length) {
                    articleHref = $figureLink.attr('data-href');
                } else if ($headingLink.length) {
                    articleHref = $headingLink.attr('href');
                }
                
                const $textWrapper = $article.find('.gapy-3');
                if ($textWrapper.length && articleHref && !$textWrapper.find('.article-button-wrapper').length) {
                    const $buttonWrapper = $('<div class="article-button-wrapper"></div>');
                    const $discoverBtn = $('<a>')
                        .attr('href', articleHref)
                        .attr('class', 'btn fg sh-md ou bg-se fs-lg-3 fs-1 ca-c')
                        .text('Celý článek');
                    
                    $buttonWrapper.append($discoverBtn);
                    $textWrapper.append($buttonWrapper);
                }
            });
            
            // Obal články
            $articles.wrapAll('<div class="swiper-wrapper"></div>');
            
            // Vytvoř wrapper pro slider
            const $sliderWrapper = $('<div class="article-slider-wrapper"></div>');
            $wrapper.wrap($sliderWrapper);
            
            // Přidej navigaci
            const navigation = this.createCustomNavigation(sliderId);
            $wrapper.parent().append(navigation.prevButton);
            $wrapper.parent().append(navigation.nextButton);
            
            // Přidej pagination
            $container.append('<div class="swiper-pagination"></div>');
            
            // Přidej tlačítko všechny články
            if (!$container.find('.all-articles-wrapper').length) {
                const $allArticlesWrapper = $('<div class="all-articles-wrapper"></div>');
                const $allArticlesBtn = $('<a>')
                    .attr('href', this.config.allArticlesUrl)
                    .attr('class', 'btn fg sh-md fw-b bg-su fs-ms-1 fs-md-1 fs-xl-3 fs-lg-3 ff-adv fs-1 ca-c td-n mt-4')
                    .html('Všechny články →');
                
                $allArticlesWrapper.append($allArticlesBtn);
                $container.append($allArticlesWrapper);
            }
            
            // Přidej styly
            this.addStyles();
            
            // Inicializuj Swiper
            setTimeout(function() {
                // Získej navigační elementy
                const $prevEl = $wrapper.parent().find('.swiper-button-prev-custom')[0];
                const $nextEl = $wrapper.parent().find('.swiper-button-next-custom')[0];
                
                const swiperInstance = new Swiper('#' + sliderId, {
                    // Základní nastavení - 1 článek pro xs/sm/md
                    slidesPerView: 1,
                    slidesPerGroup: 1,
                    spaceBetween: 8,
                    
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
                        dynamicBullets: false
                    },
                    
                    // Responzivní breakpointy podle Bootstrap grid
                    breakpoints: {
                        576: {  // sm - 2 články
                            slidesPerView: 2,
                            slidesPerGroup: 1,
                            spaceBetween: 8
                        },
                        768: {  // md - 2 články
                            slidesPerView: 2,
                            slidesPerGroup: 1,
                            spaceBetween: 16
                        },
                        992: {  // lg - 3 články
                            slidesPerView: 3,
                            slidesPerGroup: 1,
                            spaceBetween: 16
                        },
                        1204: { // xl - 3 články
                            slidesPerView: 3,
                            slidesPerGroup: 1,
                            spaceBetween: 16
                        },
                        1502: { // xxl - 4 články
                            slidesPerView: 4,
                            slidesPerGroup: 1,
                            spaceBetween: 16
                        }
                    },
                    
                    // Události
                    on: {
                        init: function() {
                            // Kontrola, jestli jsou šipky a pagination potřeba
                            const needsNavigation = totalItems > this.params.slidesPerView;
                            
                            if (!needsNavigation) {
                                // Skryj navigaci když se všechny články vejdou
                                $(this.navigation.prevEl).hide();
                                $(this.navigation.nextEl).hide();
                                $(this.pagination.el).hide();
                                this.allowTouchMove = false;
                                this.allowSlideNext = false;
                                this.allowSlidePrev = false;
                            } else {
                                self.updateNavigationVisibility(this);
                            }
                            
                            console.log('ArticleSlider: Slider ' + index + ' inicializován');
                            console.log('- Celkem článků: ' + totalItems);
                            console.log('- Zobrazeno článků: ' + this.params.slidesPerView);
                            console.log('- Navigace: ' + (needsNavigation ? 'zobrazena' : 'skryta'));
                            console.log('- Loop mode: ' + (this.params.loop ? 'zapnuto' : 'vypnuto'));
                            console.log('- Aktuální breakpoint: ' + window.innerWidth + 'px');
                        },
                        
                        slideChange: function() {
                            self.handleLazyLoad(this);
                        },
                        
                        resize: function() {
                            // Při změně velikosti okna zkontroluj, jestli je slider stále potřeba
                            const windowWidth = window.innerWidth;
                            let expectedSlidesPerView = 1;
                            
                            if (windowWidth >= 1502) {
                                expectedSlidesPerView = 4;
                            } else if (windowWidth >= 1204) {
                                expectedSlidesPerView = 3;
                            } else if (windowWidth >= 992) {
                                expectedSlidesPerView = 3;
                            } else if (windowWidth >= 768) {
                                expectedSlidesPerView = 2;
                            } else if (windowWidth >= 576) {
                                expectedSlidesPerView = 2;
                            }
                            
                            // Pokud se teď všechny články vejdou, skryj navigaci
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
            // Při loop mode jsou navigační prvky vždy viditelné pokud je víc článků než se vejde
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

        addStyles: function() {
            if ($('#article-slider-styles').length) {
                return;
            }

            const styles = `
                <style id="article-slider-styles">
                    /* Wrapper pro slider s navigací */
                    .article-slider-wrapper {
                        position: relative;
                    }
                    
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
                    
                    /* Články - zajistit stejnou výšku */
                    .article-slider-active article {
                        height: auto; /* Automatická výška pro správné vyrovnání */
                        display: flex !important;
                        flex-direction: column;
                        gap: 20px;
                        background: #f7f7ef;
                        padding: 0 0 20px 0;
                        border-radius: 8px;
                        overflow: hidden;
                    }
                    
                    .article-slider-active article:not(:has(figure)) {
                        padding: 20px;
                        justify-content: center;
                    }
                    
                    .article-slider-active .swiper-slide * {
                        visibility: visible !important;
                    }
                    
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
                    
                    .article-slider-active article .gapy-3 {
                        flex: 1;
                        display: flex;
                        flex-direction: column;
                        gap: 12px;
                        padding: 0 20px;
                        width: 100%;
                    }
                    
                    .article-slider-active article .text {
                        overflow: hidden;
                        display: -webkit-box;
                        -webkit-line-clamp: 3;
                        -webkit-box-orient: vertical;
                    }
                    
                    .article-slider-active .article-button-wrapper {
                        margin-top: auto; /* Přisadit tlačítko ke spodní části */
                        padding-top: 15px;
                        width: 100%;
                    }
                    
                    /* Navigační šipky */
                    .article-slider-wrapper .carousel-nav {
                        position: absolute;
                        top: 50%;
                        transform: translateY(-50%);
                        z-index: 10;
                        transition: all 0.3s;
                        opacity: 0.5;
                    }
                    
                    .article-slider-wrapper .carousel-prev {
                        left: -20px;
                    }
                    
                    .article-slider-wrapper .carousel-next {
                        right: -20px;
                    }
                    
                    /* Hover efekt na celém wrapperu - zobrazí šipky */
                    .article-slider-wrapper:hover .carousel-nav {
                        opacity: 1;
                    }
                    
                    /* Hover efekt na samotné šipce */
                    .article-slider-wrapper .carousel-nav:hover {
                        transform: translateY(-50%) scale(1.1);
                        opacity: 1;
                    }
                    
                    /* Touch zařízení - vždy plná opacita */
                    @media (hover: none) and (pointer: coarse) {
                        .article-slider-wrapper .carousel-nav {
                            opacity: 1;
                        }
                    }
                    
                    /* Styly pro články bez slideru (když se všechny vejdou) */
                    .article-processed-no-slider .artcl-wrap {
                        display: flex;
                        flex-wrap: wrap;
                        gap: 16px;
                    }
                    
                    .article-processed-no-slider article {
                        flex: 0 0 100%; /* xs - 1 článek */
                        display: flex !important;
                        flex-direction: column;
                        gap: 20px;
                        background: #f7f7ef;
                        padding: 0 0 20px 0;
                        border-radius: 8px;
                        overflow: hidden;
                    }
                    
                    @media (min-width: 576px) {
                        .article-processed-no-slider article {
                            flex: 0 0 calc(50% - 8px); /* sm - 2 články */
                        }
                    }
                    
                    @media (min-width: 768px) {
                        .article-processed-no-slider article {
                            flex: 0 0 calc(50% - 8px); /* md - 2 články */
                        }
                    }
                    
                    @media (min-width: 992px) {
                        .article-processed-no-slider article {
                            flex: 0 0 calc(33.333% - 11px); /* lg - 3 články */
                        }
                    }
                    
                    @media (min-width: 1204px) {
                        .article-processed-no-slider article {
                            flex: 0 0 calc(33.333% - 11px); /* xl - 3 články */
                        }
                    }
                    
                    @media (min-width: 1502px) {
                        .article-processed-no-slider article {
                            flex: 0 0 calc(25% - 12px); /* xxl - 4 články */
                        }
                    }
                    
                    .article-processed-no-slider article:not(:has(figure)) {
                        padding: 20px;
                        justify-content: center;
                    }
                    
                    .article-processed-no-slider article figure {
                        margin: 0;
                        padding: 0;
                        flex-shrink: 0;
                        overflow: hidden;
                        width: 100%;
                    }
                    
                    .article-processed-no-slider article figure img {
                        width: 100%;
                        height: auto;
                        object-fit: cover;
                        display: block;
                    }
                    
                    .article-processed-no-slider article .gapy-3 {
                        flex: 1;
                        display: flex;
                        flex-direction: column;
                        gap: 12px;
                        padding: 0 20px;
                        width: 100%;
                    }
                    
                    .article-processed-no-slider article .text {
                        overflow: hidden;
                        display: -webkit-box;
                        -webkit-line-clamp: 3;
                        -webkit-box-orient: vertical;
                    }
                    
                    .article-processed-no-slider .article-button-wrapper {
                        margin-top: auto;
                        padding-top: 15px;
                        width: 100%;
                    }
                    
                    /* Styly pro články bez slideru (když se všechny vejdou) */
                    .article-processed-no-slider .artcl-wrap {
                        display: flex;
                        flex-wrap: wrap;
                        gap: 16px;
                    }
                    
                    .article-processed-no-slider article {
                        flex: 0 0 100%; /* xs - 1 článek */
                        display: flex !important;
                        flex-direction: column;
                        gap: 20px;
                        background: #f7f7ef;
                        padding: 0 0 20px 0;
                        border-radius: 8px;
                        overflow: hidden;
                    }
                    
                    @media (min-width: 576px) {
                        .article-processed-no-slider article {
                            flex: 0 0 calc(50% - 8px); /* sm - 2 články */
                        }
                    }
                    
                    @media (min-width: 768px) {
                        .article-processed-no-slider article {
                            flex: 0 0 calc(50% - 8px); /* md - 2 články */
                        }
                    }
                    
                    @media (min-width: 992px) {
                        .article-processed-no-slider article {
                            flex: 0 0 calc(33.333% - 11px); /* lg - 3 články */
                        }
                    }
                    
                    @media (min-width: 1204px) {
                        .article-processed-no-slider article {
                            flex: 0 0 calc(33.333% - 11px); /* xl - 3 články */
                        }
                    }
                    
                    @media (min-width: 1502px) {
                        .article-processed-no-slider article {
                            flex: 0 0 calc(25% - 12px); /* xxl - 4 články */
                        }
                    }
                    
                    .article-processed-no-slider article:not(:has(figure)) {
                        padding: 20px;
                        justify-content: center;
                    }
                    
                    .article-processed-no-slider article figure {
                        margin: 0;
                        padding: 0;
                        flex-shrink: 0;
                        overflow: hidden;
                        width: 100%;
                    }
                    
                    .article-processed-no-slider article figure img {
                        width: 100%;
                        height: auto;
                        object-fit: cover;
                        display: block;
                    }
                    
                    .article-processed-no-slider article .gapy-3 {
                        flex: 1;
                        display: flex;
                        flex-direction: column;
                        gap: 12px;
                        padding: 0 20px;
                        width: 100%;
                    }
                    
                    .article-processed-no-slider article .text {
                        overflow: hidden;
                        display: -webkit-box;
                        -webkit-line-clamp: 3;
                        -webkit-box-orient: vertical;
                    }
                    
                    .article-processed-no-slider .article-button-wrapper {
                        margin-top: auto;
                        padding-top: 15px;
                        width: 100%;
                    }
                    
                    /* Tlačítko všechny články */
                    .all-articles-wrapper {
                        display: flex;
                        justify-content: center;
                        margin-top: 20px;
                    }
                    
                    /* Pagination */
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
                    
                    /* Responzivní úpravy */
                    @media (max-width: 768px) {
                        .article-slider-active .swiper-pagination-bullet {
                            width: 6px;
                            height: 6px;
                            margin: 0 3px;
                        }
                        
                        .article-slider-active .swiper-pagination-bullet-active {
                            width: 20px;
                        }
                    }
                    
                    @media (max-width: 1204px) {
                        .article-slider-wrapper .carousel-nav {
                            opacity: 1;
                        }
                    }
                </style>
            `;
            
            $('head').append(styles);
        },

        destroy: function() {
            // Odstraň event listener
            $(window).off('resize.articleSlider');
            
            this.instances.forEach(instance => {
                if (instance.swiper) {
                    instance.swiper.destroy(true, true);
                }
            });
            this.instances = [];
            $('#article-slider-styles').remove();
            $('.article-slider-active').removeClass('article-slider-active');
            $('.swiper-initialized').removeClass('swiper-initialized');
            $('.article-slider-wrapper').children().unwrap();
        },

        debug: function() {
            console.log('ArticleSlider v8.0 Debug:');
            console.log('Window width:', window.innerWidth + 'px');
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
        setTimeout(function() {
            ArticleSlider.init();
        }, 100);
    });

    // Export pro globální použití
    window.ArticleSlider = ArticleSlider;

})(jQuery);
