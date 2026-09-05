import { describe, expect, it } from 'vitest';
import {
	HISTORY_RESULT_MAX,
	PERSISTED_VERSION,
	migratePersisted,
	sanitizeHistory,
	sanitizeKarma,
	sanitizeSpellbook,
	toPersisted
} from './persistence';
import { initialKarmaState } from './karmaSlice';
import { initialTalentState } from './talentsSlice';
import { initialSettingsState } from './settingsSlice';
import { HISTORY_LIMIT, type RollHistoryEntry } from './rollSlice';
import {
	SPELL_COST_TEXT_MAX,
	SPELL_CAST_TIME_MAX,
	SPELL_DURATION_MAX,
	SPELL_NAME_MAX,
	SPELL_NOTE_MAX,
	SPELL_PROBE_NOTE_MAX,
	initialSpellbookState
} from './spellbookSlice';

const historyEntry = (id: string): RollHistoryEntry => ({
	id,
	type: 'Talent',
	values: [4, 8, 15],
	result: 'Ergebnis: 3 (QS: 1)',
	date: '2026-07-05T12:00:00.000Z'
});

describe('migratePersisted', () => {
	it('verwirft Nicht-Objekte', () => {
		expect(migratePersisted(null)).toBeUndefined();
		expect(migratePersisted('kaputt')).toBeUndefined();
		expect(migratePersisted(42)).toBeUndefined();
	});

	it('migriert einen Legacy-Blob (Slice-Dump ohne version)', () => {
		const legacy = {
			roll: { history: [historyEntry('a')] },
			talents: { talents: [{ id: '3', name: 'Klettern', attribute1: 'MU', attribute2: 'GE', attribute3: 'KK', value: 7 }] },
			attributes: { MU: 13, KL: 11 },
			combat: { attack: 12, life: { current: 20, max: 30 } }
		};

		const state = migratePersisted(legacy);
		expect(state).toBeDefined();
		expect(state!.attributes.MU).toBe(13);
		expect(state!.attributes.KL).toBe(11);
		expect(state!.attributes.KK).toBe(8); // fehlt im Blob -> Default
		expect(state!.talents.talents.find(t => t.id === '3')!.value).toBe(7);
		expect(state!.combat.attack).toBe(12);
		expect(state!.combat.life).toEqual({ current: 20, max: 30 });
		expect(state!.roll.history).toHaveLength(1);
		expect(state!.settings).toEqual(initialSettingsState);
	});

	it('Talente aus dem Code überleben, die im Blob fehlen', () => {
		const state = migratePersisted({ version: 2, talents: [{ id: '1', value: 5 }] });
		expect(state!.talents.talents).toHaveLength(initialTalentState.talents.length);
		expect(state!.talents.talents.find(t => t.id === '1')!.value).toBe(5);
		expect(state!.talents.talents.find(t => t.id === '59')!.value).toBe(0);
	});

	it('verwirft unbekannte Talent-ids und korrupte Werte', () => {
		const state = migratePersisted({
			version: 2,
			talents: [
				{ id: 'gibtsnicht', value: 9 },
				{ id: '2', value: 'zwölf' },
				{ id: '4', value: 4 }
			]
		});
		expect(state!.talents.talents).toHaveLength(initialTalentState.talents.length);
		expect(state!.talents.talents.find(t => t.id === '2')!.value).toBe(0);
		expect(state!.talents.talents.find(t => t.id === '4')!.value).toBe(4);
	});

	it('fällt bei korrupten Werten feldweise auf Defaults zurück', () => {
		const state = migratePersisted({
			version: 2,
			attributes: { MU: 'vierzehn', KL: 12 },
			combat: { attack: 'kaputt', dodge: 9, life: { current: 'x', max: 24 } },
			history: 'keine Liste',
			settings: { confirmCriticals: 'ja' }
		});
		expect(state!.attributes.MU).toBe(8);
		expect(state!.attributes.KL).toBe(12);
		expect(state!.combat.attack).toBe(8);
		expect(state!.combat.dodge).toBe(9);
		expect(state!.combat.life).toEqual({ current: 8, max: 24 });
		expect(state!.roll.history).toEqual([]);
		expect(state!.settings.confirmCriticals).toBe(true);
	});

	it('übernimmt persistierte Settings', () => {
		const state = migratePersisted({ version: 2, settings: { confirmCriticals: false } });
		expect(state!.settings.confirmCriticals).toBe(false);
	});
});

