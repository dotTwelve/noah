// Quantity Selector with Range Support
// (c) 2025 NOAH Natural Products s.r.o.
(function($) {
    'use strict';
    
    $(document).ready(function() {
        // Najít input pro množství
        const input = $('#frmproductForm-quantity');
        
        // Najít všechny kontejnery s boxy (může být více - desktop a mobil)
        const containers = $('.quantity-discounts');
        
        if (!containers.length || !input.length) {
            console.log('Quantity selector: Required elements not found');
            return;
        }
        
        // Funkce pro výběr správného boxu podle množství
        function selectBoxByQuantity(quantity, animate = true) {
            // Projít všechny kontejnery (desktop i mobil verze)
            containers.each(function() {
                const $container = $(this);
                const boxes = $container.find('.discount-boxes .box');
                
                if (!boxes.length) return;
                
                // Získat všechny hodnoty z boxů
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
                
                // Speciální logika pro 3 boxy (1, 3, 5)
                if (boxValues.length === 3) {
                    if (quantity >= 1 && quantity <= 2) {
                        selectedBox = boxValues[0].element; // Box s hodnotou 1
                    } else if (quantity >= 3 && quantity <= 4) {
                        selectedBox = boxValues[1].element; // Box s hodnotou 3
                    } else if (quantity >= 5) {
                        selectedBox = boxValues[2].element; // Box s hodnotou 5
                    }
                } else {
                    // Obecná logika pro jiný počet boxů
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
                            if (quantity >= currentBox.value && quantity < nextBox.value) {
                                selectedBox = currentBox.element;
                                break;
                            }
                        }
                    }
                }
                
                // Animovaně odstranit třídu selected ze všech boxů
                boxes.each(function() {
                    const $box = $(this);
                    if ($box.hasClass('selected') && $box[0] !== (selectedBox ? selectedBox[0] : null)) {
                        // Plynulá deaktivace
                        $box.removeClass('selected');
                    }
                });
                
                // Přidat třídu selected vybranému boxu s animací
                if (selectedBox && !selectedBox.hasClass('selected')) {
                    if (animate) {
                        // Malé zpoždění pro plynulejší animaci
                        setTimeout(function() {
                            selectedBox.addClass('selected');
                        }, 50);
                    } else {
                        selectedBox.addClass('selected');
                    }
                }
            });
        }
        
        // Inicializace - označit box podle aktuální hodnoty bez animace
        const initialQuantity = parseInt(input.val()) || 1;
        selectBoxByQuantity(initialQuantity, false);
        
        // Odstranit staré handlery pomocí namespace
        containers.find('.discount-boxes .box').off('click.quantitySelector');
        input.off('change.quantitySelector input.quantitySelector');
        $('.ui-spinner-button').off('click.quantitySelector');
        
        // Klik na box - nastaví hodnotu z data-quantity
        containers.on('click.quantitySelector', '.discount-boxes .box', function(e) {
            e.preventDefault();
            e.stopPropagation();
            
            const $clickedBox = $(this);
            const quantity = parseInt($clickedBox.data('quantity'));
            
            if (!isNaN(quantity)) {
                // Okamžitě označit kliknutý box (pro rychlou odezvu)
                containers.find('.discount-boxes .box').removeClass('selected');
                $clickedBox.addClass('selected');
                
                // Nastavit hodnotu do inputu
                input.val(quantity);
                
                // Trigger change event pro případné další skripty
                input.trigger('change');
                
                // Zajistit správný výběr (pro případ více kontejnerů)
                setTimeout(function() {
                    selectBoxByQuantity(quantity, false);
                }, 100);
            }
        });
        
        // Změna inputu - vybere správný box podle rozmezí
        input.on('change.quantitySelector input.quantitySelector', function() {
            const quantity = parseInt($(this).val()) || 1;
            selectBoxByQuantity(quantity);
        });
        
        // Při změně množství tlačítky +/- (ui-spinner)
        $('.ui-spinner-button').on('click.quantitySelector', function(e) {
            e.preventDefault();
            setTimeout(function() {
                const quantity = parseInt(input.val()) || 1;
                selectBoxByQuantity(quantity);
            }, 100);
        });
        
        // Zajistit správné hover efekty - zabránit hover během selected stavu
        containers.on('mouseenter.quantitySelector', '.discount-boxes .box', function() {
            const $box = $(this);
            if (!$box.hasClass('selected')) {
                $box.addClass('hovering');
            }
        });
        
        containers.on('mouseleave.quantitySelector', '.discount-boxes .box', function() {
            $(this).removeClass('hovering');
        });
        
        // Debug log pro kontrolu
        console.log('Quantity selector initialized:', {
            containers: containers.length,
            boxes: containers.find('.discount-boxes .box').length,
            input: input.val()
        });
    });
})(jQuery);
