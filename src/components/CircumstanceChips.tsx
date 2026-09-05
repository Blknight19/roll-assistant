import {
	CIRCUMSTANCES, CIRCUMSTANCE_GROUPS, costLocked, maxModifications, type Circumstance
} from '@/data/liturgies/circumstances';
import type { LiturgyBookClass } from '@/store/karmaSlice';
import { signedModifier } from '@/utils/format';
import { cn } from '@/lib/utils';

type CircumstanceChipsProps = {
	klasse: LiturgyBookClass;
	fw: number;
	costText?: string;
	active: string[];
	onToggle: (id: string) => void;
};

/** Benannte Modifikatoren als Umschaltknöpfe; ihre Summe fließt in den automatischen Modifikator. */
const CircumstanceChips = ({ klasse, fw, costText, active, onToggle }: CircumstanceChipsProps) => {
	const allowed = maxModifications(fw);
	const chosenMods = active.filter(
		id => CIRCUMSTANCES.find(c => c.id === id)?.group === 'modifikation'
	).length;
	const locked = costLocked(costText);

	const isDisabled = (circumstance: Circumstance) => {
		if (active.includes(circumstance.id)) return false;
		if (circumstance.group === 'modifikation' && chosenMods >= allowed) return true;
		if (circumstance.costFactor !== undefined && locked) return true;
		return false;
	};

	return (
		<div className="space-y-3">
			{CIRCUMSTANCE_GROUPS.map(group => {
				const items = CIRCUMSTANCES.filter(
					c => c.group === group.group && c.appliesTo.includes(klasse)
				);
				if (items.length === 0) return null;

				const hint = group.group === 'modifikation'
					? `bis zu ${allowed} wählbar (je 4 FW eine)${locked ? ', Kosten nicht modifizierbar' : ''}`
					: group.exclusive ? 'nur einer gilt' : undefined;

				return (
					<div key={group.group}>
						<p className="mb-1 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
							{group.label}
							{hint && <span className="font-normal normal-case"> – {hint}</span>}
						</p>
						<div className="flex flex-wrap gap-2">
							{items.map(circumstance => {
								const pressed = active.includes(circumstance.id);
								const disabled = isDisabled(circumstance);
								return (
									<button
										key={circumstance.id}
										type="button"
										aria-pressed={pressed}
										aria-disabled={disabled || undefined}
										onClick={() => { if (!disabled) onToggle(circumstance.id); }}
										className={cn(
											'min-h-11 rounded-full border px-3 py-1.5 font-body text-sm transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring',
											pressed
												? 'border-karma bg-karma/15 text-karma-dark dark:text-karma-light'
												: 'border-aventurian-300 bg-card hover:bg-aventurian-100/60 dark:border-aventurian-700 dark:hover:bg-aventurian-800/60',
											disabled && 'cursor-not-allowed opacity-50'
										)}
									>
										{circumstance.label}{' '}
										<span className="font-heading tabular-nums">
											{signedModifier(circumstance.modifier)}
										</span>
									</button>
								);
							})}
						</div>
					</div>
				);
			})}
		</div>
	);
};

export default CircumstanceChips;
