import { useMemo, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { nanoid } from '@reduxjs/toolkit';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Switch } from '@/components/ui/switch';
import {
	Select, SelectContent, SelectItem, SelectTrigger, SelectValue
} from '@/components/ui/select';
import { Popover, PopoverTrigger, PopoverContent } from '@/components/ui/popover';
import {
	Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList
} from '@/components/ui/command';
import PropertyNumber from './PropertyNumber';
import ConfirmDialog from './ConfirmDialog';
import type { RootState } from '@/store';
import { ATTRIBUTE_KEYS, type AttributeKey } from '@/store/attributesSlice';
import { TALENT_VALUE_MAX } from '@/store/talentsSlice';
import { SPELL_NAME_MAX, SPELL_NOTE_MAX } from '@/store/spellbookSlice';
import {
	LITURGY_COST_MAX, LITURGY_LIMIT, addLiturgy, removeLiturgy, toggleBlessing, updateLiturgy,
	type LiturgyBookClass
} from '@/store/karmaSlice';
import {
	LITURGY_CATALOG, TRADITIONEN, passtZurTradition, traditionOf, type LiturgyCatalogEntry
} from '@/data/liturgies';
import { ChevronDown, Church, HeartHandshake, Plus, Trash2 } from 'lucide-react';

const DEFAULT_ATTRIBUTES: [AttributeKey, AttributeKey, AttributeKey] = ['MU', 'KL', 'IN'];

const ALLE = 'alle';

const KLASSEN: { value: LiturgyBookClass; label: string; plural: string }[] = [
	{ value: 'liturgie', label: 'Liturgie', plural: 'Liturgien' },
	{ value: 'zeremonie', label: 'Zeremonie', plural: 'Zeremonien' }
];

const klassenLabel = (klasse: LiturgyBookClass) =>
	KLASSEN.find(k => k.value === klasse)?.label ?? klasse;

/** Aspekte, unter denen die gewählte Tradition den Eintrag führt: „Praios (Ordnung)" ergibt „Ordnung". */
const aspekteFuer = (entry: LiturgyCatalogEntry, tradition: string): string =>
	entry.verbreitung
		.filter(pair => traditionOf(pair) === tradition)
		.map(pair => /\(([^)]*)\)/.exec(pair)?.[1])
		.filter(Boolean)
		.join(', ');

