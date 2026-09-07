import { useState } from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useCastingDomains } from '@/hooks/useCastingDomains';
import LiturgyRoll from './LiturgyRoll';
import SpellRoll from './SpellRoll';
import { Church, Wand2 } from 'lucide-react';

/** Der Wirken-Slot: ein System direkt, beide mit Umschalter. */
const CastingTab = () => {
	const { magic, karma } = useCastingDomains();
	const [domain, setDomain] = useState<'magic' | 'karma'>(magic ? 'magic' : 'karma');

	if (!(magic && karma)) return magic ? <SpellRoll /> : <LiturgyRoll />;

	return (
		<Tabs value={domain} onValueChange={(value) => setDomain(value as 'magic' | 'karma')}>
			<TabsList className="mx-auto mb-4 grid w-full max-w-xs grid-cols-2 bg-aventurian-100 dark:bg-aventurian-800">
				<TabsTrigger value="magic" className="gap-2 font-heading" aria-label="Magie">
					<Wand2 className="h-4 w-4" />
					Magie
				</TabsTrigger>
				<TabsTrigger value="karma" className="gap-2 font-heading" aria-label="Liturgie">
					<Church className="h-4 w-4" />
					Liturgie
				</TabsTrigger>
			</TabsList>
			<TabsContent value="magic" className="mt-0">
				<SpellRoll />
			</TabsContent>
			<TabsContent value="karma" className="mt-0">
				<LiturgyRoll />
			</TabsContent>
		</Tabs>
	);
};

export default CastingTab;
