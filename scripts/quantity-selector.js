// Quantity Selector with Range Support and Dynamic Pricing
// (c) 2025 NOAH Natural Products s.r.o.
(function($) {
    'use strict';
    
    $(document).ready(function() {
        // Základní elementy
        const containers = $('.quantity-discounts');
        if (!containers.length) return;
        
        // Získat data z upgates
        function getPriceData() {
            if (typeof upgates === 'undefined' || !upgates.product || !upgates.product.price) {
                return null;
            }
            
            const price = upgates.product.price.withVat;
            const currency = upgates.currency;
            
            let symbol = 'Kč';
            if (currency === 'EUR') symbol = '€';
            else if (currency === 'USD') symbol = '$';
            else if (currency !== 'CZK') symbol = currency;
            
            return { price: price, symbol: symbol };
        }
        
        // Určit rozmezí pro box
        function getRange(boxes, index) {
            const current = parseInt($(boxes[index]).data('quantity'));
            const next = boxes[index + 1] ? parseInt($(boxes[index + 1]).data('quantity')) : null;
            
            if (index === 0) {
                return next ? `1-${next - 1}` : '1';
            } else if (!next) {
                return `${current}+`;
            } else {
                return `${current}-${next - 1}`;
            }
        }
        
        // Pluralizace
        function getWord(range) {
            const lastNum = parseInt(range.match(/\d+/g).pop());
            if (lastNum === 1) return 'kus';
            if (lastNum >= 2 && lastNum <= 4) return 'kusy';
            return 'kusů';
        }
        
        // Formátovat cenu
        function formatPrice(price) {
            const rounded = Math.round(price * 100) / 100;
            return rounded % 1 === 0 ? rounded.toString() : rounded.toFixed(2).replace('.', ',');
        }
        
        // Aktualizovat obsah boxů
        function updateBoxes() {
            const priceData = getPriceData();
            if (!priceData) return;
            
            containers.each(function() {
                const boxes = $(this).find('.discount-boxes .box').toArray();
                
                boxes.forEach((box, index) => {
                    const $box = $(box);
                    const savePercent = parseInt($box.data('save')) || 0;
                    const range = getRange(boxes, index);
                    const word = getWord(range);
                    
                    // Vypočítat ceny
                    const discountedPrice = priceData.price * (1 - savePercent / 100);
                    const saved = priceData.price - discountedPrice;
                    
                    // Vyčistit box
                    $box.empty();
                    
                    if (savePercent > 0) {
                        // Box se slevou
                        $box.addClass('highlight');
                        $box.append(`<span class="savings">-${savePercent}%</span>`);
                        $box.append(`<span class="quantity">${range} ${word}</span>`);
                        $box.append(`<span class="price">${formatPrice(discountedPrice)} ${priceData.symbol}/ks</span>`);
                        //$box.append(`<span class="saved">ušetříte ${formatPrice(saved)} ${priceData.symbol}/ks</span>`);
                    } else {
                        // Základní box
                        $box.append(`<span class="quantity">${range} ${word}</span>`);
                        $box.append(`<span class="price">${formatPrice(priceData.price)} ${priceData.symbol}/ks</span>`);
                    }
                });
            });
        }
        
        // Vybrat box podle množství
        function selectBox(quantity) {
            containers.each(function() {
                const boxes = $(this).find('.discount-boxes .box');
                boxes.removeClass('selected');
                
                let selectedBox = null;
                const values = [];
                
                boxes.each(function() {
                    const val = parseInt($(this).data('quantity'));
                    if (!isNaN(val)) {
                        values.push({ element: $(this), value: val });
                    }
                });
                
                values.sort((a, b) => a.value - b.value);
                
                // Najít správný box
                for (let i = 0; i < values.length; i++) {
                    const current = values[i];
                    const next = values[i + 1];
                    
                    if (i === 0 && quantity < (next ? next.value : 999)) {
                        selectedBox = current.element;
                        break;
                    } else if (!next && quantity >= current.value) {
                        selectedBox = current.element;
                        break;
                    } else if (next && quantity >= current.value && quantity < next.value) {
                        selectedBox = current.element;
                        break;
                    }
                }
                
                if (selectedBox) {
                    selectedBox.addClass('selected');
                }
            });
        }
        
        // Event handlery
        function initEvents() {
            // Klik na box
            containers.on('click', '.discount-boxes .box', function(e) {
                e.preventDefault();
                const quantity = parseInt($(this).data('quantity'));
                
                console.log('Klik na box, quantity:', quantity);
                
                if (!isNaN(quantity)) {
                    // Najít input znovu pro jistotu
                    const $input = $('#frmproductForm-quantity');
                    console.log('Input nalezen:', $input.length > 0);
                    
                    if ($input.length) {
                        const oldVal = $input.val();
                        console.log('Stará hodnota:', oldVal);
                        
                        $input.val(quantity);
                        console.log('Nová hodnota nastavena:', $input.val());
                        
                        // Zkusit různé způsoby triggerování
                        $input.trigger('change');
                        $input.change();
                        
                        console.log('Change event triggerován');
                        console.log('Finální hodnota v inputu:', $input.val());
                    }
                    selectBox(quantity);
                }
            });
            
            // Sledovat změny inputu
            const $input = $('#frmproductForm-quantity');
            if ($input.length) {
                $input.on('change input', function() {
                    const val = parseInt($(this).val()) || 1;
                    selectBox(val);
                });
                
                // Sledovat klikání na spinner tlačítka
                $('.ui-spinner-button').on('click', function() {
                    setTimeout(function() {
                        const val = parseInt($input.val()) || 1;
                        selectBox(val);
                    }, 50);
                });
            }
        }
        
        // Inicializace
        updateBoxes();
        
        const $input = $('#frmproductForm-quantity');
        if ($input.length) {
            const initialVal = parseInt($input.val()) || 1;
            selectBox(initialVal);
        }
        
        initEvents();
        
        // Debug
        const priceData = getPriceData();
        if (priceData) {
            console.log('Quantity selector initialized:', {
                price: priceData.price + ' ' + priceData.symbol,
                boxes: containers.find('.box').length
            });
        }
    });
})(jQuery);
