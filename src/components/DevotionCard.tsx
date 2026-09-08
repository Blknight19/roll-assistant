import { useDispatch, useSelector } from 'react-redux';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import PropertyNumber from './PropertyNumber';
import type { RootState } from '@/store';
import { setConditionLevel } from '@/store/conditionsSlice';
import {
	CONDITION_MAX_LEVEL, DEVOTION_PER_LEVEL, DEVOTION_TABLE, ROMAN_LEVELS, conditionById
} from '@/data/conditions';
import { signedModifier } from '@/utils/format';
import { Flame } from 'lucide-react';

const ENTRUECKUNG = conditionById('entrueckung');

/**
 * Entrückung entsteht beim Wirken und wirkt woanders – auf Talente und Zauber. Die Karte
 * steht dort, wo sie entsteht; gestellt wird die Stufe hier oder im Zustände-Dialog.
 */
const DevotionCard = () => {
	const dispatch = useDispatch();
	const level = useSelector((state: RootState) => state.conditions.levels.entrueckung);
	const current = ENTRUECKUNG.levels[level];

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
						max={CONDITION_MAX_LEVEL}
						size="s"
						ariaLabel="Stufe der Entrückung"
						onChange={(value) => dispatch(setConditionLevel({ id: 'entrueckung', level: value }))}
					/>
					<div className="text-center" aria-live="polite">
						<p className="font-heading text-sm font-semibold uppercase tracking-wide text-karma-dark dark:text-karma-light">
							{ROMAN_LEVELS[level]} – {current.name}
						</p>
						<p className="mt-1 text-sm text-muted-foreground">{current.effect}</p>
					</div>
				</div>

				<table className="w-full text-sm">
					<caption className="sr-only">Wirkung der Entrückungsstufen</caption>
					<thead>
						<tr className="border-b border-parchment-300 dark:border-parchment-700">
							<th scope="col" className="p-2 text-left font-heading">Stufe</th>
							<th scope="col" className="p-2 text-center font-heading">Gefällig</th>
							<th scope="col" className="p-2 text-center font-heading">Sonst</th>
						</tr>
					</thead>
					<tbody>
						{DEVOTION_TABLE.slice(1).map((row, index) => {
							const stufe = index + 1;
							return (
								<tr
									key={stufe}
									className={stufe === level
										? 'bg-karma/10 font-semibold text-karma-dark dark:text-karma-light'
										: ''}
								>
									<th scope="row" className="p-2 text-left font-heading font-normal">
										{ROMAN_LEVELS[stufe]}{' '}
										<span className="text-xs text-muted-foreground">{ENTRUECKUNG.levels[stufe].name}</span>
									</th>
									<td className="p-2 text-center tabular-nums">
										{row.favoured === 0 ? '±0' : signedModifier(row.favoured)}
									</td>
									<td className="p-2 text-center tabular-nums">{signedModifier(row.other)}</td>
								</tr>
							);
						})}
					</tbody>
				</table>

				<p className="text-xs text-muted-foreground">
					Je {DEVOTION_PER_LEVEL} KaP, die für Mirakel, Liturgien oder Zeremonien ausgegeben
					werden, steigt die Stufe um 1. Ohne Karmaeinsatz sinkt sie stündlich um 1. Die App
					rechnet die Stufe in Talent- und Zauberproben ein; ob eine Probe gottgefällig ist,
					sagt der Chip an der Probe.
				</p>
			</CardContent>
		</Card>
	);
};

export default DevotionCard;
