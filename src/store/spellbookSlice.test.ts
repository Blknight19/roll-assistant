import { describe, expect, it } from 'vitest';
import {
	SPELL_COST_TEXT_MAX,
	SPELL_CAST_TIME_MAX,
	SPELL_DURATION_MAX,
	SPELL_NOTE_MAX,
	SPELL_PROBE_NOTE_MAX,
	addSpell,
	addUpkeep,
	changeAsp,
	clampAsp,
	initialSpellbookState,
	removeSpell,
	removeUpkeep,
	setAsp,
	setSpellbook,
	setSpellcaster,
	spellbookReducer,
	updateSpell,
	type Spell
} from './spellbookSlice';

const zauber = (overrides: Partial<Spell> = {}): Spell => ({
	id: 'z1',
	name: 'Odem Arcanum',
	attributes: ['KL', 'IN', 'IN'],
	cost: 4,
	value: 10,
	...overrides
});

describe('clampAsp', () => {
	it('lässt ein Maximum von 0 zu – anders als LeP', () => {
		expect(clampAsp({ current: 0, max: 0 })).toEqual({ current: 0, max: 0 });
	});

	it('kappt current am Maximum', () => {
		expect(clampAsp({ current: 50, max: 30 })).toEqual({ current: 30, max: 30 });
	});

	it('verhindert negative Werte', () => {
		expect(clampAsp({ current: -5, max: -3 })).toEqual({ current: 0, max: 0 });
	});
});

