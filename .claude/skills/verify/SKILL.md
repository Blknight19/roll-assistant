---
name: verify
description: Build, launch and drive the DSA Roll Assistant end-to-end to verify changes at the UI surface (Playwright against vite preview).
---

# Verify: DSA Roll Assistant

## Build & Launch

```powershell
npm run build          # tsc -b && vite build (PWA sw.js wird mitgebaut)
npm run preview        # serviert dist auf http://localhost:4173/dsa-roll-assistant/
```

Die Basis-URL enthält den gh-pages-Pfad: `http://localhost:4173/dsa-roll-assistant/`.

## Drive (Playwright)

Playwright ist keine Projekt-Dependency — bei Bedarf `npm install --no-save playwright`
(Chromium liegt meist schon in `%LOCALAPPDATA%\ms-playwright`). Skript außerhalb des
Repos muss Playwright per absolutem Pfad importieren:
`import { chromium } from 'file:///.../dsa-roll-assistant/node_modules/playwright/index.mjs'`.

### Deterministische Würfe

`src/utils/dice.ts` nutzt `Math.random`. Vor dem Laden per `context.addInitScript`
eine Queue injizieren:

```js
window.__rolls = [];
const orig = Math.random.bind(Math);
Math.random = () => (window.__rolls.length ? window.__rolls.shift() : orig());
// Wert v auf einem Wsides erzwingen: (v - 1) / sides + 0.001
```

### localStorage-Seed

Persistenz-Key: `dsa-app-state`. Aktuelles Format ist v5: `{ version: 5,
activeCharacterId, characters: [{ id, name, attributes, talents: [{id,value}],
combat, spellbook, karma }], history, settings }`. `spellbook` je Charakter ist
`{ isSpellcaster, asp: { current, max }, spells: [...], upkeep: [...] }`, `karma` ist
`{ isBlessed, tradition, kap: { current, max }, liturgies: [...], blessings: [...],
upkeep: [...], devotionLevel }`. `blessings` trägt Katalog-IDs der Segen — unbekannte
IDs verwirft der Sanitizer, `devotionLevel` ist die Entrückungsstufe 0..4. `settings`
trägt `confirmCriticals` und `noLiturgyFumble`.
Ältere Blobs werden beim Laden migriert: v4 ohne `karma`, v2/v3 lagen flacher
(Charakter auf oberster Ebene bzw. `characters` ohne `spellbook`), Legacy v1 ist ein
roher Slice-Dump ohne `version`. Zum Seeden reicht ein v5-Blob mit genau einem
Eintrag in `characters`.
**Achtung:** `addInitScript` läuft bei jedem Reload — nur seeden, wenn der Key `null`
ist, sonst überschreibt der Seed den von der App geschriebenen v4-Blob und
Persistenz-Checks schlagen fälschlich fehl. Saves sind ~500 ms debounced: vor dem
Auslesen `waitForTimeout(800)`.

### Nützliche Selektoren

- Tabs: 5 Top-Level ohne Wirken-Fähigkeit. Magie und Liturgie teilen sich **einen**
  Slot: der sechste Tab heißt „Magie" (nur zauberkundig), „Liturgie" (nur geweiht)
  oder „Wirken" (beides, dann mit einem Umschalter *Magie | Liturgie* im Tab). Ein
  siebter Tab existiert nicht — bei 360 px sind sechs Tabs 53 px breit und „Historie"
  braucht 49 px. Charakter hat 2 Sub-Tabs, mit Fähigkeit einen dritten
  („Zauberbuch" / „Liturgien" / „Wirken").
- Talent wählen: combobox "Talent wählen" → `getByPlaceholder('Talent suchen...')`
  → `getByRole('option', { name: ... })`
- Kampf-Würfe: `getByRole('button', { name: 'Attacke würfeln' })` etc.
- Settings-Toggle: seit dem Magie-Modul liegen zwei Switches auf Charakter →
  Einstellungen — `getByRole('switch')` ohne Namen ist mehrdeutig. Gezielt:
  `getByRole('switch', { name: 'Bestätigungswurf bei Kritisch und Patzer' })`
  (default an), `getByRole('switch', { name: 'Held ist zauberkundig' })` (default aus),
  `getByRole('switch', { name: 'Held ist geweiht' })` (default aus) und
  `getByRole('switch', { name: 'Keine Patzer bei Liturgien' })` (default aus).
  Bei „Geweiht" erscheint darunter das Select „Tradition wählen"
- **Radix-Falle beim Skripten:** `element.click()` schaltet einen `TabsTrigger` nicht um.
  Nötig ist die Pointer-Folge `pointerdown, mousedown, pointerup, mouseup, click`.
  Umstände sind `button[aria-pressed]`, Katalogeinträge `[cmdk-item]`
- PropertyNumber: `getByRole('button', { name: '<Label> verringern/erhöhen' })`;
  ohne Label heißen sie "Wert verringern/erhöhen" — auf dem Talentprobe-Screen ist
  `input[type=number]` nth(0) = Modifikator, nth(1) = Talentwert
- **Strict-Mode-Falle:** Ergebnistexte stehen zusätzlich in einer `sr-only`
  aria-live-Region — `getByText(..., { exact: true })` verwenden.

### Flows, die sich lohnen

1. Talentprobe mit Modifikator −2 → Label "Erschwernis", Berechnung `X − 2 − Wurf`
2. TaW 20, Würfe klein → QS-Hero zeigt 6 (Cap), nicht 7
3. Nach Wurf Modifikator ändern → Berechnung/QS unverändert (Snapshot)
4. Kampf: d20=1 + Bestätigung ≤/> Zielwert → Krit vs. "Gelungen (Krit nicht bestätigt)"
5. Legacy-Blob seeden → Talente/Attribute migriert, Blob wird als v4 zurückgeschrieben
6. `navigator.serviceWorker.ready` abwarten → `context.setOffline(true)` → Reload rendert
7. Liturgie mit „Ohne Gebet" → Gesamt −2 im Rechenweg
8. Zeremonie: „Namenlose Tage" dann „Feiertag" → nur der Feiertag bleibt (Zeit ist
   exklusiv); „Erzwingen" verdoppelt die Kosten auf „32 KaP (statt 16)"
9. Würfel 1/1/x → Karte „Kritischer Erfolg", halbe KaP, Knopf „+1W6 auf die FP" hebt
   die FP und verschwindet danach
10. Segen tippen → KaP −1, Historieneintrag „Segen: … (QS 1)" **ohne** Würfelzeile
11. Entrückung: Stepper auf 2 → Tabellenzeile II hervorgehoben, HeroBar zeigt das
    Abzeichen „E II" (`getByLabel('Entrückung Stufe 2')`); Stufe 0 blendet es aus
