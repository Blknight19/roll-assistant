import JSON5 from 'json5';
import { describe, expect, it } from 'vitest';
import {
	applyKorrektur,
	normalisiereCastTime,
	normalisiereDuration,
	normalisiereVerbreitung,
	parseCost,
	parseProbe,
	renderModule,
	slugify,
	toCatalogEntry
} from './parse.mjs';

describe('slugify', () => {
	it('macht aus einem einfachen Namen einen Kleinbuchstaben-Slug', () => {
		expect(slugify('Adlerschwinge')).toBe('adlerschwinge');
	});

	it('verbindet mehrere Wörter mit Bindestrich', () => {
		expect(slugify('Analys Arkanstruktur')).toBe('analys-arkanstruktur');
	});

	it('schreibt Umlaute und ß aus', () => {
		expect(slugify('Große Gier')).toBe('grosse-gier');
		expect(slugify('Öffnendes Auge')).toBe('oeffnendes-auge');
	});

	it('wirft Satzzeichen weg, ohne doppelte Bindestriche zu hinterlassen', () => {
		expect(slugify('Beiss auf Granit !')).toBe('beiss-auf-granit');
		expect(slugify("Blitz' dich  find")).toBe('blitz-dich-find');
	});

	it('lehnt Namen ab, aus denen kein Slug entsteht', () => {
		expect(() => slugify('!!!')).toThrow();
	});
});

describe('parseProbe', () => {
	it('liest die drei Eigenschaften einer schlichten Probe', () => {
		expect(parseProbe('MU/KL/CH')).toEqual({ attributes: ['MU', 'KL', 'CH'] });
	});

	it('trennt den Klammerzusatz als probeNote ab', () => {
		expect(parseProbe('KL/IN/FF (modifiziert durch ZK)')).toEqual({
			attributes: ['KL', 'IN', 'FF'],
			probeNote: 'modifiziert durch ZK'
		});
	});

	it('behält Schrägstriche innerhalb des Zusatzes', () => {
		expect(parseProbe('MU/IN/CH (modifiziert durch SK/2)').probeNote).toBe(
			'modifiziert durch SK/2'
		);
	});

	it('verkraftet den Zeilenumbruch-Whitespace der Quelle', () => {
		expect(parseProbe('  MU/CH/KO   (modifiziert durch SK)  ')).toEqual({
			attributes: ['MU', 'CH', 'KO'],
			probeNote: 'modifiziert durch SK'
		});
	});

	it('lehnt eine unbekannte Eigenschaft ab', () => {
		expect(() => parseProbe('XX/KL/CH')).toThrow();
	});

	it('lehnt eine Probe ohne erkennbares Eigenschaftstrio ab', () => {
		expect(() => parseProbe('nach Ermessen der Spielleitung')).toThrow();
	});
});

describe('parseCost', () => {
	it('liest eine schlichte Kostenangabe als Zahl', () => {
		expect(parseCost('8 AsP')).toBe(8);
	});

	it('liest die Zahl auch ohne Einheit', () => {
		expect(parseCost('8 (Kosten sind nicht modifizierbar)')).toBe(8);
	});

	it('lässt einen Klammerzusatz ohne eigene Kosten stehen', () => {
		expect(parseCost('16 AsP (Kosten sind nicht modifizierbar)')).toBe(16);
	});

	it('gibt null zurück, wenn die Kosten eine Formel sind', () => {
		expect(parseCost('8 AsP (Aktivierung des Zaubers) + 4 AsP pro Stunde')).toBeNull();
		expect(parseCost('8 AsP für die erste Person + 4 AsP für jede weitere')).toBeNull();
		expect(parseCost('3 AsP pro Zuhörer')).toBeNull();
	});

	it('gibt null zurück, wenn die Quelle zwei Beträge nennt', () => {
		expect(parseCost('8 AsP bzw. 16 AsP für Zauber mit Zielkategorie Zone')).toBeNull();
	});

	it('gibt null zurück, wenn der Betrag nur eine Untergrenze ist', () => {
		expect(parseCost('mindestens 4 AsP (Kosten sind nicht modifizierbar)')).toBeNull();
	});

	it('gibt null zurück, wenn gar keine Kosten angegeben sind', () => {
		expect(parseCost(undefined)).toBeNull();
		expect(parseCost('')).toBeNull();
	});

	it('lehnt einen Betrag jenseits der Zauberbuchgrenze ab', () => {
		expect(() => parseCost('500 AsP')).toThrow();
	});
});

