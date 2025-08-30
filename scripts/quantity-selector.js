// Quantity Selector with Range Support and Dynamic Pricing
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
        
        // Funkce pro získání základní ceny a měny z upgates objektu
        function getPriceData() {
            if (typeof upgates === 'undefined' || !upgates.product || !upgates.product.price) {
                console.log('Upgates product data not found');
                return null;
            }
            
            const price = upgates.product.price.withVat;
            const currency = upgates.currency;
            
            // Určit symbol měny
            let currencySymbol = '';
            switch(currency) {
                case 'CZK':
                    currencySymbol = 'Kč';
                    break;
                case 'EUR':
                    currencySymbol = '€';
                    break;
                case 'USD':
                    currencySymbol = '$';
                    break;
                default:
                    currencySymbol = currency;
            }
            
            return {
                price: price,
                currency: currency,
                symbol: currencySymbol
            };
        }
        
        // Funkce pro určení rozmezí množství
        function getQuantityRange(boxes, index) {
            const currentBox = boxes[index];
            const nextBox = boxes[index + 1];
            const currentQty = parseInt($(currentBox).data('quantity'));
            
            if (index === 0) {
                // První box - od 1 do (další-1)
                if (nextBox) {
                    const nextQty = parseInt($(nextBox).data('quantity'));
                    if (nextQty === 3) {
                        return '1-2';
                    }
                    return `1-${nextQty - 1}`;
                }
                return '1';
            } else if (!nextBox) {
                // Poslední box - od hodnoty nahoru
                return `${currentQty}+`;
            } else {
                // Prostřední box - od hodnoty do (další-1)
                const nextQty = parseInt($(nextBox).data('quantity'));
                if (currentQty === nextQty - 1) {
                    return `${currentQty}`;
                }
                return `${currentQty}-${nextQty - 1}`;
            }
        }
        
        // Funkce pro pluralizaci českých slov
        function getQuantityWord(range) {
            // Extrahovat čísla z rozmezí
            const numbers = range.match(/\d+/g);
            if (!numbers) return 'kusů';
            
            const firstNum = parseInt(numbers[0]);
            const lastNum = numbers.length > 1 ? parseInt(numbers[numbers.length - 1]) : firstNum;
            
            // Pro rozmezí používáme poslední číslo
            const num = range.includes('+') ? 5 : lastNum;
            
            if (num === 1) {
                return 'kus';
            } else if (num >= 2 && num <= 4) {
                return 'kusy';
            } else {
                return 'kusů';
            }
        }
        
        // Funkce pro aktualizaci obsahu boxů
        function updateBoxContent() {
            const priceData = getPriceData();
            
            if (!priceData) {
                console.log('Could not get price data');
                return;
            }
            
            const basePrice = priceData.price;
            const currencySymbol = priceData.symbol;
            
            containers.each(function() {
                const $container = $(this);
                const boxes = $container.find('.discount-boxes .box').toArray();
                
                // Přidat loading class na začátku
                $(boxes).addClass('loading');
                
                boxes.forEach((box, index) => {
                    const $box = $(box);
                    const quantity = parseInt($box.data('quantity'));
                    const savePercent = parseInt($box.data('save')) || 0;
                    
                    // Vypočítat ceny
                    const discountMultiplier = 1 - (savePercent / 100);
                    const discountedPrice = Math.round(basePrice * discountMultiplier);
                    const savedAmount = Math.round(basePrice - discountedPrice);
                    
                    // Určit rozmezí
                    const range = getQuantityRange(boxes, index);
                    const quantityWord = getQuantityWord(range);
                    const quantityText = `${range} ${quantityWord}`;
                    
                    // Vyčistit box
                    $box.empty();
                    
                    // Přidat obsah podle typu boxu
                    if (savePercent > 0) {
                        // Box se slevou
                        $box.addClass('highlight');
                        
                        // Přidat savings badge
                        const $savings = $('<span class="savings"></span>');
                        $savings.text(`-${savePercent}%`);
                        $box.append($savings);
                        
                        // Přidat množství
                        const $quantity = $('<span class="quantity"></span>');
                        $quantity.text(quantityText);
                        $box.append($quantity);
                        
                        // Přidat cenu
                        const $price = $('<span class="price"></span>');
                        $price.text(`${discountedPrice} ${currencySymbol}/ks`);
                        $box.append($price);
                        
                        // Přidat úsporu (menší text)
                        const $saved = $('<span class="saved"></span>');
                        $saved.text(`ušetříte ${savedAmount} ${currencySymbol}/ks`);
                        $box.append($saved);
                        
                    } else {
                        // Základní box bez slevy
                        $box.removeClass('highlight');
                        
                        // Přidat množství
                        const $quantity = $('<span class="quantity"></span>');
                        $quantity.text(quantityText);
                        $box.append($quantity);
                        
                        // Přidat cenu
                        const $price = $('<span class="price"></span>');
                        $price.text(`${basePrice} ${currencySymbol}/ks`);
                        $box.append($price);
                    }
                    
                    // Odstranit loading class po naplnění obsahu
                    $box.removeClass('loading');
                });
            });
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
                
                // Dynamická logika podle počtu boxů a jejich hodnot
                if (boxValues.length >= 2) {
                    for (let i = 0; i < boxValues.length; i++) {
                        const currentBox = boxValues[i];
                        const nextBox = boxValues[i + 1];
                        
                        if (i === 0) {
                            // První box - od 1 do hodnoty dalšího boxu mínus 1
                            const upperLimit = nextBox ? nextBox.value - 1 : 999;
                            if (quantity >= 1 && quantity <= upperLimit) {
                                selectedBox = currentBox.element;
                                break;
                            }
                        } else if (!nextBox) {
                            // Poslední box - od své hodnoty nahoru
                            if (quantity >= currentBox.value) {
                                selectedBox = currentBox.element;
                            }
                        } else {
                            // Prostřední box - od své hodnoty do další mínus 1
                            if (quantity >= currentBox.value && quantity < nextBox.value) {
                                selectedBox = currentBox.element;
                                break;
                            }
                        }
                    }
                } else {
                    // Obecná logika pro jiný počet boxů
                    for (let i = 0; i < boxValues.length; i++) {
                        const currentBox = boxValues[i];
                        const nextBox = boxValues[i + 1];
                        
                        if (i === boxValues.length - 1) {
                            // Poslední box
                            if (quantity >= currentBox.value) {
                                selectedBox = currentBox.element;
                            }
                        } else {
                            // Určit rozmezí
                            if (quantity >= currentBox.value && quantity < nextBox.value) {
                                selectedBox = currentBox.element;
                                break;
                            }
                        }
                    }
                }
                
                // Odstranit selected ze všech boxů
                boxes.removeClass('selected');
                
                // Přidat selected vybranému boxu
                if (selectedBox) {
                    if (animate) {
                        setTimeout(function() {
                            selectedBox.addClass('selected');
                        }, 50);
                    } else {
                        selectedBox.addClass('selected');
                    }
                }
            });
        }
        
        // Inicializace - aktualizovat obsah a označit box
        updateBoxContent();
        const initialQuantity = parseInt(input.val()) || 1;
        selectBoxByQuantity(initialQuantity, false);
        
        // Odstranit staré handlery
        containers.find('.discount-boxes .box').off('click.quantitySelector');
        input.off('change.quantitySelector input.quantitySelector');
        $('.ui-spinner-button').off('click.quantitySelector');
        
        // Klik na box
        containers.on('click.quantitySelector', '.discount-boxes .box', function(e) {
            e.preventDefault();
            e.stopPropagation();
            
            const $clickedBox = $(this);
            const quantity = parseInt($clickedBox.data('quantity'));
            
            if (!isNaN(quantity)) {
                // Nastavit hodnotu do inputu (to triggeruje input event)
                input.val(quantity).trigger('input');
                // Nepotřebujeme volat selectBoxByQuantity zde, protože input event to udělá
            }
        });
        
        // Změna inputu
        input.on('change.quantitySelector input.quantitySelector', function() {
            const quantity = parseInt($(this).val()) || 1;
            selectBoxByQuantity(quantity);
        });
        
        // Spinner tlačítka
        $('.ui-spinner-button').on('click.quantitySelector', function(e) {
            e.preventDefault();
            setTimeout(function() {
                const quantity = parseInt(input.val()) || 1;
                selectBoxByQuantity(quantity);
            }, 100);
        });
        
        // Sledovat změny v upgates objektu (pro AJAX aktualizace)
        if (typeof upgates !== 'undefined') {
            upgates.on('product-price-changed', function() {
                updateBoxContent();
            });
        }
        
        // Debug
        const priceData = getPriceData();
        if (priceData) {
            const debugInfo = {
                priceData: priceData,
                boxes: containers.find('.discount-boxes .box').length,
                priceBreakdown: {}
            };
            
            // Získat procenta slev z data atributů pro debug výpis
            containers.first().find('.discount-boxes .box').each(function() {
                const $box = $(this);
                const qty = parseInt($box.data('quantity'));
                const save = parseInt($box.data('save')) || 0;
                const range = qty === 1 ? '1-2 ks' : qty === 3 ? '3-4 ks' : '5+ ks';
                
                if (save === 0) {
                    debugInfo.priceBreakdown[range] = `${priceData.price} ${priceData.symbol}`;
                } else {
                    const discountedPrice = Math.round(priceData.price * (1 - save/100));
                    debugInfo.priceBreakdown[range] = `${discountedPrice} ${priceData.symbol} (-${save}%)`;
                }
            });
            
            console.log('Quantity selector initialized:', debugInfo);
        } else {
            console.log('Quantity selector initialized: Price data not found');
        }
    });
})(jQuery);
