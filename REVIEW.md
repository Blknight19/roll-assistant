# Review: Roll-Assistent

Stand 2026-07-26, Branch `redesign`. Vollständige Quelldurchsicht; die Regellogik gegen das offizielle
Regel-Wiki des Verlags geprüft. Ausgangsbasis war grün
(36 Tests, `tsc` sauber), Endstand ebenfalls: **55 Unit-Tests + 23 UI-Checks**.

Die vorige Fassung (2026-07-05) ist weitgehend abgearbeitet — Regel-Engine als reine Funktionen mit
Tests, versionierte Persistenz, PWA, selbst gehostete Fonts, `ConfirmDialog`, Kampf als eigener Tab,
QS als Hero-Zahl. Dieses Dokument ersetzt sie und hält den neuen Stand fest.

**Kurzfassung:** Die Regelmathematik war korrekt. Kaputt war die Peripherie — überall dort, wo Werte
das System betreten oder verlassen. Der teuerste Fehler war ein Default-Parameter.

---

## 1. Korrektheit

### 1.1 KRITISCH — Die Lebensenergie ließ sich nicht eintragen · behoben

**`PropertyNumber.tsx:25`, `Combat.tsx` (LeP-Felder)**

```ts
const PropertyNumber = ({ min = 0, max = 20, ... })   // vorher
```

`Combat.tsx` reichte für „Aktuell" und „Maximum" kein `max` durch, also griff der Default von 20.
LeP liegt bei KO×2 + Rassenbonus, real also 25–40. Wer 32 eintippte, bekam 20 — **ohne
jede Rückmeldung**, weil `handleInputChange` still klemmte. Dieselbe Ursache deckelte Talentwerte
bei 20, obwohl das Regelwerk bis 25 steigert.

Das ist kein Schönheitsfehler: Die App konnte den Charakter, für den sie gebaut ist, nicht abbilden.

**Fix:** `max` ist jetzt Pflichtparameter. Damit hat der Compiler jede Aufrufstelle aufgedeckt statt
sie stillschweigend auf 20 zu setzen — genau das, was ein Default hier verhindert hat. Grenzen
liegen bei den Daten, nicht in der UI: `LIFE_MAX`, `COMBAT_STAT_MAX` (`combatSlice.ts`),
`TALENT_VALUE_MAX` (`talentsSlice.ts`), `ATTRIBUTE_MIN/MAX` (`attributesSlice.ts`).

> **Merksatz:** Ein Default-Wert an einer Pflichtangabe verwandelt einen Compile-Fehler in einen
> stillen Datenfehler.

### 1.2 HOCH — Ein fehlgeschlagener Import meldete Erfolg · behoben

**`importCharacter.ts`, `ImportExportSettings.tsx`**

`importCharacter` gab in *allen* Pfaden `undefined` zurück — bei Erfolg, bei gefangener Exception
und beim frühen Ausstieg wegen nicht unterstützter Dateiversion. Der Aufrufer setzte den Dateinamen
danach bedingungslos:

```ts
await importCharacter(file);
setFileName(file.name);        // rendert „✅ Import erfolgreich!"
```

Ergebnis: rote Fehlermeldung und grüne Erfolgsmeldung gleichzeitig. Wer eine kaputte Datei lud,
durfte raten, ob sein Charakter noch da war.

**Fix:** Rückgabetyp `Promise<boolean>`; die Erfolgsanzeige hängt am Rückgabewert.

### 1.3 HOCH — `life.max: 0` teilte durch null · behoben

**`persistence.ts` (`sanitizeCombat`), `combatSlice.ts`**

Der Reducer klemmte `max` auf ≥ 1 — aber die Persistenz setzt `preloadedState` und **umgeht die
Reducer vollständig**. Ein gespeichertes oder von Hand editiertes `max: 0` erreichte damit
ungeprüft die Anzeige:

