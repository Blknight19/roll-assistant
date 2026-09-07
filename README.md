# 🧙 Roll-Assistent

Ein digitaler Würfelassistent und Charakterbogen.

## ✨ Features

- **Talentproben** mit 3W20-Mechanik
- **Einfache Würfelwürfe** (W4, W6, W8, W10, W12, W20)
- **Kampfwürfe** (Attacke, Parade, Ausweichen, Fernkampf, Initiative)
- **Zauberproben** (3W20) mit automatischer AsP-Buchung, halbe Kosten bei misslungener Probe und bei kritischem Erfolg
- **Zauberbuch** mit durchsuchbarem Zauberkatalog und eigenen Zaubern
- **Liturgie- und Zeremonieproben** (3W20) mit automatischer KaP-Buchung, halben Kosten bei misslungener Probe und kritischem Erfolg, „+1W6 auf die FP" beim Krit und optionaler Regel „Keine Patzer bei Liturgien"
- **Segen** als Knopfleiste: ein Tipp bucht 1 KaP und protokolliert den Segen ohne Wurf
- **Umstände** als benannte Modifikatoren: Ort und Zeit der Zeremonie, fehlendes Gebet oder fehlende Geste, Modifikationen (Erzwingen, Kosten senken …) samt Kostenfolge
- **Liturgienbuch** mit Katalog (185 Liturgien, 131 Zeremonien, 12 Segen), Filter nach Tradition und Gattung
- **Entrückung** als Stufenzähler mit Tabelle: was jede Stufe auf Talent- und Zauberproben bewirkt
- **Laufende Effekte** zählen Zauber und Liturgien gemeinsam (−1 je Effekt auf alle Zauber- und Liturgieproben)
- **Charakterverwaltung**
  - Eigenschaften (MU, KL, IN, CH, FF, GE, KO, KK)
  - 59 Talente
  - Kampfwerte & Lebensenergie
  - Astralenergie & Zauberbuch (für zauberkundige Helden)
  - Karmaenergie & Liturgienbuch (für geweihte Helden), Tradition mit KaP-Richtwert
- **Würfelhistorie** mit LocalStorage-Persistenz
- **Import/Export** von Charakterdaten (.held-Datei)
- **Dark/Light Mode** mit automatischer Systemerkennung
- **Mobile-optimiert** & Responsive
- **Offline-fähig & installierbar** (PWA), funktioniert auch ohne Netz am Spieltisch

## 🚀 Quick Start
```bash
# Installation
npm install

# Development Server
npm run dev

# Build für Produktion
npm run build

# Deployment auf GitHub Pages
npm run deploy:full
```

Die App läuft standardmäßig auf `http://localhost:5173`

## 🛠️ Tech Stack

- **Framework:** React 19
- **Language:** TypeScript 5.8
- **Build Tool:** Vite 6
- **State Management:** Redux Toolkit
- **Styling:** Tailwind CSS + shadcn/ui
- **Icons:** Lucide React
- **Theme:** next-themes
- **Fonts:** @fontsource (selbst gehostet, DSGVO-konform)
- **Offline:** vite-plugin-pwa
- **Tests:** Vitest

## 🎲 Verwendung

### Talentprobe würfeln

1. Wähle ein Talent aus der Liste (z.B. "Klettern")
2. Die Eigenschaften werden automatisch gesetzt (MU/GE/KK)
3. Optional: Erschwernis/Erleichterung einstellen
4. Klicke auf "Würfeln"
5. Ergebnis zeigt QS (Qualitätsstufe) oder Misserfolg

### Charakterdaten sichern

1. Gehe zu **Charakter → Einstellungen**
2. Klicke auf "Charakter exportieren"
3. .held-Datei wird heruntergeladen
4. Import: "Charakter importieren" → Datei auswählen

## 🤝 Contributing

Contributions sind willkommen! Bitte öffne ein Issue oder Pull Request.

## 🐛 Bug Reports

Gefunden einen Bug? [Erstelle ein Issue](https://github.com/Blknight19/roll-assistant/issues/new)

---

Made with ⚔️ by [Blknight19](https://github.com/Blknight19)
