import { useId } from 'react';
import ModifierControl from './ModifierControl';
import { signedModifier } from '@/utils/format';
import { Button } from '@/components/ui/button';
import { Dices } from 'lucide-react';
import { cn } from '@/lib/utils';

type RollBarProps = {
	modifier: number;
	onModifierChange: (value: number) => void;
	onRoll: () => void;
	disabled?: boolean;
	/**
	 * Warum der Auslöser grau ist. Gehört an die Leiste und nicht in die
	 * Ergebnisspalte: die gibt es auf dem Handy nicht, dort stand vorher ein
	 * toter Knopf ohne jede Begründung.
	 */
	disabledReason?: string;
	label?: string;
	/**
	 * `true` rendert die Handy-Fassung (klebt in der Daumenzone), `false` die
	 * Desktop-Fassung am Fuß der Eingabespalte – gleiche Karte, andere Position.
	 * Die Leiste bringt ihren Breakpoint selbst mit, statt in einem Wrapper zu
	 * stecken: ein Wrapper wäre der umschließende Block und exakt so hoch wie sie
	 * – dann hat `position: sticky` keinen Weg und wirkt gar nicht.
	 */
	sticky?: boolean;
	/**
	 * Aufschlag, den die App selbst herleitet (z. B. −1 je aufrechterhaltenem Zauber).
	 * Bewusst getrennt vom manuellen Wert: sonst driften beide auseinander, sobald
	 * sich die Herleitung ändert.
	 */
	autoModifier?: number;
	autoNote?: string;
	/** Rote Zeile unter der Leiste, z. B. Handlungsunfähigkeit – warnt, sperrt nicht. */
	warning?: string;
	className?: string;
};

const RollBar = ({
	modifier,
	onModifierChange,
	onRoll,
	disabled = false,
	disabledReason,
	label = 'Würfeln',
	sticky = false,
	autoModifier = 0,
	autoNote,
	warning,
	className
}: RollBarProps) => {
	const total = modifier + autoModifier;
	const reasonId = useId();
	/**
	 * `aria-disabled` statt `disabled`: ein echtes `disabled` nimmt den Knopf aus der
	 * Tabreihenfolge, dann erreicht ihn niemand und die Begründung wird nie angesagt.
	 */
	const showsReason = disabled && Boolean(disabledReason);

	return (
		<div
			className={cn(
				'rounded-lg border border-parchment-300 bg-card p-4 shadow-lg dark:border-parchment-700',
				sticky
					? 'sticky bottom-4 z-40 mt-4 lg:hidden'
					: 'hidden lg:sticky lg:bottom-4 lg:block',
				className
			)}
		>
			<div className="mx-auto flex max-w-3xl flex-col items-center gap-3 sm:flex-row sm:items-end sm:gap-4">
				<ModifierControl value={modifier} onChange={onModifierChange} hintValue={total} />

				<Button
					onClick={disabled ? undefined : onRoll}
					size="xl"
					variant="parchment"
					aria-disabled={disabled || undefined}
					aria-describedby={showsReason ? reasonId : undefined}
					className={cn(
						'w-full shadow-lg hover:shadow-xl sm:mb-5 sm:w-auto sm:flex-1',
						disabled && 'cursor-not-allowed opacity-50 hover:shadow-lg'
					)}
				>
					<Dices className="mr-2 h-6 w-6" />
					{label}
				</Button>
			</div>

			{showsReason && (
				<p
					id={reasonId}
					className="mx-auto mt-2 max-w-3xl text-center text-sm text-muted-foreground"
				>
					{disabledReason}
				</p>
			)}

			{autoModifier !== 0 && (
				<p className="mx-auto mt-2 max-w-3xl text-center text-xs text-muted-foreground">
					Gesamt {signedModifier(total)}
					{autoNote && <> – {autoNote}</>}
				</p>
			)}

			{warning && (
				<p className="mx-auto mt-2 max-w-3xl text-center text-xs font-semibold text-failure-dark dark:text-failure-light">
					{warning}
				</p>
			)}
		</div>
	);
};

export default RollBar;
