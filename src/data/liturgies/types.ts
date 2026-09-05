import type { AttributeKey } from '@/store/attributesSlice';

export type LiturgyClass = 'liturgie' | 'zeremonie' | 'segen';

/**
 * Regelwissen, nicht Charakterdaten – unveränderlich, nicht persistiert. Erzeugt von
 * `scripts/import-spells`; dauerhafte Abweichungen gehören in dessen `korrekturen.mjs`.
 */
export type LiturgyCatalogEntry = {
	id: string;
	klasse: LiturgyClass;
	name: string;
	/** Fehlt bei Segen: sie kennen keine Probe. */
	attributes?: [AttributeKey, AttributeKey, AttributeKey];
	/** Zusatz zur Probe, z. B. „modifiziert durch SK". Reine Anzeige. */
	probeNote?: string;
	/** Zahl, wenn die Quelle genau einen Betrag nennt; Segen kosten immer 1. */
	cost: number | null;
	costText: string;
	/** Liturgiedauer in Aktionen, Zeremoniedauer in Minuten/Stunden, Segen „1 Aktion". */
	castTime: string;
	range?: string;
	/** Nur „aufrechterhaltend" lässt sich aufrechterhalten. */
	duration: string;
	target?: string;
	/** Paare „Gott (Aspekt)", „Allgemein" oder „Allgemein-Schamanenritus". */
	verbreitung: string[];
};
