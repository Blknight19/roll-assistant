import { useSelector } from 'react-redux';
import type { RootState } from '@/store';
import { Church, Sparkles, Wand2, type LucideIcon } from 'lucide-react';

/**
 * Magie und Liturgie teilen sich einen Tab-Slot: die Leiste ist bei sechs Tabs gemessen
 * voll (53 px je Tab bei 360 px, „Historie" braucht 49 px). Label und Icon hängen davon
 * ab, welche der beiden Fähigkeiten der Held hat.
 */
export const useCastingDomains = () => {
	const magic = useSelector((state: RootState) => state.spellbook.isSpellcaster);
	const karma = useSelector((state: RootState) => state.karma.isBlessed);
	const both = magic && karma;

	const tabLabel = both ? 'Wirken' : karma ? 'Liturgie' : 'Magie';
	const bookLabel = both ? 'Wirken' : karma ? 'Liturgien' : 'Zauberbuch';
	const icon: LucideIcon = both ? Sparkles : karma ? Church : Wand2;

	return { magic, karma, any: magic || karma, tabLabel, bookLabel, icon };
};
