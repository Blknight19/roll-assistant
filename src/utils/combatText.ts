import type { CombatRoll } from '@/store/combatRollSlice';
import type { ResultTone } from '@/components/RollResultCard';
import { modifierTerm } from '@/utils/format';

/** Ergebnis in einem Wort – für Karte, Leiste, Historie und die aria-live-Region. */
export const statusText = (roll: CombatRoll): string => {
	if (!roll.result) return String(roll.initiative ?? '');
	const { special, d20, success } = roll.result;
	if (special === 'krit') return 'Kritischer Erfolg!';
	if (special === 'patzer') return 'Patzer!';
	if (d20 === 1) return 'Gelungen (Krit nicht bestätigt)';
	if (d20 === 20) return 'Misslungen (Patzer nicht bestätigt)';
	return success ? 'Gelungen' : 'Misslungen';
};

/**
 * Regelfolge zum Wurf. Nur für Attacke und Fernkampf belegt – für Parade und
 * Ausweichen behandelt das Regelwerk kritische Erfolge gesondert, teils optional.
 */
export const consequenceText = (roll: CombatRoll): string | undefined => {
	if (roll.type !== 'AT' && roll.type !== 'FK') return undefined;
	if (!roll.result) return undefined;
	const { special, d20 } = roll.result;
	if (special === 'krit') return 'Verteidigung des Ziels halbiert, Schaden verdoppelt';
	if (special === 'patzer') return 'Patzer-Tabelle auswerten';
	if (d20 === 1) return 'Verteidigung des Ziels halbiert';
	return undefined;
};

const conditionTerm = (roll: CombatRoll): string =>
	roll.conditionModifier === 0 ? '' : `${modifierTerm(roll.conditionModifier)} Zustände`;

export const derivationText = (roll: CombatRoll): string => {
	if (!roll.result) {
		return `${roll.base} + ${roll.dice[0]}${modifierTerm(roll.modifier)}${conditionTerm(roll)} = ${roll.initiative}`;
	}
	const { d20, target, confirmation } = roll.result;
	const base = roll.modifier === 0 && roll.conditionModifier === 0
		? `Wurf: ${d20}, Zielwert: ${target}`
		: `Wurf: ${d20}, Basis: ${roll.base}${modifierTerm(roll.modifier)}${conditionTerm(roll)} → ${target}`;
	return confirmation ? `${base} | Bestätigung: ${confirmation.roll}` : base;
};

/** Ton der Ergebnisfläche. Initiative kennt kein Misslingen und bleibt `success`. */
export const combatTone = (roll: CombatRoll): ResultTone =>
	roll.result?.special === 'krit' ? 'critical'
		: roll.result && !roll.result.success ? 'failure'
			: 'success';
