/**
 * Reine Umformungen von den Rohfeldern der Quelle auf das Katalogschema.
 * Alles hier ist frei von Dateizugriff, damit es sich einzeln testen lässt.
 */

const UMLAUTE = { ä: 'ae', ö: 'oe', ü: 'ue', ß: 'ss' };

/** Die IDs des handgepflegten Katalogs entstehen nach genau dieser Regel. */
export const slugify = name => {
	const slug = name
		.toLowerCase()
		.replace(/[äöüß]/g, zeichen => UMLAUTE[zeichen])
		.replace(/[^a-z0-9]+/g, '-')
		.replace(/^-+|-+$/g, '');
	if (slug === '') throw new Error(`Kein Slug aus Name: ${JSON.stringify(name)}`);
	return slug;
};

/**
 * Muss zu ATTRIBUTE_KEYS in src/store/attributesSlice.ts passen. Als eigene Liste
 * geführt, weil das Skript unter Node läuft und keine TS-Quelle importiert.
 */
export const ATTRIBUTE_KEYS = ['MU', 'KL', 'IN', 'CH', 'FF', 'GE', 'KO', 'KK'];

const PROBE_MUSTER = /^([A-Z]{2})\/([A-Z]{2})\/([A-Z]{2})(?:\s*\((.+)\))?$/;

/** Zerlegt „MU/KL/CH (modifiziert durch ZK)" in Eigenschaften und Anzeigezusatz. */
export const parseProbe = probe => {
	const treffer = PROBE_MUSTER.exec(probe.replace(/\s+/g, ' ').trim());
	if (treffer === null) throw new Error(`Probe nicht lesbar: ${JSON.stringify(probe)}`);

	const attributes = treffer.slice(1, 4);
	for (const attribut of attributes) {
		if (!ATTRIBUTE_KEYS.includes(attribut)) {
			throw new Error(`Unbekannte Eigenschaft ${attribut} in Probe: ${JSON.stringify(probe)}`);
		}
	}

	const probeNote = treffer[4]?.trim();
	return probeNote === undefined ? { attributes } : { attributes, probeNote };
};

/** Spiegelt SPELL_COST_MAX aus src/store/spellbookSlice.ts. */
export const SPELL_COST_MAX = 99;
/** Spiegelt LITURGY_COST_MAX aus src/store/karmaSlice.ts – Zeremonien kosten bis 256 KaP. */
export const LITURGY_COST_MAX = 256;

/** Fester Betrag, optional gefolgt von einem Zusatz, der selbst keine Kosten nennt. */
const FESTE_KOSTEN = /^(\d+)(?:\s*(?:AsP|KaP))?(?:\s*\(([^()]*)\))?$/;

/**
 * Gibt die Zahl nur zurück, wenn der Wortlaut genau einen festen Betrag nennt.
 * Formeln („+ 4 AsP pro Stunde"), Alternativen („bzw."), Untergrenzen („mindestens")
 * und Teilbeträge („davon 2 permanent") bleiben null – die löst der Spieler beim
 * Übernehmen selbst auf.
 */
export const parseCost = (kosten, max = SPELL_COST_MAX) => {
	if (kosten === undefined || kosten.trim() === '') return null;

	const treffer = FESTE_KOSTEN.exec(kosten.replace(/\s+/g, ' ').trim());
	if (treffer === null) return null;
	if (/\d/.test(treffer[2] ?? '')) return null;

	const betrag = Number(treffer[1]);
	if (betrag > max) {
		throw new Error(`Kosten über ${max}: ${JSON.stringify(kosten)}`);
	}
	return betrag;
};

/**
 * Klassen mit Probe und AsP. Zaubertricks fehlt die Probe im Regelwerk, damit fehlen
 * ihnen die drei Eigenschaften, ohne die ein Zauberbucheintrag nicht würfelbar ist.
 */
export const MAGIE_KLASSEN = ['zauber', 'ritual', 'hexenfluch'];
/** Klassen der Geweihten. Segen haben keine Probe, aber feste Regelwerte. */
export const KARMA_KLASSEN = ['liturgie', 'zeremonie', 'segen'];
export const KLASSEN = [...MAGIE_KLASSEN, ...KARMA_KLASSEN];

/** Geschlossene Liste des Regelwerks – alles andere ist ein Lesefehler. */
export const MERKMALE = [
	'Antimagie',
	'Dämonisch',
	'Einfluss',
	'Elementar',
	'Heilung',
	'Hellsicht',
	'Illusion',
	'Objekt',
	'Sphären',
	'Telekinese',
	'Temporal',
	'Verwandlung'
];

/** Feld je Klasse, das die Dauer des Wirkens trägt. Hexenflüche und Segen führen keines. */
const DAUER_FELD = {
	zauber: 'Zauberdauer',
	ritual: 'Ritualdauer',
	hexenfluch: null,
	liturgie: 'Liturgiedauer',
	zeremonie: 'Zeremoniedauer',
	segen: null
};