const IGNIFAXIUS = {
	Klasse: 'zauber',
	Name: 'Ignifaxius',
	Probe: 'MU/KL/CH',
	Zauberdauer: '2 Aktion(en)',
	'AsP-Kosten': '8 (Kosten sind nicht modifizierbar)',
	Reichweite: '16 Schritt',
	Wirkungsdauer: 'sofort',
	Zielkategorie: 'Alle',
	Merkmal: 'Elementar',
	Verbreitung: 'Druiden, Geoden, Gildenmagier',
	Wirkung: 'Langer urheberrechtlich geschützter Fließtext.',
	'Publikation(en)': 'Regelwerk, Seite 293'
};

describe('toCatalogEntry', () => {
	it('bildet einen Zauber auf das Katalogschema ab', () => {
		expect(toCatalogEntry(IGNIFAXIUS)).toEqual({
			id: 'ignifaxius',
			klasse: 'zauber',
			name: 'Ignifaxius',
			attributes: ['MU', 'KL', 'CH'],
			cost: 8,
			costText: '8 (Kosten sind nicht modifizierbar)',
			castTime: '2 Aktionen',
			range: '16 Schritt',
			duration: 'sofort',
			target: 'Alle',
			merkmal: 'Elementar',
			verbreitung: ['Druiden', 'Geoden', 'Gildenmagier']
		});
	});

	it('übernimmt den Regeltext der Quelle nicht', () => {
		const eintrag = toCatalogEntry(IGNIFAXIUS);
		expect(Object.keys(eintrag)).not.toContain('Wirkung');
		expect(JSON.stringify(eintrag)).not.toContain('Fließtext');
	});

	it('gibt jedem Hexenfluch die Zauberdauer aus der Regel', () => {
		const eintrag = toCatalogEntry({
			Klasse: 'hexenfluch',
			Name: 'Beute!',
			Probe: 'KL/IN/CH',
			'AsP-Kosten': '14 AsP',
			Wirkungsdauer: 'QS x 3 in Tagen',
			Merkmal: 'Einfluss'
		});
		expect(eintrag.castTime).toBe('mindestens 1 Aktion');
	});

	it('lässt die Felder weg, die einem Hexenfluch fehlen', () => {
		const eintrag = toCatalogEntry({
			Klasse: 'hexenfluch',
			Name: 'Beute!',
			Probe: 'KL/IN/CH (modifiziert durch SK)',
			'AsP-Kosten': '14 AsP',
			Wirkungsdauer: 'QS x 3 in Tagen',
			Merkmal: 'Einfluss'
		});
		expect(eintrag).toEqual({
			id: 'beute',
			klasse: 'hexenfluch',
			name: 'Beute!',
			attributes: ['KL', 'IN', 'CH'],
			probeNote: 'modifiziert durch SK',
			cost: 14,
			costText: '14 AsP',
			castTime: 'mindestens 1 Aktion',
			duration: 'QS x 3 in Tagen',
			merkmal: 'Einfluss'
		});
	});

	it('lehnt einen Eintrag ohne Wirkungsdauer ab', () => {
		expect(() => toCatalogEntry({ ...IGNIFAXIUS, Wirkungsdauer: undefined })).toThrow(
			/Wirkungsdauer/
		);
	});

	it('lehnt ein unbekanntes Merkmal ab', () => {
		expect(() => toCatalogEntry({ ...IGNIFAXIUS, Merkmal: 'Nekromantie' })).toThrow(/Merkmal/);
	});

	it('lehnt eine unbekannte Klasse ab', () => {
		expect(() => toCatalogEntry({ ...IGNIFAXIUS, Klasse: 'zaubertrick' })).toThrow(/Klasse/);
	});

	const BEL = String.fromCodePoint(0x0007);
	const BIDI_UMKEHR = String.fromCodePoint(0x202e);

	it('lehnt Steuerzeichen in einem Textfeld ab', () => {
		expect(() => toCatalogEntry({ ...IGNIFAXIUS, Reichweite: `16 Schritt${BEL}` })).toThrow(
			/Steuerzeichen/
		);
	});

	it('lehnt Bidi-Steuerzeichen ab, mit denen sich Text tarnen lässt', () => {
		expect(() => toCatalogEntry({ ...IGNIFAXIUS, Name: `Ignifaxius${BIDI_UMKEHR}` })).toThrow(
			/Steuerzeichen/
		);
	});

	it('lehnt ein überlanges Textfeld ab', () => {
		expect(() => toCatalogEntry({ ...IGNIFAXIUS, Name: 'A'.repeat(200) })).toThrow(/zu lang/);
	});

	it('verwendet geerbte Eigenschaften nicht als Feldwerte', () => {
		const praepariert = Object.create({ Merkmal: 'Elementar' });
		Object.assign(praepariert, { ...IGNIFAXIUS, Merkmal: undefined });
		expect(() => toCatalogEntry(praepariert)).toThrow(/Merkmal/);
	});
});