```ts
const healthPercentage = (combat.life.current / combat.life.max) * 100;  // Infinity / NaN
style={{ width: `${healthPercentage}%` }}                               // width: NaN%
```

**Fix:** Die Klemmlogik liegt jetzt in `clampLife`/`clampCombatStat` in `combatSlice.ts`; Reducer
und Sanitizer benutzen dieselbe Funktion. Zwei Wege in den Zustand, eine Regel.

### 1.4 HOCH — `current` konnte `max` überschreiten · behoben

**`combatSlice.ts`**

`updateLifeStat` klemmte `current` nur nach unten. Wer das Maximum unter den aktuellen Wert senkte,
bekam „35 / 20" und einen überlaufenden Balken. Der Heil-Knopf klemmte an der Aufrufstelle, das
Eingabefeld daneben nicht — die Regel stand an der falschen Stelle.

**Fix:** `clampLife` klemmt `current` gegen `max` und zieht es beim Senken von `max` nach.

### 1.5 MITTEL — `NaN` und `Infinity` kamen durch den Import · behoben

**`importCharacter.ts`**

Geprüft wurde nur `typeof value === 'number'`. Das ist für `NaN` **wahr**. Ein `NaN` im Attribut
vergiftete danach jede Probe: `attrs[i] + modifier - die` → `NaN` → `Math.min(0, NaN)` → `NaN` →
QS `NaN`. Die Persistenz machte es mit `Number.isFinite` bereits richtig; der Import hatte seine
eigene, schwächere Validierung.

**Fix:** Der Import benutzt jetzt `migratePersisted` aus `persistence.ts` — dieselbe Validierung
wie beim Laden. Ein Format, ein Validierer.

### 1.6 MITTEL — Dieselbe Datei ließ sich kein zweites Mal importieren · behoben

**`ImportExportSettings.tsx`**

Das File-Input wurde nie zurückgesetzt, also feuerte `change` bei gleicher Datei nicht erneut.
Betroffen war ausgerechnet der Ablauf „Alle Daten zurücksetzen → Backup zurückspielen".

**Fix:** `input.value = ''` nach der Verarbeitung.

### 1.7 MITTEL — Der letzte Wurf konnte verloren gehen · behoben

**`store/index.ts`**

Speichern war 500 ms entprellt, ohne Flush. Wer die App direkt nach einem Wurf wegwischte, verlor
ihn — auf dem Handy ist das der normale Weg, eine App zu verlassen.

**Fix:** Flush auf `pagehide` und `visibilitychange`.

### 1.8 MITTEL — Reset konnte vom eigenen Save überholt werden · behoben

**`resetLocalStorage.ts`**

`clearPersistedState()` gefolgt von `location.reload()` — ein bis zu 500 ms alter Save-Timer konnte
zwischen Löschen und Entladen feuern und den gerade gelöschten Zustand zurückschreiben.

**Fix:** `cancelPendingSave()` vor dem Löschen.

### 1.9 MITTEL — Kampf- und Einzelwurf-Zustand starb beim Tab-Wechsel · behoben

**`Combat.tsx`, `SimpleRoll.tsx`**

Radix Tabs hängt inaktive Panels aus. `TalentRoll` war dafür in `probeSlice` gehoben worden —
`Combat` und `SimpleRoll` blieben bei lokalem `useState`. Ein halb fertiges Refactoring: Modifikator
und letztes Ergebnis waren nach einem Blick in die Historie weg.

**Fix:** `combatRollSlice` und `simpleRollSlice` nach dem Vorbild von `probeSlice`. Beide sind
bewusst **nicht** persistiert — sie sollen nur den Unmount überleben, nicht den Neustart.

### 1.10 Kleinere Funde · behoben

