import { createSlice } from '@reduxjs/toolkit';
import type { PayloadAction } from '@reduxjs/toolkit';



export type LifeState = {
	current: number;
	max: number;
};

export type CombatState = {
	attack: number;
	save: number;
	dodge: number;
	initiative: number;
	ranged: number;
	life: LifeState;
}

export const initialCombatState: CombatState = {
	attack: 8,
	save: 8,
	dodge: 8,
	initiative: 8,
	ranged: 8,
	life: {
		current: 8,
		max: 8
	}
};

export type CombatStatKey = Exclude<keyof CombatState, 'life'>;

export const COMBAT_STAT_KEYS: CombatStatKey[] = ['attack', 'save', 'dodge', 'initiative', 'ranged'];

/** Obergrenzen großzügig: LeP liegen bei KO×2 + Rassenbonus, also deutlich über 20. */
export const COMBAT_STAT_MAX = 99;
export const LIFE_MAX = 999;

export const clampCombatStat = (value: number): number =>
	Math.min(COMBAT_STAT_MAX, Math.max(0, Math.round(value)));

/**
 * Einzige Quelle der LeP-Grenzen – Reducer und Persistenz teilen sie sich, damit ein
 * geladener Blob nicht an den Reducern vorbei ein `max` von 0 einschleusen kann.
 */
export const clampLife = ({ current, max }: LifeState): LifeState => {
	const safeMax = Math.min(LIFE_MAX, Math.max(1, Math.round(max)));
	return {
		max: safeMax,
		current: Math.min(safeMax, Math.max(0, Math.round(current)))
	};
};

/** Sichtbarer Rest-Streifen, solange der Wert nicht bei 0 liegt. */
export const MIN_FILL_PERCENT = 4;

/**
 * Breite eines Ressourcenbalkens in Prozent. Bei wenigen Punkten bliebe der Balken
 * sonst unsichtbar – 1 LeP und 0 LeP sähen gleich aus. Nur für die Darstellung; die
 * Farbschwellen richten sich weiter nach dem exakten Verhältnis.
 */
export const fillPercent = (current: number, max: number): number => {
	if (current <= 0 || max <= 0) return 0;
	return Math.min(100, Math.max(MIN_FILL_PERCENT, (current / max) * 100));
};

const combatSlice = createSlice({
	name: 'combat',
	initialState: initialCombatState,
	reducers: {
		updateCombatStat: (state, action: PayloadAction<{ key: CombatStatKey, value: number }>) => {
			state[action.payload.key] = clampCombatStat(action.payload.value);
		},
		updateLifeStat: (state, action: PayloadAction<Partial<LifeState>>) => {
			state.life = clampLife({
				current: action.payload.current ?? state.life.current,
				max: action.payload.max ?? state.life.max
			});
		}
	}
});

export const { updateCombatStat, updateLifeStat } = combatSlice.actions;
export const combatReducer = combatSlice.reducer;