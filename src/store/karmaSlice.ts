import { createSlice } from '@reduxjs/toolkit';
import type { PayloadAction } from '@reduxjs/toolkit';
import type { AttributeKey } from './attributesSlice';
import {
	SPELL_CAST_TIME_MAX,
	SPELL_COST_TEXT_MAX,
	SPELL_DURATION_MAX,
	SPELL_NOTE_MAX,
	SPELL_PROBE_NOTE_MAX,
	clampSpellText,
	sanitizeSpellName,
	type UpkeepEntry
} from './spellbookSlice';
import { clampTalentValue } from './talentsSlice';
import { clampDevotionLevel } from '@/data/liturgies/devotion';
import { stripControlChars } from '@/utils/text';

/** Segen stehen nicht im Buch – sie sind eine geschlossene Liste und nur als Katalog-ID erworben. */
export type LiturgyBookClass = 'liturgie' | 'zeremonie';

/** Ein Eintrag im Liturgienbuch. Katalogeinträge werden hier hinein kopiert. */
export type Liturgy = {
	id: string;
	/** Herkunft, wenn aus dem Katalog übernommen. Nie zum Nachschlagen zur Laufzeit. */
	catalogId?: string;
	klasse: LiturgyBookClass;
	name: string;
	attributes: [AttributeKey, AttributeKey, AttributeKey];
	/** Immer eine Zahl – Formeln aus dem Katalog löst der Spieler auf. */
	cost: number;
	costText?: string;
	probeNote?: string;
	castTime?: string;
	duration?: string;
	value: number;
	note?: string;
};

export type KapState = { current: number; max: number };

export type KarmaState = {
	/** Einziger Schalter für das gesamte Geweihten-Modul. */
	isBlessed: boolean;
	/** Traditionsname aus TRADITIONEN oder '' – Vorfilter des Katalogs, Richtwert der KaP. */
	tradition: string;
	kap: KapState;
	liturgies: Liturgy[];
	/** Katalog-IDs der erworbenen Segen. */
	blessings: string[];
	/** Laufende Liturgien – zählen zusammen mit den laufenden Zaubern in den Malus. */
	upkeep: UpkeepEntry[];
	/** Stufe des Zustands Entrückung, 0..4. Vom Spieler gestellt, nicht hergeleitet. */
	devotionLevel: number;
};

export const KAP_MAX = 999;
/** Zeremonien kosten bis 256 KaP – Liturgien enden bei 32. */
export const LITURGY_COST_MAX = 256;
export const LITURGY_LIMIT = 100;
export const TRADITION_MAX = 40;

export const initialKarmaState: KarmaState = {
	isBlessed: false,
	tradition: '',
	kap: { current: 0, max: 0 },
	liturgies: [],
	blessings: [],
	upkeep: [],
	devotionLevel: 0
};

/**
 * Wie `clampAsp` ist ein Maximum von 0 erlaubt: ein frisch geweihter Held hat noch
 * nichts eingetragen.
 */
export const clampKap = ({ current, max }: KapState): KapState => {
	const safeMax = Math.min(KAP_MAX, Math.max(0, Math.round(max)));
	return { max: safeMax, current: Math.min(safeMax, Math.max(0, Math.round(current))) };
};

export const clampKapCost = (value: number): number =>
	Math.min(LITURGY_COST_MAX, Math.max(0, Math.round(value)));

export const sanitizeTradition = (name: string): string =>
	stripControlChars(name).replace(/\s+/g, ' ').trim().slice(0, TRADITION_MAX);

const normalizeLiturgy = (entry: Liturgy): Liturgy => ({
	...entry,
	name: sanitizeSpellName(entry.name),
	cost: clampKapCost(entry.cost),
	value: clampTalentValue(entry.value),
	costText: clampSpellText(entry.costText, SPELL_COST_TEXT_MAX),
	probeNote: clampSpellText(entry.probeNote, SPELL_PROBE_NOTE_MAX),
	duration: clampSpellText(entry.duration, SPELL_DURATION_MAX),
	castTime: clampSpellText(entry.castTime, SPELL_CAST_TIME_MAX),
	note: clampSpellText(entry.note, SPELL_NOTE_MAX)
});