describe('renderModule', () => {
	it('schreibt Sonderzeichen so, dass sie Zeichenketten nicht verlassen', () => {
		const eintrag = {
			id: 'boeser-name',
			klasse: 'zauber',
			name: "Bose' ` \\ \" }; import('node:fs') //",
			attributes: ['MU', 'KL', 'CH'],
			cost: 8,
			costText: '8 AsP',
			duration: 'sofort',
			merkmal: 'Elementar'
		};
		const quelltext = renderModule('TEST_SPELLS', [eintrag]);
		const literal = quelltext.slice(quelltext.indexOf('= [') + 2, quelltext.lastIndexOf(']') + 1);
		expect(JSON5.parse(literal)).toEqual([eintrag]);
	});
});

describe('applyKorrektur', () => {
	const EINTRAG = {
		id: 'corpofesso',
		klasse: 'zauber',
		name: 'Corpofesso',
		attributes: ['MU', 'KL', 'CH'],
		cost: 16,
		costText: '16 AsP',
		duration: 'OS x 2 in Kampfrunden',
		merkmal: 'Verwandlung'
	};

	it('lässt einen Eintrag ohne Korrektur unverändert', () => {
		expect(applyKorrektur(EINTRAG, {})).toEqual(EINTRAG);
	});

	it('überschreibt genau die genannten Felder', () => {
		const korrigiert = applyKorrektur(EINTRAG, {
			corpofesso: { grund: 'Regelwerk S. 289', felder: { cost: 8, costText: '8 AsP' } }
		});
		expect(korrigiert.cost).toBe(8);
		expect(korrigiert.costText).toBe('8 AsP');
		expect(korrigiert.duration).toBe('OS x 2 in Kampfrunden');
	});

	it('lehnt eine Korrektur für ein unbekanntes Feld ab', () => {
		expect(() =>
			applyKorrektur(EINTRAG, { corpofesso: { grund: 'x', felder: { schaden: '2W6' } } })
		).toThrow(/schaden/);
	});

	it('lehnt eine Korrektur ohne Begründung ab', () => {
		expect(() => applyKorrektur(EINTRAG, { corpofesso: { felder: { cost: 8 } } })).toThrow(
			/grund/i
		);
	});
});

describe('normalisiere', () => {
	it('schreibt die Klammerform der Zauberdauer aus', () => {
		expect(normalisiereCastTime('1 Aktion(en)')).toBe('1 Aktion');
		expect(normalisiereCastTime('8 Aktion(en)')).toBe('8 Aktionen');
	});

	it('lässt Zusätze hinter der Zauberdauer stehen', () => {
		expect(normalisiereCastTime('2 Aktion(en) (nicht modifizierbar)')).toBe(
			'2 Aktionen (nicht modifizierbar)'
		);
	});

	it('lässt eine Zauberdauer ohne Klammerform unberührt', () => {
		expect(normalisiereCastTime('16 Kampfrunden')).toBe('16 Kampfrunden');
	});

	it('ersetzt das verlesene OS durch QS', () => {
		expect(normalisiereDuration('OS in Kampfrunden')).toBe('QS in Kampfrunden');
		expect(normalisiereDuration('OS x 2 in Kampfrunden')).toBe('QS x 2 in Kampfrunden');
	});

	it('rührt ein OS innerhalb eines Wortes nicht an', () => {
		expect(normalisiereDuration('KOSTEN')).toBe('KOSTEN');
	});
});

describe('parseCost mit KaP', () => {
	it('liest KaP wie AsP', () => {
		expect(parseCost('16 KaP')).toBe(16);
		expect(parseCost('8 KaP (Kosten sind nicht modifizierbar)')).toBe(8);
	});

	it('gibt null für Aktivierung plus Intervall zurück', () => {
		expect(parseCost('4 KaP (Aktivierung der Liturgie) + 2 KaP pro Minute')).toBeNull();
	});

	it('gibt null für teils permanente Kosten zurück', () => {
		expect(parseCost('16 KaP, davon 2 permanent (Kosten sind nicht modifizierbar)')).toBeNull();
	});

	it('akzeptiert Zeremonienkosten bis 256', () => {
		expect(parseCost('256 KaP', 256)).toBe(256);
		expect(() => parseCost('256 KaP')).toThrow();
	});
});

