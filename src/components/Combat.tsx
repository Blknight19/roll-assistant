import { useDispatch, useSelector } from 'react-redux';
import { nanoid } from '@reduxjs/toolkit';
import { Card, CardHeader, CardTitle, CardContent } from './ui/card';
import PropertyNumber from './PropertyNumber';
import ModifierControl from './ModifierControl';
import RollResultCard from './RollResultCard';
import CombatResultBar from './CombatResultBar';
import { Button } from './ui/button';
import type { RootState } from '@/store';
import {
	COMBAT_STAT_MAX,
	LIFE_MAX,
	fillPercent,
	updateCombatStat,
	updateLifeStat,
	type CombatStatKey
} from '@/store/combatSlice';
import {
	setCombatLastRoll,
	setCombatModifier,
	type CombatRoll,
	type CombatType
} from '@/store/combatRollSlice';
import { addRoll } from '@/store/rollSlice';
import { rollDie } from '@/utils/dice';
import { evaluateCombatRoll } from '@/utils/rules';
import { combatTone, consequenceText, derivationText, statusText } from '@/utils/combatText';
import { Swords, Shield, Footprints, Target, Clock, Heart, Sparkles, Skull, Check, X } from 'lucide-react';

const combatLabels: Record<CombatType, string> = {
	AT: 'Attacke',
	PA: 'Parade',
	AW: 'Ausweichen',
	FK: 'Fernkampf',
	INI: 'Initiative'
};

const combatIcons: Record<CombatType, typeof Swords> = {
	AT: Swords,
	PA: Shield,
	AW: Footprints,
	FK: Target,
	INI: Clock
};

const combatStats: { type: CombatType; key: CombatStatKey }[] = [
	{ type: 'AT', key: 'attack' },
	{ type: 'FK', key: 'ranged' },
	{ type: 'PA', key: 'save' },
	{ type: 'AW', key: 'dodge' },
	{ type: 'INI', key: 'initiative' }
];

/** Ohne `id`: die vergibt erst der Aufrufer, damit die Würfel zuerst fallen. */
type CombatRollDraft = Omit<CombatRoll, 'id'>;

const buildInitiativeRoll = (base: number, modifier: number): CombatRollDraft => {
	const w6 = rollDie(6);
	return { type: 'INI', base, modifier, initiative: base + w6 + modifier, dice: [w6] };
};

const buildCheckRoll = (
	type: CombatType,
	base: number,
	modifier: number,
	confirmCriticals: boolean
): CombatRollDraft => {
	const d20 = rollDie(20);
	const needsConfirmation = confirmCriticals && (d20 === 1 || d20 === 20);
	const result = evaluateCombatRoll(base, modifier, d20, needsConfirmation ? rollDie(20) : undefined);
	return {
		type,
		base,
		modifier,
		dice: result.confirmation ? [d20, result.confirmation.roll] : [d20],
		result
	};
};