describe('Wertgrenzen beim Laden', () => {
	// Die Persistenz setzt preloadedState und umgeht damit die Reducer – sie muss
	// dieselben Grenzen selbst durchsetzen.
	it('repariert ein LeP-Maximum von 0, statt den Balken durch null teilen zu lassen', () => {
		const state = migratePersisted({ version: 2, combat: { life: { current: 5, max: 0 } } });
		expect(state!.combat.life.max).toBeGreaterThanOrEqual(1);
		expect(Number.isFinite(state!.combat.life.current / state!.combat.life.max)).toBe(true);
	});

	it('zieht einen aktuellen LeP-Wert über dem Maximum herunter', () => {
		const state = migratePersisted({ version: 2, combat: { life: { current: 99, max: 30 } } });
		expect(state!.combat.life).toEqual({ current: 30, max: 30 });
	});

	it('übernimmt LeP über 20 unverändert', () => {
		const state = migratePersisted({ version: 2, combat: { life: { current: 27, max: 34 } } });
		expect(state!.combat.life).toEqual({ current: 27, max: 34 });
	});

	it('verwirft NaN und Infinity, die typeof-Prüfungen allein passieren', () => {
		const state = migratePersisted({
			version: 2,
			attributes: { MU: NaN, KL: Infinity },
			combat: { attack: NaN, life: { current: Infinity, max: NaN } },
			talents: [{ id: '1', value: NaN }]
		});
		expect(state!.attributes.MU).toBe(8);
		expect(state!.attributes.KL).toBe(8);
		expect(state!.combat.attack).toBe(8);
		expect(state!.talents.talents.find(t => t.id === '1')!.value).toBe(0);
		expect(Number.isFinite(state!.combat.life.current)).toBe(true);
		expect(Number.isFinite(state!.combat.life.max)).toBe(true);
	});

	it('begrenzt Eigenschaften und Talentwerte auf gültige Bereiche', () => {
		const state = migratePersisted({
			version: 2,
			attributes: { MU: 999, KL: -5 },
			talents: [{ id: '1', value: 999 }, { id: '2', value: -4 }]
		});
		expect(state!.attributes.MU).toBe(20);
		expect(state!.attributes.KL).toBe(1);
		expect(state!.talents.talents.find(t => t.id === '1')!.value).toBe(25);
		expect(state!.talents.talents.find(t => t.id === '2')!.value).toBe(0);
	});
});