| Ort | Problem |
|---|---|
| `TalentRoll.tsx` | Bei einem Krit färbte `getDiceVariant` **alle drei** Würfel golden — auch die 20 in einem Doppel-1-Krit. Jetzt färbt jeder Würfel nach eigenem Wert. |
| `probeSlice.ts` | `selectProbeTalent` löschte `lastRoll` nicht — nach dem Talentwechsel stand das Ergebnis des vorigen Talents oben. |
| `PropertyNumber.tsx` | Leereingabe wurde verworfen, das Feld ließ sich nicht leeren; 8 → 15 erforderte Alles-Markieren. Jetzt Entwurfszustand beim Tippen, Normalisierung beim Verlassen. |
| `PropertyNumber.tsx` | `w-12` schnitt zweistellige Werte ab („10" erschien als „1C"). Erst im Screenshot sichtbar geworden, nicht im Test. |
| `importCharacter.ts` | `addRoll` in der Schleife kehrte die importierte Historie um (`unshift` je Eintrag). Jetzt `setHistory` am Stück. |
| `exportCharacter.ts` | `URL.revokeObjectURL` lief synchron direkt nach `click()` — in manchen Browsern bricht das den Download ab. |
| `App.tsx` | Der schwebende Theme-Umschalter unten rechts überlappte den neuen Würfeln-Knopf; er sitzt jetzt im Kopf. |

### 1.11 HOCH — Die LeP-Zahl verschwand bei wenig Lebensenergie · behoben

**`Combat.tsx`, `HeroBar.tsx`, `combatSlice.ts`**

Die Zahl stand **im Füllbalken**: `<div style={{ width: '5%' }}>3 / 40</div>`. Sobald die Füllung
schmaler war als der Text, schnitt das `overflow-hidden` des Rahmens sie ab — und bei
`current === 0` blendete eine Bedingung sie ganz aus. Ausgerechnet bei niedriger und bei null
Lebensenergie zeigte die Anzeige also nichts. Dazu `text-white` auf `bg-amber-500`, rund 2:1.

Eine bloße Mindestbreite hätte nur die halbe Ursache getroffen und den Balken zusätzlich
beschönigen lassen. Stattdessen:

- Die Zahl liegt jetzt auf einer eigenen Ebene mittig über der **ganzen** Leiste und wird
  **zweimal gezeichnet**: einmal in Vordergrundfarbe für die leere Spur, darüber dieselbe Zahl in
  dunkler Tinte, per `clip-path` exakt an der Füllkante beschnitten. Dadurch stimmt der Kontrast
  auf beiden Seiten der Kante, ohne Kasten oder Pille hinter dem Text — ein einfarbiger Text
  scheitert im Dunkelmodus über der grünen Füllung (rund 1,8:1), eine Pille sah wie ein
  aufgeklebter Fleck aus.
- `lifeFillPercent` (`combatSlice.ts`, neben `clampLife`) gibt der Füllung einen Mindest-Streifen
  von 4 %, solange mehr als 0 LeP übrig sind — sonst sähen 1 LeP und 0 LeP gleich aus. Die
  **Farbschwellen** rechnen weiter mit dem exakten Verhältnis, damit der Streifen die Farbe nicht
  verfälscht.
- Der große Balken hatte gar keinen zugänglichen Namen; er trägt jetzt `role="img"` mit
  `aria-label`, wie die Held-Leiste schon vorher.

---

## 2. Regelwerk

### 2.1 Geprüft und korrekt — bitte nicht „reparieren"

Gegen das offizielle Regel-Wiki verifiziert:

| Regel | Umsetzung |
|---|---|
| QS-Tabelle 0–3→1, 4–6→2, 7–9→3, 10–12→4, 13–15→5, 16+→6, Deckel 6 | `Math.min(6, Math.max(1, Math.ceil(fp / 3)))` trifft das exakt |
| 0 übrige FP = bestanden mit QS 1 | ✓ |
| Modifikator wirkt auf die **Eigenschaften**, nicht auf die FP; negativ = Erschwernis | ✓ |
| Zwei oder drei Einsen = kritischer Erfolg, zwei oder drei Zwanzigen = Patzer, jeweils automatisch | ✓ |
| Bestätigungswurf im Kampf gegen den **modifizierten** Wert | `target = value + modifier` ✓ |
| INI = Basiswert + 1W6 | ✓ |
| 59 Talente mit ihren Eigenschaftstripeln | alle geprüft, alle korrekt |

