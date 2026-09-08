import type { ActiveCondition } from '@/hooks/useConditions';
import { cn } from '@/lib/utils';
import { Activity } from 'lucide-react';

type ConditionBadgesProps = { active: ActiveCondition[]; incapacitated: boolean };

/** Inhalt des HeroBar-Auslösers: ein Abzeichen je aktivem Zustand, sonst nur das Icon. */
const ConditionBadges = ({ active, incapacitated }: ConditionBadgesProps) => {
	if (active.length === 0) return <Activity className="h-5 w-5 text-muted-foreground" aria-hidden />;
	return (
		<>
			{incapacitated && (
				<span className="rounded-full border border-failure bg-failure/10 px-2 py-0.5 font-heading text-xs font-semibold text-failure-dark dark:text-failure-light">
					Handlungsunfähig
				</span>
			)}
			{active.map(entry => (
				<span
					key={entry.id}
					className={cn(
						'rounded-full border px-2 py-0.5 font-heading text-xs font-semibold',
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
