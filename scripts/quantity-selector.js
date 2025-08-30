// Quantity Selector
// (c) 2025 NOAH Natural Products s.r.o.

(function($) {
    'use strict';
    
    $(document).ready(function() {
        const boxes = $('.quantity-discounts .box');
        const input = $('#frmproductForm-quantity');
        
        if (!boxes.length || !input.length) {
            return;
        }
        
        function selectBoxByQuantity(quantity) {
            boxes.each(function() {
                const boxQuantityText = $(this).find('.quantity').text();
                const match = boxQuantityText.match(/\d+/);
                if (match) {
                    const boxQuantity = parseInt(match[0]);
                    
                    if (boxQuantity === quantity) {
                        $(this).addClass('selected');
                    } else {
                        $(this).removeClass('selected');
                    }
                }
            });
        }
        
        // Inicializace - označit box podle aktuální hodnoty
        const initialQuantity = parseInt(input.val()) || 1;
        selectBoxByQuantity(initialQuantity);
        
        // Odstranit staré handlery
        boxes.off('click.noah');
        input.off('change.noah input.noah');
        
        // Klik na box
        boxes.on('click.noah', function(e) {
            e.preventDefault();
            const quantityText = $(this).find('.quantity').text();
            const match = quantityText.match(/\d+/);
            if (match) {
                const quantity = parseInt(match[0]);
                input.val(quantity);
                input.trigger('change');
                selectBoxByQuantity(quantity);
            }
        });
        
        // Změna inputu
        input.on('change.noah input.noah', function() {
            const quantity = parseInt($(this).val()) || 1;
            selectBoxByQuantity(quantity);
        });
    });
})(jQuery);
