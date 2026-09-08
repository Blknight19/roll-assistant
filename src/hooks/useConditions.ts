import { useSelector } from 'react-redux';
import type { RootState } from '@/store';
import { CONDITIONS, ROMAN_LEVELS, type ConditionId } from '@/data/conditions';
import {
	conditionModifier,
	effectivePain,
	isIncapacitated,
	painFromLife,
	totalLevels,
	type ConditionLevels,
	type ConditionModifier,
	type ConditionOptions,
	type ConditionTarget
} from '@/utils/conditionRules';

export type ActiveCondition = { id: ConditionId; name: string; level: number; roman: string };

/**
 * Wirksame Zustände: Schmerz aus LeP-Stufe, Zusatzstufe und Zäher Hund; Entrückung nur
 * bei geweihten Helden – der Schalter blendet die Wirkung aus, nicht die gespeicherte Stufe.
 */
export const useConditions = () => {
	const stored = useSelector((state: RootState) => state.conditions);
	const life = useSelector((state: RootState) => state.combat.life);
	const isBlessed = useSelector((state: RootState) => state.karma.isBlessed);

	const fromLife = painFromLife(life.current, life.max);
	const levels: ConditionLevels = {
		...stored.levels,
		schmerz: effectivePain(fromLife, stored.levels.schmerz, stored.toughDog),
		entrueckung: isBlessed ? stored.levels.entrueckung : 0
	};

	const active: ActiveCondition[] = CONDITIONS
		.filter(condition => levels[condition.id] > 0)
		.map(condition => ({
			id: condition.id,
			name: condition.name,
			level: levels[condition.id],
			roman: ROMAN_LEVELS[levels[condition.id]]
		}));

	return {
		levels,
		painFromLife: fromLife,
		toughDog: stored.toughDog,
		active,
		totalLevels: totalLevels(levels),
		incapacitated: isIncapacitated(levels),
		modifierFor: (target: ConditionTarget, options?: ConditionOptions): ConditionModifier =>
			conditionModifier(levels, target, options)
	};
};
