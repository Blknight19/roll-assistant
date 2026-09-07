import type { AttributeKey } from '@/store/attributesSlice';

/** Klassen, die eine Probe kennen und sich darum als Zauberbucheintrag führen lassen. */
export type SpellClass = 'zauber' | 'ritual' | 'hexenfluch';

/**
 * Regelwissen, nicht Charakterdaten: unveränderlich, nicht persistiert, nicht
 * exportiert. Beim Übernehmen ins Zauberbuch wird ein Eintrag kopiert – der Spieler
 * darf danach alles überschreiben, und eine .held-Datei bleibt lesbar, auch wenn sich
 * dieser Katalog später ändert.
 *
 * Die Dateien neben dieser erzeugt `scripts/import-spells`. Änderungen von Hand gehen
 * beim nächsten Lauf verloren – dauerhafte Abweichungen gehören in dessen
 * `korrekturen.mjs`.
 */
export type SpellCatalogEntry = {
	id: string;
	klasse: SpellClass;
	name: string;
	attributes: [AttributeKey, AttributeKey, AttributeKey];
	/** Zusatz zur Probe, z. B. „modifiziert durch ZK". Reine Anzeige. */
	probeNote?: string;
	/** Kosten als Zahl – null, wenn das Regelwerk eine Formel angibt. */
	cost: number | null;
	/** Kostenangabe im Wortlaut. Bleibt im Zauberbuch als Erinnerung stehen. */
	costText: string;
	/** Fehlt bei Hexenflüchen: das Regelwerk nennt für sie keine Zauberdauer. */
	castTime?: string;
	/** Fehlt bei Hexenflüchen. */
	range?: string;
	/** Nur „aufrechterhaltend" lässt sich aufrechterhalten; jede feste Dauer läuft von selbst ab. */
	duration: string;
	/** Fehlt bei Hexenflüchen. */
	target?: string;
	merkmal: string;
	/**
	 * Traditionen, denen der Zauber offensteht – Filter der Katalogsuche. Hexenflüche
	 * führen keine, weil sie ausschließlich Hexen offenstehen.
	 */
	verbreitung?: string[];
};
