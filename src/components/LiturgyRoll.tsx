import { useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { nanoid } from '@reduxjs/toolkit';
import { roll3D20, rollDie } from '@/utils/dice';
import { canSustain, castingCost, evaluateTalentCheck } from '@/utils/rules';
import { signedModifier } from '@/utils/format';
import RollBar from './RollBar';
import CheckResultCard, { checkSummary } from './CheckResultCard';
import PropertyNumber from './PropertyNumber';
import ResourceBar from './ResourceBar';
import SustainedEffects from './SustainedEffects';
import CircumstanceChips from './CircumstanceChips';
import DevotionCard from './DevotionCard';
import BlessingBar from './BlessingBar';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import {
	Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList
} from '@/components/ui/command';
import { Popover, PopoverTrigger, PopoverContent } from '@/components/ui/popover';
import { addRoll } from '@/store/rollSlice';
import { KAP_MAX, addKarmaUpkeep, changeKap, setKap } from '@/store/karmaSlice';
import {
	applyCritBonus, markLiturgyRefunded, selectLiturgy, setLiturgyLastRoll, setLiturgyModifier,
	toggleLiturgyCircumstance, type LiturgyRoll as LiturgyRollSnapshot
} from '@/store/liturgyRollSlice';
import type { RootState } from '@/store';
import { useResultScroll } from '@/hooks/useResultScroll';
import { useSustained } from '@/hooks/useSustained';
import { CIRCUMSTANCES, circumstanceModifier, costWithCircumstances } from '@/data/liturgies/circumstances';
import { KAP_GRUNDWERT, LEITEIGENSCHAFTEN } from '@/data/liturgies/leiteigenschaften';
import {
	ChevronDown, Church, Dices, Hourglass, Info, RotateCcw, StickyNote, Sun, Timer
} from 'lucide-react';

/** Begründung der Buchung – die halbe Zahl allein wirkt sonst wie ein Fehler. */
const costNote = (roll: LiturgyRollSnapshot): string => {
	// Formelliturgien stehen im Buch bei 0 KaP, bis der Spieler die Zahl einträgt.
	if (roll.kapSpent === 0) return 'keine KaP gebucht';
	if (roll.result.special === 'krit') return `−${roll.kapSpent} KaP (halbe Kosten, kritischer Erfolg)`;
	if (roll.result.special === 'patzer') {
		return `−${roll.kapSpent} KaP (halbe Kosten). Patzer: 2W6 auf der Patzertabelle für Liturgien.`;
	}
	if (!roll.result.success) return `−${roll.kapSpent} KaP (halbe Kosten, Probe misslungen)`;
	return `−${roll.kapSpent} KaP`;
};

/** Dieselbe Aussage in Worten – die Vorlesehilfe spricht kein „−". */
const spokenBooking = (roll: LiturgyRollSnapshot, booked: boolean): string => {
	if (!booked) return `Buchung zurückgenommen, ${roll.kapSpent} KaP erstattet`;
	if (roll.kapSpent === 0) return 'keine KaP gebucht';
	if (roll.result.special === 'krit') return `${roll.kapSpent} KaP gebucht, halbe Kosten bei kritischem Erfolg`;
	if (!roll.result.success) return `${roll.kapSpent} KaP gebucht, halbe Kosten bei misslungener Probe`;
	return `${roll.kapSpent} KaP gebucht`;
};

/** Namen der aktiven Umstände mit Vorzeichen, für die Wurfleiste. */
const circumstanceNote = (ids: string[]): string =>
	ids
		.map(id => CIRCUMSTANCES.find(c => c.id === id))
		.filter((c): c is NonNullable<typeof c> => c !== undefined)
		.map(c => `${c.label} ${signedModifier(c.modifier)}`)
		.join(', ');

const LiturgyRoll = () => {
	const dispatch = useDispatch();
	const attributes = useSelector((state: RootState) => state.attributes);
	const { liturgies, kap, upkeep, tradition } = useSelector((state: RootState) => state.karma);
	const noLiturgyFumble = useSelector((state: RootState) => state.settings.noLiturgyFumble);
	const liturgyRoll = useSelector((state: RootState) => state.liturgyRoll);
	const sustained = useSustained();

	const [pickerOpen, setPickerOpen] = useState(false);

	// Der Eintrag wird bei jedem Render frisch aus dem Buch geholt, nicht beim Auswählen
	// kopiert: sonst würfelt dieser Tab weiter den alten FW.
	const liturgy = liturgyRoll.liturgyId !== null
		? liturgies.find(entry => entry.id === liturgyRoll.liturgyId)
		: undefined;
	// Ausgewählt, aber nicht mehr im Buch: gelöscht oder durch einen Import ersetzt.
	const selectionLost = liturgyRoll.liturgyId !== null && liturgy === undefined;

	const entries = liturgy
		? liturgy.attributes.map(attribute => ({ attribute, value: attributes[attribute] }))
		: [];
	const active = liturgyRoll.circumstances.filter(id =>
		CIRCUMSTANCES.find(c => c.id === id)?.appliesTo.includes(liturgy?.klasse ?? 'liturgie')
	);
	const baseCost = liturgy?.cost ?? 0;
	const cost = costWithCircumstances(baseCost, active);

	const lastRoll = liturgyRoll.lastRoll;
	const auto = sustained.modifier + circumstanceModifier(active);
	const totalModifier = liturgyRoll.modifier + auto;
	const canAfford = cost <= kap.current;
	const ready = liturgy !== undefined && canAfford;
	const autoNote = [sustained.note, circumstanceNote(active)].filter(Boolean).join('; ') || undefined;

	const leiteigenschaft = LEITEIGENSCHAFTEN[tradition];
	const richtwert = leiteigenschaft ? KAP_GRUNDWERT + attributes[leiteigenschaft] : undefined;

	const resultRef = useResultScroll(lastRoll);

	const pick = (id: string) => {
		dispatch(selectLiturgy(id));
		setPickerOpen(false);
	};

	const cast = () => {
		if (!liturgy) return;
		const dice = roll3D20();
		const attrs = entries.map(entry => entry.value) as [number, number, number];
		const result = evaluateTalentCheck(attrs, liturgy.value, totalModifier, dice, {
			ignoreFumble: noLiturgyFumble
		});
		const kapSpent = castingCost(cost, result);

		dispatch(setLiturgyLastRoll({
			liturgyId: liturgy.id,
			name: liturgy.name,
			klasse: liturgy.klasse,
			entries: entries.map(entry => ({ ...entry })),
			modifier: totalModifier,
			circumstances: [...active],
			taw: liturgy.value,
			kapSpent,
			critBonus: null,
			duration: liturgy.duration,
			result
		}));
		dispatch(changeKap(-kapSpent));

		const outcome = result.success ? `(QS: ${result.qs})` : '(Misslungen)';
		const special = result.special === 'krit'
			? 'Kritischer Erfolg! '
			: result.special === 'patzer' ? 'Patzer! ' : '';
		const booking = kapSpent === 0 ? 'keine KaP gebucht' : `−${kapSpent} KaP`;

		dispatch(addRoll({
			id: nanoid(),
			type: 'Liturgie',
			values: [...result.dice],
			result: `${special}${liturgy.name}: ${result.fp} FP ${outcome} [Mod ${signedModifier(totalModifier)}, ${booking}]`,
			date: new Date().toISOString()
		}));
	};

	const undoBooking = () => {
		if (!lastRoll || !liturgyRoll.lastRollBooked) return;
		dispatch(changeKap(lastRoll.kapSpent));
		dispatch(markLiturgyRefunded());
	};

	const critBonus = () => {
		if (!lastRoll || lastRoll.critBonus !== null) return;
		dispatch(applyCritBonus(rollDie(6)));
	};

	const alreadySustained =
		lastRoll !== null && upkeep.some(entry => entry.spellName === lastRoll.name);

	const sustain = () => {
		if (!lastRoll || !liturgyRoll.lastRollBooked || !canSustain(lastRoll.duration)) return;
		dispatch(addKarmaUpkeep({ id: nanoid(), spellName: lastRoll.name, qs: lastRoll.result.qs }));
	};

	const setup = (
		<>
			<Card variant="parchment">
				<CardHeader>
					<CardTitle className="text-lg">Liturgieprobe</CardTitle>
				</CardHeader>
				<CardContent className="space-y-4">
					<Popover open={pickerOpen} onOpenChange={setPickerOpen}>
						<PopoverTrigger asChild>
							<Button
								variant="aventurian"
								size="lg"
								role="combobox"
								className="w-full justify-between"
								aria-expanded={pickerOpen}
								aria-label="Liturgie wählen"
								disabled={liturgies.length === 0}
							>
								{liturgy?.name ?? (liturgies.length === 0 ? 'Liturgienbuch ist leer' : 'Liturgie wählen…')}
								<ChevronDown className="opacity-50" />
							</Button>
						</PopoverTrigger>
						<PopoverContent className="w-[min(24rem,90vw)] p-0">
							<Command>
								<CommandInput placeholder="Liturgie suchen…" className="font-body" />
								<CommandList>
									<CommandEmpty>Keine Liturgie gefunden</CommandEmpty>
									<CommandGroup>
										{liturgies.map(entry => (
											<CommandItem key={entry.id} onSelect={() => pick(entry.id)} className="font-body">
												<div className="min-w-0 flex-1">
													<div>{entry.name}</div>
													<div className="truncate text-xs text-muted-foreground">
														{entry.klasse === 'zeremonie' ? 'Zeremonie' : 'Liturgie'}
														{entry.probeNote ? ` · ${entry.probeNote}` : ''}
													</div>
												</div>
												<span className="ml-2 text-xs text-muted-foreground">{entry.cost} KaP</span>
											</CommandItem>
										))}
									</CommandGroup>
								</CommandList>
							</Command>
						</PopoverContent>
					</Popover>

					{liturgies.length === 0 && (
						<p className="text-sm text-muted-foreground">
							Trage im Charakterbogen unter „Liturgien" Einträge ein.
						</p>
					)}

					{selectionLost && (
						<p className="text-sm font-semibold text-failure-dark dark:text-failure-light">
							Der gewählte Eintrag steht nicht mehr im Liturgienbuch. Wähle einen anderen.
						</p>
					)}

					{liturgy && (
						<>
							<div className="flex flex-wrap items-center gap-2">
								{entries.map((entry, index) => (
									<span
										key={index}
										className="rounded-lg bg-aventurian-100/60 px-3 py-2 font-heading text-sm dark:bg-aventurian-800/60"
									>
										{entry.attribute} <span className="font-bold">{entry.value}</span>
									</span>
								))}
								<span className="rounded-lg bg-aventurian-100/60 px-3 py-2 font-heading text-sm dark:bg-aventurian-800/60">
									FW <span className="font-bold">{liturgy.value}</span>
								</span>
							</div>

							{liturgy.castTime && (
								<p className="flex items-start gap-2 text-sm text-muted-foreground">
									<Hourglass className="mt-0.5 h-4 w-4 shrink-0" />
									<span>
										{liturgy.klasse === 'zeremonie' ? 'Zeremoniedauer' : 'Liturgiedauer'} {liturgy.castTime}
									</span>
								</p>
							)}

							{liturgy.probeNote && (
								<p className="flex items-start gap-2 text-sm text-karma-dark dark:text-karma-light">
									<Info className="mt-0.5 h-4 w-4 shrink-0" />
									<span>Probe {liturgy.probeNote}</span>
								</p>
							)}

							{liturgy.note && (
								<p className="flex items-start gap-2 text-sm text-muted-foreground">
									<StickyNote className="mt-0.5 h-4 w-4 shrink-0" />
									<span className="whitespace-pre-wrap">{liturgy.note}</span>
								</p>
							)}

							<div className="border-t border-border pt-4">
								<CircumstanceChips
									klasse={liturgy.klasse}
									fw={liturgy.value}
									costText={liturgy.costText}
									active={active}
									onToggle={(id) => dispatch(toggleLiturgyCircumstance(id))}
								/>
							</div>

							<div className="flex flex-wrap items-center justify-between gap-2 border-t border-border pt-4">
								<span className="font-heading text-sm">
									Kosten{' '}
									<span className="font-bold text-karma-dark dark:text-karma-light">{cost} KaP</span>
									{cost !== baseCost && (
										<span className="text-muted-foreground"> (statt {baseCost})</span>
									)}
								</span>
								<span className={`text-sm ${canAfford ? 'text-muted-foreground' : 'font-semibold text-failure-dark dark:text-failure-light'}`}>
									{canAfford
										? `→ ${kap.current - cost} KaP übrig`
										: `Nicht genug KaP (${kap.current} vorhanden)`}
								</span>
							</div>
						</>
					)}
				</CardContent>
			</Card>

			<BlessingBar />

			<Card variant="parchment">
				<CardHeader className="pb-3">
					<CardTitle className="flex items-center gap-2 text-lg">
						<Sun className="h-5 w-5 text-karma-dark dark:text-karma-light" />
						Karmaenergie
					</CardTitle>
				</CardHeader>
				<CardContent className="space-y-4">
					<ResourceBar label="KaP" current={kap.current} max={kap.max} tone="karma" className="w-full" />

					<div className="flex flex-wrap items-center justify-center gap-2">
						<span className="mr-1 font-heading text-sm uppercase tracking-wide text-aventurian-700 dark:text-aventurian-300">
							Verbrauch
						</span>
						{[1, 4, 8].map(amount => (
							<Button
								key={amount}
								variant="outline"
								size="sm"
								className="h-11 min-w-11 font-heading"
								onClick={() => dispatch(changeKap(-amount))}
								aria-label={`${amount} KaP verbrauchen`}
							>
								−{amount}
							</Button>
						))}
						<Button
							variant="outline"
							size="sm"
							className="h-11 min-w-11 font-heading"
							onClick={() => dispatch(changeKap(1))}
							aria-label="1 KaP regenerieren"
						>
							+1
						</Button>
					</div>

					<div className="flex flex-wrap items-center justify-center gap-x-3 gap-y-2">
						<PropertyNumber
							label="Aktuell"
							value={kap.current}
							max={kap.max}
							size="s"
							onChange={(value) => dispatch(setKap({ current: value }))}
						/>
						<span className="mb-5 font-heading text-xl">/</span>
						<PropertyNumber
							label="Maximum"
							value={kap.max}
							max={KAP_MAX}
							size="s"
							onChange={(value) => dispatch(setKap({ max: value }))}
						/>
					</div>

					{richtwert !== undefined && (
						<p className="text-center text-xs text-muted-foreground">
							Richtwert {KAP_GRUNDWERT} + {leiteigenschaft} {attributes[leiteigenschaft]} = {richtwert} KaP
							(ohne Vor- und Nachteile, Zukäufe und Hohe Weihe)
						</p>
					)}
				</CardContent>
			</Card>

			<DevotionCard />

			<SustainedEffects />
		</>
	);

	const result = lastRoll && (
		<div ref={resultRef} className="scroll-mt-24">
			<CheckResultCard
				name={lastRoll.name}
				entries={lastRoll.entries}
				modifier={lastRoll.modifier}
				taw={lastRoll.taw}
				tawLabel="Fertigkeitswert"
				result={lastRoll.result}
				consequence={
					liturgyRoll.lastRollBooked
						? `${costNote(lastRoll)}${lastRoll.critBonus !== null ? ` · +${lastRoll.critBonus} FP durch den kritischen Erfolg` : ''}`
						: `Buchung zurückgenommen (${lastRoll.kapSpent} KaP erstattet)`
				}
				action={
					<>
						{liturgyRoll.lastRollBooked && lastRoll.kapSpent > 0 && (
							<Button variant="outline" size="sm" onClick={undoBooking}>
								<RotateCcw className="mr-1 h-4 w-4" />
								KaP zurückbuchen
							</Button>
						)}
						{/* „Wenn es für den Geweihten nützlich ist, können 1W6 Punkte auf die FP
						    addiert werden." – also ein Angebot, keine Automatik. */}
						{liturgyRoll.lastRollBooked && lastRoll.result.special === 'krit'
							&& lastRoll.critBonus === null && (
							<Button variant="outline" size="sm" onClick={critBonus}>
								<Dices className="mr-1 h-4 w-4" />
								+1W6 auf die FP
							</Button>
						)}
						{/* Nach einer zurückgenommenen Buchung gilt die Liturgie als nicht gewirkt. */}
						{liturgyRoll.lastRollBooked && lastRoll.result.success
							&& canSustain(lastRoll.duration) && !alreadySustained && (
							<Button variant="outline" size="sm" onClick={sustain}>
								<Timer className="mr-1 h-4 w-4" />
								Aufrechterhalten
							</Button>
						)}
					</>
				}
			/>
		</div>
	);

	const rollBar = (sticky: boolean) => (
		<RollBar
			sticky={sticky}
			modifier={liturgyRoll.modifier}
			onModifierChange={(value) => dispatch(setLiturgyModifier(value))}
			onRoll={cast}
			disabled={!ready}
			disabledReason={liturgy === undefined
				? (liturgies.length === 0
					? 'Trage im Charakterbogen unter „Liturgien" Einträge ein.'
					: 'Wähle eine Liturgie, um zu wirken.')
				: `Nicht genug KaP: ${cost} nötig, ${kap.current} vorhanden.`}
			label="Wirken"
			autoModifier={auto}
			autoNote={autoNote}
		/>
	);

	return (
		<div className="mx-auto w-full max-w-6xl lg:grid lg:grid-cols-2 lg:items-start lg:gap-6">
			{/* Die KaP-Buchung gehört mit in die Ansage: sie ist das, was dieser Tab
			    gegenüber der Talentprobe zusätzlich tut. */}
			<div aria-live="polite" className="sr-only">
				{lastRoll
					? `${checkSummary(lastRoll.result)}. ${spokenBooking(lastRoll, liturgyRoll.lastRollBooked)}.`
					: ''}
			</div>

			<div className="lg:sticky lg:top-24 lg:order-2">
				{result}
				{!result && (
					<Card variant="parchment" className="hidden border-dashed lg:block">
						<CardContent className="flex flex-col items-center gap-3 py-16 text-center text-muted-foreground">
							<Church className="h-8 w-8 opacity-50" />
							<p className="text-sm">
								{liturgy ? 'Das Ergebnis erscheint hier.' : 'Wähle eine Liturgie, um zu wirken.'}
							</p>
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

export default LiturgyRoll;
