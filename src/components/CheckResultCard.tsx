import type { ReactNode } from 'react';
import RollResultCard, { type ResultDie } from './RollResultCard';
import { modifierTerm } from '@/utils/format';
import type { TalentCheckResult } from '@/utils/rules';
import type { AttributeKey } from '@/store/attributesSlice';
import { Skull, Sparkles } from 'lucide-react';

export type CheckEntry = { attribute: AttributeKey; value: number };

type CheckResultCardProps = {
	/** Name der Probe – Talent oder Zauber. */
	name: string;
	entries: CheckEntry[];
	modifier: number;
	taw: number;
	/** „Talentwert" oder „Fertigkeitswert" – die Rechnung ist dieselbe. */
	tawLabel: string;
	result: TalentCheckResult;
	/** Zustandsposten, unter der Rechnung: „Schmerz II −2, Furcht I −1". */
	note?: string;
	/** Regelfolge in einem Satz. Überschreibt den Krit-Standardtext. */
	consequence?: string;
	action?: ReactNode;
};

const dieTone = (value: number): ResultDie['tone'] => {
	if (value === 1) return 'critical';
	if (value === 20) return 'failure';
	return 'default';
};

/** Ergebnis in einem Satz – für die `aria-live`-Region. */
export const checkSummary = (result: TalentCheckResult): string => {
	if (result.special === 'krit') return `Kritischer Erfolg, Qualitätsstufe ${result.qs}`;
	if (result.special === 'patzer') return 'Patzer';
	return result.success ? `Erfolg, Qualitätsstufe ${result.qs}` : 'Misslungen';
};

const CheckResultCard = ({
	name,
	entries,
	modifier,
	taw,
	tawLabel,
	result,
	note,
	consequence,
	action
}: CheckResultCardProps) => (
	<RollResultCard
		tone={result.special === 'krit' ? 'critical' : result.success ? 'success' : 'failure'}
		title={
			result.special === 'krit' ? 'Kritischer Erfolg!' :
			result.special === 'patzer' ? 'Patzer!' :
			`${name}${result.success ? ' – Erfolg' : ' – Misslungen'}`
		}
		icon={
			result.special === 'krit' ? <Sparkles className="h-6 w-6 animate-glow" /> :
			result.special === 'patzer' ? <Skull className="h-6 w-6 shake-error" /> :
			undefined
		}
		hero={
			result.success
				? {
					value: result.qs,
					caption: 'Qualitätsstufe',
					// Ein Krit gelingt auch mit negativen FP – „−2 FP übrig" unter
					// einem Erfolg zu zeigen wäre irreführend.
					note: result.fp >= 0 ? `${result.fp} FP übrig` : 'ohne FP-Reserve gelungen'
				}
				: {
					value: result.fp,
					caption: 'Fertigkeitspunkte',
					note: result.special === 'patzer'
						? 'Zwei Zwanzigen. Die Probe misslingt unabhängig von den FP.'
						: undefined
				}
		}
		dice={result.dice.map(value => ({ value, tone: dieTone(value) }))}
		consequence={
			consequence ??
			(result.special === 'krit'
				? 'Zwei Einsen. Die Probe gelingt unabhängig von den FP.'
				: undefined)
		}
		action={action}
		details={
			<div className="grid gap-2 rounded-lg bg-background/50 p-4 text-sm">
				{entries.map((entry, index) => (
					<div className="flex justify-between gap-4" key={index}>
						<span>
							{entry.attribute}: {entry.value}{modifierTerm(modifier)} − {result.dice[index]}
						</span>
						<span className="font-semibold tabular-nums">
							{result.perDieShortfall[index]}
						</span>
					</div>
				))}
				<div className="mt-1 flex justify-between gap-4 border-t border-border pt-2 font-semibold">
					<span>
						{tawLabel} {taw} − Verluste{' '}
						{Math.abs(result.perDieShortfall.reduce((sum, value) => sum + value, 0))}
					</span>
					<span className="tabular-nums">= {result.fp}</span>
				</div>
				{note && (
					<p className="pt-1 text-xs text-muted-foreground">Zustände: {note}</p>
				)}
			</div>
		}
	/>
);

export default CheckResultCard;
