# HDO Tarif - Sledování nízkého a vysokého tarifu

[![Live Demo](https://img.shields.io/badge/demo-live-success)](https://dottwelve.github.io/noah/hdo/)
[![ČEZ Distribuce](https://img.shields.io/badge/ČEZ-Distribuce-blue)](https://www.cezdistribuce.cz/)

Webová aplikace pro sledování přepínání mezi vysokým (VT) a nízkým (NT) tarifem elektřiny v reálném čase.

## 🚀 Demo

**[https://dottwelve.github.io/noah/hdo/](https://dottwelve.github.io/noah/hdo/)**

## ✨ Funkce

- 📊 **Živé zobrazení** aktuálního tarifu (NT/VT)
- ⏰ **Automatická aktualizace** každou sekundu
- 📅 **Časová osa** celého dne s vizualizací
- 🔔 **Čas další změny** tarifu
- 🔄 **Přepínání režimů** P1/P2 (vytápění) a P3 (8h)
- 📱 **Responzivní design** pro všechna zařízení
- 💾 **Offline funkce** - funguje i bez internetu
- 🌙 **Dark mode** podle nastavení systému

## 📱 Instalace na iPhone

1. Otevřete aplikaci v **Safari** na iPhone
2. Klepněte na tlačítko **Sdílet** (⎙)
3. Vyberte **"Přidat na plochu"**
4. Pojmenujte (např. "HDO Tarif")
5. Klepněte na **"Přidat"**

Aplikace se objeví jako ikona na ploše a bude fungovat jako nativní aplikace!

## ⚙️ Konfigurace

Aplikace je nakonfigurována pro:

- **Distributor:** ČEZ Distribuce (Oblast Sever)
- **Sazba:** D45d (Akumulační vytápění)
- **HDO povely:** A1B8P1-22/2, A1B8P2-22/2, A1B8P3-8/16

### Režimy

#### P1/P2 - Akumulační vytápění (22h NT/48h)

**Pracovní dny** (Po, St, Čt, Pá):
```
00:00 - 07:51  →  NT
07:51 - 08:50  →  VT
08:50 - 11:16  →  NT
11:16 - 12:15  →  VT
12:15 - 18:05  →  NT
18:05 - 19:05  →  VT
19:05 - 20:50  →  NT
20:50 - 21:50  →  VT
21:50 - 24:00  →  NT
```

**Víkendy** (Út, So, Ne):
```
00:00 - 08:05  →  NT
08:05 - 09:05  →  VT
09:05 - 12:05  →  NT
12:05 - 13:04  →  VT
13:04 - 15:01  →  NT
15:01 - 16:00  →  VT
16:00 - 19:01  →  NT
19:01 - 20:00  →  VT
20:00 - 24:00  →  NT
```

#### P3 - Běžná spotřeba (8h NT/16h)

**Pracovní dny** (Po, St, Čt, Pá):
```
00:00 - 04:46  →  NT
04:46 - 12:45  →  VT
12:45 - 14:46  →  NT
14:46 - 22:45  →  VT
22:45 - 24:00  →  NT
```

**Víkendy** (Út, So, Ne):
```
00:00 - 04:21  →  NT
04:21 - 16:40  →  VT
16:40 - 18:41  →  NT
18:41 - 22:20  →  VT
22:20 - 24:00  →  NT
```

## 🎨 Screenshoty

- Moderní gradientové pozadí
- Frosted glass efekt
- Velký, čitelný displej tarifu
- Interaktivní časová osa
- Seznam všech přepínání za den

## 🛠️ Technologie

- **HTML5** - Sémantická struktura
- **CSS3** - Moderní gradient design, frosted glass
- **Vanilla JavaScript** - Žádné závislosti
- **Progressive Web App** - Offline funkce, instalovatelná

## 💡 Tipy pro úsporu

1. **Nabíjení elektromobilu** - Naplánujte na období NT
2. **Akumulační kamna** - Ověřte správné časování topení
3. **Bojler** - Optimalizujte ohřev vody
4. **Pračka/myčka** - Využívajte časovače na NT období
5. **Ušetřete až 50%** nákladů v období NT

## ⚠️ Upozornění

Časy spínání může ČEZ Distribuce změnit. Pravidelně kontrolujte aktuální data na:
- [ČEZ Distribuce - Časy spínání HDO](https://www.cezdistribuce.cz/cs/pro-zakazniky/spinani-hdo)

## 📄 Licence

MIT License - volně k použití

## 👨‍💻 Autor

Vytvořeno pro uživatele s akumulačním vytápěním v oblasti ČEZ Distribuce Sever.

---

**🔗 Odkazy:**
- [ČEZ Distribuce](https://www.cezdistribuce.cz/)
- [Hlavní NOAH aplikace](https://dottwelve.github.io/noah/)
- [GitHub Repository](https://github.com/dotTwelve/noah)
