// Jednoduchý JavaScript kód:

document.querySelectorAll('a[href="#!"]').forEach(link => {
    // Nahradí element <a> jeho obsahem
    link.replaceWith(...link.childNodes);
});
