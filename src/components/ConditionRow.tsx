import LevelPicker from './LevelPicker';
import { ROMAN_LEVELS, type Condition } from '@/data/conditions';

type ConditionRowProps = {
	condition: Condition;
	/** Gespeicherte Stufe – bei Schmerz die Zusatzstufe. */
	value: number;
	/** Wirksame Stufe – bei Schmerz inklusive LeP-Anteil und Zäher Hund. */
	effective: number;
	pickerLabel: string;
	/** Rechts neben dem Namen, z. B. „aus LeP: II (15 / 30)". */
	hint?: string;
	onChange: (level: number) => void;
};

const ConditionRow = ({ condition, value, effective, pickerLabel, hint, onChange }: ConditionRowProps) => {
	const current = condition.levels[effective];
	return (
		<div className="space-y-2 rounded-lg bg-parchment-100/50 p-3 dark:bg-parchment-800/50">
			<div className="flex flex-wrap items-baseline justify-between gap-x-3 gap-y-1">
				<span className="font-heading font-semibold">{condition.name}</span>
				{hint && <span className="text-xs text-muted-foreground">{hint}</span>}
			</div>
			<LevelPicker label={pickerLabel} value={value} onChange={onChange} />
			<p className="text-sm" aria-live="polite">
				<span className="font-semibold">{ROMAN_LEVELS[effective]} – {current.name}</span>
				<span className="text-muted-foreground">: {current.effect}</span>
			</p>
			<p className="text-xs text-muted-foreground">{condition.decay}</p>
		</div>
	);
};

export default ConditionRow;
