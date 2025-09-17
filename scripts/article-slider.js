/**
 * Article Slider for NOAH Natural Products
 * Převádí seznam článků na interaktivní slider pomocí Swiper.js
 * 
 * @version 8.2.0 - Navigace a tlačítko uvnitř wrapperu
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
            skipOnBodyClasses: ['page-site', 'is-category', 'advisor'],
            svgIconsPath: '/images/icons/fa/solid.svg?1757317552',
            
            // Konfigurace breakpointů a počtu zobrazených článků
            // Formát: { minWidth: počet článků }
            // DŮLEŽITÉ: Breakpointy musí být seřazené od nejmenšího po největší
            breakpoints: {
                0: 1,      // xs (výchozí) - 1 článek
                576: 2,    // sm - 2 články
                768: 2,    // md - 2 články  
                992: 3,    // lg - 3 články
                1204: 3,   // xl - 3 články
                1502: 3    // xxl - 3 články
            },
            
            // Mezery mezi slidy pro různé breakpointy
            // Formát: { minWidth: mezera v px }
            spacing: {
                0: 8,      // xs
                576: 8,    // sm
                768: 16,   // md
                992: 16,   // lg
                1204: 16,  // xl
                1502: 16   // xxl
            }
        },

        instances: [],

        /**
         * Získá počet článků pro aktuální šířku okna
         * @param {number} windowWidth - Šířka okna v px
         * @returns {number} Počet článků k zobrazení
         */
        getSlidesPerView: function(windowWidth) {
            let slidesPerView = 1;
            
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
            let spaceBetween = 8;
            
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
                    spaceBetween: this.config.spacing[breakpoint] || 16
                };
            }
            
            return swiperBreakpoints;
        },

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
                const expectedSlidesPerView = self.getSlidesPerView(windowWidth);
                
                const hasSlider = $wrapper.hasClass('swiper-initialized');
                const needsSlider = totalItems > expectedSlidesPerView;
                
                // Pokud nemá slider a potřebuje ho, vytvoř ho
                if (!hasSlider && needsSlider) {
                    // Vyčisti případné zbytky
                    if ($wrapper.parent().hasClass('article-slider-wrapper')) {
                        // Přesuň pagination a all-articles-wrapper zpět do containeru před unwrap
                        const $pagination = $wrapper.parent().find('.swiper-pagination');
                        const $allArticles = $wrapper.parent().find('.all-articles-wrapper');
                        if ($pagination.length) $pagination.appendTo($container);
                        if ($allArticles.length) $allArticles.appendTo($container);
                        
                        $wrapper.unwrap();
                    }
                    $wrapper.find('.swiper-wrapper').children().unwrap();
                    $wrapper.find('.swiper-slide').removeClass('swiper-slide');
                    $container.find('.swiper-pagination').remove();
                    $container.find('.carousel-nav').remove();
                    $container.find('.all-articles-wrapper').remove();
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
            const expectedSlidesPerView = this.getSlidesPerView(windowWidth);
            
            // Vyčisti HTML
            $hrs.remove();
            const $nextButton = $container.find(this.config.nextButtonSelector);
            if ($nextButton.length) {
                $nextButton.remove();
            }
            
            // Odstraň existující pagination a tlačítko všechny články, pokud existují
            $container.find('.swiper-pagination').remove();
            $container.find('.all-articles-wrapper').remove();
            
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
                        .attr('class', 'btn fg sh-md ou bg-su fs-lg-3 fs-1 ca-c')
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
            
            // Přidej navigaci (šipky)
            const navigation = this.createCustomNavigation(sliderId);
            $wrapper.parent().append(navigation.prevButton);
            $wrapper.parent().append(navigation.nextButton);
            
            // ZMĚNA: Přidej pagination DOVNITŘ wrapperu
            const $pagination = $('<div class="swiper-pagination"></div>');
            $wrapper.parent().append($pagination);
            
            // ZMĚNA: Přidej tlačítko všechny články DOVNITŘ wrapperu
            const $allArticlesWrapper = $('<div class="all-articles-wrapper d-flex pt-2"></div>');
            const $allArticlesBtn = $('<a>')
                .attr('href', this.config.allArticlesUrl)
                .attr('class', 'btn fg sh-md fw-b bg-su fs-ms-1 fs-md-1 fs-xl-3 fs-lg-3 ff-adv fs-1 ca-c td-n mt-4')
                .html('Všechny články →');
            
            $allArticlesWrapper.append($allArticlesBtn);
            $wrapper.parent().append($allArticlesWrapper);
            
            // Přidej styly
            this.addStyles();
            
            // Inicializuj Swiper
            setTimeout(function() {
                // Získej navigační elementy
                const $prevEl = $wrapper.parent().find('.swiper-button-prev-custom')[0];
                const $nextEl = $wrapper.parent().find('.swiper-button-next-custom')[0];
                const $paginationEl = $wrapper.parent().find('.swiper-pagination')[0];
                
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
                    
                    // Pagination - použij element uvnitř wrapperu
                    pagination: {
                        el: $paginationEl,
                        clickable: true,
                        type: 'bullets',
                        dynamicBullets: false
                    },
                    
                    // Responzivní breakpointy z konfigurace
                    breakpoints: self.getSwiperBreakpoints(),
                    
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
                            
                            // Nastav pozici šipek podle výšky obrázků
                            self.updateArrowPosition(this);
                            
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
                            // Nastav flag, že probíhá resize
                            this.isResizing = true;
                            
                            // Resetuj data flag pro přepočet pozice
                            $(this.navigation.prevEl).removeData('position-set');
                            $(this.navigation.nextEl).removeData('position-set');
                            
                            // Při změně velikosti okna zkontroluj, jestli je slider stále potřeba
                            const windowWidth = window.innerWidth;
                            const expectedSlidesPerView = self.getSlidesPerView(windowWidth);
                            
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
                            
                            // Aktualizuj pozici šipek při resize
                            self.updateArrowPosition(this);
                            
                            // Resetuj flag
                            this.isResizing = false;
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

        updateArrowPosition: function(swiper) {
            // Zkontroluj, jestli už byla pozice nastavena (pokud ne bylo resize)
            if ($(swiper.navigation.prevEl).data('position-set') && !swiper.isResizing) {
                return;
            }
            
            // Najdi pouze viditelné obrázky nebo první obrázek jako reprezentanta
            const $firstImage = $(swiper.el).find('article:first figure img').first();
            
            if ($firstImage.length === 0) {
                // Pokud není obrázek, nech výchozí pozici (50%)
                return;
            }
            
            const calculatePosition = function() {
                const imgHeight = $firstImage.height();
                
                if (imgHeight > 0) {
                    // Nastav pozici šipek na střed prvního obrázku
                    const arrowTop = imgHeight / 2;
                    
                    $(swiper.navigation.prevEl).css({
                        'top': arrowTop + 'px',
                        'transform': 'translateY(-50%)'
                    }).data('position-set', true);
                    
                    $(swiper.navigation.nextEl).css({
                        'top': arrowTop + 'px',
                        'transform': 'translateY(-50%)'
                    }).data('position-set', true);
                }
            };
            
            // Zkontroluj, jestli je první obrázek načtený
            if ($firstImage[0].complete && $firstImage[0].naturalHeight !== 0) {
                calculatePosition();
            } else {
                // Počkej na načtení prvního obrázku
                $firstImage.on('load', calculatePosition);
                
                // Fallback
                setTimeout(calculatePosition, 500);
            }
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
                        padding-bottom: 60px; /* Prostor pro pagination a tlačítko */
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
                        height: auto;
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
                        margin-top: auto;
                        padding-top: 15px;
                        width: 100%;
                    }
                    
                    /* Navigační šipky */
                    .article-slider-wrapper .carousel-nav {
                        position: absolute;
                        top: 50%;
                        transform: translateY(-50%);
                        z-index: 10;
                        transition: opacity 0.3s ease, transform 0.3s ease;
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
                        opacity: 1 !important;
                    }
                    
                    /* Hover efekt na samotné šipce */
                    .article-slider-wrapper .carousel-nav:hover {
                        transform: translateY(-50%) scale(1.1);
                        opacity: 1 !important;
                    }
                    
                    /* Touch zařízení a malé obrazovky - vždy plná opacita */
                    @media (hover: none) and (pointer: coarse),
                           (max-width: 1024px) {
                        .article-slider-wrapper .carousel-nav {
                            opacity: 1 !important;
                        }
                    }
                    
                    /* Pagination - nyní uvnitř wrapperu */
                    .article-slider-wrapper .swiper-pagination {
                        position: absolute;
                        bottom: 35px;
                        left: 0;
                        right: 0;
                        text-align: center;
                        line-height: 1;
                        z-index: 10;
                    }
                    
                    .article-slider-wrapper .swiper-pagination-bullet {
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
                    
                    .article-slider-wrapper .swiper-pagination-bullet:hover {
                        background: #999;
                    }
                    
                    .article-slider-wrapper .swiper-pagination-bullet-active {
                        background: #27ae60;
                        width: 24px;
                        border-radius: 4px;
                    }
                    
                    /* Tlačítko všechny články - nyní uvnitř wrapperu */
                    .article-slider-wrapper .all-articles-wrapper {
                        position: absolute;
                        bottom: 0;
                        left: 0;
                        right: 0;
                        text-align: center;
                        z-index: 10;
                    }
                    
                    /* Responzivní úpravy */
                    @media (max-width: 768px) {
                        .article-slider-wrapper {
                            padding-bottom: 50px;
                        }
                        
                        .article-slider-wrapper .swiper-pagination {
                            bottom: 30px;
                        }
                        
                        .article-slider-wrapper .swiper-pagination-bullet {
                            width: 6px;
                            height: 6px;
                            margin: 0 3px;
                        }
                        
                        .article-slider-wrapper .swiper-pagination-bullet-active {
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
            
            // Přesuň pagination a all-articles-wrapper zpět do containeru před unwrap
            $('.article-slider-wrapper').each(function() {
                const $wrapper = $(this);
                const $container = $wrapper.parent();
                const $pagination = $wrapper.find('.swiper-pagination');
                const $allArticles = $wrapper.find('.all-articles-wrapper');
                
                if ($pagination.length) $pagination.appendTo($container);
                if ($allArticles.length) $allArticles.appendTo($container);
                
                $wrapper.children().unwrap();
            });
        },

        debug: function() {
            console.log('ArticleSlider v8.2 Debug:');
            console.log('Window width:', window.innerWidth + 'px');
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
        setTimeout(function() {
            ArticleSlider.init();
        }, 100);
    });

    // Export pro globální použití
    window.ArticleSlider = ArticleSlider;

})(jQuery);
