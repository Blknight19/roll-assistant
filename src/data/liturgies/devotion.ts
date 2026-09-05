/**
 * Entrückung: „Für jeweils 10 volle Karmapunkte, die bei Mirakeln, Liturgien oder
 * Zeremonien frei werden, erhält er eine Stufe des Zustands Entrückung." Der Zustand
 * wirkt auf Talente und Zauber, nicht auf Liturgien. Die App führt ihn als Anzeige: sie
 * rechnet ihn in keine Probe ein und leitet die Stufe auch nicht aus den gebuchten KaP
 * her – Mirakel und Intervallkosten laufen an ihr vorbei, ein Zähler wäre unvollständig.
 */
export const DEVOTION_PER_LEVEL = 10;
export const DEVOTION_MAX_LEVEL = 4;

export type DevotionLevel = {
	roman: string;
	name: string;
	/** Modifikator auf gottgefällige Proben auf Talente und Zauber. */
	favoured: number;
	/** Modifikator auf alle übrigen Proben auf Talente und Zauber. */
	other: number;
	effect: string;
};

/** Namen, Zahlen und Wirkungen nach dem Regelwiki, Index = Stufe. */
export const DEVOTION_LEVELS: DevotionLevel[] = [
	{
		roman: '0',
		name: 'nicht entrückt',
		favoured: 0,
		other: 0,
		effect: 'Keine Wirkung.'
	},
	{
		roman: 'I',
		name: 'leicht entrückt',
		favoured: 0,
		other: -1,
		effect: 'Proben auf Talente und Zauber −1, sofern sie dem eigenen Gott nicht gefällig sind. Liturgien sind nicht betroffen.'
	},
	{
		roman: 'II',
		name: 'entrückt',
		favoured: 1,
		other: -2,
		effect: 'Gottgefällige Proben auf Talente und Zauber +1, alle anderen −2. Liturgien sind nicht betroffen.'
	},
	{
		roman: 'III',
		name: 'göttlich berührt',
		favoured: 2,
		other: -3,
		effect: 'Gottgefällige Proben auf Talente und Zauber +2, alle anderen −3. Liturgien sind nicht betroffen.'
	},
	{
		roman: 'IV',
		name: 'ein Werkzeug des Gottes',
		favoured: 3,
		other: -4,
		effect: 'Gottgefällige Proben auf Talente und Zauber +3, alle anderen −4. Liturgien sind nicht betroffen.'
	}
];

export const clampDevotionLevel = (value: number): number =>
	Math.min(DEVOTION_MAX_LEVEL, Math.max(0, Math.round(value)));