describe('sanitizeSpellbook', () => {
	it('liefert ein leeres Buch für Unsinn', () => {
		expect(sanitizeSpellbook(null)).toEqual(initialSpellbookState);
		expect(sanitizeSpellbook('kaputt')).toEqual(initialSpellbookState);
	});

	it('nimmt isSpellcaster nur als echten Boolean', () => {
		expect(sanitizeSpellbook({ isSpellcaster: 'ja' }).isSpellcaster).toBe(false);
		expect(sanitizeSpellbook({ isSpellcaster: true }).isSpellcaster).toBe(true);
	});

	it('verwirft Zauber mit unbekannter Eigenschaft', () => {
		const book = sanitizeSpellbook({
			spells: [
				{ id: 'a', name: 'Gut', attributes: ['KL', 'IN', 'IN'], cost: 4, value: 8 },
				{ id: 'b', name: 'Böse', attributes: ['KL', 'XX', 'IN'], cost: 4, value: 8 }
			]
		});
		expect(book.spells.map(s => s.id)).toEqual(['a']);
	});

	it('kappt überlange Namen und clampt Werte', () => {
		const book = sanitizeSpellbook({
			spells: [{ id: 'a', name: 'x'.repeat(300), attributes: ['KL', 'IN', 'IN'], cost: 5000, value: 99 }]
		});
		expect(book.spells[0].name).toHaveLength(SPELL_NAME_MAX);
		expect(book.spells[0].cost).toBe(99);
		expect(book.spells[0].value).toBe(25);
	});

	it('übernimmt die Freitextfelder und kappt sie auf die Slice-Grenzen', () => {
		const book = sanitizeSpellbook({
			spells: [{
				id: 'a', name: 'Blitz', attributes: ['KL', 'IN', 'IN'], cost: 4, value: 8,
				costText: 'k'.repeat(200),
				probeNote: 'p'.repeat(200),
				duration: 'd'.repeat(200),
				note: 'n'.repeat(900)
			}]
		});
		expect(book.spells[0].costText).toHaveLength(SPELL_COST_TEXT_MAX);
		expect(book.spells[0].probeNote).toHaveLength(SPELL_PROBE_NOTE_MAX);
		expect(book.spells[0].duration).toHaveLength(SPELL_DURATION_MAX);
		expect(book.spells[0].note).toHaveLength(SPELL_NOTE_MAX);
	});

	it('trägt probeNote unverändert durch – der Hinweis auf ZK/SK überlebt den Export', () => {
		const book = sanitizeSpellbook({
			spells: [{
				id: 'a', name: 'Horriphobus', attributes: ['MU', 'CH', 'CH'], cost: 8, value: 8,
				probeNote: 'modifiziert durch SK'
			}]
		});
		expect(book.spells[0].probeNote).toBe('modifiziert durch SK');
	});

	it('verwirft nicht-textliche Freitextfelder, statt sie zu übernehmen', () => {
		const book = sanitizeSpellbook({
			spells: [{
				id: 'a', name: 'Blitz', attributes: ['KL', 'IN', 'IN'], cost: 4, value: 8,
				probeNote: { boese: true }, note: 42
			}]
		});
		expect(book.spells[0].probeNote).toBeUndefined();
		expect(book.spells[0].note).toBeUndefined();
	});

	it('deckelt die Zahl der Zauber', () => {
		const spells = Array.from({ length: 150 }, (_, i) => ({
			id: `z${i}`, name: `Z${i}`, attributes: ['KL', 'IN', 'IN'], cost: 1, value: 1
		}));
		expect(sanitizeSpellbook({ spells }).spells).toHaveLength(100);
	});

	it('clampt current am max', () => {
		expect(sanitizeSpellbook({ asp: { current: 99, max: 20 } }).asp).toEqual({ current: 20, max: 20 });
	});

	it('übernimmt eine gespeicherte AsP von 0/30 unverändert – kein automatisches Auffüllen beim Laden', () => {
		// 0/30 ist ein legitim leergezauberter Magier, nicht vom ursprünglichen
		// Ersteinrichtungsfehler unterscheidbar. Auto-Auffüllen beim Laden würde einem
		// tatsächlich erschöpften Magier bei jedem Neustart die Kraft zurückschenken.
		expect(sanitizeSpellbook({ asp: { current: 0, max: 30 } }).asp).toEqual({ current: 0, max: 30 });
	});

	it('übernimmt laufende Zauber nur mit gültiger QS', () => {
		const book = sanitizeSpellbook({
			upkeep: [
				{ id: 'u1', spellName: 'Odem', qs: 3 },
				{ id: 'u2', spellName: 'Kaputt', qs: 9 },
				{ id: 'u3', spellName: 'Kaputt', qs: 'drei' }
			]
		});
		expect(book.upkeep.map(e => e.id)).toEqual(['u1']);
	});

	it('deckelt die Zahl der laufenden Zauber wie das Zauberbuch', () => {
		const upkeep = Array.from({ length: 150 }, (_, i) => ({ id: `u${i}`, spellName: 'Odem', qs: 3 }));
		expect(sanitizeSpellbook({ upkeep }).upkeep).toHaveLength(100);
	});

	it('behält ein gefülltes Buch bei isSpellcaster false', () => {
		const book = sanitizeSpellbook({
			isSpellcaster: false,
			spells: [{ id: 'a', name: 'Gut', attributes: ['KL', 'IN', 'IN'], cost: 4, value: 8 }]
		});
		expect(book.isSpellcaster).toBe(false);
		expect(book.spells).toHaveLength(1);
	});
});

describe('Migration auf v4', () => {
	it('gibt einem v3-Blob ohne Zauberbuch ein leeres', () => {
		const state = migratePersisted({
			version: 3,
			activeCharacterId: 'held-1',
			characters: [{ id: 'held-1', name: 'Gerbald' }]
		});
		expect(state!.spellbook).toEqual(initialSpellbookState);
	});

	it('schreibt das Zauberbuch in den Charakter zurück', () => {
		const slices = migratePersisted({
			version: 4,
			activeCharacterId: 'held-1',
			characters: [{
				id: 'held-1',
				name: 'Gerbald',
				spellbook: { isSpellcaster: true, asp: { current: 12, max: 30 }, spells: [], upkeep: [] }
			}]
		})!;
		const persisted = toPersisted(slices);
		expect(persisted.version).toBe(PERSISTED_VERSION);
		expect(persisted.characters[0].spellbook.asp).toEqual({ current: 12, max: 30 });
	});
});

