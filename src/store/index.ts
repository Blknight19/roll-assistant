import { combineReducers, configureStore } from '@reduxjs/toolkit';
import { attributeReducer } from './attributesSlice';
import { rollReducer } from './rollSlice';
import { talentReducer } from './talentsSlice';
import { combatReducer } from './combatSlice';
import { settingsReducer } from './settingsSlice';
import { probeReducer } from './probeSlice';
import { profileReducer } from './profileSlice';
import { combatRollReducer } from './combatRollSlice';
import { simpleRollReducer } from './simpleRollSlice';
import { loadState, saveState } from './persistence';
import { karmaReducer } from './karmaSlice';
import { spellbookReducer } from './spellbookSlice';
import { liturgyRollReducer } from './liturgyRollSlice';
import { spellRollReducer } from './spellRollSlice';

const rootReducer = combineReducers({
	profile: profileReducer,
	roll: rollReducer,
	talents: talentReducer,
	attributes: attributeReducer,
	combat: combatReducer,
	spellbook: spellbookReducer,
	karma: karmaReducer,
	settings: settingsReducer,
	// Laufende Wurf-Eingaben: bewusst nicht persistiert, aber im Store, damit sie
	// den Unmount der Radix-Tab-Panels überleben.
	probe: probeReducer,
	combatRoll: combatRollReducer,
	spellRoll: spellRollReducer,
	liturgyRoll: liturgyRollReducer,
	simpleRoll: simpleRollReducer
});

export const store = configureStore({
	reducer: rootReducer,
	preloadedState: loadState()
});

export type RootState = ReturnType<typeof store.getState>
export type AppDispatch = typeof store.dispatch

const SAVE_DEBOUNCE_MS = 500;
let saveTimer: ReturnType<typeof setTimeout> | undefined;
let hasUnsavedChanges = false;

/** Verwirft einen ausstehenden Save – sonst schreibt er nach einem Reset alles zurück. */
export const cancelPendingSave = () => {
	clearTimeout(saveTimer);
	saveTimer = undefined;
	hasUnsavedChanges = false;
};

const flushSave = () => {
	if (!hasUnsavedChanges) return;
	cancelPendingSave();
	saveState(store.getState());
};

store.subscribe(() => {
	hasUnsavedChanges = true;
	clearTimeout(saveTimer);
	saveTimer = setTimeout(flushSave, SAVE_DEBOUNCE_MS);
});

// Der Debounce darf den letzten Wurf nicht verschlucken, wenn die App weggewischt
// oder in den Hintergrund geschoben wird – auf dem Handy ist das der Normalfall.
window.addEventListener('pagehide', flushSave);
document.addEventListener('visibilitychange', () => {
	if (document.visibilityState === 'hidden') flushSave();
});