const karmaSlice = createSlice({
	name: 'karma',
	initialState: initialKarmaState,
	reducers: {
		setBlessed: (state, action: PayloadAction<boolean>) => {
			// Ausschalten versteckt nur – Buch, KaP und laufende Liturgien bleiben.
			state.isBlessed = action.payload;
		},
		setTradition: (state, action: PayloadAction<string>) => {
			state.tradition = sanitizeTradition(action.payload);
		},
		setKap: (state, action: PayloadAction<Partial<KapState>>) => {
			const nextMax = action.payload.max ?? state.kap.max;
			// Ersteinrichtung wie bei `setAsp`: nur die Kante max 0 auf > 0 füllt current auf.
			const isFirstSetup = state.kap.max === 0 && nextMax > 0;
			const nextCurrent = action.payload.current ?? (isFirstSetup ? nextMax : state.kap.current);
			state.kap = clampKap({ current: nextCurrent, max: nextMax });
		},
		/** Relative Buchung – der Rückgängig-Knopf bucht denselben Betrag positiv zurück. */
		changeKap: (state, action: PayloadAction<number>) => {
			state.kap = clampKap({ current: state.kap.current + action.payload, max: state.kap.max });
		},
		addLiturgy: (state, action: PayloadAction<Liturgy>) => {
			if (state.liturgies.length >= LITURGY_LIMIT) return;
			state.liturgies.push(normalizeLiturgy(action.payload));
		},
		updateLiturgy: (state, action: PayloadAction<{ id: string; changes: Partial<Liturgy> }>) => {
			const index = state.liturgies.findIndex(entry => entry.id === action.payload.id);
			if (index === -1) return;
			state.liturgies[index] = normalizeLiturgy({
				...state.liturgies[index],
				...action.payload.changes
			});
		},
		removeLiturgy: (state, action: PayloadAction<string>) => {
			state.liturgies = state.liturgies.filter(entry => entry.id !== action.payload);
		},
		toggleBlessing: (state, action: PayloadAction<string>) => {
			state.blessings = state.blessings.includes(action.payload)
				? state.blessings.filter(id => id !== action.payload)
				: [...state.blessings, action.payload];
		},
		addKarmaUpkeep: (state, action: PayloadAction<UpkeepEntry>) => {
			state.upkeep.push(action.payload);
		},
		removeKarmaUpkeep: (state, action: PayloadAction<string>) => {
			state.upkeep = state.upkeep.filter(entry => entry.id !== action.payload);
		},
		setDevotionLevel: (state, action: PayloadAction<number>) => {
			state.devotionLevel = clampDevotionLevel(action.payload);
		},
		/**
		 * Ersetzt das Buch am Stück – für den Import. Teilt bewusst nicht die
		 * Ersteinrichtungs-Auffüllung aus `setKap`: eine importierte KaP von 0/30 ist ein
		 * legitimer Zustand, kein Zeichen für eine unfertige Einrichtung.
		 */
		setKarma: (state, action: PayloadAction<KarmaState>) => {
			state.isBlessed = action.payload.isBlessed;
			state.tradition = sanitizeTradition(action.payload.tradition);
			state.kap = clampKap(action.payload.kap);
			state.liturgies = action.payload.liturgies.slice(0, LITURGY_LIMIT).map(normalizeLiturgy);
			state.blessings = [...new Set(action.payload.blessings)];
			state.upkeep = action.payload.upkeep;
			state.devotionLevel = clampDevotionLevel(action.payload.devotionLevel);
		}
	}
});

export const {
	setBlessed,
	setTradition,
	setKap,
	changeKap,
	addLiturgy,
	updateLiturgy,
	removeLiturgy,
	toggleBlessing,
	addKarmaUpkeep,
	removeKarmaUpkeep,
	setDevotionLevel,
	setKarma
} = karmaSlice.actions;
export const karmaReducer = karmaSlice.reducer;
