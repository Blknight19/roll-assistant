import { createSlice } from '@reduxjs/toolkit';
import type { PayloadAction } from '@reduxjs/toolkit';
import { stripControlChars } from '@/utils/text';

export const CHARACTER_NAME_MAX = 40;

export type ProfileState = {
	/** Id des Charakters – heute immer genau einer, das Dateiformat trägt aber eine Liste. */
	id: string;
	name: string;
};

export const DEFAULT_CHARACTER_ID = 'held-1';

export const initialProfileState: ProfileState = {
	id: DEFAULT_CHARACTER_ID,
	name: ''
};

export const sanitizeCharacterName = (name: string): string =>
	stripControlChars(name).replace(/\s+/g, ' ').trimStart().slice(0, CHARACTER_NAME_MAX);

const profileSlice = createSlice({
	name: 'profile',
	initialState: initialProfileState,
	reducers: {
		setCharacterName: (state, action: PayloadAction<string>) => {
			state.name = sanitizeCharacterName(action.payload);
		}
	}
});

export const { setCharacterName } = profileSlice.actions;
export const profileReducer = profileSlice.reducer;