const WAHRHEIT = {
	Klasse: 'liturgie',
	Name: 'Wahrheit',
	Probe: 'MU/KL/IN (modifiziert durch SK)',
	Liturgiedauer: '8 Aktion(en)',
	'KaP-Kosten': '16 KaP',
	Reichweite: 'Berührung',
	Wirkungsdauer: 'QS x 3 in Minuten',
	Zielkategorie: 'Kulturschaffende',
	Verbreitung: 'Gjalskerschamanen (Gemeinschaft), Nandus (Erkenntnis), Praios (Ordnung)',
	Steigerungsfaktor: 'C',
	Wirkung: 'Langer urheberrechtlich geschützter Fließtext.',
	'Publikation(en)': 'Regelwerk, Seite 331'
};

const SPEISESEGEN = {
	Klasse: 'segen',
	Name: 'Speisesegen',
	Wirkung: 'Langer urheberrechtlich geschützter Fließtext.',
	Reichweite: 'Berührung',
	Wirkungsdauer: 'sofort',
	Zielkategorie: 'Objekte',
	Aspekt: 'Allgemein',
	'Publikation(en)': 'Regelwerk, Seite 323'
};

describe('toCatalogEntry für karmale Klassen', () => {
	it('bildet eine Liturgie mit Verbreitungspaaren ab', () => {
		expect(toCatalogEntry(WAHRHEIT)).toEqual({
			id: 'wahrheit',
			klasse: 'liturgie',
			name: 'Wahrheit',
			attributes: ['MU', 'KL', 'IN'],
			probeNote: 'modifiziert durch SK',
			cost: 16,
			costText: '16 KaP',
			castTime: '8 Aktionen',
			range: 'Berührung',
			duration: 'QS x 3 in Minuten',
			target: 'Kulturschaffende',
			verbreitung: ['Gjalskerschamanen (Gemeinschaft)', 'Nandus (Erkenntnis)', 'Praios (Ordnung)']
		});
	});

	it('gibt einem Segen die Regelwerte statt fehlender Felder', () => {
		expect(toCatalogEntry(SPEISESEGEN)).toEqual({
			id: 'speisesegen',
			klasse: 'segen',
			name: 'Speisesegen',
			cost: 1,
			costText: '1 KaP',
			castTime: '1 Aktion',
			range: 'Berührung',
			duration: 'sofort',
			target: 'Objekte',
			verbreitung: ['Allgemein']
		});
	});

	it('liest die Zeremoniedauer als castTime', () => {
		const roh = { ...WAHRHEIT, Klasse: 'zeremonie', Zeremoniedauer: '30 Minuten' };
		delete roh.Liturgiedauer;
		const eintrag = toCatalogEntry(roh);
		expect(eintrag.klasse).toBe('zeremonie');
		expect(eintrag.castTime).toBe('30 Minuten');
	});

	it('lehnt Kosten in AsP bei karmalen Klassen nicht ab – das regelt die Korrektur', () => {
		expect(toCatalogEntry({ ...WAHRHEIT, 'KaP-Kosten': '8 AsP' }).costText).toBe('8 AsP');
	});
});

describe('renderModule mit eigenem Typ', () => {
	it('importiert den angegebenen Typnamen', () => {
		const code = renderModule('SEGEN', [toCatalogEntry(SPEISESEGEN)], 'LiturgyCatalogEntry');
		expect(code.startsWith("import type { LiturgyCatalogEntry } from './types';")).toBe(true);
		expect(code).toContain('export const SEGEN: LiturgyCatalogEntry[] = [');
	});
});

describe('normalisiereVerbreitung', () => {
	it('schreibt die Mohaschamanen der Quelle auf Tahayaschamanen um', () => {
		expect(normalisiereVerbreitung('Mohaschamanen (Sonne)')).toBe('Tahayaschamanen (Sonne)');
	});

	it('rührt andere Traditionen nicht an', () => {
		expect(normalisiereVerbreitung('Praios (Ordnung)')).toBe('Praios (Ordnung)');
		expect(normalisiereVerbreitung('Allgemein')).toBe('Allgemein');
	});
});
