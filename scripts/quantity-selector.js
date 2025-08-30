// Quantity Selector
// (c) 2025 NOAH Natural Products s.r.o.

$(document).ready(function() {
    // Funkce pro označení boxu podle počtu kusů
    function selectBoxByQuantity(quantity) {
        $('.quantity-discounts .box').each(function() {
            var boxQuantityText = $(this).find('.quantity').text();
            var boxQuantity = parseInt(boxQuantityText.match(/\d+/)[0]);
            
            if (boxQuantity === quantity) {
                $(this).addClass('selected');
            } else {
                $(this).removeClass('selected');
            }
        });
    }
    
    // Při načtení stránky označíme box podle aktuální hodnoty inputu
    var initialQuantity = parseInt($('#frmproductForm-quantity').val()) || 1;
    selectBoxByQuantity(initialQuantity);
    
    // Při kliknutí na box
    $('.quantity-discounts .box').on('click', function() {
        var quantityText = $(this).find('.quantity').text();
        var quantity = parseInt(quantityText.match(/\d+/)[0]);
        
        // Nastavíme hodnotu do inputu
        $('#frmproductForm-quantity').val(quantity);
        $('#frmproductForm-quantity').trigger('change');
        
        // Označíme tento box jako vybraný
        selectBoxByQuantity(quantity);
    });
    
    // Při změně hodnoty inputu také aktualizujeme vybraný box
    $('#frmproductForm-quantity').on('change input', function() {
        var quantity = parseInt($(this).val()) || 1;
        selectBoxByQuantity(quantity);
    });
});
