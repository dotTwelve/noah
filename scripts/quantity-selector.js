// Quantity Selector with Range Support
// (c) 2025 NOAH Natural Products s.r.o.
(function($) {
    'use strict';
    
    $(document).ready(function() {
        // Správné selektory podle HTML struktury
        const boxes = $('.discount-boxes .box');
        const input = $('#frmproductForm-quantity');
        
        if (!boxes.length || !input.length) {
            console.log('Quantity selector: Elements not found');
            return;
        }
        
        function selectBoxByQuantity(quantity) {
            // Získat všechny hodnoty z boxů pomocí data-quantity atributu
            const boxValues = [];
            boxes.each(function() {
                const $box = $(this);
                const boxQuantity = parseInt($box.data('quantity'));
                
                if (!isNaN(boxQuantity)) {
                    boxValues.push({
                        element: $box,
                        value: boxQuantity
                    });
                }
            });
            
            // Seřadit podle hodnot vzestupně
            boxValues.sort((a, b) => a.value - b.value);
            
            // Najít správný box podle rozmezí
            let selectedBox = null;
            
            for (let i = 0; i < boxValues.length; i++) {
                const currentBox = boxValues[i];
                const nextBox = boxValues[i + 1];
                
                if (i === 0) {
                    // První box - platí pro hodnoty od 1 do dalšího boxu
                    if (nextBox) {
                        if (quantity >= 1 && quantity < nextBox.value) {
                            selectedBox = currentBox.element;
                            break;
                        }
                    } else {
                        // Jediný box
                        selectedBox = currentBox.element;
                        break;
                    }
                } else if (i === boxValues.length - 1) {
                    // Poslední box - platí pro všechny hodnoty >= jeho hodnota
                    if (quantity >= currentBox.value) {
                        selectedBox = currentBox.element;
                    }
                } else {
                    // Prostřední boxy - od své hodnoty do další hodnoty minus 1
                    if (quantity >= currentBox.value && quantity < nextBox.value) {
                        selectedBox = currentBox.element;
                        break;
                    }
                }
            }
            
            // Odstranit třídu selected ze všech boxů a přidat ji vybranému
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
        
        // Klik na box - nastaví hodnotu z data-quantity
        boxes.on('click.noah', function(e) {
            e.preventDefault();
            const quantity = parseInt($(this).data('quantity'));
            
            if (!isNaN(quantity)) {
                input.val(quantity);
                input.trigger('change');
                selectBoxByQuantity(quantity);
            }
        });
        
        // Změna inputu - vybere správný box podle rozmezí
        input.on('change.noah input.noah', function() {
            const quantity = parseInt($(this).val()) || 1;
            selectBoxByQuantity(quantity);
        });
    });
})(jQuery);
