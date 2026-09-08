import { describe, expect, it } from 'vitest';
import { derivationText } from './combatText';
import { evaluateCombatRoll } from './rules';
import type { CombatRoll } from '@/store/combatRollSlice';

const check = (modifier: number, conditionModifier: number): CombatRoll => ({
	id: 'k1',
	type: 'AT',
	base: 12,
	modifier,
	conditionModifier,
	dice: [7],
	result: evaluateCombatRoll(12, modifier + conditionModifier, 7)
});

describe('derivationText', () => {
	it('nennt ohne Modifikatoren nur Wurf und Zielwert', () => {
		expect(derivationText(check(0, 0))).toBe('Wurf: 7, Zielwert: 12');
	});

	it('führt den Zustandsanteil getrennt vom getippten Wert', () => {
		expect(derivationText(check(-1, -2))).toBe('Wurf: 7, Basis: 12 − 1 − 2 Zustände → 9');
		expect(derivationText(check(0, -2))).toBe('Wurf: 7, Basis: 12 − 2 Zustände → 10');
	});

	it('rechnet die Initiative mit Zustandsanteil vor', () => {
		const ini: CombatRoll = {
			id: 'i1', type: 'INI', base: 12, modifier: 0, conditionModifier: -2, initiative: 14, dice: [4]
		};
		expect(derivationText(ini)).toBe('12 + 4 − 2 Zustände = 14');
	});
});
