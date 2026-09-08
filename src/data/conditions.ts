/**
 * Zustände des Grundregelwerks (Regelwiki, Regelwerk S. 31–34). Regelwissen gehört
 * dem Code; die Stufen je Held liegen im Slice `conditions`.
 */
export type ConditionId =
	| 'schmerz'
	| 'betaeubung'
	| 'furcht'
	| 'verwirrung'
	| 'belastung'
	| 'paralyse'
	| 'berauscht'
	| 'entrueckung';

/** Worauf ein Zustand wirkt – die Rechenfunktion kennt nur diese fünf Profile. */
export type ConditionProfile = 'alle' | 'bewegung' | 'belastung' | 'zechen' | 'entrueckung';

export type ConditionLevel = { name: string; effect: string };

export type Condition = {
	id: ConditionId;
	name: string;
	profile: ConditionProfile;
	/** Index = Stufe, [0] ist „keine". */
	levels: [ConditionLevel, ConditionLevel, ConditionLevel, ConditionLevel, ConditionLevel];
	/** Ob Stufe IV den Helden handlungsunfähig macht. */
	incapacitatesAtFour: boolean;
	/** Merksatz zum Abbau – die App kennt keine Spielzeit, der Spieler stellt die Stufe. */
	decay: string;
};

export const CONDITION_MAX_LEVEL = 4;
export const ROMAN_LEVELS = ['0', 'I', 'II', 'III', 'IV'] as const;

/** Talent-ID von Zechen – das einzige Ziel von Berauscht. */
export const ZECHEN_TALENT_ID = '14';

/** Je 10 volle KaP bei Mirakeln, Liturgien oder Zeremonien eine Stufe Entrückung. */
export const DEVOTION_PER_LEVEL = 10;

/** Zahlen der Entrückungskarte, Index = Stufe: gefällige und übrige Proben. */
export const DEVOTION_TABLE: { favoured: number; other: number }[] = [
	{ favoured: 0, other: 0 },
	{ favoured: 0, other: -1 },
	{ favoured: 1, other: -2 },
	{ favoured: 2, other: -3 },
	{ favoured: 3, other: -4 }
];

const NONE: ConditionLevel = { name: 'keine', effect: 'Keine Wirkung.' };

