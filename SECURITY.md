# Sicherheit

Diese Datei beschreibt, wie Sicherheitsprobleme gemeldet werden, welches Bedrohungsmodell
für die App gilt und welche Regeln jede Änderung einhalten muss. Die Abschnitte
„Projektsteckbrief" und „Bedrohungsmodell" sind projektspezifisch, alles darunter lässt
sich unverändert in andere Projekte übernehmen.

## Sicherheitsprobleme melden

Bitte **kein öffentliches Issue** für Sicherheitslücken. Stattdessen:

1. Über GitHub: *Security → Report a vulnerability* (Private Vulnerability Reporting),
   sofern im Repository aktiviert.
2. Alternativ per E-Mail an den Maintainer (Adresse im GitHub-Profil).

Was hilft: betroffene Datei oder Funktion, Schritte zum Nachstellen, eine präparierte
Datei oder ein localStorage-Blob, falls das Problem darüber ausgelöst wird.

Rückmeldung innerhalb von 7 Tagen. Behobene Lücken werden im Commit als solche benannt,
sobald die Korrektur veröffentlicht ist.

Unterstützt wird ausschließlich der Stand auf `main` bzw. die daraus veröffentlichte
Version auf GitHub Pages.

## Projektsteckbrief

| | |
|---|---|
| Art | Reine Client-App (React, Vite, PWA), kein Backend, keine Accounts |
| Hosting | GitHub Pages, statische Dateien, Deployment per `gh-pages` vom Entwicklerrechner |
| Datenhaltung | Ausschließlich `localStorage` im Browser des Nutzers (Key `roll-app-state`) |
| Netzwerk zur Laufzeit | Keines außer dem Laden der eigenen Dateien (CSP `connect-src 'self'`) |
| Externe Daten | Zauberkatalog wird zur **Entwicklungszeit** aus einer Fremdquelle erzeugt, nie zur Laufzeit |
| Personenbezug | Nur der frei gewählte Heldenname; keine Telemetrie, keine Third-Party-Requests |

## Bedrohungsmodell

Es gibt keinen Server, keine Sitzungen und keine Geheimnisse. Ein Angreifer kann daher
nur über drei Wege Einfluss nehmen:

1. **Präparierte Charakterdatei (`.held`)** – ein Nutzer importiert eine Datei aus fremder
   Hand. Ziel des Angreifers: Code ausführen, Daten des Nutzers zerstören oder die App
   unbenutzbar machen.
2. **Manipulierter `localStorage`** – z. B. durch eine andere Seite auf demselben Origin
   (`*.github.io` ist per Public Suffix List getrennt, das Risiko ist also gering) oder
   durch ein altes, fehlerhaftes Format.
3. **Lieferkette** – kompromittiertes npm-Paket, manipulierte Zauber-Quelle beim Import,
   oder ein kompromittierter Entwicklerrechner, der direkt nach GitHub Pages deployt.

Alles andere (XSS über eigene Eingaben, CSRF, Auth-Bypass) hat ohne Server keinen
Angriffsweg oder trifft nur den Nutzer selbst.

### Schutzmaßnahmen, die dieses Modell tragen

- **Ein Sanitizer für beide Eingangstore.** Import und `localStorage` laufen durch
  `migratePersisted` in `src/store/persistence.ts`. Jedes Feld wird nach Typ geprüft,
  Zahlen werden geklemmt, Texte gekappt, Listen gedeckelt, unbekannte IDs verworfen.
- **Kein HTML aus Daten.** Kein `dangerouslySetInnerHTML`, kein `innerHTML`, kein `eval`.
  React rendert alle Nutzer- und Dateiinhalte als Text.
- **Content Security Policy** im Build: `script-src 'self'`, `object-src 'none'`,
  `base-uri 'none'`, `form-action 'none'`, `connect-src 'self'`.
- **Zauber-Import parst, führt nie aus.** Die fremde JS-Datei wird mit JSON5 gelesen,
  Textfelder werden auf Steuer-, Zero-Width- und Bidi-Zeichen geprüft, und der erzeugte
  TypeScript-Quelltext maskiert alle Zeichenketten (Test in `parse.test.mjs`).
- **Lockfile mit Integritätshashes** für alle Pakete, einzige Registry `registry.npmjs.org`.

## Regeln für jede Änderung

Diese Checkliste gilt für Pull Requests und eigene Commits.

