import type { ActiveCondition } from '@/hooks/useConditions';
import { cn } from '@/lib/utils';

type ConditionBadgesProps = { active: ActiveCondition[]; incapacitated: boolean };

/** Ein Abzeichen je aktivem Zustand – reine Anzeige, der Dialog hängt am Knopf daneben. */
const ConditionBadges = ({ active, incapacitated }: ConditionBadgesProps) => {
	if (active.length === 0) return null;
	return (
		<>
			{incapacitated && (
				<span className="max-w-full break-words rounded-full border border-failure bg-failure/10 px-2 py-0.5 font-heading text-xs font-semibold text-failure-dark dark:text-failure-light">
					{/* Weiches Trennzeichen an der Wortfuge: in der schmalen Spalte bricht das
					    Wort sonst mitten im Stamm um. */}
					{'Handlungs­unfähig'}
				</span>
			)}
			{active.map(entry => (
				<span
					key={entry.id}
					className={cn(
						'max-w-full break-words rounded-full border px-2 py-0.5 font-heading text-xs font-semibold',
						entry.id === 'entrueckung'
							? 'border-karma text-karma-dark dark:text-karma-light'
							: 'border-amber-600/60 text-amber-700 dark:text-amber-400'
					)}
				>
					{entry.name} {entry.roman}
				</span>
			))}
		</>
	);
};

export default ConditionBadges;