Besonders erwähnenswert: Der Schalter `confirmCriticals` bildet exakt die offizielle optionale Regel
*Kein Bestätigungswurf* ab —
eingeschaltet gilt die Grundregel mit Bestätigungswurf, ausgeschaltet zählen 1 und 20 direkt. Der
Beschreibungstext in `RulesSettings.tsx` stimmt wörtlich mit der Regellage überein. Das ist selten
genau getroffen.

### 2.2 Ergänzt — Regelfolgen werden jetzt genannt

Laut der Regel *Kritischer Erfolg (Attacke)*
halbiert eine **unbestätigte** 1 immer noch die Verteidigung des Ziels; erst der bestätigte Krit
verdoppelt zusätzlich den Schaden. Die App sagte dazu nichts. Jetzt trägt die Ergebniskarte für
Attacke und Fernkampf einen Konsequenzsatz. Für Parade und Ausweichen bewusst nicht — dort behandelt
das Regelwerk kritische Erfolge gesondert, teils als optionale Regel.

Ebenfalls ergänzt: Ein **kritischer Erfolg zeigt jetzt seine QS**. Vorher war die Anzeige an
`special === null` gekoppelt, der beste Ausgang der Probe blieb also ohne die eine Zahl, nach der
am Tisch gefragt wird. (Die QS-Verdopplung ist eine *Sammelproben*-Regel und gilt hier nicht.)

### 2.3 OFFEN — Bestätigungswurf ab Zielwert 20

**`rules.ts`**

```ts
const confirmed = confirmationRoll <= target;   // Krit
const confirmed = confirmationRoll > target;    // Patzer
```

Ab einem modifizierten Zielwert von 20 bestätigt sich damit **jeder** Krit und **kein** Patzer je —
die Bestätigung wird zur Formalie. Ob eine gewürfelte 20 trotzdem nie bestätigt, ließ sich am
Regel-Wiki nicht belegen: Forenquellen sagen ja, die offizielle Seite schweigt.

**Bewusst nicht geändert.** Würfelchancen auf Verdacht zu verschieben wäre schlechter, als den
Status quo zu lassen. Stattdessen ist das Verhalten jetzt mit zwei Tests festgenagelt und im Code
kommentiert, damit es nicht unbemerkt kippt. **Wenn du im Regelwerk nachsiehst, ist die Änderung
zwei Zeilen groß.**

### 2.4 Fehlende Mechaniken (kein Fehler, Roadmap)

Schicksalspunkte (Wiederholungswürfe), Routineproben und die Patzertabellen sind nicht abgebildet.

---

## 3. Sicherheit

Die realistische Bedrohung ist **korrupte Eingabe, nicht ein Angreifer**: eine statische, rein
lokale PWA ohne Anmeldung, ohne Server, ohne Netzwerkaufrufe. Kein XSS-Vektor (React escaped die
Historien-Strings), keine Injection-Fläche, keine Geheimnisse. Entsprechend ehrlich die Liste:

| Fund | Status |
|---|---|
| Rohe Exception im Toast (`${e}`) legte Interna offen | behoben — eigene Meldung, Details nur in die Konsole |
| Keine Größenprüfung vor `file.text()`; eine riesige Datei fror den Tab ein | behoben — 5-MB-Grenze vor dem Lesen |
| `NaN`/`Infinity` durch den Import | behoben, siehe 1.5 |
| Base64 ist **keine** Verschlüsselung — die `.held`-Datei sieht nur undurchsichtig aus | benannt: die UI sagt es jetzt ausdrücklich, damit niemand die Datei für geschützt hält |

---

## 4. Performance

