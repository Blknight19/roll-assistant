import { describe, expect, it } from 'vitest';
import { evaluateTalentCheck } from '@/utils/rules';
import { setTradition } from './karmaSlice';
import {
	applyCritBonus,
	liturgyRollReducer,
	markBlessingRefunded,
	markLiturgyRefunded,
	selectLiturgy,
	setLastBlessing,
	setCatalogTradition,
	setLiturgyLastRoll,
	toggleLiturgyCircumstance,
	type LiturgyRoll
} from './liturgyRollSlice';

const initial = liturgyRollReducer(undefined, { type: 'init' });

const roll = (): LiturgyRoll => ({
	liturgyId: 'l1',
	name: 'Wahrheit',
	klasse: 'liturgie',
	entries: [
		{ attribute: 'MU', value: 13 },
		{ attribute: 'KL', value: 13 },
		{ attribute: 'IN', value: 13 }
	],
	modifier: 0,
	circumstances: [],
	taw: 8,
	kapSpent: 8,
	critBonus: null,
	result: evaluateTalentCheck([13, 13, 13], 8, 0, [1, 1, 10])
});

describe('liturgyRollReducer', () => {
	it('behält Ort und Zeit beim Wechsel der Liturgie, verwirft Modifikationen und Technik', () => {
		let state = liturgyRollReducer(initial, toggleLiturgyCircumstance('ort-tempel'));
		state = liturgyRollReducer(state, toggleLiturgyCircumstance('mod-erzwingen'));
		state = liturgyRollReducer(state, toggleLiturgyCircumstance('technik-ohne-gebet'));
		state = liturgyRollReducer(state, selectLiturgy('l2'));
		expect(state.circumstances).toEqual(['ort-tempel']);
		expect(state.lastRoll).toBeNull();
	});

	it('bucht den Krit-Bonus einmal und hebt die QS', () => {
		let state = liturgyRollReducer(initial, setLiturgyLastRoll(roll()));
		expect(state.lastRoll!.result.qs).toBe(3);
		state = liturgyRollReducer(state, applyCritBonus(5));
		expect(state.lastRoll!.critBonus).toBe(5);
		expect(state.lastRoll!.result.fp).toBe(13);
		expect(state.lastRoll!.result.qs).toBe(5);
		state = liturgyRollReducer(state, applyCritBonus(6));
		expect(state.lastRoll!.critBonus).toBe(5);
	});

	it('verweigert den Bonus nach einer Rückbuchung', () => {
		let state = liturgyRollReducer(initial, setLiturgyLastRoll(roll()));
		state = liturgyRollReducer(state, markLiturgyRefunded());
		state = liturgyRollReducer(state, applyCritBonus(4));
		expect(state.lastRoll!.critBonus).toBeNull();
	});

	it('verweigert den Bonus ohne kritischen Erfolg', () => {
		const schlicht = { ...roll(), result: evaluateTalentCheck([13, 13, 13], 8, 0, [5, 10, 12]) };
		let state = liturgyRollReducer(initial, setLiturgyLastRoll(schlicht));
		state = liturgyRollReducer(state, applyCritBonus(4));
		expect(state.lastRoll!.critBonus).toBeNull();
	});

	it('merkt sich den letzten Segen samt Rückbuchung', () => {
		let state = liturgyRollReducer(
			initial,
			setLastBlessing({ catalogId: 'speisesegen', name: 'Speisesegen' })
		);
		expect(state.lastBlessing).toEqual({
			catalogId: 'speisesegen',
			name: 'Speisesegen',
			booked: true
		});
		state = liturgyRollReducer(state, markBlessingRefunded());
		expect(state.lastBlessing!.booked).toBe(false);
	});
});

describe('Katalogfilter', () => {
	it('folgt ohne eigene Wahl der Tradition des Helden', () => {
		expect(initial.catalogTradition).toBeNull();
	});

	it('merkt sich eine eigene Wahl', () => {
		const state = liturgyRollReducer(initial, setCatalogTradition('alle'));
		expect(state.catalogTradition).toBe('alle');
	});

	it('gibt die eigene Wahl auf, sobald die Tradition wechselt', () => {
		let state = liturgyRollReducer(initial, setCatalogTradition('alle'));
		state = liturgyRollReducer(state, setTradition('Rondra'));
		expect(state.catalogTradition).toBeNull();
	});
});