/** Reihenfolge = Reihenfolge im Dialog, nach Häufigkeit am Spieltisch. */
export const CONDITIONS: Condition[] = [
	{
		id: 'schmerz',
		name: 'Schmerz',
		profile: 'alle',
		levels: [
			NONE,
			{ name: 'leichte Schmerzen', effect: 'Alle Proben −1, GS −1.' },
			{ name: 'ablenkende Schmerzen', effect: 'Alle Proben −2, GS −2.' },
			{ name: 'starke Schmerzen', effect: 'Alle Proben −3, GS −3.' },
			{
				name: 'unerträgliche Schmerzen',
				effect: 'Handlungsunfähig. Wer per Selbstbeherrschung weiter handelt, hat auf alle Proben −4.'
			}
		],
		incapacitatesAtFour: true,
		decay: 'Je 1 Stufe bei ¾, ½, ¼ und ab 5 LeP – diese Stufen enden, sobald die Schwelle wieder überschritten ist. Andere Stufen bauen sich je 4 Stunden um 1 ab.'
	},
	{
		id: 'betaeubung',
		name: 'Betäubung',
		profile: 'alle',
		levels: [
			NONE,
			{ name: 'leicht angeschlagen', effect: 'Alle Proben −1.' },
			{ name: 'angeschlagen', effect: 'Alle Proben −2.' },
			{ name: 'schwer angeschlagen', effect: 'Alle Proben −3.' },
			{ name: 'handlungsunfähig', effect: 'Handlungsunfähig.' }
		],
		incapacitatesAtFour: true,
		decay: 'Jede Stufe verschwindet nach 3 Stunden Ruhe.'
	},
	{
		id: 'furcht',
		name: 'Furcht',
		profile: 'alle',
		levels: [
			NONE,
			{ name: 'beunruhigt', effect: 'Alle Proben −1.' },
			{ name: 'verängstigt', effect: 'Alle Proben −2.' },
			{ name: 'in Panik', effect: 'Alle Proben −3.' },
			{ name: 'katatonisch', effect: 'Handlungsunfähig.' }
		],
		incapacitatesAtFour: true,
		decay: 'Bleibt, solange der Auslöser in der Nähe ist; danach 1 Stufe je 5 Minuten.'
	},
	{
		id: 'verwirrung',
		name: 'Verwirrung',
		profile: 'alle',
		levels: [
			NONE,
			{ name: 'leicht verwirrt', effect: 'Alle Proben −1.' },
			{ name: 'verwirrt', effect: 'Alle Proben −2.' },
			{
				name: 'sehr verwirrt',
				effect: 'Alle Proben −3. Zaubern, Liturgien wirken und Wissenstalente sind unmöglich.'
			},
			{ name: 'handlungsunfähig', effect: 'Handlungsunfähig.' }
		],
		incapacitatesAtFour: true,
		decay: '1 Stufe je Stunde.'
	},
	{
		id: 'belastung',
		name: 'Belastung',
		profile: 'belastung',
		levels: [
			NONE,
			{ name: 'leicht belastet', effect: 'Talente mit Belastung, AT, PA, AW und INI −1, GS −1.' },
			{ name: 'belastet', effect: 'Talente mit Belastung, AT, PA, AW und INI −2, GS −2.' },
			{ name: 'schwer belastet', effect: 'Talente mit Belastung, AT, PA, AW und INI −3, GS −3.' },
			{ name: 'überlastet', effect: 'Handlungsunfähig, bis die Last fällt.' }
		],
		incapacitatesAtFour: true,
		decay: 'Endet, sobald die Last abgelegt ist.'
	},
	{
		id: 'paralyse',
		name: 'Paralyse',
		profile: 'bewegung',
		levels: [
			NONE,
			{ name: 'leicht versteift', effect: 'Proben mit Bewegung oder Sprache −1, GS 75 %.' },
			{ name: 'versteift', effect: 'Proben mit Bewegung oder Sprache −2, GS 50 %.' },
			{ name: 'kaum bewegungsfähig', effect: 'Proben mit Bewegung oder Sprache −3, GS 25 %.' },
			{ name: 'bewegungsunfähig', effect: 'Bewegungsunfähig.' }
		],
		incapacitatesAtFour: true,
		decay: '1 Stufe je halbe Stunde.'
	},
	{
		id: 'berauscht',
		name: 'Berauscht',
		profile: 'zechen',
		levels: [
			NONE,
			{ name: 'leicht berauscht', effect: 'Zechen −1.' },
			{ name: 'berauscht', effect: 'Zechen −2.' },
			{ name: 'stark berauscht', effect: 'Zechen −3.' },
			{ name: 'volltrunken', effect: 'Wird zu 1 Stufe Betäubung; 4 Stufen Berauscht entfallen.' }
		],
		incapacitatesAtFour: false,
		decay: '1 Stufe je 2 Stunden ohne Alkohol.'
	},
	{
		id: 'entrueckung',
		name: 'Entrückung',
		profile: 'entrueckung',
		levels: [
			{ name: 'nicht entrückt', effect: 'Keine Wirkung.' },
			{
				name: 'leicht entrückt',
				effect: 'Proben auf Talente und Zauber −1, sofern sie dem eigenen Gott nicht gefällig sind. Liturgien sind nicht betroffen.'
			},
			{
				name: 'entrückt',
				effect: 'Gottgefällige Proben auf Talente und Zauber +1, alle anderen −2. Liturgien sind nicht betroffen.'
			},
			{
				name: 'göttlich berührt',
				effect: 'Gottgefällige Proben auf Talente und Zauber +2, alle anderen −3. Liturgien sind nicht betroffen.'
			},
			{
				name: 'ein Werkzeug des Gottes',
				effect: 'Gottgefällige Proben auf Talente und Zauber +3, alle anderen −4. Liturgien sind nicht betroffen.'
			}
		],
		incapacitatesAtFour: false,
		decay: `Je ${DEVOTION_PER_LEVEL} KaP für Mirakel, Liturgien oder Zeremonien steigt die Stufe um 1. Ohne Karmaeinsatz sinkt sie stündlich um 1.`
	}
];

export const CONDITION_IDS: ConditionId[] = CONDITIONS.map(condition => condition.id);

const byId = new Map(CONDITIONS.map(condition => [condition.id, condition]));

export const conditionById = (id: ConditionId): Condition => byId.get(id)!;

export const clampConditionLevel = (value: number): number =>
	Math.min(CONDITION_MAX_LEVEL, Math.max(0, Math.round(value)));

export const emptyConditionLevels = (): Record<ConditionId, number> => ({
	schmerz: 0,
	betaeubung: 0,
	furcht: 0,
	verwirrung: 0,
	belastung: 0,
	paralyse: 0,
	berauscht: 0,
	entrueckung: 0
});
