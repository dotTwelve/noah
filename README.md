# Noah Scripts

JavaScript skripty pro e-shop NOAH Natural Products.

## 🚀 Použití

```html
<script src="https://dottwelve.github.io/noah/index.js"></script>
```

## 📊 Monitoring

Dashboard: https://dottwelve.github.io/noah/

## 📁 Struktura

```
noah/
├── index.html          # Monitoring dashboard
├── index.js           # Hlavní loader
├── README.md          # Tento soubor
└── scripts/
    └── quantity-selector.js  # Výběr množství produktu
    └── remove-hashbang-links.js  # Odstranění prázdných odkazů
```

## 📦 Skripty

### quantity-selector.js
Interaktivní výběr množství produktu s vizuální zpětnou vazbou.

**Vyžaduje HTML:**
```html
<div class="quantity-discounts">
    <div class="box">
        <span class="quantity">1 ks</span>
    </div>
    <div class="box">
        <span class="quantity">5 ks</span>
    </div>
</div>
<input type="number" id="frmproductForm-quantity" value="1">
```

### remove-hashbang-links.js
Samostatný skript pro odstranění odkazů s href="#!"

## ⚙️ Požadavky

- jQuery 3.4.1+

## 📄 Licence

© 2025 NOAH Natural Products s.r.o. Všechna práva vyhrazena.

---

**Web:** https://www.noah.fit
