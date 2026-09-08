import { createSlice } from '@reduxjs/toolkit';
import type { PayloadAction } from '@reduxjs/toolkit';
import type { AttributeKey } from './attributesSlice';
import type { TalentCheckResult } from '@/utils/rules';

export type ProbeEntry = {
	attribute: AttributeKey;
	value: number;
};

/** Vollständiger Schnappschuss eines Wurfs – Anzeige rechnet nur hieraus. */
export type ProbeRoll = {
	talentName: string;
	entries: ProbeEntry[];
	modifier: number;
	taw: number;
	/** Zustandsposten des Wurfs, z. B. „Schmerz II −2". */
	note?: string;
	result: TalentCheckResult;
};

export type ProbeState = {
	talentId: string | null;
	talentName: string;
	entries: ProbeEntry[];
	modifier: number;
	taw: number;
	/** Belastung bei Talenten mit BE „evtl." – hängt an Talent und Szene. */
	belastungGilt: boolean;
	/** Entrückung: die Probe ist dem eigenen Gott gefällig. */
	gottgefaellig: boolean;
	lastRoll: ProbeRoll | null;
};

const initialState: ProbeState = {
	talentId: null,
	talentName: '',
	entries: [
		{ attribute: 'MU', value: 8 },
		{ attribute: 'KL', value: 8 },
		{ attribute: 'IN', value: 8 }
	],
	modifier: 0,
	taw: 10,
	belastungGilt: false,
	gottgefaellig: false,
	lastRoll: null
};

const probeSlice = createSlice({
	name: 'probe',
	initialState,
	reducers: {
		selectProbeTalent: (state, action: PayloadAction<{ id: string; name: string; entries: ProbeEntry[]; taw: number }>) => {
			state.talentId = action.payload.id;
			state.talentName = action.payload.name;
			state.entries = action.payload.entries;
			state.taw = action.payload.taw;
			// Sonst steht das Ergebnis des vorigen Talents über der neuen Auswahl.
			state.lastRoll = null;
			state.belastungGilt = false;
			state.gottgefaellig = false;
		},
		setProbeEntry: (state, action: PayloadAction<{ index: number; attribute?: AttributeKey; value?: number }>) => {
			const entry = state.entries[action.payload.index];
			if (!entry) return;
			if (action.payload.attribute !== undefined) entry.attribute = action.payload.attribute;
			if (action.payload.value !== undefined) entry.value = action.payload.value;
		},
		setProbeModifier: (state, action: PayloadAction<number>) => {
			state.modifier = action.payload;
		},
		setProbeTaw: (state, action: PayloadAction<number>) => {
			state.taw = action.payload;
		},
		setProbeLastRoll: (state, action: PayloadAction<ProbeRoll>) => {
			state.lastRoll = action.payload;
		},
		toggleProbeBelastung: (state) => {
			state.belastungGilt = !state.belastungGilt;
		},
		toggleProbeGottgefaellig: (state) => {
			state.gottgefaellig = !state.gottgefaellig;
		}
	}
});

export const {
	selectProbeTalent,
	setProbeEntry,
	setProbeModifier,
	setProbeTaw,
	setProbeLastRoll,
	toggleProbeBelastung,
	toggleProbeGottgefaellig
} = probeSlice.actions;
export const probeReducer = probeSlice.reducer;
