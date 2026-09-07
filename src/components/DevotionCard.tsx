import { useDispatch, useSelector } from 'react-redux';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import PropertyNumber from './PropertyNumber';
import type { RootState } from '@/store';
import { setDevotionLevel } from '@/store/karmaSlice';
import { DEVOTION_LEVELS, DEVOTION_MAX_LEVEL, DEVOTION_PER_LEVEL } from '@/data/liturgies/devotion';
import { signedModifier } from '@/utils/format';
import { Flame } from 'lucide-react';

/**
 * Entrückung entsteht nebenbei und wirkt woanders – auf Talente und Zauber, nicht auf
 * Liturgien. Die Karte hält die Stufe und erklärt sie; sie rechnet nichts in eine Probe
 * ein, weil die App nicht weiß, welche Probe der eigenen Gottheit gefällig ist.
 */
const DevotionCard = () => {
	const dispatch = useDispatch();
	const level = useSelector((state: RootState) => state.karma.devotionLevel);
	const current = DEVOTION_LEVELS[level];

	return (
		<Card variant="parchment">
			<CardHeader className="pb-3">
				<CardTitle className="flex items-center gap-2 text-lg">
					<Flame className="h-5 w-5 text-karma-dark dark:text-karma-light" />
					Entrückung
				</CardTitle>
			</CardHeader>
			<CardContent className="space-y-4">
				<div className="flex flex-col items-center gap-3">
					<PropertyNumber
						label="Stufe"
						value={level}
						max={DEVOTION_MAX_LEVEL}
						size="s"
						ariaLabel="Stufe der Entrückung"
						onChange={(value) => dispatch(setDevotionLevel(value))}
					/>
					<div className="text-center" aria-live="polite">
						<p className="font-heading text-sm font-semibold uppercase tracking-wide text-karma-dark dark:text-karma-light">
							{current.roman} – {current.name}
						</p>
						<p className="mt-1 text-sm text-muted-foreground">{current.effect}</p>
					</div>
				</div>

				<table className="w-full text-sm">
					<caption className="sr-only">Wirkung der Entrückungsstufen</caption>
					<thead>
						<tr className="border-b border-aventurian-300 dark:border-aventurian-700">
							<th scope="col" className="p-2 text-left font-heading">Stufe</th>
							<th scope="col" className="p-2 text-center font-heading">Gefällig</th>
							<th scope="col" className="p-2 text-center font-heading">Sonst</th>
						</tr>
					</thead>
					<tbody>
						{DEVOTION_LEVELS.slice(1).map((entry, index) => (
							<tr
								key={entry.roman}
								className={index + 1 === level
									? 'bg-karma/10 font-semibold text-karma-dark dark:text-karma-light'
									: ''}
							>
								<th scope="row" className="p-2 text-left font-heading font-normal">
									{entry.roman}{' '}
									<span className="text-xs text-muted-foreground">{entry.name}</span>
								</th>
								<td className="p-2 text-center tabular-nums">
									{entry.favoured === 0 ? '±0' : signedModifier(entry.favoured)}
								</td>
								<td className="p-2 text-center tabular-nums">{signedModifier(entry.other)}</td>
							</tr>
						))}
					</tbody>
				</table>

				<p className="text-xs text-muted-foreground">
					Je {DEVOTION_PER_LEVEL} KaP, die für Mirakel, Liturgien oder Zeremonien ausgegeben
					werden, steigt die Stufe um 1. Ohne Karmaeinsatz sinkt sie stündlich um 1. Die
					Modifikatoren gelten für Talente und Zauber, nicht für Liturgien.
				</p>
			</CardContent>
		</Card>
	);
};

export default DevotionCard;
