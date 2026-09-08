import { createSlice } from '@reduxjs/toolkit';
import type { PayloadAction } from '@reduxjs/toolkit';
import type { AttributeKey } from './attributesSlice';
import type { TalentCheckResult } from '@/utils/rules';

export type SpellEntry = { attribute: AttributeKey; value: number };

/** Vollständiger Schnappschuss eines Zauberwurfs – die Anzeige rechnet nur hieraus. */
export type SpellRoll = {
	spellId: string;
	spellName: string;
	entries: SpellEntry[];
	modifier: number;
	taw: number;
	/** Zustandsposten des Wurfs, z. B. „Schmerz II −2". */
	note?: string;
	/** Tatsächlich gebuchte AsP – der Rückgängig-Knopf bucht genau diese zurück. */
	aspSpent: number;
	/** Wirkungsdauer zum Zeitpunkt des Wurfs; nur „aufrechterhaltend" bindet Konzentration. */
	duration?: string;
	result: TalentCheckResult;
};

/**
 * Bewusst nur die Auswahl, nicht die Werte des Zaubers: Fertigkeitswert, Kosten,
 * Eigenschaften und Wirkungsdauer liest die Ansicht bei jedem Render frisch aus dem
 * Zauberbuch. Ein hier abgelegter Schnappschuss würde veralten, sobald der Spieler im
 * Charakterbogen den FW anhebt, den Zauber löscht oder einen Charakter importiert.
 */
export type SpellRollState = {
	spellId: string | null;
	modifier: number;
	lastRoll: SpellRoll | null;
	/** Ob die AsP des letzten Wurfs noch gebucht sind – schaltet den Rückgängig-Knopf. */
	lastRollBooked: boolean;
	/** Entrückung: die Probe ist dem eigenen Gott gefällig. */
	gottgefaellig: boolean;
};

const initialState: SpellRollState = {
	spellId: null,
	modifier: 0,
	lastRoll: null,
	lastRollBooked: false,
	gottgefaellig: false
};

const spellRollSlice = createSlice({
	name: 'spellRoll',
	initialState,
	reducers: {
		selectSpell: (state, action: PayloadAction<string>) => {
			state.spellId = action.payload;
			// Sonst steht das Ergebnis des vorigen Zaubers über der neuen Auswahl.
			state.lastRoll = null;
			state.lastRollBooked = false;
			state.gottgefaellig = false;
		},
		setSpellModifier: (state, action: PayloadAction<number>) => {
			state.modifier = action.payload;
		},
		setSpellLastRoll: (state, action: PayloadAction<SpellRoll>) => {
			state.lastRoll = action.payload;
			state.lastRollBooked = true;
		},
		/** Rückgängig: der Wurf bleibt sichtbar, die Buchung gilt als zurückgenommen. */
		markLastRollRefunded: (state) => {
			state.lastRollBooked = false;
		},
		toggleSpellGottgefaellig: (state) => {
			state.gottgefaellig = !state.gottgefaellig;
		}
	}
});

export const {
	selectSpell,
	setSpellModifier,
	setSpellLastRoll,
	markLastRollRefunded,
	toggleSpellGottgefaellig
} = spellRollSlice.actions;
export const spellRollReducer = spellRollSlice.reducer;