describe('sanitizeHistory mit Zauberwürfen', () => {
	it('behält Einträge vom Typ Zauber', () => {
		const entry = { ...historyEntry('z'), type: 'Zauber' as const };
		expect(sanitizeHistory([entry])).toHaveLength(1);
	});
});

describe('sanitizeHistory', () => {
	it('deckelt die History bei HISTORY_LIMIT', () => {
		const entries = Array.from({ length: HISTORY_LIMIT + 50 }, (_, i) => historyEntry(String(i)));
		expect(sanitizeHistory(entries)).toHaveLength(HISTORY_LIMIT);
	});

	it('filtert Einträge mit falschem Shape heraus', () => {
		const entries = [historyEntry('ok'), { id: 1, type: 'Talent' }, { ...historyEntry('badtype'), type: 'Quatsch' }];
		const clean = sanitizeHistory(entries);
		expect(clean).toHaveLength(1);
		expect(clean[0].id).toBe('ok');
	});
});

describe('toPersisted / Roundtrip', () => {
	it('schreibt die aktuelle Version und liest sie identisch zurück', () => {
		const slices = migratePersisted({ version: 2, attributes: { MU: 14 }, talents: [{ id: '5', value: 6 }] })!;
		slices.profile.name = 'Thorwal Grimm';

		const blob = toPersisted(slices);
		expect(blob.version).toBe(PERSISTED_VERSION);
		expect(blob.characters).toHaveLength(1);
		expect(blob.activeCharacterId).toBe(blob.characters[0].id);
		expect(blob.characters[0].talents).toContainEqual({ id: '5', value: 6 });

		const reloaded = migratePersisted(JSON.parse(JSON.stringify(blob)))!;
		expect(reloaded).toEqual(slices);
	});

	it('hebt einen v2-Blob in einen benannten Charakter-Eintrag', () => {
		const slices = migratePersisted({
			version: 2,
			attributes: { MU: 14 },
			combat: { life: { current: 20, max: 30 } }
		})!;
		expect(slices.profile.name).toBe('');
		expect(slices.attributes.MU).toBe(14);
		expect(slices.combat.life).toEqual({ current: 20, max: 30 });
	});

	it('wählt bei mehreren Charakteren den aktiven aus', () => {
		const state = migratePersisted({
			version: 3,
			activeCharacterId: 'b',
			characters: [
				{ id: 'a', name: 'Alrik', attributes: { MU: 9 }, talents: [], combat: {} },
				{ id: 'b', name: 'Boron', attributes: { MU: 17 }, talents: [], combat: {} }
			]
		})!;
		expect(state.profile).toEqual({ id: 'b', name: 'Boron' });
		expect(state.attributes.MU).toBe(17);
	});

	it('fällt auf den ersten Charakter zurück, wenn die aktive id unbekannt ist', () => {
		const state = migratePersisted({
			version: 3,
			activeCharacterId: 'weg',
			characters: [{ id: 'a', name: 'Alrik', attributes: { MU: 9 }, talents: [], combat: {} }]
		})!;
		expect(state.profile.name).toBe('Alrik');
	});
});

