import {
	CONDITIONS,
	CONDITION_MAX_LEVEL,
	DEVOTION_TABLE,
	ROMAN_LEVELS,
	ZECHEN_TALENT_ID,
	clampConditionLevel,
	type Condition,
	type ConditionId
} from '@/data/conditions';
import type { TalentEncumbrance, TalentGroup } from '@/store/talentsSlice';
import type { CombatType } from '@/store/combatRollSlice';
import { signedModifier } from './format';

export type ConditionLevels = Record<ConditionId, number>;

export type ConditionTarget =
	| { kind: 'talent'; id: string; group: TalentGroup; be: TalentEncumbrance }
	| { kind: 'kampf'; value: CombatType }
	| { kind: 'zauber' }
	| { kind: 'liturgie' };

export type ConditionOptions = {
	/** Belastung bei Talenten mit BE „evtl." – entscheidet die Szene. */
	belastungGilt?: boolean;
	/** Entrückung: die Probe ist dem eigenen Gott gefällig. */
	gottgefaellig?: boolean;
};

export type ConditionPart = {
	id: ConditionId;
	name: string;
	level: number;
	roman: string;
	/** Buch-Konvention: negativ = Erschwernis, positiv = Erleichterung. */
	value: number;
};

export type ConditionModifier = {
	/** Summe nach Deckel. */
	modifier: number;
	/** Ein Posten je wirksamem Zustand, ungekappt, für die Begründung. */
	parts: ConditionPart[];
	/** Ob der Deckel gegriffen hat – die Note sagt es dann. */
	capped: boolean;
	incapacitated: boolean;
	/** Nur Verwirrung ab III: die Probe ist unmöglich. */
	blockedReason?: string;
};

/** „Die maximale Erschwernis durch verschiedene Zustände beträgt 5." */
export const CONDITION_PENALTY_CAP = 5;
/** „insgesamt 8 oder mehr Zustandsstufen" machen handlungsunfähig. */
export const INCAPACITATED_AT_TOTAL = 8;
/** Ab so wenig LeP kommt eine weitere Stufe Schmerz hinzu. */
export const PAIN_LOW_LIFE = 5;
const PAIN_THRESHOLDS = [3 / 4, 1 / 2, 1 / 4];
const VERWIRRUNG_BLOCKS_FROM = 3;

export const INCAPACITATED_WARNING =
	'Handlungsunfähig – würfeln nur mit gelungener Selbstbeherrschung (Handlungsfähigkeit bewahren).';

/** Schmerzstufe allein aus den LeP-Schwellen: „auf ¾ … oder darunter", darum ohne Rundung. */
export const painFromLife = (current: number, max: number): number => {
	if (max <= 0) return 0;
	const steps = PAIN_THRESHOLDS.filter(fraction => current <= max * fraction).length;
	return Math.min(CONDITION_MAX_LEVEL, steps + (current <= PAIN_LOW_LIFE ? 1 : 0));
};

/** Zäher Hund ignoriert die höchste Stufe des Zustands – gleich, woher sie stammt. */
export const effectivePain = (fromLife: number, extra: number, toughDog: boolean): number =>
	clampConditionLevel(fromLife + extra - (toughDog ? 1 : 0));

export const totalLevels = (levels: ConditionLevels): number =>
	CONDITIONS.reduce((sum, condition) => sum + (levels[condition.id] ?? 0), 0);

export const incapacitationReason = (levels: ConditionLevels): string | undefined => {
	const atFour = CONDITIONS.find(
		condition => condition.incapacitatesAtFour && (levels[condition.id] ?? 0) >= CONDITION_MAX_LEVEL
	);
	if (atFour) return `${atFour.name} ${ROMAN_LEVELS[CONDITION_MAX_LEVEL]}`;
	const total = totalLevels(levels);
	return total >= INCAPACITATED_AT_TOTAL ? `${total} Stufen` : undefined;
};

export const isIncapacitated = (levels: ConditionLevels): boolean =>
	incapacitationReason(levels) !== undefined;

const BELASTUNG_COMBAT: CombatType[] = ['AT', 'PA', 'AW', 'INI'];

const isInitiative = (target: ConditionTarget): boolean =>
	target.kind === 'kampf' && target.value === 'INI';

/** Wert des Zustands für dieses Ziel; `undefined`, wenn er es nicht trifft. */
const partValue = (
	condition: Condition,
	level: number,
	target: ConditionTarget,
	options: ConditionOptions
): number | undefined => {
	switch (condition.profile) {
		case 'alle':
			return isInitiative(target) ? undefined : -level;
		case 'bewegung':
			if (isInitiative(target)) return undefined;
			if (target.kind === 'talent' && target.group === 'wissen') return undefined;
			return -level;
		case 'belastung':
			if (target.kind === 'kampf') return BELASTUNG_COMBAT.includes(target.value) ? -level : undefined;
			if (target.kind !== 'talent') return undefined;
			if (target.be === 'ja' || (target.be === 'evtl' && options.belastungGilt)) return -level;
			return undefined;
		case 'zechen':
			return target.kind === 'talent' && target.id === ZECHEN_TALENT_ID ? -level : undefined;
		case 'entrueckung':
			if (target.kind !== 'talent' && target.kind !== 'zauber') return undefined;
			return options.gottgefaellig ? DEVOTION_TABLE[level].favoured : DEVOTION_TABLE[level].other;
	}
};

const blockedBy = (levels: ConditionLevels, target: ConditionTarget): string | undefined => {
	const level = levels.verwirrung ?? 0;
	if (level < VERWIRRUNG_BLOCKS_FROM) return undefined;
	const prefix = `Verwirrung ${ROMAN_LEVELS[level]}`;
	if (target.kind === 'zauber') return `${prefix}: Zaubern ist unmöglich.`;
	if (target.kind === 'liturgie') return `${prefix}: Liturgien wirken ist unmöglich.`;
	if (target.kind === 'talent' && target.group === 'wissen') return `${prefix}: Wissenstalente sind unmöglich.`;
	return undefined;
};

export const conditionModifier = (
	levels: ConditionLevels,
	target: ConditionTarget,
	options: ConditionOptions = {}
): ConditionModifier => {
	const parts: ConditionPart[] = [];
	for (const condition of CONDITIONS) {
		const level = levels[condition.id] ?? 0;
		if (level <= 0) continue;
		const value = partValue(condition, level, target, options);
		if (value === undefined || value === 0) continue;
		parts.push({ id: condition.id, name: condition.name, level, roman: ROMAN_LEVELS[level], value });
	}

	const penalty = parts.filter(part => part.value < 0).reduce((sum, part) => sum + part.value, 0);
	const bonus = parts.filter(part => part.value > 0).reduce((sum, part) => sum + part.value, 0);
	const capped = penalty < -CONDITION_PENALTY_CAP;
	// `|| 0` normalisiert -0 zu +0.
	const modifier = (Math.max(penalty, -CONDITION_PENALTY_CAP) + bonus) || 0;

	return {
		modifier,
		parts,
		capped,
		incapacitated: isIncapacitated(levels),
		blockedReason: blockedBy(levels, target)
	};
};

/** „Schmerz II −2, Furcht I −1", mit Deckel-Zusatz; leer ohne Posten. */
export const conditionNote = (result: ConditionModifier): string | undefined => {
	if (result.parts.length === 0) return undefined;
	const list = result.parts
		.map(part => `${part.name} ${part.roman} ${signedModifier(part.value)}`)
		.join(', ');
	return result.capped ? `${list} (Deckel −${CONDITION_PENALTY_CAP})` : list;
};