describe('spellbookReducer', () => {
	it('schaltet zauberkundig um, ohne Daten zu löschen', () => {
		let state = spellbookReducer(initialSpellbookState, addSpell(zauber()));
		state = spellbookReducer(state, setSpellcaster(true));
		state = spellbookReducer(state, setSpellcaster(false));
		expect(state.isSpellcaster).toBe(false);
		expect(state.spells).toHaveLength(1);
	});

	it('senkt AsP per changeAsp und nicht unter 0', () => {
		let state = spellbookReducer(initialSpellbookState, setAsp({ current: 10, max: 30 }));
		state = spellbookReducer(state, changeAsp(-4));
		expect(state.asp.current).toBe(6);
		state = spellbookReducer(state, changeAsp(-99));
		expect(state.asp.current).toBe(0);
	});

	it('erstattet AsP per changeAsp zurück, gedeckelt am Maximum', () => {
		let state = spellbookReducer(initialSpellbookState, setAsp({ current: 28, max: 30 }));
		state = spellbookReducer(state, changeAsp(8));
		expect(state.asp.current).toBe(30);
	});

	it('füllt current beim erstmaligen Setzen von max auf (0 → 30) automatisch auf', () => {
		const state = spellbookReducer(initialSpellbookState, setAsp({ max: 30 }));
		expect(state.asp).toEqual({ current: 30, max: 30 });
	});

	it('lässt ein bereits ausgegebenes current unangetastet, wenn max weiter angehoben wird', () => {
		let state = spellbookReducer(initialSpellbookState, setAsp({ current: 10, max: 10 }));
		state = spellbookReducer(state, changeAsp(-8));
		expect(state.asp.current).toBe(2);
		state = spellbookReducer(state, setAsp({ max: 15 }));
		expect(state.asp).toEqual({ current: 2, max: 15 });
	});

	it('kappt current weiterhin nach unten, wenn max gesenkt wird', () => {
		let state = spellbookReducer(initialSpellbookState, setAsp({ current: 30, max: 30 }));
		state = spellbookReducer(state, setAsp({ max: 10 }));
		expect(state.asp).toEqual({ current: 10, max: 10 });
	});

	it('übernimmt beim Ersteinrichten ein explizit mitgegebenes current statt aufzufüllen', () => {
		const state = spellbookReducer(initialSpellbookState, setAsp({ current: 5, max: 30 }));
		expect(state.asp).toEqual({ current: 5, max: 30 });
	});

	it('ändert nichts, wenn max von 0 auf 0 gesetzt wird', () => {
		const state = spellbookReducer(initialSpellbookState, setAsp({ max: 0 }));
		expect(state.asp).toEqual({ current: 0, max: 0 });
	});

	it('greift die Ersteinrichtung erneut, wenn max im UI auf 0 zurück- und wieder hochgesetzt wird – unbedenklich, weil dabei nichts Ausgegebenes verloren geht', () => {
		let state = spellbookReducer(initialSpellbookState, setAsp({ current: 10, max: 10 }));
		state = spellbookReducer(state, changeAsp(-8));
		expect(state.asp.current).toBe(2);
		state = spellbookReducer(state, setAsp({ max: 0 }));
		// clampAsp zieht current schon hier auf 0 – das gezielt heruntergezauberte current
		// existiert danach nicht mehr, es gibt nichts mehr zu verlieren.
		expect(state.asp).toEqual({ current: 0, max: 0 });
		state = spellbookReducer(state, setAsp({ max: 15 }));
		expect(state.asp).toEqual({ current: 15, max: 15 });
	});

	it('setSpellbook übernimmt eine importierte AsP von 0/30 unverändert – kein automatisches Auffüllen beim Import', () => {
		const state = spellbookReducer(
			initialSpellbookState,
			setSpellbook({ ...initialSpellbookState, isSpellcaster: true, asp: { current: 0, max: 30 } })
		);
		expect(state.asp).toEqual({ current: 0, max: 30 });
	});

	it('kappt Zaubernamen und Fertigkeitswerte', () => {
		const state = spellbookReducer(
			initialSpellbookState,
			addSpell(zauber({ name: 'x'.repeat(200), value: 99 }))
		);
		expect(state.spells[0].name).toHaveLength(60);
		expect(state.spells[0].value).toBe(25);
	});

	it('kappt die Freitextfelder auf dieselben Grenzen wie der Import', () => {
		// Sonst hält ein überlanger Wert die Sitzung durch und ändert sich still beim
		// nächsten Laden – und `duration` steuert, ob aufrechterhalten werden darf.
		const state = spellbookReducer(initialSpellbookState, addSpell(zauber({
			costText: 'k'.repeat(200),
			probeNote: 'p'.repeat(200),
			duration: 'd'.repeat(200),
			castTime: 'z'.repeat(200),
			note: 'n'.repeat(900)
		})));
		expect(state.spells[0].costText).toHaveLength(SPELL_COST_TEXT_MAX);
		expect(state.spells[0].probeNote).toHaveLength(SPELL_PROBE_NOTE_MAX);
		expect(state.spells[0].duration).toHaveLength(SPELL_DURATION_MAX);
		expect(state.spells[0].castTime).toHaveLength(SPELL_CAST_TIME_MAX);
		expect(state.spells[0].note).toHaveLength(SPELL_NOTE_MAX);
	});

	it('kappt Freitext auch beim Ändern und beim Import per setSpellbook', () => {
		let state = spellbookReducer(initialSpellbookState, addSpell(zauber()));
		state = spellbookReducer(state, updateSpell({
			id: 'z1',
			changes: { note: 'n'.repeat(900) }
		}));
		expect(state.spells[0].note).toHaveLength(SPELL_NOTE_MAX);

		state = spellbookReducer(state, setSpellbook({
			...initialSpellbookState,
			spells: [zauber({ duration: 'd'.repeat(200) })]
		}));
		expect(state.spells[0].duration).toHaveLength(SPELL_DURATION_MAX);
	});

	it('lässt Freitextfelder undefined, wenn sie nicht gesetzt sind', () => {
		const state = spellbookReducer(initialSpellbookState, addSpell(zauber()));
		expect(state.spells[0].note).toBeUndefined();
		expect(state.spells[0].probeNote).toBeUndefined();
	});

	it('nimmt nicht mehr als SPELL_LIMIT Zauber auf', () => {
		let state = initialSpellbookState;
		for (let i = 0; i < 105; i++) {
			state = spellbookReducer(state, addSpell(zauber({ id: `z${i}` })));
		}
		expect(state.spells).toHaveLength(100);
	});

	it('ändert und entfernt einzelne Zauber', () => {
		let state = spellbookReducer(initialSpellbookState, addSpell(zauber()));
		state = spellbookReducer(state, updateSpell({ id: 'z1', changes: { value: 14 } }));
		expect(state.spells[0].value).toBe(14);
		state = spellbookReducer(state, removeSpell('z1'));
		expect(state.spells).toHaveLength(0);
	});

	it('führt laufende Zauber als Liste', () => {
		let state = spellbookReducer(
			initialSpellbookState,
			addUpkeep({ id: 'u1', spellName: 'Odem Arcanum', qs: 3 })
		);
		state = spellbookReducer(state, addUpkeep({ id: 'u2', spellName: 'Armatrutz', qs: 2 }));
		expect(state.upkeep).toHaveLength(2);
		state = spellbookReducer(state, removeUpkeep('u1'));
		expect(state.upkeep.map(e => e.id)).toEqual(['u2']);
	});
});
