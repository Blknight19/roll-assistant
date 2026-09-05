/**
 * Erzeugt die Katalogdateien unter src/data/spells aus der Zaubertabelle von
 * f-space.de. Aufruf: `node scripts/import-spells`.
 *
 * Die Quelle ist eine JS-Datei mit einer Objektliste. Sie wird geparst, nie
 * ausgeführt – ein Skript aus fremder Hand darf beim Bauen keinen Code beisteuern.
 * Übernommen werden ausschließlich Werteangaben; Wirkungstexte, Zaubererweiterungen
 * und Publikationsangaben des Regelwerks bleiben draußen.
 */
import { writeFileSync } from 'node:fs';
import { argv } from 'node:process';
import JSON5 from 'json5';
import { KORREKTUREN } from './korrekturen.mjs';
import { KARMA_KLASSEN, KLASSEN, applyKorrektur, renderModule, toCatalogEntry } from './parse.mjs';

const QUELLE = 'https://www.f-space.de/dsa5/tools/spells/spells-data.js';

/** Ein Export je Klasse – die Dateien bleiben so klein genug, um sie zu lesen. */
const DATEIEN = {
	zauber: { ziel: 'src/data/spells', datei: 'zauber.ts', exportName: 'ZAUBER', typ: 'SpellCatalogEntry' },
	ritual: { ziel: 'src/data/spells', datei: 'rituale.ts', exportName: 'RITUALE', typ: 'SpellCatalogEntry' },
	hexenfluch: { ziel: 'src/data/spells', datei: 'hexenfluesche.ts', exportName: 'HEXENFLUESCHE', typ: 'SpellCatalogEntry' },
	liturgie: { ziel: 'src/data/liturgies', datei: 'liturgien.ts', exportName: 'LITURGIEN', typ: 'LiturgyCatalogEntry' },
	zeremonie: { ziel: 'src/data/liturgies', datei: 'zeremonien.ts', exportName: 'ZEREMONIEN', typ: 'LiturgyCatalogEntry' },
	segen: { ziel: 'src/data/liturgies', datei: 'segen.ts', exportName: 'SEGEN', typ: 'LiturgyCatalogEntry' }
};

/** Schneidet die Objektliste aus der Zuweisung `var DATA_RAW = [...]`. */
const arrayLiteral = text => text.slice(text.indexOf('= [') + 2, text.lastIndexOf(']') + 1);

const ladeQuelle = async () => {
	const antwort = await fetch(QUELLE);
	if (!antwort.ok) throw new Error(`${QUELLE} antwortet mit ${antwort.status}`);
	return antwort.text();
};

/**
 * Ein Katalog je Zielordner: Zauberbuch und Liturgienbuch vergeben ihre IDs
 * unabhängig voneinander, „Schlangenruf" gibt es als Zauber und als Liturgie.
 */
const kataloge = { magie: new Map(), karma: new Map() };
const gruppeVon = klasse => (KARMA_KLASSEN.includes(klasse) ? 'karma' : 'magie');
const abgelehnt = [];

const roh = JSON5.parse(arrayLiteral(await ladeQuelle()));
for (const datensatz of roh) {
	const klasse = Object.hasOwn(datensatz, 'Klasse') ? datensatz.Klasse : undefined;
	if (!KLASSEN.includes(klasse)) continue;

	try {
		const eintrag = applyKorrektur(toCatalogEntry(datensatz), KORREKTUREN);
		if (KARMA_KLASSEN.includes(eintrag.klasse) && eintrag.verbreitung.length === 0) {
			throw new Error('Verbreitung fehlt');
		}
		const katalog = kataloge[gruppeVon(eintrag.klasse)];
		const bekannt = katalog.get(eintrag.id);
		if (bekannt !== undefined) throw new Error(`id ${eintrag.id} doppelt (${bekannt.name})`);
		katalog.set(eintrag.id, eintrag);
	} catch (ursache) {
		abgelehnt.push(`${datensatz.Name ?? '?'}: ${ursache.message}`);
	}
}

for (const zeile of abgelehnt) console.error(`abgelehnt – ${zeile}`);

const unbenutzt = Object.keys(KORREKTUREN).filter(
	id => !kataloge.magie.has(id) && !kataloge.karma.has(id)
);
if (unbenutzt.length > 0) {
	throw new Error(`Korrekturen ohne Eintrag: ${unbenutzt.join(', ')}`);
}

// Korrekturen greifen allein über die id. Trägt eine id in beiden Katalogen einen
// Eintrag, träfe eine Korrektur unbeabsichtigt auch den anderen.
const mehrdeutig = Object.keys(KORREKTUREN).filter(
	id => kataloge.magie.has(id) && kataloge.karma.has(id)
);
if (mehrdeutig.length > 0) {
	throw new Error(`Korrekturen treffen beide Kataloge: ${mehrdeutig.join(', ')}`);
}

if (argv.includes('--dry-run')) {
	const gelesen = kataloge.magie.size + kataloge.karma.size;
	console.log(`${gelesen} Einträge gelesen, ${abgelehnt.length} abgelehnt (dry run)`);
} else {
	for (const [klasse, { ziel, datei, exportName, typ }] of Object.entries(DATEIEN)) {
		const gruppe = [...kataloge[gruppeVon(klasse)].values()]
			.filter(eintrag => eintrag.klasse === klasse)
			.sort((a, b) => a.id.localeCompare(b.id, 'de'));
		writeFileSync(`${ziel}/${datei}`, renderModule(exportName, gruppe, typ), 'utf8');
		console.log(`${datei}: ${gruppe.length} Einträge`);
	}
}

if (abgelehnt.length > 0) {
	throw new Error(`${abgelehnt.length} Einträge abgelehnt – siehe Meldungen oben`);
}
