import { createSlice } from '@reduxjs/toolkit';
import type { PayloadAction } from '@reduxjs/toolkit';
import type { AttributeKey } from './attributesSlice';
import { clampTalentValue } from './talentsSlice';
import { stripControlChars } from '@/utils/text';

/** Ein Zauber im Zauberbuch des Helden. Katalogeinträge werden hier hinein kopiert. */
export type Spell = {
	id: string;
	/** Herkunft, wenn aus dem Katalog übernommen. Nie zum Nachschlagen zur Laufzeit. */
	catalogId?: string;
	name: string;
	attributes: [AttributeKey, AttributeKey, AttributeKey];
	/** Im Zauberbuch immer eine Zahl – Formeln aus dem Katalog löst der Spieler auf. */
	cost: number;
	/** Wortlaut aus dem Katalog, z. B. „1 AsP pro LeP". Nur Erinnerung. */
	costText?: string;
	/** Zusatz zur Probe aus dem Katalog, z. B. „modifiziert durch ZK". Reine Anzeige. */
	probeNote?: string;
	/** Zauberdauer aus dem Katalog, z. B. „2 Aktionen". Reine Anzeige. */
	castTime?: string;
	duration?: string;
	value: number;
	/** Freie Notiz des Spielers – Merkhilfe, keine Regelmechanik. */
	note?: string;
};

export type UpkeepEntry = { id: string; spellName: string; qs: number };

export type AspState = { current: number; max: number };

export type SpellbookState = {
	/** Einziger Schalter für das gesamte Magie-Modul. */
	isSpellcaster: boolean;
	asp: AspState;
	spells: Spell[];
	upkeep: UpkeepEntry[];
};

/**
 * Deckt auch den längsten Katalognamen ab: „Herbeirufung der Heerscharen des
 * Rattenkindes (Vampirfledermäuse)" braucht 65 Zeichen.
 */
export const SPELL_NAME_MAX = 70;
/** Weit über jedem gespielten Magier – Grenze gegen präparierte Importdateien. */
export const SPELL_LIMIT = 100;
export const SPELL_COST_MAX = 99;
export const ASP_MAX = 999;

/**
 * Grenzen der Freitextfelder eines Zaubers. Reducer und Import ziehen sie über
 * `clampSpellText` gemeinsam – sonst überlebt ein zu langer Wert die Sitzung und
 * ändert sich still beim nächsten Laden.
 */
export const SPELL_COST_TEXT_MAX = 160;
export const SPELL_PROBE_NOTE_MAX = 90;
export const SPELL_DURATION_MAX = 120;
export const SPELL_CAST_TIME_MAX = 60;
export const SPELL_NOTE_MAX = 500;

export const initialSpellbookState: SpellbookState = {
	isSpellcaster: false,
	asp: { current: 0, max: 0 },
	spells: [],
	upkeep: []
};

/**
 * Anders als `clampLife` ist ein Maximum von 0 erlaubt: ein Held, der gerade erst
 * zauberkundig geschaltet wurde, hat noch keine AsP eingetragen.
 */
export const clampAsp = ({ current, max }: AspState): AspState => {
	const safeMax = Math.min(ASP_MAX, Math.max(0, Math.round(max)));
	return {
		max: safeMax,
		current: Math.min(safeMax, Math.max(0, Math.round(current)))
	};
};

export const sanitizeSpellName = (name: string): string =>
	stripControlChars(name).replace(/\s+/g, ' ').trimStart().slice(0, SPELL_NAME_MAX);

export const clampSpellCost = (value: number): number =>
	Math.min(SPELL_COST_MAX, Math.max(0, Math.round(value)));

/**
 * Ein optionales Freitextfeld auf seine Länge kappen. Nimmt `unknown`, damit der
 * Import dieselbe Funktion benutzen kann: alles, was kein String ist, entfällt.
 */
export const clampSpellText = (value: unknown, max: number): string | undefined =>
	typeof value === 'string' ? stripControlChars(value).slice(0, max) : undefined;

const normalizeSpell = (spell: Spell): Spell => ({
	...spell,
	name: sanitizeSpellName(spell.name),
	cost: clampSpellCost(spell.cost),
	value: clampTalentValue(spell.value),
	costText: clampSpellText(spell.costText, SPELL_COST_TEXT_MAX),
	probeNote: clampSpellText(spell.probeNote, SPELL_PROBE_NOTE_MAX),
	duration: clampSpellText(spell.duration, SPELL_DURATION_MAX),
	castTime: clampSpellText(spell.castTime, SPELL_CAST_TIME_MAX),
	note: clampSpellText(spell.note, SPELL_NOTE_MAX)
});

