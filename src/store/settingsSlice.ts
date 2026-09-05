import { createSlice } from '@reduxjs/toolkit';
import type { PayloadAction } from '@reduxjs/toolkit';

export type SettingsState = {
	/** Krit/Patzer im Kampf per Bestätigungswurf prüfen (DSA-5-Grundregel). */
	confirmCriticals: boolean;
	/** Optionalregel des Regelwerks: zwei Zwanzigen sind bei Liturgien kein Patzer. */
	noLiturgyFumble: boolean;
};

export const initialSettingsState: SettingsState = {
	confirmCriticals: true,
	noLiturgyFumble: false
};

const settingsSlice = createSlice({
	name: 'settings',
	initialState: initialSettingsState,
	reducers: {
		setConfirmCriticals: (state, action: PayloadAction<boolean>) => {
			state.confirmCriticals = action.payload;
		},
		setNoLiturgyFumble: (state, action: PayloadAction<boolean>) => {
			state.noLiturgyFumble = action.payload;
		}
	}
});

export const { setConfirmCriticals, setNoLiturgyFumble } = settingsSlice.actions;
export const settingsReducer = settingsSlice.reducer;
