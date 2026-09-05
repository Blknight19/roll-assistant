import { useState } from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useCastingDomains } from '@/hooks/useCastingDomains';
import LiturgyBook from './LiturgyBook';
import Spellbook from './Spellbook';
import { BookOpen, Church } from 'lucide-react';

/** Derselbe Slot im Charakterbogen: ein Buch direkt, beide mit Umschalter. */
const CastingBooks = () => {
	const { magic, karma } = useCastingDomains();
	const [domain, setDomain] = useState<'magic' | 'karma'>(magic ? 'magic' : 'karma');

	if (!(magic && karma)) return magic ? <Spellbook /> : <LiturgyBook />;

	return (
		<Tabs value={domain} onValueChange={(value) => setDomain(value as 'magic' | 'karma')}>
			<TabsList className="mx-auto mb-4 grid w-full max-w-xs grid-cols-2">
				<TabsTrigger value="magic" className="gap-2 font-heading" aria-label="Zauberbuch">
					<BookOpen className="h-4 w-4" />
					Zauberbuch
				</TabsTrigger>
				<TabsTrigger value="karma" className="gap-2 font-heading" aria-label="Liturgien">
					<Church className="h-4 w-4" />
					Liturgien
				</TabsTrigger>
			</TabsList>
			<TabsContent value="magic" className="mt-0">
				<Spellbook />
			</TabsContent>
			<TabsContent value="karma" className="mt-0">
				<LiturgyBook />
			</TabsContent>
		</Tabs>
	);
};

export default CastingBooks;