const spellbookSlice = createSlice({
	name: 'spellbook',
	initialState: initialSpellbookState,
	reducers: {
		setSpellcaster: (state, action: PayloadAction<boolean>) => {
			// Ausschalten versteckt nur – Zauberbuch, AsP und laufende Zauber bleiben.
			state.isSpellcaster = action.payload;
		},
		setAsp: (state, action: PayloadAction<Partial<AspState>>) => {
			const nextMax = action.payload.max ?? state.asp.max;
			// Ersteinrichtung: ein frisch zauberkundig geschalteter Held startet bei 0/0 AsP.
			// Trägt er nun ein Maximum ein, bliebe current sonst bei 0 hängen – der
			// „Zaubern"-Knopf wäre gesperrt, ohne dass ersichtlich ist, warum. Diese eine
			// Übergangskante (max von 0 auf > 0) füllt current einmalig auf max auf.
			// Bewusst NICHT verallgemeinert auf „current an max nachziehen, wenn max steigt":
			// ein Spieler, der gezielt auf 2/10 heruntergezaubert hat und dann max auf 15
			// anhebt, muss bei 2/15 bleiben – stilles Auffüllen wäre schlimmer als der
			// ursprüngliche Fehler. Die Kante kann im UI erneut greifen (das Maximum-Feld lässt
			// sich auf 0 zurückstellen und neu hochsetzen) – das ist unbedenklich, weil
			// `clampAsp` current schon beim Erreichen von max === 0 auf 0 zieht: ein gezielt
			// heruntergezaubertes current existiert dann nicht mehr, es gibt nichts zu verlieren.
			// Ein explizit mitgegebenes current gewinnt immer – der Aufrufer hat gesagt, was er will.
			const isFirstSetup = state.asp.max === 0 && nextMax > 0;
			const nextCurrent = action.payload.current ?? (isFirstSetup ? nextMax : state.asp.current);
			state.asp = clampAsp({ current: nextCurrent, max: nextMax });
		},
		/** Relative Buchung – der Rückgängig-Knopf bucht denselben Betrag positiv zurück. */
		changeAsp: (state, action: PayloadAction<number>) => {
			state.asp = clampAsp({ current: state.asp.current + action.payload, max: state.asp.max });
		},
		addSpell: (state, action: PayloadAction<Spell>) => {
			if (state.spells.length >= SPELL_LIMIT) return;
			state.spells.push(normalizeSpell(action.payload));
		},
		updateSpell: (state, action: PayloadAction<{ id: string; changes: Partial<Spell> }>) => {
			const index = state.spells.findIndex(spell => spell.id === action.payload.id);
			if (index === -1) return;
			state.spells[index] = normalizeSpell({ ...state.spells[index], ...action.payload.changes });
		},
		removeSpell: (state, action: PayloadAction<string>) => {
			state.spells = state.spells.filter(spell => spell.id !== action.payload);
		},
		addUpkeep: (state, action: PayloadAction<UpkeepEntry>) => {
			state.upkeep.push(action.payload);
		},
		removeUpkeep: (state, action: PayloadAction<string>) => {
			state.upkeep = state.upkeep.filter(entry => entry.id !== action.payload);
		},
		/**
		 * Ersetzt das Buch am Stück – für den Import.
		 * Teilt bewusst NICHT die Ersteinrichtungs-Auffüllung aus `setAsp`: eine importierte
		 * AsP von 0/30 ist ein legitimer Zustand (ein leergezauberter Magier), kein Zeichen für
		 * den ursprünglichen Fehler. Die App kann beides nicht unterscheiden – automatisches
		 * Auffüllen beim Laden würde also einem tatsächlich erschöpften Magier bei jedem
		 * Neustart die Kraft zurückschenken. Persistenz muss exakt wiederherstellen, was
		 * gespeichert wurde; die Auffüllung gehört ausschließlich in den interaktiven
		 * Ersteinrichtungspfad, wo der Spieler gerade aktiv sein Maximum einträgt.
		 */
		setSpellbook: (state, action: PayloadAction<SpellbookState>) => {
			state.isSpellcaster = action.payload.isSpellcaster;
			state.asp = clampAsp(action.payload.asp);
			state.spells = action.payload.spells.slice(0, SPELL_LIMIT).map(normalizeSpell);
			state.upkeep = action.payload.upkeep;
		}
	}
});

export const {
	setSpellcaster,
	setAsp,
	changeAsp,
	addSpell,
	updateSpell,
	removeSpell,
	addUpkeep,
	removeUpkeep,
	setSpellbook
} = spellbookSlice.actions;
export const spellbookReducer = spellbookSlice.reducer;
