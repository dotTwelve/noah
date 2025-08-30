// Quantity Selector with Range Support
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
            // Získat všechny hodnoty z boxů a seřadit je
            const boxValues = [];
            boxes.each(function() {
                const boxQuantityText = $(this).find('.quantity').text();
                const match = boxQuantityText.match(/\d+/);
                if (match) {
                    const boxQuantity = parseInt(match[0]);
                    boxValues.push({
                        element: $(this),
                        value: boxQuantity
                    });
                }
            });
            
            // Seřadit podle hodnot
            boxValues.sort((a, b) => a.value - b.value);
            
            // Najít správný box podle rozmezí
            let selectedBox = null;
            
            for (let i = 0; i < boxValues.length; i++) {
                const currentBox = boxValues[i];
                const nextBox = boxValues[i + 1];
                
                if (i === boxValues.length - 1) {
                    // Poslední box - platí pro všechny hodnoty >= jeho hodnota
                    if (quantity >= currentBox.value) {
                        selectedBox = currentBox.element;
                    }
                } else {
                    // Určit rozmezí pro aktuální box
                    const rangeStart = currentBox.value;
                    const rangeEnd = nextBox.value - 1;
                    
                    if (quantity >= rangeStart && quantity <= rangeEnd) {
                        selectedBox = currentBox.element;
                        break;
                    }
                }
            }
            
            // Označit vybraný box
            boxes.removeClass('selected');
            if (selectedBox) {
                selectedBox.addClass('selected');
            }
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
