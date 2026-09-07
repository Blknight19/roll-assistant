import { LITURGIEN } from './liturgien';
import { SEGEN } from './segen';
import type { LiturgyCatalogEntry } from './types';
import { ZEREMONIEN } from './zeremonien';

export type { LiturgyCatalogEntry, LiturgyClass } from './types';

export const LITURGY_CATALOG: LiturgyCatalogEntry[] = [...LITURGIEN, ...ZEREMONIEN, ...SEGEN].sort(
	(a, b) => a.name.localeCompare(b.name, 'de')
);

/** „Praios (Ordnung)" → „Praios"; Einträge ohne Klammer bleiben, wie sie sind. */
export const traditionOf = (pair: string): string => pair.replace(/\s*\([^)]*\)\s*$/, '').trim();

const ALLGEMEIN = new Set(['Allgemein', 'Allgemein-Schamanenritus']);

/** Götter und Traditionen, die im Katalog vorkommen – Filter des Liturgienbuchs. */
export const TRADITIONEN = [
	...new Set(
		LITURGY_CATALOG.flatMap(entry => entry.verbreitung.map(traditionOf)).filter(
			name => !ALLGEMEIN.has(name)
		)
	)
].sort((a, b) => a.localeCompare(b, 'de'));

/** Ob ein Eintrag der Tradition offensteht; „Allgemein" steht allen Nicht-Schamanen offen. */
export const passtZurTradition = (entry: LiturgyCatalogEntry, tradition: string): boolean =>
	entry.verbreitung.some(pair => pair === 'Allgemein' || traditionOf(pair) === tradition);
