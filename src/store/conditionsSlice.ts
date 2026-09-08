import { createSlice } from '@reduxjs/toolkit';
import type { PayloadAction } from '@reduxjs/toolkit';
import {
	CONDITION_IDS,
	CONDITION_MAX_LEVEL,
	clampConditionLevel,
	emptyConditionLevels,
	type ConditionId
} from '@/data/conditions';

export type ConditionsState = {
	/** Stufe 0..4 je Zustand. Bei Schmerz nur die Zusatzstufe – die LeP-Stufe wird hergeleitet. */
	levels: Record<ConditionId, number>;
	/** Vorteil Zäher Hund: die höchste Schmerzstufe wird ignoriert. */
	toughDog: boolean;
};

export const initialConditionsState: ConditionsState = {
	levels: emptyConditionLevels(),
	toughDog: false
};

/** Berauscht IV: „Held erleidet eine Stufe Betäubung, 4 Stufen Berauscht werden gestrichen." */
const BERAUSCHT_TO_BETAEUBUNG = 4;

const conditionsSlice = createSlice({
	name: 'conditions',
	initialState: initialConditionsState,
	reducers: {
		setConditionLevel: (state, action: PayloadAction<{ id: ConditionId; level: number }>) => {
			const level = clampConditionLevel(action.payload.level);
			if (action.payload.id === 'berauscht' && level >= BERAUSCHT_TO_BETAEUBUNG) {
				state.levels.berauscht = 0;
				state.levels.betaeubung = Math.min(CONDITION_MAX_LEVEL, state.levels.betaeubung + 1);
				return;
			}
			state.levels[action.payload.id] = level;
		},
		setToughDog: (state, action: PayloadAction<boolean>) => {
			state.toughDog = action.payload;
		},
		resetConditions: (state) => {
			state.levels = emptyConditionLevels();
		},
		/** Ersetzt den Zustand am Stück – für den Import. */
		setConditions: (state, action: PayloadAction<ConditionsState>) => {
			const levels = emptyConditionLevels();
			for (const id of CONDITION_IDS) levels[id] = clampConditionLevel(action.payload.levels[id] ?? 0);
			state.levels = levels;
			state.toughDog = action.payload.toughDog === true;
		}
	}
});

export const { setConditionLevel, setToughDog, resetConditions, setConditions } = conditionsSlice.actions;
export const conditionsReducer = conditionsSlice.reducer;
