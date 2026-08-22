import { useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { nanoid } from '@reduxjs/toolkit';
import { roll3D20 } from '@/utils/dice';
import { canSustain, evaluateTalentCheck, spellAspCost, upkeepModifier } from '@/utils/rules';
import { signedModifier } from '@/utils/format';
import RollBar from './RollBar';
import CheckResultCard, { checkSummary } from './CheckResultCard';
import PropertyNumber from './PropertyNumber';
import ResourceBar from './ResourceBar';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import {
	Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList
} from '@/components/ui/command';
import { Popover, PopoverTrigger, PopoverContent } from '@/components/ui/popover';
import { addRoll } from '@/store/rollSlice';
import { ASP_MAX, addUpkeep, changeAsp, removeUpkeep, setAsp } from '@/store/spellbookSlice';
import {
	markLastRollRefunded,
	selectSpell,
	setSpellLastRoll,
	setSpellModifier,
	type SpellRoll as SpellRollSnapshot
} from '@/store/spellRollSlice';
import type { RootState } from '@/store';
import { useResultScroll } from '@/hooks/useResultScroll';
import { ChevronDown, Hourglass, Info, RotateCcw, Sparkle, StickyNote, Timer, Wand2, X } from 'lucide-react';

/** Begründung der Buchung – die halbe Zahl allein wirkt sonst wie ein Fehler. */
const costNote = (roll: SpellRollSnapshot): string => {
	// Formelzauber stehen im Zauberbuch bei 0 AsP, bis der Spieler die Zahl einträgt.
	// „−0 AsP" sähe nach einem Fehler aus, obwohl schlicht nichts gebucht wurde.
	if (roll.aspSpent === 0) return 'keine AsP gebucht';
	if (roll.result.special === 'krit') return `−${roll.aspSpent} AsP (halbe Kosten, kritischer Erfolg)`;
	if (!roll.result.success) return `−${roll.aspSpent} AsP (halbe Kosten, Probe misslungen)`;
	return `−${roll.aspSpent} AsP`;
};

/** Dieselbe Aussage in Worten – die Vorlesehilfe spricht kein „−". */
const spokenBooking = (roll: SpellRollSnapshot, booked: boolean): string => {
	if (!booked) return `Buchung zurückgenommen, ${roll.aspSpent} AsP erstattet`;
	if (roll.aspSpent === 0) return 'keine AsP gebucht';
	if (roll.result.special === 'krit') return `${roll.aspSpent} AsP gebucht, halbe Kosten bei kritischem Erfolg`;
	if (!roll.result.success) return `${roll.aspSpent} AsP gebucht, halbe Kosten bei misslungener Probe`;
	return `${roll.aspSpent} AsP gebucht`;
};

const SpellRoll = () => {
	const dispatch = useDispatch();
	const attributes = useSelector((state: RootState) => state.attributes);
	const { spells, asp, upkeep } = useSelector((state: RootState) => state.spellbook);
	const spellRoll = useSelector((state: RootState) => state.spellRoll);

	const [pickerOpen, setPickerOpen] = useState(false);

	// Der Zauber wird bei jedem Render frisch aus dem Zauberbuch geholt, nicht beim
	// Auswählen kopiert: sonst zeigt und würfelt dieser Tab weiter den alten FW,
	// nachdem er im Charakterbogen angehoben wurde.
	const spell = spellRoll.spellId !== null
		? spells.find(entry => entry.id === spellRoll.spellId)
		: undefined;
	// Ausgewählt, aber nicht mehr im Buch: gelöscht oder durch einen Import ersetzt.
	const selectionLost = spellRoll.spellId !== null && spell === undefined;

	const entries = spell
		? spell.attributes.map(attribute => ({ attribute, value: attributes[attribute] }))
		: [];
	const cost = spell?.cost ?? 0;

	const lastRoll = spellRoll.lastRoll;
	const auto = upkeepModifier(upkeep.length);
	const totalModifier = spellRoll.modifier + auto;
	const canAfford = cost <= asp.current;
	const ready = spell !== undefined && canAfford;

	const resultRef = useResultScroll(lastRoll);

	const pick = (spellId: string) => {
		dispatch(selectSpell(spellId));
		setPickerOpen(false);
	};

	const cast = () => {
		if (!spell) return;
		const dice = roll3D20();
		const attrs = entries.map(entry => entry.value) as [number, number, number];
		const result = evaluateTalentCheck(attrs, spell.value, totalModifier, dice);
		const aspSpent = spellAspCost(spell.cost, result);

		const snapshot: SpellRollSnapshot = {
			spellId: spell.id,
			spellName: spell.name,
			entries: entries.map(entry => ({ ...entry })),
			modifier: totalModifier,
			taw: spell.value,
			aspSpent,
			duration: spell.duration,
			result
		};

		dispatch(setSpellLastRoll(snapshot));
		dispatch(changeAsp(-aspSpent));

		const outcome = result.success ? `(QS: ${result.qs})` : '(Misslungen)';
		const special = result.special === 'krit'
			? 'Kritischer Erfolg! '
			: result.special === 'patzer' ? 'Patzer! ' : '';
		// Formelzauber stehen bei 0 AsP, bis der Spieler die Zahl einträgt – „−0 AsP"
		// sähe nach einem Fehler aus, siehe costNote().
		const aspBooking = aspSpent === 0 ? 'keine AsP gebucht' : `−${aspSpent} AsP`;

		dispatch(addRoll({
			id: nanoid(),
			type: 'Zauber',
			values: [...result.dice],
			result: `${special}${spell.name}: ${result.fp} FP ${outcome} [Mod ${signedModifier(totalModifier)}, ${aspBooking}]`,
			date: new Date().toISOString()
		}));
	};

	const undoBooking = () => {
		if (!lastRoll || !spellRoll.lastRollBooked) return;
		dispatch(changeAsp(lastRoll.aspSpent));
		dispatch(markLastRollRefunded());
	};

	const alreadySustained = lastRoll !== null && upkeep.some(entry => entry.spellName === lastRoll.spellName);

	const sustain = () => {
		if (!lastRoll || !spellRoll.lastRollBooked || !canSustain(lastRoll.duration)) return;
		dispatch(addUpkeep({ id: nanoid(), spellName: lastRoll.spellName, qs: lastRoll.result.qs }));
	};

	const setup = (
		<>
			<Card variant="parchment">
				<CardHeader>
					<CardTitle className="text-lg">Zauberprobe</CardTitle>
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
								aria-label="Zauber wählen"
								disabled={spells.length === 0}
							>
								{spell?.name ?? (spells.length === 0 ? 'Zauberbuch ist leer' : 'Zauber wählen…')}
								<ChevronDown className="opacity-50" />
							</Button>
						</PopoverTrigger>
						<PopoverContent className="w-[min(24rem,90vw)] p-0">
							<Command>
								<CommandInput placeholder="Zauber suchen…" className="font-body" />
								<CommandList>
									<CommandEmpty>Kein Zauber gefunden</CommandEmpty>
									<CommandGroup>
										{spells.map(entry => (
											<CommandItem key={entry.id} onSelect={() => pick(entry.id)} className="font-body">
												<div className="min-w-0 flex-1">
													<div>{entry.name}</div>
													{entry.probeNote && (
														<div className="truncate text-xs text-muted-foreground">{entry.probeNote}</div>
													)}
												</div>
												<span className="ml-2 text-xs text-muted-foreground">{entry.cost} AsP</span>
											</CommandItem>
										))}
									</CommandGroup>
								</CommandList>
							</Command>
						</PopoverContent>
					</Popover>

					{spells.length === 0 && (
						<p className="text-sm text-muted-foreground">
							Trage im Charakterbogen unter „Zauberbuch" Zauber ein.
						</p>
					)}

					{selectionLost && (
						<p className="text-sm font-semibold text-failure-dark dark:text-failure-light">
							Der gewählte Zauber steht nicht mehr im Zauberbuch. Wähle einen anderen.
						</p>
					)}

					{spell && (
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
									FW <span className="font-bold">{spell.value}</span>
								</span>
							</div>

							{/* Die Sanduhr trennt die Zauberdauer sichtbar vom Timer, der für die
							    Wirkungsdauer laufender Zauber steht. */}
							{spell.castTime && (
								<p className="flex items-start gap-2 text-sm text-muted-foreground">
									<Hourglass className="mt-0.5 h-4 w-4 shrink-0" />
									<span>Zauberdauer {spell.castTime}</span>
								</p>
							)}

							{spell.probeNote && (
								<p className="flex items-start gap-2 text-sm text-magic-dark dark:text-magic-light">
									<Info className="mt-0.5 h-4 w-4 shrink-0" />
									<span>Probe {spell.probeNote}</span>
								</p>
							)}

							{spell.note && (
								<p className="flex items-start gap-2 text-sm text-muted-foreground">
									<StickyNote className="mt-0.5 h-4 w-4 shrink-0" />
									<span className="whitespace-pre-wrap">{spell.note}</span>
								</p>
							)}

							<div className="flex flex-wrap items-center justify-between gap-2 border-t border-border pt-4">
								<span className="font-heading text-sm">
									Kosten <span className="font-bold text-magic-dark dark:text-magic-light">{cost} AsP</span>
								</span>
								<span className={`text-sm ${canAfford ? 'text-muted-foreground' : 'font-semibold text-failure-dark dark:text-failure-light'}`}>
									{canAfford
										? `→ ${asp.current - cost} AsP übrig`
										: `Nicht genug AsP (${asp.current} vorhanden)`}
								</span>
							</div>
						</>
					)}
				</CardContent>
			</Card>

			<Card variant="parchment">
				<CardHeader className="pb-3">
					<CardTitle className="flex items-center gap-2 text-lg">
						<Sparkle className="h-5 w-5 text-magic-dark dark:text-magic-light" />
						Astralenergie
					</CardTitle>
				</CardHeader>
				<CardContent className="space-y-4">
					<ResourceBar label="AsP" current={asp.current} max={asp.max} tone="astral" className="w-full" />

					<div className="flex flex-wrap items-center justify-center gap-2">
						<span className="mr-1 font-heading text-sm uppercase tracking-wide text-aventurian-700 dark:text-aventurian-300">
							Verbrauch
						</span>
						{[1, 4, 8].map((amount) => (
							<Button
								key={amount}
								variant="outline"
								size="sm"
								className="h-11 min-w-11 font-heading"
								onClick={() => dispatch(changeAsp(-amount))}
								aria-label={`${amount} AsP verbrauchen`}
							>
								−{amount}
							</Button>
						))}
						<Button
							variant="outline"
							size="sm"
							className="h-11 min-w-11 font-heading"
							onClick={() => dispatch(changeAsp(1))}
							aria-label="1 AsP regenerieren"
						>
							+1
						</Button>
					</div>

					<div className="flex items-center justify-center gap-3">
						<PropertyNumber
							label="Aktuell"
							value={asp.current}
							max={asp.max}
							size="s"
							onChange={(value) => dispatch(setAsp({ current: value }))}
						/>
						<span className="mb-5 font-heading text-xl">/</span>
						<PropertyNumber
							label="Maximum"
							value={asp.max}
							max={ASP_MAX}
							size="s"
							onChange={(value) => dispatch(setAsp({ max: value }))}
						/>
					</div>
				</CardContent>
			</Card>

			{upkeep.length > 0 && (
				<Card variant="parchment">
					<CardHeader className="pb-3">
						<CardTitle className="flex items-center gap-2 text-lg">
							<Timer className="h-5 w-5 text-magic-dark dark:text-magic-light" />
							Laufende Zauber
						</CardTitle>
					</CardHeader>
					<CardContent className="space-y-2">
						{upkeep.map(entry => (
							<div
								key={entry.id}
								className="flex items-center gap-3 rounded-lg bg-aventurian-100/50 px-3 py-2 dark:bg-aventurian-800/50"
							>
								<span className="min-w-0 flex-1 truncate font-heading text-sm">{entry.spellName}</span>
								<span className="whitespace-nowrap text-xs text-muted-foreground">QS {entry.qs}</span>
								<Button
									variant="ghost"
									size="icon"
									onClick={() => dispatch(removeUpkeep(entry.id))}
									aria-label={`${entry.spellName} beenden`}
								>
									<X className="h-4 w-4" />
								</Button>
							</div>
						))}
						<p className="pt-1 text-xs text-muted-foreground">
							Jeder laufende Zauber erschwert weitere Zauberproben um 1.
						</p>
					</CardContent>
				</Card>
			)}
		</>
	);

	const result = lastRoll && (
		<div ref={resultRef} className="scroll-mt-24">
			<CheckResultCard
				name={lastRoll.spellName}
				entries={lastRoll.entries}
				modifier={lastRoll.modifier}
				taw={lastRoll.taw}
				tawLabel="Fertigkeitswert"
				result={lastRoll.result}
				// Die AsP-Buchung verdrängt den Krit-Standardtext: am Tisch ist die
				// Frage „was hat es gekostet", nicht „warum ist es gelungen".
				consequence={
					spellRoll.lastRollBooked
						? costNote(lastRoll)
						: `Buchung zurückgenommen (${lastRoll.aspSpent} AsP erstattet)`
				}
				action={
					<>
						{spellRoll.lastRollBooked && lastRoll.aspSpent > 0 && (
							<Button variant="outline" size="sm" onClick={undoBooking}>
								<RotateCcw className="mr-1 h-4 w-4" />
								AsP zurückbuchen
							</Button>
						)}
						{/* Nach einer zurückgenommenen Buchung gilt der Zauber als nicht gewirkt –
						    dann darf er auch nicht in die laufenden Zauber wandern. */}
						{spellRoll.lastRollBooked && lastRoll.result.success
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
			modifier={spellRoll.modifier}
			onModifierChange={(value) => dispatch(setSpellModifier(value))}
			onRoll={cast}
			disabled={!ready}
			disabledReason={spell === undefined
				? (spells.length === 0
					? 'Trage im Charakterbogen unter „Zauberbuch" Zauber ein.'
					: 'Wähle einen Zauber, um zu wirken.')
				: `Nicht genug AsP: ${cost} nötig, ${asp.current} vorhanden.`}
			label="Zaubern"
			autoModifier={auto}
			autoNote={upkeep.length > 0
				? `${auto} durch ${upkeep.length} ${upkeep.length === 1 ? 'laufenden Zauber' : 'laufende Zauber'}`
				: undefined}
		/>
	);

	return (
		<div className="mx-auto w-full max-w-6xl lg:grid lg:grid-cols-2 lg:items-start lg:gap-6">
			{/* Die AsP-Buchung gehört mit in die Ansage: sie ist das, was dieser Tab
			    gegenüber der Talentprobe zusätzlich tut. */}
			<div aria-live="polite" className="sr-only">
				{lastRoll
					? `${checkSummary(lastRoll.result)}. ${spokenBooking(lastRoll, spellRoll.lastRollBooked)}.`
					: ''}
			</div>

			<div className="lg:sticky lg:top-24 lg:order-2">
				{result}
				{!result && (
					<Card variant="parchment" className="hidden border-dashed lg:block">
						<CardContent className="flex flex-col items-center gap-3 py-16 text-center text-muted-foreground">
							<Wand2 className="h-8 w-8 opacity-50" />
							<p className="text-sm">
								{spell ? 'Das Ergebnis erscheint hier.' : 'Wähle einen Zauber, um zu wirken.'}
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

export default SpellRoll;