### Daten von außen (Datei, Storage, URL, Netzwerk)

- [ ] Jeder Wert wird **vor** dem Dispatch in den Store geprüft: Typ, endlicher Zahlenbereich,
      Textlänge, Listenlänge. Neue Felder bekommen eine Obergrenze und einen Test.
- [ ] Objekte werden **feldweise neu aufgebaut**, nicht per Spread übernommen. Ein
      `{ ...entry }` schleppt unbekannte Schlüssel mit in den Store und in den Export.
- [ ] Unbekannte IDs, Schlüssel und Enum-Werte werden verworfen, nicht durchgereicht.
- [ ] Fehlermeldungen an den Nutzer enthalten keine rohen Exceptions oder Dateiinhalte.
- [ ] Ein neues Format bekommt eine Versionsnummer und einen Migrationspfad; Dateien mit
      höherer Version als die App werden abgelehnt.

### Rendering

- [ ] Kein `dangerouslySetInnerHTML`, `innerHTML`, `document.write`, `eval`, `new Function`.
- [ ] Links aus Daten (falls je nötig) nur mit erlaubtem Schema (`https:`) und
      `rel="noopener noreferrer"`.
- [ ] Werte in `style={{ }}` sind Zahlen aus dem Store, nie Texte aus Dateien.
- [ ] Keine neue Inline-Script-Quelle: die CSP erlaubt nur `script-src 'self'`.
      Wer sie lockern muss, begründet das im Commit.

### Abhängigkeiten

- [ ] Neue Pakete nur, wenn der Nutzen den Angriffsraum rechtfertigt. Vorher prüfen:
      Downloads, letzte Aktivität, Maintainer, `postinstall`-Skripte
      (`npm query ':attr(scripts, [postinstall])'`).
- [ ] Installation reproduzierbar mit `npm ci`, nicht `npm install`.
- [ ] `npm audit` vor jedem Deployment. Befunde in reinen Build-Tools sind Nutzer nicht
      ausgesetzt, werden aber beim nächsten Update mitgezogen; Befunde in
      Laufzeit-Paketen blockieren das Deployment.
- [ ] Dependabot oder Renovate ist aktiv, damit Updates nicht vom Erinnern abhängen.

### Build und Deployment

- [ ] Der Build läuft ohne Netzwerkzugriff auf fremde Inhalte. Codegeneratoren
      (wie `scripts/import-spells`) laufen bewusst von Hand, ihr Ergebnis wird als Diff
      geprüft und committet.
- [ ] Deployment nur von einem sauberen `main` (`git status` leer, `npm test` grün).
- [ ] `dist/` wird bei jedem Build geleert, damit keine alten oder lokalen Dateien
      mit veröffentlicht werden.
- [ ] Keine Secrets im Repository, auch nicht in der Historie. Umgebungsdateien
      (`*.local`, `.env*`) stehen in `.gitignore`.
- [ ] Agent- oder Editor-Allowlists (`.claude/settings.local.json` u. ä.) erlauben kein
      unbeaufsichtigtes Deployment.

### Persistenz und Nutzerdaten

- [ ] Ein defekter oder überlaufener Speicher darf die App nicht am Start hindern
      (Defaults statt Absturz) und darf keine Daten still verwerfen. Fehlgeschlagene
      Saves werden dem Nutzer gemeldet.
- [ ] Reset-Funktionen räumen ausstehende Speicherläufe ab, bevor sie löschen.
- [ ] Es wird nichts gespeichert oder exportiert, was der Nutzer nicht bewusst eingetragen hat.

## Regelmäßige Prüfung

Einmal pro Quartal oder vor jedem größeren Release:

```bash
npm ci
npm audit
npm test
npm run build
```

Dazu ein Blick auf: neue Felder in `persistence.ts` ohne Obergrenze, neue Pakete im
Lockfile, Änderungen an der CSP in `vite.config.ts`, offene Dependabot-Hinweise.

## Nicht im Scope

- Verfügbarkeitsangriffe (DoS) gegen eine statisch gehostete Seite.
- Manipulation der eigenen Daten durch den Nutzer selbst (Würfelergebnisse, Werte).
  `Math.random` ist bewusst kein kryptografischer Zufall; es geht um kein Geld.
- Sicherheitslücken in GitHub Pages oder im Browser des Nutzers.
