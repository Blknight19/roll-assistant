import { useDispatch, useSelector } from 'react-redux';
import { nanoid } from '@reduxjs/toolkit';
import PropertyNumber from './PropertyNumber';
import RollBar from './RollBar';
import RollResultCard from './RollResultCard';
import {
	Select,
	SelectContent,
	SelectItem,
	SelectTrigger,
	SelectValue
} from '@/components/ui/select';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import type { RootState } from '@/store';
import {
	setSimpleCount,
	setSimpleModifier,
	setSimpleSides,
	setSimpleLastRoll
} from '@/store/simpleRollSlice';
import { addRoll } from '@/store/rollSlice';
import { rollDice } from '@/utils/dice';
import { signedModifier } from '@/utils/format';
import { Dices } from 'lucide-react';

const DICE_SIDES = [20, 12, 10, 8, 6, 4];
const MAX_DICE = 20;

const SimpleRoll = () => {
	const dispatch = useDispatch();
	const { count, sides, modifier, lastRoll } = useSelector((state: RootState) => state.simpleRoll);

	const handleRoll = () => {
		const dice = rollDice(count, sides);
		const total = dice.reduce((sum, value) => sum + value, 0) + modifier;

		dispatch(setSimpleLastRoll({ count, sides, modifier, dice, total }));
		dispatch(addRoll({
			id: nanoid(),
			type: 'Einzel',
			values: dice,
			result: `Gesamt: ${total} (${count}W${sides} ${signedModifier(modifier)})`,
			date: new Date().toISOString()
		}));
	};

	const setup = (
		<Card variant="parchment">
			<CardHeader>
				<CardTitle className="text-lg">Einzelwurf</CardTitle>
			</CardHeader>
			<CardContent className="space-y-5">
				<div className="flex flex-col gap-2">
					<span className="text-xs font-semibold uppercase tracking-widest text-muted-foreground">
						Würfel
					</span>
					<Select
						value={String(sides)}
						onValueChange={(value) => dispatch(setSimpleSides(Number(value)))}
					>
						<SelectTrigger className="font-heading" aria-label="Würfel-Typ">
							<SelectValue />
						</SelectTrigger>
						<SelectContent>
							{DICE_SIDES.map(side => (
								<SelectItem key={side} value={String(side)} className="font-heading">
									W{side}
								</SelectItem>
							))}
						</SelectContent>
					</Select>
				</div>

				<div className="flex justify-center">
					<PropertyNumber
						label="Anzahl"
						value={count}
						min={1}
						max={MAX_DICE}
						onChange={(value) => dispatch(setSimpleCount(value))}
					/>
				</div>
			</CardContent>
		</Card>
	);

	const rollBar = (sticky: boolean) => (
		<RollBar
			sticky={sticky}
			modifier={modifier}
			onModifierChange={(value) => dispatch(setSimpleModifier(value))}
			onRoll={handleRoll}
		/>
	);

	const result = lastRoll && (
		<RollResultCard
			tone="success"
			title={`${lastRoll.count}W${lastRoll.sides}${
				lastRoll.modifier !== 0 ? ` ${signedModifier(lastRoll.modifier)}` : ''
			}`}
			hero={{ value: lastRoll.total, caption: 'Gesamt' }}
			dice={lastRoll.dice.map(value => ({ value, size: 'md' as const }))}
			details={
				<p className="rounded-lg bg-background/50 p-4 text-center text-sm text-muted-foreground">
					{lastRoll.dice.join(' + ')}
					{lastRoll.modifier !== 0 && ` ${signedModifier(lastRoll.modifier)}`}
					{' = '}{lastRoll.total}
				</p>
			}
			detailsLabel="Einzelwürfe"
		/>
	);

	return (
		<div className="mx-auto w-full max-w-6xl lg:grid lg:grid-cols-2 lg:items-start lg:gap-6">
			<div aria-live="polite" className="sr-only">
				{lastRoll ? `Gesamt: ${lastRoll.total}` : ''}
			</div>

			<div className="lg:sticky lg:top-24 lg:order-2">
				{result}
				{!result && (
					<Card variant="parchment" className="max-lg:hidden border-dashed">
						<CardContent className="flex flex-col items-center gap-3 py-16 text-center text-muted-foreground">
							<Dices className="h-8 w-8 opacity-50" />
							<p className="text-sm">Das Ergebnis erscheint hier.</p>
						</CardContent>
					</Card>
				)}
			</div>

			<div className="mt-4 flex flex-col gap-4 lg:mt-0 lg:order-1">
				{setup}
				{rollBar(false)}
			</div>

			{/* Kein Wrapper-div: der wäre der umschließende Block der Sticky-Leiste
			    und exakt so hoch wie sie – siehe RollBar. */}
			{rollBar(true)}
		</div>
	);
};

export default SimpleRoll;