const Combat = () => {
	const dispatch = useDispatch();
	const combat = useSelector((state: RootState) => state.combat);
	const confirmCriticals = useSelector((state: RootState) => state.settings.confirmCriticals);
	const { modifier, lastRoll } = useSelector((state: RootState) => state.combatRoll);

	const roll = (type: CombatType, base: number) => {
		const draft = type === 'INI'
			? buildInitiativeRoll(base, modifier)
			: buildCheckRoll(type, base, modifier, confirmCriticals);
		const snapshot = { ...draft, id: nanoid() };

		dispatch(setCombatLastRoll(snapshot));
		dispatch(addRoll({
			id: snapshot.id,
			type: 'Kampf',
			values: snapshot.dice,
			result: `${combatLabels[type]}: ${statusText(snapshot)} (${derivationText(snapshot)})`,
			date: new Date().toISOString()
		}));
	};

	// Farbe nach dem exakten Verhältnis, Breite mit Mindest-Streifen – sonst
	// würde der Streifen bei sehr wenig LeP die Farbschwelle verfälschen.
	const lifeRatio = (combat.life.current / combat.life.max) * 100;
	const lifeWidth = fillPercent(combat.life.current, combat.life.max);
	const healthColor =
		lifeRatio > 66 ? 'bg-success' : lifeRatio > 33 ? 'bg-amber-500' : 'bg-failure';

	const setup = (
		<>
			<Card variant="parchment">
				<CardHeader className="pb-3">
					<CardTitle className="flex items-center gap-2 text-lg">
						<Heart className="h-5 w-5 text-failure-dark dark:text-failure-light" />
						Lebensenergie
					</CardTitle>
				</CardHeader>
				<CardContent className="space-y-4">
					<div
						className="relative h-8 w-full overflow-hidden rounded-full border-2 border-parchment-400 bg-muted dark:border-parchment-600"
						role="img"
						aria-label={`Lebensenergie ${combat.life.current} von ${combat.life.max}`}
					>
						<div
							className={`h-full transition-all duration-500 ${healthColor}`}
							style={{ width: `${lifeWidth}%` }}
						/>
						{[25, 50, 75].map((mark) => (
							<div
								key={mark}
								className="absolute top-0 h-full w-px bg-foreground/30"
								style={{ left: `${mark}%` }}
								title={`Schmerzstufe bei ${Math.ceil(combat.life.max * mark / 100)} LeP`}
							/>
						))}

						{/*
						  Die Zahl liegt über der ganzen Leiste (in der Füllung wurde sie bei
						  wenig LeP abgeschnitten) und wird zweimal gezeichnet: einmal in
						  Vordergrundfarbe für die leere Spur, darüber dieselbe Zahl in dunkler
						  Tinte, exakt an der Füllkante beschnitten. So stimmt der Kontrast auf
						  beiden Seiten, ohne Kasten hinter dem Text.
						*/}
						<span
							aria-hidden
							className="absolute inset-0 flex items-center justify-center font-heading text-sm font-bold tabular-nums text-foreground"
						>
							{combat.life.current} / {combat.life.max}
						</span>
						<span
							aria-hidden
							className="absolute inset-0 flex items-center justify-center font-heading text-sm font-bold tabular-nums text-black transition-all duration-500"
							style={{ clipPath: `inset(0 ${100 - lifeWidth}% 0 0)` }}
						>
							{combat.life.current} / {combat.life.max}
						</span>
					</div>

					<div className="flex flex-wrap items-center justify-center gap-2">
						<span className="mr-1 font-heading text-sm uppercase tracking-wide text-parchment-700 dark:text-parchment-300">
							Schaden
						</span>
						{[1, 3, 5].map((damage) => (
							<Button
								key={damage}
								variant="outline"
								size="sm"
								className="h-11 min-w-11 font-heading"
								onClick={() => dispatch(updateLifeStat({ current: combat.life.current - damage }))}
								aria-label={`${damage} Schaden nehmen`}
							>
								−{damage}
							</Button>
						))}
						<Button
							variant="outline"
							size="sm"
							className="h-11 min-w-11 font-heading"
							onClick={() => dispatch(updateLifeStat({ current: combat.life.current + 1 }))}
							aria-label="1 Lebenspunkt heilen"
						>
							+1
						</Button>
					</div>

					<div className="flex flex-wrap items-center justify-center gap-x-3 gap-y-2">
						<PropertyNumber
							label="Aktuell"
							value={combat.life.current}
							max={combat.life.max}
							size="s"
							onChange={(value) => dispatch(updateLifeStat({ current: value }))}
						/>
						<span className="mb-5 font-heading text-xl">/</span>
						<PropertyNumber
							label="Maximum"
							value={combat.life.max}
							min={1}
							max={LIFE_MAX}
							size="s"
							onChange={(value) => dispatch(updateLifeStat({ max: value }))}
						/>
					</div>
				</CardContent>
			</Card>

			<Card variant="parchment">
				<CardHeader>
					<CardTitle className="text-lg">Kampfwerte</CardTitle>
				</CardHeader>
				<CardContent>
					{/* Eine Kachel braucht 160 px (zwei 44-px-Knöpfe, ein 64-px-Feld, zwei
					    Lücken), zwei Spalten also 412 px Fensterbreite – darunter eine Spalte.
					    Drei Spalten nur, solange die Karte die volle Breite hat: im
					    Desktop-Layout steht sie in einer halbbreiten Spalte, dort passen drei
					    Stepper nicht mehr in die Zellen und ragen über deren Hintergrund hinaus. */}
					<div className="grid grid-cols-1 gap-3 xs:grid-cols-2 sm:grid-cols-3 lg:grid-cols-2">
						{combatStats.map(({ type, key }) => {
							const Icon = combatIcons[type];
							return (
								<div
									key={key}
									className="flex flex-col items-center gap-2 rounded-lg bg-parchment-100/50 p-3 transition-colors hover:bg-parchment-200/50 dark:bg-parchment-800/50 dark:hover:bg-parchment-700/50"
								>
									<Icon className="h-5 w-5 text-parchment-600 dark:text-parchment-400" />
									<PropertyNumber
										label={type}
										value={combat[key]}
										max={COMBAT_STAT_MAX}
										size="s"
										onChange={(value) => dispatch(updateCombatStat({ key, value }))}
									/>
									<Button
										size="sm"
										variant="parchment"
										onClick={() => roll(type, combat[key])}
										className="w-full"
										aria-label={`${combatLabels[type]} würfeln`}
									>
										Würfeln
									</Button>
								</div>
							);
						})}

						<div className="flex flex-col items-center gap-2 p-3">
							{/* Platzhalter in Icon-Höhe – hält den Stepper auf einer Linie mit den Nachbarkacheln. */}
							<div aria-hidden className="h-5" />
							<ModifierControl
								value={modifier}
								onChange={(value) => dispatch(setCombatModifier(value))}
							/>
						</div>
					</div>
				</CardContent>
			</Card>
		</>
	);

	const ResultIcon = lastRoll ? combatIcons[lastRoll.type] : null;

	const result = lastRoll && (
		<RollResultCard
			tone={combatTone(lastRoll)}
			title={`${combatLabels[lastRoll.type]}${lastRoll.result ? ` – ${statusText(lastRoll)}` : ''}`}
			icon={
				lastRoll.result?.special === 'krit' ? <Sparkles className="h-6 w-6 animate-glow" /> :
				lastRoll.result?.special === 'patzer' ? <Skull className="h-6 w-6 shake-error" /> :
				lastRoll.result ? (
					lastRoll.result.success
						? <Check className="h-6 w-6" />
						: <X className="h-6 w-6" />
				) : ResultIcon ? <ResultIcon className="h-6 w-6" /> : undefined
			}
			hero={
				lastRoll.result
					? undefined
					: { value: lastRoll.initiative ?? 0, caption: 'Initiative' }
			}
			dice={lastRoll.dice.map((value, index) => ({
				value,
				size: index === 0 ? 'lg' : 'md',
				tone: index > 0 ? 'default' :
					lastRoll.result?.special === 'krit' ? 'critical' :
					lastRoll.result?.special === 'patzer' ? 'failure' : 'default'
			}))}
			consequence={consequenceText(lastRoll)}
			details={
				<div className="space-y-2 rounded-lg bg-background/50 p-4 text-center text-sm">
					<p>{derivationText(lastRoll)}</p>
					{lastRoll.result?.confirmation && (
						<p className="flex items-center justify-center gap-2 font-semibold">
							Bestätigungswurf {lastRoll.result.confirmation.roll}
							{lastRoll.result.confirmation.confirmed
								? <Check className="h-4 w-4 text-success-dark dark:text-success-light" aria-label="bestätigt" />
								: <X className="h-4 w-4 text-failure-dark dark:text-failure-light" aria-label="nicht bestätigt" />}
						</p>
					)}
				</div>
			}
		/>
	);

	return (
		<div className="mx-auto w-full max-w-6xl lg:grid lg:grid-cols-2 lg:items-start lg:gap-6">
			<div aria-live="polite" className="sr-only">
				{lastRoll ? `${combatLabels[lastRoll.type]}: ${statusText(lastRoll)}` : ''}
			</div>

			{/* Auf dem Handy übernimmt die klebende Leiste unten – die Auslöser sitzen
			    in den Kacheln, ein Ergebnis am Seitenanfang bliebe ungesehen. */}
			<div className="hidden lg:sticky lg:top-24 lg:order-2 lg:block">
				{result}
				{!result && (
					<Card variant="parchment" className="border-dashed">
						<CardContent className="flex flex-col items-center gap-3 py-16 text-center text-muted-foreground">
							<Swords className="h-8 w-8 opacity-50" />
							<p className="text-sm">Das Ergebnis erscheint hier.</p>
						</CardContent>
					</Card>
				)}
			</div>

			<div className="flex flex-col gap-4 lg:order-1">
				{setup}
			</div>

			{lastRoll && (
				<CombatResultBar key={lastRoll.id} roll={lastRoll} label={combatLabels[lastRoll.type]} />
			)}
		</div>
	);
};

export default Combat;