const LiturgyBook = () => {
	const dispatch = useDispatch();
	const liturgies = useSelector((state: RootState) => state.karma.liturgies);
	const blessings = useSelector((state: RootState) => state.karma.blessings);
	const heroTradition = useSelector((state: RootState) => state.karma.tradition);

	const [name, setName] = useState('');
	const [klasse, setKlasse] = useState<LiturgyBookClass>('liturgie');
	const [attributes, setAttributes] =
		useState<[AttributeKey, AttributeKey, AttributeKey]>(DEFAULT_ATTRIBUTES);
	const [cost, setCost] = useState(8);
	const [catalogOpen, setCatalogOpen] = useState(false);
	const [tradition, setTradition] = useState(heroTradition || ALLE);
	const [gattung, setGattung] = useState<string>(ALLE);
	// Löschen ist der einzige Weg, einen Eintrag samt Notiz zu verlieren – die App fragt vorher.
	const [pendingDelete, setPendingDelete] = useState<{ id: string; name: string } | null>(null);

	const full = liturgies.length >= LITURGY_LIMIT;
	const owned = new Set(liturgies.map(entry => entry.catalogId).filter(Boolean));
	const gefiltert = tradition !== ALLE || gattung !== ALLE;

	const segen = useMemo(() => LITURGY_CATALOG.filter(entry => entry.klasse === 'segen'), []);

	const catalog = useMemo(
		() => LITURGY_CATALOG.filter(entry =>
			entry.klasse !== 'segen' &&
			(gattung === ALLE || entry.klasse === gattung) &&
			(tradition === ALLE || passtZurTradition(entry, tradition))
		),
		[tradition, gattung]
	);

	const adopt = (entry: LiturgyCatalogEntry) => {
		if (entry.klasse === 'segen' || !entry.attributes) return;
		dispatch(addLiturgy({
			id: nanoid(),
			catalogId: entry.id,
			klasse: entry.klasse,
			name: entry.name,
			attributes: [...entry.attributes] as [AttributeKey, AttributeKey, AttributeKey],
			// Formelkosten starten bei 0 – die Zahl trägt der Spieler ein, der Wortlaut
			// bleibt daneben stehen.
			cost: entry.cost ?? 0,
			costText: entry.costText,
			probeNote: entry.probeNote,
			castTime: entry.castTime,
			duration: entry.duration,
			value: 0
		}));
		setCatalogOpen(false);
	};

	const create = () => {
		const trimmed = name.trim();
		if (!trimmed || full) return;
		dispatch(addLiturgy({
			id: nanoid(),
			klasse,
			name: trimmed,
			attributes: [...attributes] as [AttributeKey, AttributeKey, AttributeKey],
			cost,
			value: 0
		}));
		setName('');
		setAttributes(DEFAULT_ATTRIBUTES);
		setCost(8);
	};

	return (
		<div className="space-y-6">
			<Card variant="parchment">
				<CardHeader>
					<CardTitle className="flex items-center gap-2">
						<Church className="w-6 h-6" />
						Liturgienbuch
					</CardTitle>
				</CardHeader>
				<CardContent>
					{liturgies.length === 0 ? (
						<p className="py-8 text-center text-sm text-muted-foreground">
							Noch keine Liturgien. Übernimm welche aus dem Katalog oder lege unten eine an.
						</p>
					) : (
						<>
						{/* Schmale Screens bekommen Karten: sieben Spalten schieben KaP, FW und
						    Notiz sonst aus dem Bild. */}
						<div className="space-y-3 sm:hidden">
							{liturgies.map(entry => (
								<div
									key={entry.id}
									className="space-y-3 rounded-lg border border-aventurian-200 bg-aventurian-50/50 p-3 dark:border-aventurian-700 dark:bg-aventurian-900/30"
								>
									<div className="flex items-start justify-between gap-2">
										<div className="min-w-0">
											<div className="font-heading">{entry.name}</div>
											<div className="font-heading text-sm text-muted-foreground">
												{klassenLabel(entry.klasse)} · {entry.attributes.join('/')}
												{entry.probeNote && (
													<span className="font-body text-karma-dark dark:text-karma-light"> {entry.probeNote}</span>
												)}
											</div>
											{entry.costText && (
												<div className="text-xs text-muted-foreground">{entry.costText}</div>
											)}
											{entry.castTime && (
												<div className="text-xs text-muted-foreground">Dauer {entry.castTime}</div>
											)}
										</div>
										<Button
											variant="ghost"
											size="icon"
											onClick={() => setPendingDelete({ id: entry.id, name: entry.name })}
											aria-label={`${entry.name} entfernen`}
										>
											<Trash2 className="h-4 w-4" />
										</Button>
									</div>

									<div className="flex flex-wrap items-end gap-3">
										<PropertyNumber
											label="KaP"
											value={entry.cost}
											max={LITURGY_COST_MAX}
											size="s"
											ariaLabel={`KaP für ${entry.name}`}
											onChange={(value) => dispatch(updateLiturgy({ id: entry.id, changes: { cost: value } }))}
										/>
										<PropertyNumber
											label="FW"
											value={entry.value}
											max={TALENT_VALUE_MAX}
											size="s"
											ariaLabel={`Fertigkeitswert für ${entry.name}`}
											onChange={(value) => dispatch(updateLiturgy({ id: entry.id, changes: { value } }))}
										/>
									</div>

									<Input
										value={entry.note ?? ''}
										maxLength={SPELL_NOTE_MAX}
										placeholder="Notiz"
										aria-label={`Notiz zu ${entry.name}`}
										onChange={(event) => dispatch(updateLiturgy({
											id: entry.id,
											changes: { note: event.target.value }
										}))}
										className="font-body"
									/>
								</div>
							))}
						</div>

						<div className="hidden overflow-x-auto sm:block">
							<table className="min-w-full text-sm">
								<thead className="sticky top-0 z-10 bg-aventurian-100 dark:bg-aventurian-800">
									<tr className="border-b-2 border-aventurian-400 dark:border-aventurian-600">
										<th className="p-3 text-left font-heading">Name</th>
										<th className="p-3 text-center font-heading">Probe</th>
										<th className="p-3 text-center font-heading">Dauer</th>
										<th className="p-3 text-center font-heading">KaP</th>
										<th className="p-3 text-center font-heading">FW</th>
										<th className="p-3 text-left font-heading">Notiz</th>
										<th className="p-3 text-center font-heading"><span className="sr-only">Löschen</span></th>
									</tr>
								</thead>
								<tbody>
									{liturgies.map((entry, index) => (
										<tr
											key={entry.id}
											className={index % 2 === 0 ? 'bg-aventurian-50/50 dark:bg-aventurian-900/30' : ''}
										>
											<td className="p-3">
												<div className="font-heading">{entry.name}</div>
												<div className="text-xs text-muted-foreground">
													{klassenLabel(entry.klasse)}{entry.costText ? ` · ${entry.costText}` : ''}
												</div>
											</td>
											<td className="p-3 text-center font-heading">
												{entry.attributes.join('/')}
												{entry.probeNote && (
													<div className="font-body text-xs text-karma-dark dark:text-karma-light">
														{entry.probeNote}
													</div>
												)}
											</td>
											<td className="p-3 text-center text-xs text-muted-foreground">
												{entry.castTime ?? '–'}
											</td>
											<td className="p-3">
												<PropertyNumber
													value={entry.cost}
													max={LITURGY_COST_MAX}
													size="s"
													ariaLabel={`KaP für ${entry.name}`}
													onChange={(value) => dispatch(updateLiturgy({ id: entry.id, changes: { cost: value } }))}
													className="mx-auto"
												/>
											</td>
											<td className="p-3">
												<PropertyNumber
													value={entry.value}
													max={TALENT_VALUE_MAX}
													size="s"
													ariaLabel={`Fertigkeitswert für ${entry.name}`}
													onChange={(value) => dispatch(updateLiturgy({ id: entry.id, changes: { value } }))}
													className="mx-auto"
												/>
											</td>
											<td className="p-3">
												<Input
													value={entry.note ?? ''}
													maxLength={SPELL_NOTE_MAX}
													placeholder="Notiz"
													aria-label={`Notiz zu ${entry.name}`}
													onChange={(event) => dispatch(updateLiturgy({
														id: entry.id,
														changes: { note: event.target.value }
													}))}
													className="min-w-40 font-body"
												/>
											</td>
											<td className="p-3 text-center">
												<Button
													variant="ghost"
													size="icon"
													onClick={() => setPendingDelete({ id: entry.id, name: entry.name })}
													aria-label={`${entry.name} entfernen`}
												>
													<Trash2 className="h-4 w-4" />
												</Button>
											</td>
										</tr>
									))}
								</tbody>
							</table>
						</div>
						</>
					)}
				</CardContent>
			</Card>

			<Card variant="parchment">
				<CardHeader>
					<CardTitle className="flex items-center gap-2 text-lg">
						<HeartHandshake className="h-5 w-5 text-karma-dark dark:text-karma-light" />
						Segen
					</CardTitle>
				</CardHeader>
				<CardContent className="space-y-3">
					<p className="text-xs text-muted-foreground">
						Segen werden wie Sonderfertigkeiten erworben (1 AP), kosten 1 KaP, brauchen
						keine Probe und wirken mit QS 1. Schamanen kennen keine Segen.
					</p>
					<div className="grid gap-2 sm:grid-cols-2">
						{segen.map(entry => {
							const id = `segen-${entry.id}`;
							return (
								<div
									key={entry.id}
									className="flex items-center justify-between gap-3 rounded-lg bg-aventurian-100/50 px-3 py-2 dark:bg-aventurian-800/50"
								>
									<label htmlFor={id} className="min-w-0">
										<div className="font-heading text-sm">{entry.name}</div>
										<div className="truncate text-xs text-muted-foreground">
											{entry.range} · {entry.duration}
										</div>
									</label>
									<Switch
										id={id}
										checked={blessings.includes(entry.id)}
										onCheckedChange={() => dispatch(toggleBlessing(entry.id))}
										aria-label={`${entry.name} erworben`}
									/>
								</div>
							);
						})}
					</div>
				</CardContent>
			</Card>

			<Card variant="parchment">
				<CardHeader>
					<CardTitle className="text-lg">Aus dem Katalog übernehmen</CardTitle>
				</CardHeader>
				<CardContent className="space-y-3">
					<Popover open={catalogOpen} onOpenChange={setCatalogOpen}>
						<PopoverTrigger asChild>
							<Button
								variant="aventurian"
								size="lg"
								role="combobox"
								className="w-full justify-between"
								aria-expanded={catalogOpen}
								aria-label="Liturgie aus dem Katalog wählen"
								disabled={full}
							>
								Liturgie suchen…
								<ChevronDown className="opacity-50" />
							</Button>
						</PopoverTrigger>
						<PopoverContent className="w-[min(28rem,90vw)] p-0">
							<div className="flex gap-2 border-b p-2">
								<Select value={tradition} onValueChange={setTradition}>
									<SelectTrigger className="flex-1 font-body" aria-label="Nach Tradition filtern">
										<SelectValue />
									</SelectTrigger>
									<SelectContent>
										<SelectItem value={ALLE} className="font-body">Alle Traditionen</SelectItem>
										{TRADITIONEN.map(entry => (
											<SelectItem key={entry} value={entry} className="font-body">{entry}</SelectItem>
										))}
									</SelectContent>
								</Select>
								<Select value={gattung} onValueChange={setGattung}>
									<SelectTrigger className="flex-1 font-body" aria-label="Nach Gattung filtern">
										<SelectValue />
									</SelectTrigger>
									<SelectContent>
										<SelectItem value={ALLE} className="font-body">Liturgien und Zeremonien</SelectItem>
										{KLASSEN.map(k => (
											<SelectItem key={k.value} value={k.value} className="font-body">{k.plural}</SelectItem>
										))}
									</SelectContent>
								</Select>
							</div>
							<Command>
								<CommandInput placeholder="Liturgie suchen…" className="font-body" />
								<CommandList>
									<CommandEmpty>
										{gefiltert ? (
											<div className="space-y-2">
												<p>Kein Treffer unter den gewählten Filtern.</p>
												<Button
													variant="outline"
													size="sm"
													onClick={() => {
														setTradition(ALLE);
														setGattung(ALLE);
													}}
												>
													Filter zurücksetzen
												</Button>
											</div>
										) : (
											'Keine Liturgie gefunden'
										)}
									</CommandEmpty>
									<CommandGroup heading={`${catalog.length} von ${LITURGY_CATALOG.length - segen.length}`}>
										{catalog.map(entry => (
											<CommandItem
												key={entry.id}
												value={entry.name}
												onSelect={() => adopt(entry)}
												disabled={owned.has(entry.id)}
												className="font-body"
											>
												<div className="min-w-0 flex-1">
													<div className="font-heading">{entry.name}</div>
													<div className="truncate text-xs text-muted-foreground">
														{klassenLabel(entry.klasse as LiturgyBookClass)} · {entry.attributes?.join('/')}
														{entry.probeNote ? ` (${entry.probeNote})` : ''} · {entry.costText} · {entry.castTime}
														{tradition !== ALLE && aspekteFuer(entry, tradition)
															? ` · ${aspekteFuer(entry, tradition)}`
															: ''}
													</div>
												</div>
												{owned.has(entry.id) && (
													<span className="ml-2 text-xs text-muted-foreground">im Buch</span>
												)}
											</CommandItem>
										))}
									</CommandGroup>
								</CommandList>
							</Command>
						</PopoverContent>
					</Popover>

					<p className="text-xs text-muted-foreground">
						Übernommene Einträge lassen sich frei überschreiben. Bei Kostenformeln
						(„4 KaP + 2 KaP pro Minute") steht der Wortlaut in der Tabelle. Trage die Zahl
						ein, mit der du rechnest.
					</p>
				</CardContent>
			</Card>

			<Card variant="parchment">
				<CardHeader>
					<CardTitle className="text-lg">Eigenen Eintrag anlegen</CardTitle>
				</CardHeader>
				<CardContent className="space-y-4">
					<Input
						value={name}
						maxLength={SPELL_NAME_MAX}
						placeholder="Name der Liturgie"
						aria-label="Name der Liturgie"
						onChange={(event) => setName(event.target.value)}
						className="font-heading"
					/>

					<div className="flex flex-wrap items-end gap-3">
						<Select value={klasse} onValueChange={(value) => setKlasse(value as LiturgyBookClass)}>
							<SelectTrigger className="w-32 font-heading" aria-label="Gattung">
								<SelectValue />
							</SelectTrigger>
							<SelectContent>
								{KLASSEN.map(k => (
									<SelectItem key={k.value} value={k.value} className="font-heading">{k.label}</SelectItem>
								))}
							</SelectContent>
						</Select>

						{attributes.map((attribute, index) => (
							<Select
								key={index}
								value={attribute}
								onValueChange={(value) => setAttributes(current => {
									const next = [...current] as [AttributeKey, AttributeKey, AttributeKey];
									next[index] = value as AttributeKey;
									return next;
								})}
							>
								<SelectTrigger className="w-24 text-center font-heading" aria-label={`Eigenschaft ${index + 1}`}>
									<SelectValue />
								</SelectTrigger>
								<SelectContent>
									{ATTRIBUTE_KEYS.map(key => (
										<SelectItem key={key} value={key} className="font-heading">{key}</SelectItem>
									))}
								</SelectContent>
							</Select>
						))}

						<PropertyNumber label="KaP" value={cost} max={LITURGY_COST_MAX} size="s" onChange={setCost} />

						<Button variant="aventurian" onClick={create} disabled={!name.trim() || full}>
							<Plus className="mr-1 h-4 w-4" />
							Hinzufügen
						</Button>
					</div>

					{full && (
						<p className="text-sm text-failure-dark dark:text-failure-light">
							Das Liturgienbuch fasst höchstens {LITURGY_LIMIT} Einträge.
						</p>
					)}
				</CardContent>
			</Card>

			<ConfirmDialog
				open={pendingDelete !== null}
				onOpenChange={(open) => { if (!open) setPendingDelete(null); }}
				title="Eintrag entfernen?"
				description={
					<>
						„{pendingDelete?.name}" verschwindet samt Notiz und Fertigkeitswert aus dem
						Liturgienbuch. Das lässt sich nicht rückgängig machen.
					</>
				}
				confirmLabel="Entfernen"
				onConfirm={() => { if (pendingDelete) dispatch(removeLiturgy(pendingDelete.id)); }}
			/>
		</div>
	);
};

export default LiturgyBook;
