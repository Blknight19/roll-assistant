import { ROMAN_LEVELS } from '@/data/conditions';
import { cn } from '@/lib/utils';

type LevelPickerProps = {
	/** Vorlesename der Gruppe, z. B. „Stufe Betäubung". */
	label: string;
	value: number;
	onChange: (level: number) => void;
};

/** Fünf Segmentknöpfe 0 · I · II · III · IV – ein Tipp setzt die Stufe. */
const LevelPicker = ({ label, value, onChange }: LevelPickerProps) => (
	<div role="group" aria-label={label} className="flex gap-1">
		{ROMAN_LEVELS.map((roman, level) => {
			const pressed = value === level;
			return (
				<button
					key={roman}
					type="button"
					aria-pressed={pressed}
					aria-label={`Stufe ${roman}`}
					onClick={() => onChange(level)}
					className={cn(
						'min-h-11 min-w-11 flex-1 rounded-md border font-heading text-sm transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring',
						pressed
							? 'border-amber-600 bg-amber-500/15 font-semibold text-amber-800 dark:text-amber-300'
							: 'border-parchment-300 bg-card hover:bg-parchment-100/60 dark:border-parchment-700 dark:hover:bg-parchment-800/60'
					)}
				>
					{roman}
				</button>
			);
		})}
	</div>
);

export default LevelPicker;
