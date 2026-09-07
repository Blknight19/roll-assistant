import type { LiturgyClass } from './types';

export type CircumstanceGroup = 'modifikation' | 'technik' | 'ort' | 'zeit' | 'sonstiges';

/** Ein benannter Modifikator der Liturgie-/Zeremonieprobe. Werte laut Regelwiki. */
export type Circumstance = {
	id: string;
	label: string;
	/** Buch-Konvention: negativ = Erschwernis, positiv = Erleichterung. */
	modifier: number;
	group: CircumstanceGroup;
	appliesTo: Exclude<LiturgyClass, 'segen'>[];
	/** Erzwingen hebt die Kosten eine Stufe (×2), Kosten senken senkt sie eine Stufe (÷2). */
	costFactor?: 2 | 0.5;
};

const BEIDE: Circumstance['appliesTo'] = ['liturgie', 'zeremonie'];
const NUR_LITURGIE: Circumstance['appliesTo'] = ['liturgie'];
const NUR_ZEREMONIE: Circumstance['appliesTo'] = ['zeremonie'];

export const CIRCUMSTANCE_GROUPS: {
	group: CircumstanceGroup;
	label: string;
	exclusive: boolean;
}[] = [
	{ group: 'modifikation', label: 'Modifikationen', exclusive: false },
	{ group: 'technik', label: 'Technik', exclusive: false },
	{ group: 'ort', label: 'Ort', exclusive: true },
	{ group: 'zeit', label: 'Zeit', exclusive: true },
	{ group: 'sonstiges', label: 'Sonstiges', exclusive: false }
];

export const CIRCUMSTANCES: Circumstance[] = [
	{ id: 'mod-erzwingen', label: 'Erzwingen (Kosten +1 Stufe)', modifier: 1, group: 'modifikation', appliesTo: BEIDE, costFactor: 2 },
	{ id: 'mod-kosten-senken', label: 'Kosten senken (−1 Stufe)', modifier: -1, group: 'modifikation', appliesTo: BEIDE, costFactor: 0.5 },
	{ id: 'mod-reichweite', label: 'Reichweite erhöhen', modifier: -1, group: 'modifikation', appliesTo: BEIDE },
	{ id: 'mod-dauer-erhoehen', label: 'Dauer erhöhen', modifier: 1, group: 'modifikation', appliesTo: BEIDE },
	{ id: 'mod-dauer-senken', label: 'Dauer senken', modifier: -1, group: 'modifikation', appliesTo: BEIDE },

	{ id: 'technik-ohne-gebet', label: 'Ohne Gebet', modifier: -2, group: 'technik', appliesTo: NUR_LITURGIE },
	{ id: 'technik-ohne-geste', label: 'Ohne Geste', modifier: -2, group: 'technik', appliesTo: NUR_LITURGIE },

	{ id: 'ort-heiligtum', label: 'Heiligtum oder magischer Ort', modifier: 1, group: 'ort', appliesTo: NUR_ZEREMONIE },
	{ id: 'ort-tempel', label: 'Tempel der Gottheit (geweihter Boden)', modifier: 1, group: 'ort', appliesTo: NUR_ZEREMONIE },
	{ id: 'ort-fremdes-pantheon', label: 'Tempel eines Gottes außerhalb des eigenen Pantheons', modifier: -1, group: 'ort', appliesTo: NUR_ZEREMONIE },
	{ id: 'ort-feindselig', label: 'Tempel eines feindseligen Gottes', modifier: -2, group: 'ort', appliesTo: NUR_ZEREMONIE },
	{ id: 'ort-erzdaemon', label: 'Unheiligtum eines Erzdämonen', modifier: -3, group: 'ort', appliesTo: NUR_ZEREMONIE },
	{ id: 'ort-namenloser', label: 'Unheiligtum oder Tempel des Namenlosen', modifier: -4, group: 'ort', appliesTo: NUR_ZEREMONIE },
	{ id: 'ort-gegenspieler', label: 'Unheiligtum des Gegenspielers der eigenen Gottheit', modifier: -5, group: 'ort', appliesTo: NUR_ZEREMONIE },

	{ id: 'zeit-monat', label: 'Monat des eigenen Gottes', modifier: 1, group: 'zeit', appliesTo: NUR_ZEREMONIE },
	{ id: 'zeit-feiertag', label: 'Feiertag des eigenen Gottes', modifier: 2, group: 'zeit', appliesTo: NUR_ZEREMONIE },
	{ id: 'zeit-namenlose-tage', label: 'Namenlose Tage', modifier: -5, group: 'zeit', appliesTo: NUR_ZEREMONIE },

	{ id: 'sonst-zeremonialgegenstand', label: 'Zeremonialgegenstand mit Objektweihe', modifier: 1, group: 'sonstiges', appliesTo: NUR_ZEREMONIE }
];

const byId = new Map(CIRCUMSTANCES.map(c => [c.id, c]));

export const circumstanceModifier = (ids: string[]): number =>
	ids.reduce((sum, id) => sum + (byId.get(id)?.modifier ?? 0), 0) || 0;

/** In exklusiven Gruppen (Ort, Zeit) ersetzt ein Umstand den vorherigen derselben Gruppe. */
export const toggleCircumstance = (active: string[], id: string): string[] => {
	if (active.includes(id)) return active.filter(entry => entry !== id);
	const next = byId.get(id);
	if (!next) return active;
	const exclusive = CIRCUMSTANCE_GROUPS.find(g => g.group === next.group)?.exclusive ?? false;
	const kept = exclusive ? active.filter(entry => byId.get(entry)?.group !== next.group) : active;
	return [...kept, id];
};

/** Kosten nach Modifikationen; Kosten senken fällt nie unter 1 KaP. */
export const costWithCircumstances = (cost: number, ids: string[]): number => {
	if (cost <= 0) return 0;
	let result = cost;
	for (const id of ids) {
		const factor = byId.get(id)?.costFactor;
		if (factor === 2) result *= 2;
		if (factor === 0.5) result = Math.max(1, Math.ceil(result / 2));
	}
	return result;
};

/** „Für jeweils 4 volle Punkte im Fertigkeitswert kann der Held eine Liturgiemodifikation anwenden." */
export const maxModifications = (fw: number): number => Math.max(0, Math.floor(fw / 4));

/** Die Quelle markiert Einträge, deren Kosten sich weder senken noch erzwingen lassen. */
export const costLocked = (costText?: string): boolean => /nicht modifizierbar/i.test(costText ?? '');
