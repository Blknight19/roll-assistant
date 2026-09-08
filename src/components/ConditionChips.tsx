import { cn } from '@/lib/utils';

export type ConditionChip = { id: string; label: string; pressed: boolean; onToggle: () => void };

/** Entscheidungen, die die App nicht treffen kann: gilt die Belastung, ist die Probe gottgefällig. */
const ConditionChips = ({ chips }: { chips: ConditionChip[] }) => {
	if (chips.length === 0) return null;
	return (
		<div>
			<p className="mb-1 text-xs font-semibold uppercase tracking-wide text-muted-foreground">Zustände</p>
			<div className="flex flex-wrap gap-2">
				{chips.map(chip => (
					<button
						key={chip.id}
						type="button"
						aria-pressed={chip.pressed}
						onClick={chip.onToggle}
						className={cn(
							'min-h-11 rounded-full border px-3 py-1.5 font-body text-sm transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring',
							chip.pressed
								? 'border-amber-600 bg-amber-500/15 text-amber-800 dark:text-amber-300'
								: 'border-parchment-300 bg-card hover:bg-parchment-100/60 dark:border-parchment-700 dark:hover:bg-parchment-800/60'
						)}
					>
						{chip.label}
					</button>
				))}
			</div>
		</div>
	);
};

export default ConditionChips;
