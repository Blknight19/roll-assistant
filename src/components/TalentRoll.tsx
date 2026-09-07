import { useState } from 'react';
import { nanoid } from '@reduxjs/toolkit';
import { useDispatch, useSelector } from 'react-redux';
import { roll3D20 } from '@/utils/dice';
import { evaluateTalentCheck } from '@/utils/rules';
import { signedModifier } from '@/utils/format';
import PropertyNumber from './PropertyNumber';
import RollBar from './RollBar';
import CheckResultCard, { checkSummary } from './CheckResultCard';
import { addRoll } from '@/store/rollSlice';
import { TALENT_VALUE_MAX, updateTalent } from '@/store/talentsSlice';
import {
	selectProbeTalent,
	setProbeEntry,
	setProbeModifier,
	setProbeTaw,
	setProbeLastRoll,
	type ProbeRoll
} from '@/store/probeSlice';
import {
	Select,
	SelectContent,
	SelectItem,
	SelectTrigger,
	SelectValue
} from '@/components/ui/select';
import {
	Command,
	CommandEmpty,
	CommandGroup,
	CommandInput,
	CommandItem,
	CommandList
} from '@/components/ui/command';
import { Popover, PopoverTrigger, PopoverContent } from '@/components/ui/popover';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import type { RootState } from '@/store';
import {
	ATTRIBUTE_KEYS,
	ATTRIBUTE_MAX,
	ATTRIBUTE_MIN,
	type AttributeKey
} from '@/store/attributesSlice';
import { useResultScroll } from '@/hooks/useResultScroll';
import { ChevronDown, Dices, Pencil, Check } from 'lucide-react';