Der große Hebel ist bereits gezogen: `rpg-dice-roller` samt mathjs ist raus, `dice.ts` sind drei
Zeilen `Math.random`. Der Build liegt bei **456 KB / 142 KB gzip** — für eine offline-fähige PWA mit
selbst gehosteten Fonts unauffällig.

Nicht geändert, weil es sich nicht lohnt: Das Speichern serialisiert den Gesamtzustand inklusive
100 Historieneinträgen, ist aber entprellt und läuft auf einem Datensatz dieser Größe unter einer
Millisekunde. Der Talent-Popover rendert alle 59 Einträge — cmdk filtert im DOM, bei 59 Zeilen ist
das kein Thema. **Hier zu optimieren wäre Arbeit ohne Wirkung.**

Eine Anmerkung ohne Handlungsbedarf: `Math.random()` ist nicht kryptografisch zufällig. Für einen
Würfelassistenten am Spieltisch ist das irrelevant — nennenswerten Modulo-Bias gibt es bei
`Math.floor(Math.random() * sides)` nicht.

---

## 5. Wartbarkeit

| Fund | Fix |
|---|---|
| Zwei Zustandsmuster für dieselbe Aufgabe (`probeSlice` vs. lokaler `useState`) | vereinheitlicht, siehe 1.9 |
| `modifierTerm` wortgleich in zwei Dateien, `isRecord` und `COMBAT_STAT_KEYS` doppelt | `utils/format.ts`; Guards und Schlüssel kommen aus ihren Slices |
| Import baute die Validierung der Persistenz nach | zusammengeführt, siehe 1.5 |
| Gemischte Einrückung (Tabs vs. Spaces) ohne `.editorconfig` | `.editorconfig` ergänzt |
| Emoji als Icons (🎲, ✅) trotz „nur Lucide"-Entscheidung | ersetzt |
| Identischer Wrapper zweimal ineinander (`Character.tsx` / `ImportExportSettings.tsx`) | entdoppelt |
| `ConfirmDialog` als drittes Flex-Kind in einer `justify-between`-Zeile | aus der Zeile geholt |
| `document.getElementById` statt `useRef` | `useRef` |
| Zwei `console.warn` (die Lint-Warnungen) | aufgelöst; die eine verbliebene ist bewusst und kommentiert |
| Nur `toLocaleTimeString` in der Historie — 100 Einträge umfassen mehrere Abende | Datum, sobald der Eintrag nicht von heute ist |
| `Object.entries(attributes)` verließ sich auf Schlüsselreihenfolge | `ATTRIBUTE_KEYS` |

**Entschlackt:** dekorative Banner-Kommentare, die nur wiederholten was der Code sagt
(`// Health Bar Percentage`, `// Würfel-Anzeige`), Karte-in-Karte-Verschachtelung, `text-3xl` als
Ersatz für Hierarchie, generische Namen. Deutsche Kommentare sind geblieben — sie sind projektüblich
und erklären Regelwerksbezüge.

Verbleibende Lint-Warnung: `ui/button.tsx` (react-refresh) — shadcn-Original, unverändert gelassen.

---

## 6. Oberfläche

Navigation: **fünf Tabs oben**, Talent und Kampf nebeneinander, Einzelwurf in der Hauptnavigation.
Bewusst keine zweite Ebene — verschachtelte Tabs waren schon vorher die schwächste Stelle.

Was sich geändert hat:

- **Held-Leiste** mit Name und Lebensenergie auf **jedem** Tab. Die LeP stand vorher am Ende des
  Kampf-Tabs — genau dort, wo man mitten im Kampf am wenigsten hinsieht.
- **Eine gemeinsame `RollResultCard`** für Talent, Kampf und Einzelwurf. Vorher wirkten die drei
  Ergebnisse wie drei verschiedene Apps.
- **Rechenweg eingeklappt.** Am Tisch zählt Erfolg → QS; die Herleitung kostete vorher so viel Höhe
  wie alles andere zusammen.