/**
 * Das Regelwerk nennt für Hexenflüche keine Dauer je Fluch, sondern eine für alle:
 * direkt geschleudert dauert ein Fluch mindestens 1 Aktion. Über den Vertrauten
 * übertragen wird daraus ein Ritual von einer Stunde.
 */
const HEXENFLUCH_DAUER = 'mindestens 1 Aktion';

/**
 * Das Regelwerk nennt für Segen keine eigenen Werte je Eintrag, sondern eine Regel für
 * alle: „Ihr Wirken kostet jeweils 1 KaP, die Liturgiedauer beträgt 1 Aktion."
 */
const SEGEN_DAUER = '1 Aktion';
const SEGEN_KOSTEN = '1 KaP';

/**
 * Obergrenzen der Textfelder. Sie spiegeln die Konstanten aus
 * src/store/spellbookSlice.ts – der Katalog darf nichts tragen, was das Zauberbuch
 * beim Übernehmen abschneiden würde.
 */
const LAENGEN = {
	name: 70,
	probeNote: 90,
	costText: 160,
	castTime: 60,
	range: 60,
	duration: 120,
	target: 90,
	merkmal: 30,
	verbreitung: 40
};

/**
 * C0-Steuerzeichen, Zero-Width- und Bidi-Zeichen. Letztere lassen Text anders
 * erscheinen, als er gespeichert ist – in Daten aus fremder Quelle haben sie nichts
 * zu suchen.
 */
const istSteuerzeichen = codePoint =>
	codePoint < 0x20 ||
	codePoint === 0x7f ||
	(codePoint >= 0x200b && codePoint <= 0x200f) ||
	(codePoint >= 0x202a && codePoint <= 0x202e) ||
	(codePoint >= 0x2066 && codePoint <= 0x2069) ||
	codePoint === 0xfeff;

const pruefeText = (wert, feld) => {
	for (const zeichen of wert) {
		if (istSteuerzeichen(zeichen.codePointAt(0))) {
			throw new Error(`Steuerzeichen im Feld ${feld}: ${JSON.stringify(wert)}`);
		}
	}
	if (wert.length > LAENGEN[feld]) {
		throw new Error(`Feld ${feld} zu lang (${wert.length} > ${LAENGEN[feld]})`);
	}
	return wert;
};

/**
 * Liest ein Feld ausschließlich aus dem Objekt selbst. Geerbte Eigenschaften bleiben
 * außen vor, damit ein präparierter Datensatz keine Werte über die Prototypkette
 * unterschieben kann.
 */
const feld = (roh, schluessel) => {
	if (!Object.hasOwn(roh, schluessel)) return undefined;
	const wert = roh[schluessel];
	if (wert === undefined || wert === null) return undefined;
	if (typeof wert !== 'string') {
		throw new Error(`Feld ${schluessel} ist kein Text: ${JSON.stringify(wert)}`);
	}
	const geputzt = wert.replace(/\s+/g, ' ').trim();
	return geputzt === '' ? undefined : geputzt;
};

const pflicht = (roh, schluessel) => {
	const wert = feld(roh, schluessel);
	if (wert === undefined) throw new Error(`Feld ${schluessel} fehlt`);
	return wert;
};

/** Trennt an Kommas außerhalb von Klammern: „Boron (Tod), Phex (Schatten)". */
const splitVerbreitung = text =>
	text.split(/,\s*(?![^()]*\))/).map(teil => teil.trim()).filter(Boolean);

/** Bildet einen Rohdatensatz auf einen Katalogeintrag ab. Wirft bei allem Unlesbaren. */
export const toCatalogEntry = roh => {
	const klasse = pflicht(roh, 'Klasse');
	if (!KLASSEN.includes(klasse)) throw new Error(`Unbekannte Klasse: ${klasse}`);
	const karmal = KARMA_KLASSEN.includes(klasse);

	const name = pruefeText(pflicht(roh, 'Name'), 'name');
	const eintrag = { id: slugify(name), klasse, name };

	if (klasse !== 'segen') {
		const { attributes, probeNote } = parseProbe(pflicht(roh, 'Probe'));
		eintrag.attributes = attributes;
		if (probeNote !== undefined) eintrag.probeNote = pruefeText(probeNote, 'probeNote');
	}

	const costText = klasse === 'segen'
		? SEGEN_KOSTEN
		: pruefeText(pflicht(roh, karmal ? 'KaP-Kosten' : 'AsP-Kosten'), 'costText');
	eintrag.cost = parseCost(costText, karmal ? LITURGY_COST_MAX : SPELL_COST_MAX);
	eintrag.costText = costText;

	const dauerFeld = DAUER_FELD[klasse];
	const castTime = klasse === 'hexenfluch'
		? HEXENFLUCH_DAUER
		: klasse === 'segen' ? SEGEN_DAUER : feld(roh, dauerFeld);
	if (castTime !== undefined) {
		eintrag.castTime = pruefeText(normalisiereCastTime(castTime), 'castTime');
	}

	const range = feld(roh, 'Reichweite');
	if (range !== undefined) eintrag.range = pruefeText(range, 'range');

	eintrag.duration = pruefeText(normalisiereDuration(pflicht(roh, 'Wirkungsdauer')), 'duration');

	const target = feld(roh, 'Zielkategorie');
	if (target !== undefined) eintrag.target = pruefeText(target, 'target');

	if (karmal) {
		// Fehlt die Verbreitung, bleibt sie leer: erst nach `applyKorrektur` wird geprüft,
		// damit eine Korrektur sie nachtragen kann.
		const verbreitung = klasse === 'segen' ? 'Allgemein' : feld(roh, 'Verbreitung');
		eintrag.verbreitung = verbreitung === undefined
			? []
			: splitVerbreitung(verbreitung).map(teil =>
				pruefeText(normalisiereVerbreitung(teil), 'verbreitung'));
	} else {
		const merkmal = pruefeText(pflicht(roh, 'Merkmal'), 'merkmal');
		if (!MERKMALE.includes(merkmal)) throw new Error(`Unbekanntes Merkmal: ${merkmal}`);
		eintrag.merkmal = merkmal;

		const verbreitung = feld(roh, 'Verbreitung');
		if (verbreitung !== undefined) {
			eintrag.verbreitung = splitVerbreitung(verbreitung).map(teil => pruefeText(teil, 'merkmal'));
		}
	}

	return eintrag;
};

