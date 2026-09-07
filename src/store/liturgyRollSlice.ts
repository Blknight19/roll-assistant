import { createSlice } from '@reduxjs/toolkit';
import type { PayloadAction } from '@reduxjs/toolkit';
import type { AttributeKey } from './attributesSlice';
import { setTradition, type LiturgyBookClass } from './karmaSlice';
import { CIRCUMSTANCES, toggleCircumstance } from '@/data/liturgies/circumstances';
import { withBonusFp, type TalentCheckResult } from '@/utils/rules';

export type LiturgyEntry = { attribute: AttributeKey; value: number };

/** Vollständiger Schnappschuss eines Wurfs – die Anzeige rechnet nur hieraus. */
export type LiturgyRoll = {
	liturgyId: string;
	name: string;
	klasse: LiturgyBookClass;
	entries: LiturgyEntry[];
	/** Gesamtmodifikator: getippt + Umstände + laufende Effekte. */
	modifier: number;
	circumstances: string[];
	taw: number;
	/** Tatsächlich gebuchte KaP – der Rückgängig-Knopf bucht genau diese zurück. */
	kapSpent: number;
	/** 1W6 auf die FP beim kritischen Erfolg, einmal wählbar. */
	critBonus: number | null;
	/** Wirkungsdauer zum Zeitpunkt des Wurfs; nur „aufrechterhaltend" bindet Konzentration. */
	duration?: string;
	result: TalentCheckResult;
};

export type BlessingCast = { catalogId: string; name: string; booked: boolean };

/**
 * Bewusst nur die Auswahl, nicht die Werte der Liturgie: Fertigkeitswert, Kosten und
 * Eigenschaften liest die Ansicht bei jedem Render frisch aus dem Liturgienbuch.
 */
export type LiturgyRollState = {
	liturgyId: string | null;
	modifier: number;
	circumstances: string[];
	lastRoll: LiturgyRoll | null;
	/** Ob die KaP des letzten Wurfs noch gebucht sind – schaltet den Rückgängig-Knopf. */
	lastRollBooked: boolean;
	lastBlessing: BlessingCast | null;
	/**
	 * Traditionsfilter des Katalogs, `null` solange niemand ihn von Hand gesetzt hat –
	 * dann zeigt das Liturgienbuch die Tradition des Helden. Bewusst hier und nicht als
	 * Komponentenzustand: der Tab hängt das Buch beim Wechsel ab, eine Auswahl im Buch
	 * soll das überleben.
	 */
	catalogTradition: string | null;
};

const initialState: LiturgyRollState = {
	liturgyId: null,
	modifier: 0,
	circumstances: [],
	lastRoll: null,
	lastRollBooked: false,
	lastBlessing: null,
	catalogTradition: null
};

/** Ort, Zeit und Gegenstand beschreiben die Szene und bleiben; Technik und Modifikationen hängen am Eintrag. */
const SCENE_GROUPS = new Set(['ort', 'zeit', 'sonstiges']);

const liturgyRollSlice = createSlice({
	name: 'liturgyRoll',
	initialState,
	reducers: {
		selectLiturgy: (state, action: PayloadAction<string>) => {
			state.liturgyId = action.payload;
			state.circumstances = state.circumstances.filter(id =>
				SCENE_GROUPS.has(CIRCUMSTANCES.find(c => c.id === id)?.group ?? '')
			);
			// Sonst steht das Ergebnis der vorigen Liturgie über der neuen Auswahl.
			state.lastRoll = null;
			state.lastRollBooked = false;
		},
		setLiturgyModifier: (state, action: PayloadAction<number>) => {
			state.modifier = action.payload;
		},
		toggleLiturgyCircumstance: (state, action: PayloadAction<string>) => {
			state.circumstances = toggleCircumstance(state.circumstances, action.payload);
		},
		setLiturgyLastRoll: (state, action: PayloadAction<LiturgyRoll>) => {
			state.lastRoll = action.payload;
			state.lastRollBooked = true;
		},
		/** Rückgängig: der Wurf bleibt sichtbar, die Buchung gilt als zurückgenommen. */
		markLiturgyRefunded: (state) => {
			state.lastRollBooked = false;
		},
		applyCritBonus: (state, action: PayloadAction<number>) => {
			const roll = state.lastRoll;
			if (!roll || !state.lastRollBooked) return;
			if (roll.critBonus !== null || roll.result.special !== 'krit') return;
			roll.critBonus = action.payload;
			roll.result = withBonusFp(roll.result, action.payload);
		},
		setLastBlessing: (state, action: PayloadAction<{ catalogId: string; name: string }>) => {
			state.lastBlessing = { ...action.payload, booked: true };
		},
		markBlessingRefunded: (state) => {
			if (state.lastBlessing) state.lastBlessing.booked = false;
		},
		setCatalogTradition: (state, action: PayloadAction<string>) => {
			state.catalogTradition = action.payload;
		}
	},
	extraReducers: (builder) => {
		// Eine neue Tradition schlägt die Handauswahl: der Katalog zeigt wieder das,
		// was der Held wirken darf.
		builder.addCase(setTradition, (state) => {
			state.catalogTradition = null;
		});
	}
});

export const {
	selectLiturgy,
	setLiturgyModifier,
	toggleLiturgyCircumstance,
	setLiturgyLastRoll,
	markLiturgyRefunded,
	applyCritBonus,
	setLastBlessing,
	markBlessingRefunded,
	setCatalogTradition
} = liturgyRollSlice.actions;
export const liturgyRollReducer = liturgyRollSlice.reducer;
