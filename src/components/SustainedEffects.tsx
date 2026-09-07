import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { useSustained } from '@/hooks/useSustained';
import { Church, Timer, Wand2, X } from 'lucide-react';

/** Gemeinsame Liste laufender Zauber und Liturgien – in beiden Wirken-Tabs dieselbe. */
const SustainedEffects = () => {
	const { entries, end } = useSustained();
	if (entries.length === 0) return null;

	return (
		<Card variant="parchment">
			<CardHeader className="pb-3">
				<CardTitle className="flex items-center gap-2 text-lg">
					<Timer className="h-5 w-5 text-parchment-600 dark:text-parchment-400" />
					Laufende Effekte
				</CardTitle>
			</CardHeader>
			<CardContent className="space-y-2">
				{entries.map(entry => {
					const Icon = entry.kind === 'zauber' ? Wand2 : Church;
					const tone = entry.kind === 'zauber'
						? 'text-magic-dark dark:text-magic-light'
						: 'text-karma-dark dark:text-karma-light';
					return (
						<div
							key={`${entry.kind}-${entry.id}`}
							className="flex items-center gap-3 rounded-lg bg-parchment-100/50 px-3 py-2 dark:bg-parchment-800/50"
						>
							<Icon
								className={`h-4 w-4 shrink-0 ${tone}`}
								aria-label={entry.kind === 'zauber' ? 'Zauber' : 'Liturgie'}
							/>
							<span className="min-w-0 flex-1 truncate font-heading text-sm">{entry.name}</span>
							<span className="whitespace-nowrap text-xs text-muted-foreground">QS {entry.qs}</span>
							<Button
								variant="ghost"
								size="icon"
								onClick={() => end(entry)}
								aria-label={`${entry.name} beenden`}
							>
								<X className="h-4 w-4" />
							</Button>
						</div>
					);
				})}
				<p className="pt-1 text-xs text-muted-foreground">
					Jeder laufende Zauber und jede laufende Liturgie erschwert weitere Zauber- und
					Liturgieproben um 1.
				</p>
			</CardContent>
		</Card>
	);
};

export default SustainedEffects;
