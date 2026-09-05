import { useDispatch, useSelector } from 'react-redux';
import type { RootState } from '@/store';
import { removeKarmaUpkeep } from '@/store/karmaSlice';
import { removeUpkeep } from '@/store/spellbookSlice';
import { upkeepModifier } from '@/utils/rules';

export type SustainedEntry = {
	id: string;
	name: string;
	qs: number;
	kind: 'zauber' | 'liturgie';
};

/**
 * Laufende Zauber und Liturgien als eine Liste. Der Malus zählt beide: laut Regelwerk
 * erschwert jeder aufrechterhaltene Zauber und jede aufrechterhaltene Liturgie alle
 * weiteren Zauber- und Liturgieproben um 1. Talente sind ausgenommen.
 */
export const useSustained = () => {
	const dispatch = useDispatch();
	const spells = useSelector((state: RootState) => state.spellbook.upkeep);
	const liturgies = useSelector((state: RootState) => state.karma.upkeep);

	const entries: SustainedEntry[] = [
		...spells.map(entry => ({
			id: entry.id,
			name: entry.spellName,
			qs: entry.qs,
			kind: 'zauber' as const
		})),
		...liturgies.map(entry => ({
			id: entry.id,
			name: entry.spellName,
			qs: entry.qs,
			kind: 'liturgie' as const
		}))
	];

	const count = entries.length;
	const modifier = upkeepModifier(count);
	const note = count > 0
		? `${modifier} durch ${count} ${count === 1 ? 'laufenden Effekt' : 'laufende Effekte'}`
		: undefined;

	const end = (entry: SustainedEntry) => {
		dispatch(entry.kind === 'zauber' ? removeUpkeep(entry.id) : removeKarmaUpkeep(entry.id));
	};

	return { entries, count, modifier, note, end };
};
