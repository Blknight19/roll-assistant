---
name: verify
description: Build, launch and drive the Roll-Assistent end-to-end to verify changes at the UI surface (Playwright against vite preview).
---

# Verify: Roll-Assistent

## Build & Launch

```powershell
npm run build          # tsc -b && vite build (PWA sw.js wird mitgebaut)
npm run preview        # serviert dist auf http://localhost:4173/roll-assistant/
```

Die Basis-URL enthält den gh-pages-Pfad: `http://localhost:4173/roll-assistant/`.

## Drive (Playwright)

Playwright ist keine Projekt-Dependency — bei Bedarf `npm install --no-save playwright`
(Chromium liegt meist schon in `%LOCALAPPDATA%\ms-playwright`). Skript außerhalb des
Repos muss Playwright per absolutem Pfad importieren:
`import { chromium } from 'file:///.../roll-assistant/node_modules/playwright/index.mjs'`.

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

Persistenz-Key: `roll-app-state`. Aktuelles Format ist v6: `{ version: 6,
activeCharacterId, characters: [{ id, name, attributes, talents: [{id,value}],
combat, spellbook, karma, conditions }], history, settings }`. `spellbook` je
Charakter ist `{ isSpellcaster, asp: { current, max }, spells: [...], upkeep: [...] }`,
`karma` ist `{ isBlessed, tradition, kap: { current, max }, liturgies: [...],
blessings: [...], upkeep: [...] }` — ohne `devotionLevel`, das liegt seit v6 in
`conditions`. `blessings` trägt Katalog-IDs der Segen — unbekannte IDs verwirft der
Sanitizer. `conditions` ist `{ levels: { schmerz, betaeubung, furcht, verwirrung,
belastung, paralyse, berauscht, entrueckung }, toughDog }`, jede Stufe 0..4; bei
`schmerz` ist das nur die Zusatzstufe, der LeP-Anteil wird zur Laufzeit hergeleitet.
`settings` trägt `confirmCriticals` und `noLiturgyFumble`.
Ältere Blobs werden beim Laden migriert: v5 mit `karma.devotionLevel` wird nach
`conditions.levels.entrueckung` übernommen, v4 ohne `karma`, v2/v3 lagen flacher
(Charakter auf oberster Ebene bzw. `characters` ohne `spellbook`), Legacy v1 ist ein
roher Slice-Dump ohne `version`. Zum Seeden reicht ein v6-Blob mit genau einem
Eintrag in `characters`.
**Achtung:** `addInitScript` läuft bei jedem Reload — nur seeden, wenn der Key `null`
ist, sonst überschreibt der Seed den von der App geschriebenen Blob und
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
- Zustände: HeroBar-Knopf `getByRole('button', { name: /^Zustände/ })` öffnet den Dialog;
  Stufen sind `role="group"` mit Namen „Stufe Betäubung" (bei Schmerz „Zusätzliche Stufe
  Schmerz") und darin `button[aria-pressed]` mit Namen „Stufe II". Abzeichen in der
  HeroBar stehen im Namen des Knopfs („Zustände bearbeiten: Betäubung II"). Chips an der
  Probe: `getByRole('button', { name: 'Belastung gilt' })`, `… 'Gottgefällig'`.
  Zäher Hund: `getByRole('switch', { name: 'Vorteil Zäher Hund' })`.

### Flows, die sich lohnen

1. Talentprobe mit Modifikator −2 → Label "Erschwernis", Berechnung `X − 2 − Wurf`
2. TaW 20, Würfe klein → QS-Hero zeigt 6 (Cap), nicht 7
3. Nach Wurf Modifikator ändern → Berechnung/QS unverändert (Snapshot)
4. Kampf: d20=1 + Bestätigung ≤/> Zielwert → Krit vs. "Gelungen (Krit nicht bestätigt)"
5. Legacy-Blob seeden → Talente/Attribute migriert, Blob wird als v6 zurückgeschrieben
6. `navigator.serviceWorker.ready` abwarten → `context.setOffline(true)` → Reload rendert
7. Liturgie mit „Ohne Gebet" → Gesamt −2 im Rechenweg
8. Zeremonie: „Namenlose Tage" dann „Feiertag" → nur der Feiertag bleibt (Zeit ist
   exklusiv); „Erzwingen" verdoppelt die Kosten auf „32 KaP (statt 16)"
9. Würfel 1/1/x → Karte „Kritischer Erfolg", halbe KaP, Knopf „+1W6 auf die FP" hebt
   die FP und verschwindet danach
10. Segen tippen → KaP −1, Historieneintrag „Segen: … (QS 1)" **ohne** Würfelzeile
11. Entrückung (Testcharakter braucht `karma.isBlessed === true`, sonst filtert der
    Dialog die Zeile heraus): Stepper auf 2 → Tabellenzeile II hervorgehoben,
    HeroBar-Knopf heißt „Zustände bearbeiten: Entrückung II"; Stufe 0 → Knopf heißt
    „Zustände"
12. Betäubung II + Furcht I → Talent-Tab „Gesamt −3 – Betäubung II −2, Furcht I −1",
    Rechenweg `13 − 3 − Wurf`, Historie mit Posten
13. Verwirrung III → Zaubern-Knopf grau mit „Verwirrung III: Zaubern ist unmöglich."
14. LeP auf 15/30 → „Schmerz II durch LeP" unter der Leiste, Attacke „Zustände −2"
15. Berauscht IV → Toast, Betäubung +1, Berauscht 0
16. v5-Blob mit `devotionLevel: 2` seeden (Testcharakter braucht `karma.isBlessed ===
    true`, sonst filtert der Dialog die Zeile heraus) → Entrückung II im Dialog, Blob
    wird als v6 zurückgeschrieben
