import { describe, expect, it } from 'vitest';
import {
	conditionsReducer,
	initialConditionsState,
	resetConditions,
	setConditionLevel,
	setConditions,
	setToughDog
} from './conditionsSlice';
import { emptyConditionLevels } from '@/data/conditions';

describe('conditionsReducer', () => {
	it('stellt eine Stufe und hält sie zwischen 0 und IV', () => {
		let state = conditionsReducer(initialConditionsState, setConditionLevel({ id: 'furcht', level: 3 }));
		expect(state.levels.furcht).toBe(3);
		state = conditionsReducer(state, setConditionLevel({ id: 'furcht', level: 9 }));
		expect(state.levels.furcht).toBe(4);
		state = conditionsReducer(state, setConditionLevel({ id: 'furcht', level: -1 }));
		expect(state.levels.furcht).toBe(0);
	});

	it('wandelt Berauscht IV in eine Stufe Betäubung um', () => {
		let state = conditionsReducer(initialConditionsState, setConditionLevel({ id: 'betaeubung', level: 1 }));
		state = conditionsReducer(state, setConditionLevel({ id: 'berauscht', level: 4 }));
		expect(state.levels.berauscht).toBe(0);
		expect(state.levels.betaeubung).toBe(2);
	});

	it('deckelt die Betäubung bei der Umwandlung bei IV', () => {
		let state = conditionsReducer(initialConditionsState, setConditionLevel({ id: 'betaeubung', level: 4 }));
		state = conditionsReducer(state, setConditionLevel({ id: 'berauscht', level: 4 }));
		expect(state.levels.betaeubung).toBe(4);
		expect(state.levels.berauscht).toBe(0);
	});

	it('schaltet Zäher Hund, ohne Stufen anzurühren', () => {
		let state = conditionsReducer(initialConditionsState, setConditionLevel({ id: 'schmerz', level: 2 }));
		state = conditionsReducer(state, setToughDog(true));
		expect(state.toughDog).toBe(true);
		expect(state.levels.schmerz).toBe(2);
	});

	it('setzt alle Stufen zurück und lässt Zäher Hund stehen', () => {
		let state = conditionsReducer(initialConditionsState, setToughDog(true));
		state = conditionsReducer(state, setConditionLevel({ id: 'schmerz', level: 2 }));
		state = conditionsReducer(state, setConditionLevel({ id: 'paralyse', level: 1 }));
		state = conditionsReducer(state, resetConditions());
		expect(state.levels).toEqual(emptyConditionLevels());
		expect(state.toughDog).toBe(true);
	});

	it('ersetzt den Zustand am Stück und klammert dabei', () => {
		const state = conditionsReducer(
			initialConditionsState,
			setConditions({ levels: { ...emptyConditionLevels(), verwirrung: 7, schmerz: -2 }, toughDog: true })
		);
		expect(state.levels.verwirrung).toBe(4);
		expect(state.levels.schmerz).toBe(0);
		expect(state.toughDog).toBe(true);
	});
});