/** Reihenfolge der Felder in den erzeugten Dateien – hält die Diffs ruhig. */
const FELD_REIHENFOLGE = [
	'id',
	'klasse',
	'name',
	'attributes',
	'probeNote',
	'cost',
	'costText',
	'castTime',
	'range',
	'duration',
	'target',
	'merkmal',
	'verbreitung'
];

const alsLiteral = wert => {
	if (wert === null) return 'null';
	if (typeof wert === 'number') return String(wert);
	if (Array.isArray(wert)) return `[${wert.map(alsLiteral).join(', ')}]`;

	// Umweg über JSON.stringify, damit Steuer- und Sonderzeichen korrekt maskiert sind;
	// danach auf die einfachen Anführungszeichen des Projektstils umgestellt.
	const kern = JSON.stringify(wert)
		.slice(1, -1)
		.replace(/\\"/g, '"')
		.replace(/'/g, "\\'");
	return `'${kern}'`;
};

const alsEintrag = eintrag => {
	const zeilen = FELD_REIHENFOLGE.filter(name => eintrag[name] !== undefined).map(
		name => `\t\t${name}: ${alsLiteral(eintrag[name])}`
	);
	return `\t{\n${zeilen.join(',\n')}\n\t}`;
};

/** Erzeugt den Quelltext einer Katalogdatei. */
export const renderModule = (exportName, eintraege, typeName = 'SpellCatalogEntry') =>
	`import type { ${typeName} } from './types';\n\n` +
	`export const ${exportName}: ${typeName}[] = [\n` +
	`${eintraege.map(alsEintrag).join(',\n')}\n];\n`;

/**
 * Wendet die von Hand belegten Korrekturen an. Jede braucht eine Begründung, damit
 * beim nächsten Import nachvollziehbar bleibt, warum ein Wert von der Quelle abweicht.
 */
export const applyKorrektur = (eintrag, korrekturen) => {
	const korrektur = Object.hasOwn(korrekturen, eintrag.id) ? korrekturen[eintrag.id] : undefined;
	if (korrektur === undefined) return eintrag;

	if (typeof korrektur.grund !== 'string' || korrektur.grund.trim() === '') {
		throw new Error(`Korrektur für ${eintrag.id} ohne grund`);
	}

	const korrigiert = { ...eintrag };
	for (const [feldName, wert] of Object.entries(korrektur.felder)) {
		if (!FELD_REIHENFOLGE.includes(feldName)) {
			throw new Error(`Korrektur für ${eintrag.id} nennt unbekanntes Feld ${feldName}`);
		}
		korrigiert[feldName] = wert;
	}
	return korrigiert;
};

/**
 * Die Quelle schreibt „2 Aktion(en)", der gepflegte Katalog „2 Aktionen". Vereinheitlicht
 * auf die ausgeschriebene Form, damit die Tabelle im Zauberbuch einheitlich liest.
 */
export const normalisiereCastTime = castTime =>
	castTime.replace(/(\d+) Aktion\(en\)/, (_, anzahl) =>
		anzahl === '1' ? '1 Aktion' : `${anzahl} Aktionen`
	);

/**
 * In sechs Wirkungsdauern der Quelle steht „OS" statt „QS" (Qualitätsstufe). „OS" ist
 * kein Begriff des Regelwerks – ohne diese Korrektur stünde am Spieltisch Unsinn.
 */
export const normalisiereDuration = duration => duration.replace(/\bOS\b/g, 'QS');

/**
 * Die Quelle führt die Tahayaschamanen unter ihrem früheren Namen „Mohaschamanen". Der
 * Name steht im Traditionsfilter des Liturgienbuchs, muss also der aktuellen Fassung
 * des Regelwerks folgen.
 */
export const normalisiereVerbreitung = paar => paar.replace(/^Mohaschamanen\b/, 'Tahayaschamanen');