const TalentRoll = () => {
	const dispatch = useDispatch();
	const attributes = useSelector((state: RootState) => state.attributes);
	const talents = useSelector((state: RootState) => state.talents.talents);
	const probe = useSelector((state: RootState) => state.probe);

	const [pickerOpen, setPickerOpen] = useState(false);
	const [editAttributes, setEditAttributes] = useState(false);

	const lastRoll = probe.lastRoll;

	const resultRef = useResultScroll(lastRoll);

	const sheetTalent = probe.talentId
		? talents.find(talent => talent.id === probe.talentId)
		: undefined;
	const tawDiffersFromSheet = sheetTalent !== undefined && sheetTalent.value !== probe.taw;

	const selectTalent = (talentId: string) => {
		const talent = talents.find(entry => entry.id === talentId);
		if (!talent) return;

		dispatch(selectProbeTalent({
			id: talent.id,
			name: talent.name,
			entries: [talent.attribute1, talent.attribute2, talent.attribute3]
				.map(attribute => ({ attribute, value: attributes[attribute] })),
			taw: talent.value
		}));
		setPickerOpen(false);
	};

	const rollProbe = () => {
		const dice = roll3D20();
		const attrs = probe.entries.map(entry => entry.value) as [number, number, number];
		const result = evaluateTalentCheck(attrs, probe.taw, probe.modifier, dice);

		const snapshot: ProbeRoll = {
			talentName: probe.talentName,
			entries: probe.entries.map(entry => ({ ...entry })),
			modifier: probe.modifier,
			taw: probe.taw,
			result
		};
		dispatch(setProbeLastRoll(snapshot));

		const outcome = result.success ? `(QS: ${result.qs})` : '(Misslungen)';
		const special = result.special === 'krit'
			? 'Kritischer Erfolg! '
			: result.special === 'patzer' ? 'Patzer! ' : '';

		dispatch(addRoll({
			id: nanoid(),
			type: 'Talent',
			values: [...result.dice],
			result: `${special}${probe.talentName}: ${result.fp} FP ${outcome} [Mod ${signedModifier(probe.modifier)}]`,
			date: new Date().toISOString()
		}));
	};

	const setup = (
		<>
			<Card variant="parchment">
				<CardHeader>
					<CardTitle className="text-lg">Talentprobe</CardTitle>
				</CardHeader>
				<CardContent className="space-y-4">
					<Popover open={pickerOpen} onOpenChange={setPickerOpen}>
						<PopoverTrigger asChild>
							<Button
								variant="parchment"
								size="lg"
								role="combobox"
								className="w-full justify-between"
								aria-expanded={pickerOpen}
								aria-label="Talent wählen"
							>
								{probe.talentName || 'Talent wählen…'}
								<ChevronDown className="opacity-50" />
							</Button>
						</PopoverTrigger>
						<PopoverContent className="w-[min(24rem,90vw)] p-0">
							<Command>
								<CommandInput placeholder="Talent suchen…" className="font-body" />
								<CommandList>
									<CommandEmpty>Kein Talent gefunden</CommandEmpty>
									<CommandGroup>
										{talents.map(talent => (
											<CommandItem
												key={talent.id}
												onSelect={() => selectTalent(talent.id)}
												className="font-body"
											>
												{talent.name}
											</CommandItem>
										))}
									</CommandGroup>
								</CommandList>
							</Command>
						</PopoverContent>
					</Popover>

					{editAttributes ? (
						<div className="space-y-4">
							<div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
								{probe.entries.map((entry, index) => (
									<div
										key={index}
										className="flex flex-col items-center gap-3 rounded-lg bg-parchment-100/50 p-3 dark:bg-parchment-800/50"
									>
										<Select
											value={entry.attribute}
											onValueChange={(value) => {
												const attribute = value as AttributeKey;
												dispatch(setProbeEntry({ index, attribute, value: attributes[attribute] }));
											}}
										>
											<SelectTrigger
												className="w-24 text-center font-heading"
												aria-label={`Eigenschaft ${index + 1}`}
											>
												<SelectValue />
											</SelectTrigger>
											<SelectContent>
												{ATTRIBUTE_KEYS.map(key => (
													<SelectItem key={key} value={key} className="font-heading">
														{key}
													</SelectItem>
												))}
											</SelectContent>
										</Select>
										<PropertyNumber
											value={entry.value}
											min={ATTRIBUTE_MIN}
											max={ATTRIBUTE_MAX}
											size="s"
											onChange={(value) => dispatch(setProbeEntry({ index, value }))}
										/>
									</div>
								))}
							</div>
							<div className="flex justify-center">
								<Button variant="outline" size="sm" onClick={() => setEditAttributes(false)}>
									<Check className="mr-1 h-4 w-4" />
									Fertig
								</Button>
							</div>
						</div>
					) : (
						<div className="flex flex-wrap items-center gap-2">
							{probe.entries.map((entry, index) => (
								<span
									key={index}
									className="rounded-lg bg-parchment-100/60 px-3 py-2 font-heading text-sm dark:bg-parchment-800/60"
								>
									{entry.attribute} <span className="font-bold">{entry.value}</span>
								</span>
							))}
							<Button
								variant="ghost"
								size="icon"
								onClick={() => setEditAttributes(true)}
								aria-label="Eigenschaften bearbeiten"
							>
								<Pencil className="h-4 w-4" />
							</Button>
						</div>
					)}

					<div className="flex flex-wrap items-end justify-between gap-3 border-t border-border pt-4">
						<div className="flex flex-col items-center gap-1">
							<PropertyNumber
								label="Talentwert"
								value={probe.taw}
								max={TALENT_VALUE_MAX}
								size="s"
								onChange={(value) => dispatch(setProbeTaw(value))}
							/>
							<span className="text-xs text-muted-foreground">nur für diese Probe</span>
						</div>
						{tawDiffersFromSheet && (
							<Button
								variant="outline"
								size="sm"
								className="mb-5 text-xs"
								onClick={() => dispatch(updateTalent({ id: sheetTalent.id, value: probe.taw }))}
							>
								In Charakterbogen übernehmen
							</Button>
						)}
					</div>
				</CardContent>
			</Card>
		</>
	);

	const result = lastRoll && (
		<div ref={resultRef} className="scroll-mt-24">
			<CheckResultCard
				name={lastRoll.talentName}
				entries={lastRoll.entries}
				modifier={lastRoll.modifier}
				taw={lastRoll.taw}
				tawLabel="Talentwert"
				result={lastRoll.result}
			/>
		</div>
	);

	const rollBar = (sticky: boolean) => (
		<RollBar
			sticky={sticky}
			modifier={probe.modifier}
			onModifierChange={(value) => dispatch(setProbeModifier(value))}
			onRoll={rollProbe}
			disabled={!probe.talentName}
			disabledReason="Wähle ein Talent, um zu würfeln."
		/>
	);

	return (
		<div className="mx-auto w-full max-w-6xl lg:grid lg:grid-cols-2 lg:items-start lg:gap-6">
			<div aria-live="polite" className="sr-only">
				{lastRoll ? checkSummary(lastRoll.result) : ''}
			</div>

			{/* Ergebnis: auf dem Handy über der Eingabe, auf dem Desktop rechts daneben
			    und mitlaufend. Nur einmal im DOM – sonst kollidiert die Ref. */}
			<div className="lg:sticky lg:top-24 lg:order-2">
				{result}
				{!result && (
					<Card variant="parchment" className="hidden border-dashed lg:block">
						<CardContent className="flex flex-col items-center gap-3 py-16 text-center text-muted-foreground">
							<Dices className="h-8 w-8 opacity-50" />
							<p className="text-sm">
								{probe.talentName
									? 'Das Ergebnis erscheint hier.'
									: 'Wähle ein Talent, um zu würfeln.'}
							</p>
						</CardContent>
					</Card>
				)}
			</div>

			<div className="mt-4 flex flex-col gap-4 lg:mt-0 lg:order-1">
				{setup}
				{/* Desktop: die Leiste sitzt am Fuß der Eingabespalte und klebt dort … */}
				{rollBar(false)}
			</div>

			{/* … auf dem Handy klebt sie stattdessen in der Daumenzone. Beide Leisten
			    tragen ihren Breakpoint selbst – ein Wrapper-div würde das Sticky
			    aushebeln, siehe RollBar. */}
			{rollBar(true)}
		</div>
	);
};

export default TalentRoll;
