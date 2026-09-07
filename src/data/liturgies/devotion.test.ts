import { describe, expect, it } from 'vitest';
import { DEVOTION_LEVELS, DEVOTION_MAX_LEVEL, clampDevotionLevel } from './devotion';

describe('clampDevotionLevel', () => {
	it('hält die Stufe zwischen 0 und IV', () => {
		expect(clampDevotionLevel(-3)).toBe(0);
		expect(clampDevotionLevel(2)).toBe(2);
		expect(clampDevotionLevel(9)).toBe(DEVOTION_MAX_LEVEL);
	});

	it('rundet auf ganze Stufen', () => {
		expect(clampDevotionLevel(2.7)).toBe(3);
	});
});

describe('DEVOTION_LEVELS', () => {
	it('beschreibt Stufe 0 bis IV', () => {
		expect(DEVOTION_LEVELS).toHaveLength(DEVOTION_MAX_LEVEL + 1);
		expect(DEVOTION_LEVELS[0].roman).toBe('0');
		expect(DEVOTION_LEVELS[2].name).toBe('entrückt');
		for (const level of DEVOTION_LEVELS) expect(level.effect.trim()).not.toBe('');
	});

	it('trägt die Zahlen des Regelwiki je Stufe', () => {
		// Stufe I erschwert nur die nicht gefälligen Proben; ab II gibt es einen Bonus.
		expect(DEVOTION_LEVELS.map(level => level.favoured)).toEqual([0, 0, 1, 2, 3]);
		expect(DEVOTION_LEVELS.map(level => level.other)).toEqual([0, -1, -2, -3, -4]);
	});
});
