import { describe, expect, it } from 'vitest';
import {
	LITURGY_COST_MAX,
	LITURGY_LIMIT,
	addKarmaUpkeep,
	addLiturgy,
	changeKap,
	clampKap,
	initialKarmaState,
	karmaReducer,
	removeKarmaUpkeep,
	removeLiturgy,
	setBlessed,
	setKap,
	setKarma,
	setTradition,
	toggleBlessing,
	updateLiturgy,
	type Liturgy
} from './karmaSlice';
import { SPELL_NAME_MAX } from './spellbookSlice';

const liturgie = (overrides: Partial<Liturgy> = {}): Liturgy => ({
	id: 'l1',
	klasse: 'liturgie',
	name: 'Wahrheit',
	attributes: ['MU', 'KL', 'IN'],
	cost: 16,
	value: 8,
	...overrides
});

describe('clampKap', () => {
	it('lässt ein Maximum von 0 zu', () => {
		expect(clampKap({ current: 0, max: 0 })).toEqual({ current: 0, max: 0 });
	});

	it('kappt current am Maximum und verhindert negative Werte', () => {
		expect(clampKap({ current: 50, max: 30 })).toEqual({ current: 30, max: 30 });
		expect(clampKap({ current: -5, max: -3 })).toEqual({ current: 0, max: 0 });
	});
});

describe('karmaReducer', () => {
	it('schaltet geweiht um, ohne Buch, KaP oder laufende Liturgien zu löschen', () => {
		let state = karmaReducer(initialKarmaState, addLiturgy(liturgie()));
		state = karmaReducer(state, setKap({ max: 30 }));
		state = karmaReducer(state, addKarmaUpkeep({ id: 'u1', spellName: 'Magieschutz', qs: 2 }));
		state = karmaReducer(state, setBlessed(true));
		state = karmaReducer(state, setBlessed(false));
		expect(state.isBlessed).toBe(false);
		expect(state.liturgies).toHaveLength(1);
		expect(state.kap).toEqual({ current: 30, max: 30 });
		expect(state.upkeep).toHaveLength(1);
	});

	it('füllt current bei der Ersteinrichtung des Maximums auf, sonst nicht', () => {
		let state = karmaReducer(initialKarmaState, setKap({ max: 30 }));
		expect(state.kap).toEqual({ current: 30, max: 30 });
		state = karmaReducer(state, changeKap(-20));
		state = karmaReducer(state, setKap({ max: 35 }));
		expect(state.kap).toEqual({ current: 10, max: 35 });
	});

	it('bucht relativ und bleibt in den Grenzen', () => {
		let state = karmaReducer(initialKarmaState, setKap({ current: 10, max: 30 }));
		state = karmaReducer(state, changeKap(-4));
		expect(state.kap.current).toBe(6);
		state = karmaReducer(state, changeKap(99));
		expect(state.kap.current).toBe(30);
	});

	it('kappt Tradition, Namen, Kosten und Fertigkeitswerte', () => {
		let state = karmaReducer(initialKarmaState, setTradition('x'.repeat(80)));
		expect(state.tradition).toHaveLength(40);
		state = karmaReducer(
			state,
			addLiturgy(liturgie({ name: 'y'.repeat(200), cost: 999, value: 99 }))
		);
		expect(state.liturgies[0].name).toHaveLength(SPELL_NAME_MAX);
		expect(state.liturgies[0].cost).toBe(LITURGY_COST_MAX);
		expect(state.liturgies[0].value).toBe(25);
	});

	it('nimmt nicht mehr als LITURGY_LIMIT Einträge auf', () => {
		let state = initialKarmaState;
		for (let i = 0; i < LITURGY_LIMIT + 5; i++) {
			state = karmaReducer(state, addLiturgy(liturgie({ id: `l${i}` })));
		}
		expect(state.liturgies).toHaveLength(LITURGY_LIMIT);
	});

	it('ändert und entfernt einzelne Einträge', () => {
		let state = karmaReducer(initialKarmaState, addLiturgy(liturgie()));
		state = karmaReducer(state, updateLiturgy({ id: 'l1', changes: { value: 12 } }));
		expect(state.liturgies[0].value).toBe(12);
		state = karmaReducer(state, removeLiturgy('l1'));
		expect(state.liturgies).toHaveLength(0);
	});

	it('schaltet Segen an und aus, ohne Dubletten', () => {
		let state = karmaReducer(initialKarmaState, toggleBlessing('speisesegen'));
		state = karmaReducer(state, toggleBlessing('tranksegen'));
		expect(state.blessings).toEqual(['speisesegen', 'tranksegen']);
		state = karmaReducer(state, toggleBlessing('speisesegen'));
		expect(state.blessings).toEqual(['tranksegen']);
	});

	it('führt laufende Liturgien als Liste', () => {
		let state = karmaReducer(
			initialKarmaState,
			addKarmaUpkeep({ id: 'u1', spellName: 'Magieschutz', qs: 3 })
		);
		state = karmaReducer(state, addKarmaUpkeep({ id: 'u2', spellName: 'Lautlos', qs: 2 }));
		state = karmaReducer(state, removeKarmaUpkeep('u1'));
		expect(state.upkeep.map(e => e.id)).toEqual(['u2']);
	});

	it('ersetzt das Buch am Stück, ohne current aufzufüllen', () => {
		const state = karmaReducer(
			initialKarmaState,
			setKarma({
				...initialKarmaState,
				isBlessed: true,
				tradition: 'Praios',
				kap: { current: 0, max: 30 },
				liturgies: [liturgie()],
				blessings: ['speisesegen']
			})
		);
		expect(state.kap).toEqual({ current: 0, max: 30 });
		expect(state.tradition).toBe('Praios');
		expect(state.liturgies).toHaveLength(1);
	});
});
