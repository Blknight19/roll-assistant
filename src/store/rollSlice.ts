import { createSlice } from '@reduxjs/toolkit';
import type { PayloadAction } from '@reduxjs/toolkit';

export const HISTORY_LIMIT = 100;

export type RollHistoryEntry = {
	id: string,
	type: 'Einzel' | 'Talent' | 'Kampf' | 'Zauber' | 'Liturgie',
	values: number[],
	result: string,
	date: string
}

type RollState = {
	history: RollHistoryEntry[]
}

const initialState: RollState = { history: [] };

const rollSlice = createSlice({
	name: 'roll',
	initialState,
	reducers: {
		addRoll: (state, action: PayloadAction<RollHistoryEntry>) => {
			state.history.unshift(action.payload);
			if (state.history.length > HISTORY_LIMIT) {
				state.history.length = HISTORY_LIMIT;
			}
		},
		/** Ersetzt die Historie am Stück – `addRoll` in einer Schleife würde sie umkehren. */
		setHistory: (state, action: PayloadAction<RollHistoryEntry[]>) => {
			state.history = action.payload.slice(0, HISTORY_LIMIT);
		},
		clearHistory: (state) => {
			state.history = [];
		}
	}
});

export const { addRoll, setHistory, clearHistory } = rollSlice.actions;
export const rollReducer = rollSlice.reducer;