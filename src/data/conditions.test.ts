import { describe, expect, it } from 'vitest';
import {
	CONDITIONS,
	CONDITION_IDS,
	CONDITION_MAX_LEVEL,
	DEVOTION_TABLE,
	ROMAN_LEVELS,
	clampConditionLevel,
	conditionById,
	emptyConditionLevels
} from './conditions';

describe('CONDITIONS', () => {
	it('führt die acht Zustände des Grundregelwerks, jeden genau einmal', () => {
		expect(CONDITIONS).toHaveLength(8);
		expect(new Set(CONDITIONS.map(c => c.id)).size).toBe(8);
		expect(CONDITION_IDS).toEqual(CONDITIONS.map(c => c.id));
	});

	it('beschreibt je Zustand die Stufen 0 bis IV mit Text', () => {
		for (const condition of CONDITIONS) {
			expect(condition.levels, condition.id).toHaveLength(CONDITION_MAX_LEVEL + 1);
			for (const level of condition.levels) {
				expect(level.name.trim(), condition.id).not.toBe('');
				expect(level.effect.trim(), condition.id).not.toBe('');
			}
			expect(condition.decay.trim(), condition.id).not.toBe('');
		}
	});

	it('macht bei Stufe IV handlungsunfähig – außer Berauscht und Entrückung', () => {
		const soft = CONDITIONS.filter(c => !c.incapacitatesAtFour).map(c => c.id).sort();
		expect(soft).toEqual(['berauscht', 'entrueckung']);
	});

	it('trägt die Entrückungszahlen des Regelwiki je Stufe', () => {
		expect(DEVOTION_TABLE.map(row => row.favoured)).toEqual([0, 0, 1, 2, 3]);
		expect(DEVOTION_TABLE.map(row => row.other)).toEqual([0, -1, -2, -3, -4]);
	});

	it('findet einen Zustand per id', () => {
		expect(conditionById('schmerz').name).toBe('Schmerz');
		expect(ROMAN_LEVELS).toEqual(['0', 'I', 'II', 'III', 'IV']);
	});
});

describe('clampConditionLevel', () => {
	it('hält die Stufe zwischen 0 und IV und rundet', () => {
		expect(clampConditionLevel(-3)).toBe(0);
		expect(clampConditionLevel(2.7)).toBe(3);
		expect(clampConditionLevel(9)).toBe(CONDITION_MAX_LEVEL);
	});
});

describe('emptyConditionLevels', () => {
	it('liefert jede id mit Stufe 0 und ein frisches Objekt', () => {
		const a = emptyConditionLevels();
		const b = emptyConditionLevels();
		expect(Object.keys(a).sort()).toEqual([...CONDITION_IDS].sort());
		expect(Object.values(a).every(v => v === 0)).toBe(true);
		expect(a).not.toBe(b);
	});
});