describe('Längengrenzen der Kennungen und Restfelder', () => {
	it('verwirft einen Zauber mit überlanger id', () => {
		const book = sanitizeSpellbook({
			spells: [{ id: 'a'.repeat(500), name: 'Blitz', attributes: ['KL', 'IN', 'IN'], cost: 4, value: 8 }]
		});
		expect(book.spells).toHaveLength(0);
	});

	it('verwirft eine überlange catalogId, behält aber den Zauber', () => {
		const book = sanitizeSpellbook({
			spells: [{
				id: 'a', name: 'Blitz', attributes: ['KL', 'IN', 'IN'], cost: 4, value: 8,
				catalogId: 'c'.repeat(500)
			}]
		});
		expect(book.spells).toHaveLength(1);
		expect(book.spells[0].catalogId).toBeUndefined();
	});

	it('kappt den Zaubernamen eines laufenden Zaubers', () => {
		const book = sanitizeSpellbook({
			upkeep: [{ id: 'u', spellName: 's'.repeat(300), qs: 3 }]
		});
		expect(book.upkeep[0].spellName).toHaveLength(SPELL_NAME_MAX);
	});

	it('verwirft einen laufenden Zauber mit überlanger id', () => {
		const book = sanitizeSpellbook({
			upkeep: [{ id: 'u'.repeat(500), spellName: 'Blitz', qs: 3 }]
		});
		expect(book.upkeep).toHaveLength(0);
	});

	it('kappt einen überlangen Ergebnistext der Historie', () => {
		const history = sanitizeHistory([
			{ id: 'h', type: 'Talent', values: [1, 2, 3], result: 'r'.repeat(5000), date: '2026-08-19' }
		]);
		expect(history[0].result).toHaveLength(HISTORY_RESULT_MAX);
	});

	it('verwirft einen Historieneintrag mit überlanger id', () => {
		const history = sanitizeHistory([
			{ id: 'h'.repeat(500), type: 'Talent', values: [1, 2, 3], result: 'ok', date: '2026-08-19' }
		]);
		expect(history).toHaveLength(0);
	});

	it('begrenzt die Anzahl der Würfelwerte eines Historieneintrags', () => {
		const history = sanitizeHistory([
			{ id: 'h', type: 'Talent', values: Array(5000).fill(1), result: 'ok', date: '2026-08-19' }
		]);
		expect(history).toHaveLength(0);
	});

	it('verwirft NaN und Infinity unter den Würfelwerten', () => {
		const history = sanitizeHistory([
			{ id: 'h', type: 'Talent', values: [1, NaN, 3], result: 'ok', date: '2026-08-19' }
		]);
		expect(history).toHaveLength(0);
	});

	it('verwirft einen Historieneintrag mit überlangem Datum', () => {
		const history = sanitizeHistory([
			{ id: 'h', type: 'Talent', values: [1, 2, 3], result: 'ok', date: 'd'.repeat(500) }
		]);
		expect(history).toHaveLength(0);
	});
});

describe('Zauberdauer im Zauberbuch', () => {
	it('trägt eine mitgelieferte Zauberdauer durch den Import', () => {
		const book = sanitizeSpellbook({
			spells: [{
				id: 'a', name: 'Ignifaxius', attributes: ['MU', 'KL', 'CH'], cost: 8, value: 8,
				castTime: '2 Aktionen'
			}]
		});
		expect(book.spells[0].castTime).toBe('2 Aktionen');
	});

	it('kappt eine überlange Zauberdauer aus einer fremden Datei', () => {
		const book = sanitizeSpellbook({
			spells: [{
				id: 'a', name: 'Ignifaxius', attributes: ['MU', 'KL', 'CH'], cost: 8, value: 8,
				castTime: 'z'.repeat(300)
			}]
		});
		expect(book.spells[0].castTime).toHaveLength(SPELL_CAST_TIME_MAX);
	});

	it('füllt die Zauberdauer eines übernommenen Zaubers aus dem Katalog nach', () => {
		const state = migratePersisted({
			version: 4,
			characters: [{
				spellbook: {
					isSpellcaster: true,
					spells: [{
						id: 'a', catalogId: 'ignifaxius', name: 'Ignifaxius',
						attributes: ['MU', 'KL', 'CH'], cost: 8, value: 8
					}]
				}
			}]
		});
		expect(state!.spellbook.spells[0].castTime).toBe('2 Aktionen');
	});

	it('überschreibt eine vorhandene Zauberdauer beim Nachfüllen nicht', () => {
		const state = migratePersisted({
			version: 4,
			characters: [{
				spellbook: {
					isSpellcaster: true,
					spells: [{
						id: 'a', catalogId: 'ignifaxius', name: 'Ignifaxius',
						attributes: ['MU', 'KL', 'CH'], cost: 8, value: 8, castTime: 'von Hand'
					}]
				}
			}]
		});
		expect(state!.spellbook.spells[0].castTime).toBe('von Hand');
	});

	it('lässt einen selbst angelegten Zauber ohne catalogId in Ruhe', () => {
		const state = migratePersisted({
			version: 4,
			characters: [{
				spellbook: {
					isSpellcaster: true,
					spells: [{ id: 'a', name: 'Eigenbau', attributes: ['KL', 'KL', 'IN'], cost: 4, value: 0 }]
				}
			}]
		});
		expect(state!.spellbook.spells[0].castTime).toBeUndefined();
	});
});