- **Modifikator in der Würfeln-Leiste**, mit Label und dem gewohnten Hinweis „Erschwernis" bzw.
  „Erleichterung". Auf dem Kampf-Tab trägt die Leiste nur den Modifikator — dort lösen die
  einzelnen Kampfwerte den Wurf aus.
- **Desktop ist kein gestrecktes Handy:** ab `lg` zweispaltig, Eingabe links, Ergebnis rechts
  mitlaufend. Auf dem Handy klebt die Würfeln-Leiste in der Daumenzone.
- **Charaktername**, auch als Export-Dateiname statt immer `charakter.held`.

Ein Detail aus dem Testlauf: Bei einem Krit mit negativen FP stand „−2 FP übrig" unter einem
Erfolg. Steht jetzt als „ohne FP-Reserve gelungen" da.

---

## 7. Datenformat

Der Speicher-Blob steht auf **Version 3** und trägt eine Charakterliste:

```jsonc
{
  "version": 3,
  "activeCharacterId": "held-1",
  "characters": [{ "id": "held-1", "name": "…", "attributes": {}, "talents": [], "combat": {} }],
  "history": [],      // gehört der App, nicht dem Charakter
  "settings": {}
}
```

Die App verwaltet weiterhin genau einen Charakter — der Store bleibt flach, nur die Persistenz kennt
die Liste. Mehr-Charakter-Support kostet damit später keine Migration. `migratePersisted` liest
v3, v2 (flacher Charakter) und das versionslose Alt-Format.

Datei- und Speicherformat teilen sich jetzt **eine** Version; vorher gab es zwei konkurrierende
Zählungen unter demselben Namen.

---

## 8. Prüfung

```
npm test          60 Tests, 3 Dateien
npx tsc -b        sauber
npx eslint .      1 Warnung (shadcn button.tsx, vorbestanden)
npm run build     456 KB / 142 KB gzip
```

Für den Lebensbalken zusätzlich 24 Checks über die Kreuzung aus **40/40, 2/40, 0/40** × Hell-/
Dunkelmodus × Handy/Desktop: Zahl in allen zwölf Kombinationen vollständig innerhalb der Leiste,
bei 2/40 ein sichtbarer roter Streifen, bei 0/40 keine Füllung und trotzdem `0 / 40`.

Zusätzlich 23 UI-Checks per Playwright gegen `vite preview`, Handy (390×844) und Desktop (1440×900):
LeP 32 setzen und über das Maximum hinaus klemmen, Kampfwurf mit Bestätigungswurf, Tab-Wechsel mit
erhaltenem Zustand, Krit mit QS und korrekt gefärbten Würfeln, Rechenweg auf/zu, Modifikator mit
Erschwernis/Erleichterung, Persistenz v3, Reload, kaputter Import ohne Erfolgsmeldung, zweispaltiges
Desktop-Layout.

Nicht automatisiert geprüft: Offline-Betrieb über den Service Worker, echtes Gerät statt
Viewport-Emulation.

---

## Wenn du nur drei Dinge mitnimmst

1. **Ein Default-Parameter hat den Charakterbogen unbrauchbar gemacht** (1.1). `max = 20` sah
   harmlos aus und deckelte die Lebensenergie jedes Helden. Pflichtparameter an Stellen, wo
   es keinen sinnvollen Standardwert gibt.
2. **Zwei Wege in denselben Zustand brauchen dieselbe Regel** (1.3). Die Reducer klemmten sauber,
   die Persistenz umging sie — und lieferte `width: NaN%`. Solche Fehler entstehen nicht in der
   Logik, sondern an den Nähten.
3. **Die Regeln waren richtig, die Ränder nicht.** Wer die Regelmathematik prüft, findet nichts.
   Alles Kaputte lag dort, wo Daten die App betreten oder verlassen: Import, Persistenz,
   Eingabefelder.
