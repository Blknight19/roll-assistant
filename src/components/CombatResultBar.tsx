import { Card } from './ui/card';
import DiceIcon from './DiceIcon';
import type { ResultTone } from './RollResultCard';
import type { CombatRoll } from '@/store/combatRollSlice';
import { combatTone, consequenceText, derivationText, statusText } from '@/utils/combatText';
import { Check, Skull, Sparkles, X } from 'lucide-react';

const toneText: Record<ResultTone, string> = {
	success: 'text-success-dark dark:text-success-light',
	failure: 'text-failure-dark dark:text-failure-light',
	critical: 'text-critical-dark dark:text-critical-light'
};

/** Kein Icon bei Initiative – die kennt kein Gelingen, der Titel trägt die Aussage. */
const StatusIcon = ({ roll }: { roll: CombatRoll }) => {
	if (!roll.result) return null;
	if (roll.result.special === 'krit') return <Sparkles className="h-5 w-5 shrink-0 animate-glow" />;
	if (roll.result.special === 'patzer') return <Skull className="h-5 w-5 shrink-0 shake-error" />;
	return roll.result.success
		? <Check className="h-5 w-5 shrink-0" />
		: <X className="h-5 w-5 shrink-0" />;
};

/**
 * Das Kampfergebnis in Kurzform, auf dem Handy am unteren Rand klebend.
 *
 * Ohne Wrapper-div einsetzen und als direktes Kind des Spalten-Containers
 * rendern – ein Wrapper wäre der umschließende Block und exakt so hoch wie die
 * Leiste, dann hat `position: sticky` keinen Verschiebeweg (siehe RollBar).
 */
const CombatResultBar = ({ roll, label }: { roll: CombatRoll; label: string }) => {
	const tone = combatTone(roll);
	const consequence = consequenceText(roll);
	const special = roll.result?.special;

	// `bg-card` überschreibt die getönte Fläche der Variante: die Leiste liegt beim
	// Scrollen über den Kacheln, durch 10 % Ton scheinen sie durch. Den Ton tragen
	// Rahmen, Überschrift und Würfel.
	return (
		<Card
			variant={tone}
			className="sticky bottom-4 z-40 mt-4 animate-in fade-in slide-in-from-bottom-2 border-2 bg-card p-3 shadow-lg duration-200 lg:hidden"
		>
			<p className={`flex items-center gap-2 font-heading font-semibold ${toneText[tone]}`}>
				<StatusIcon roll={roll} />
				{label}{roll.result ? ' – ' : ' '}{statusText(roll)}
			</p>

			<div className="mt-2 flex items-center gap-3">
				{roll.dice.map((value, index) => (
					<DiceIcon
						key={index}
						value={value}
						size="sm"
						variant={index > 0 ? 'default' : special === 'krit' ? 'critical' : special === 'patzer' ? 'failure' : 'default'}
					/>
				))}
				<p className="text-xs text-muted-foreground">{derivationText(roll)}</p>
			</div>
			{roll.conditionNote && (
				<p className="mt-1 text-xs text-muted-foreground">Zustände: {roll.conditionNote}</p>
			)}

			{consequence && <p className="mt-2 text-xs font-medium">{consequence}</p>}
		</Card>
	);
};

export default CombatResultBar;