describe('sanitizeKarma', () => {
	it('liefert ein leeres Buch, wenn das Feld fehlt (Migration v4 auf v5)', () => {
		const state = migratePersisted({
			version: 4,
			activeCharacterId: 'held-1',
			characters: [{ id: 'held-1', name: 'A' }]
		});
		expect(state!.karma).toEqual(initialKarmaState);
	});

	it('übernimmt isBlessed nur als echten Boolean', () => {
		expect(sanitizeKarma({ isBlessed: 'ja' }).isBlessed).toBe(false);
		expect(sanitizeKarma({ isBlessed: true }).isBlessed).toBe(true);
	});

	it('verwirft Einträge mit unbekannter Eigenschaft oder Gattung', () => {
		const karma = sanitizeKarma({
			liturgies: [
				{ id: 'a', klasse: 'liturgie', name: 'Ok', attributes: ['MU', 'KL', 'IN'], cost: 8, value: 4 },
				{ id: 'b', klasse: 'liturgie', name: 'Kaputt', attributes: ['MU', 'XX', 'IN'], cost: 8, value: 4 },
				{ id: 'c', klasse: 'segen', name: 'Falsche Gattung', attributes: ['MU', 'KL', 'IN'], cost: 1, value: 0 }
			]
		});
		expect(karma.liturgies.map(l => l.id)).toEqual(['a']);
	});

	it('lässt Zeremonien mit 256 KaP durch und kappt darüber', () => {
		const karma = sanitizeKarma({
			liturgies: [
				{ id: 'a', klasse: 'zeremonie', name: 'Teuer', attributes: ['MU', 'KL', 'IN'], cost: 256, value: 4 },
				{ id: 'b', klasse: 'zeremonie', name: 'Zu teuer', attributes: ['MU', 'KL', 'IN'], cost: 999, value: 4 }
			]
		});
		expect(karma.liturgies.map(l => l.cost)).toEqual([256, 256]);
	});

	it('behält nur bekannte Segen', () => {
		expect(sanitizeKarma({ blessings: ['speisesegen', 'gibtsnicht', 42] }).blessings).toEqual([
			'speisesegen'
		]);
	});

	it('kappt die Tradition und clampt KaP', () => {
		const karma = sanitizeKarma({ tradition: 'x'.repeat(80), kap: { current: 99, max: 30 } });
		expect(karma.tradition).toHaveLength(40);
		expect(karma.kap).toEqual({ current: 30, max: 30 });
	});

	it('übernimmt laufende Liturgien nur mit gültiger QS', () => {
		const karma = sanitizeKarma({
			upkeep: [
				{ id: 'u1', spellName: 'Magieschutz', qs: 3 },
				{ id: 'u2', spellName: 'X', qs: 9 }
			]
		});
		expect(karma.upkeep.map(u => u.id)).toEqual(['u1']);
	});

	it('rettet die Entrückungsstufe und clampt sie', () => {
		expect(sanitizeKarma({ devotionLevel: 3 }).devotionLevel).toBe(3);
		expect(sanitizeKarma({ devotionLevel: 99 }).devotionLevel).toBe(4);
		expect(sanitizeKarma({ devotionLevel: 'viel' }).devotionLevel).toBe(0);
		expect(sanitizeKarma({}).devotionLevel).toBe(0);
	});

	it('lässt ein Liturgienbuch mit Inhalt isBlessed false unverändert überleben', () => {
		const karma = sanitizeKarma({
			isBlessed: false,
			liturgies: [
				{ id: 'a', klasse: 'liturgie', name: 'Ok', attributes: ['MU', 'KL', 'IN'], cost: 8, value: 4 }
			],
			kap: { current: 12, max: 30 }
		});
		expect(karma.isBlessed).toBe(false);
		expect(karma.liturgies).toHaveLength(1);
		expect(karma.kap).toEqual({ current: 12, max: 30 });
	});
});

describe('Historie mit Liturgien', () => {
	it('lässt Einträge vom Typ Liturgie durch, auch ohne Würfel', () => {
		const entries = sanitizeHistory([{ ...historyEntry('l'), type: 'Liturgie', values: [] }]);
		expect(entries).toHaveLength(1);
		expect(entries[0].values).toEqual([]);
	});
});

describe('Einstellungen', () => {
	it('liest noLiturgyFumble nur als Boolean', () => {
		expect(migratePersisted({ version: 5, settings: { noLiturgyFumble: true } })!.settings.noLiturgyFumble).toBe(true);
		expect(migratePersisted({ version: 5, settings: { noLiturgyFumble: 'ja' } })!.settings.noLiturgyFumble).toBe(false);
	});
});
