(function($) {
    $(document).ready(function() {
        $('.products-cart-recommend .card-group').each(function() {
            const $grid = $(this);
            const $items = $grid.find('.card-item');
            
            if ($items.length === 0) return;
            
            // Přidej třídy
            $grid.addClass('swiper');
            $items.addClass('swiper-slide');
            $items.wrapAll('<div class="swiper-wrapper"></div>');
            
            // Inicializuj Swiper
            new Swiper($grid[0], {
                slidesPerView: 2,
                spaceBetween: 10,
                navigation: {
                    nextEl: '.swiper-button-next',
                    prevEl: '.swiper-button-prev',
                },
                breakpoints: {
                    768: { slidesPerView: 3 },
                    1024: { slidesPerView: 4 },
                    1200: { slidesPerView: 5 }
                }
            });
        });
    });
})(jQuery);
