import { useMemo, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { nanoid } from '@reduxjs/toolkit';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
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
import {
	SPELL_COST_MAX, SPELL_LIMIT, SPELL_NAME_MAX, SPELL_NOTE_MAX,
	addSpell, removeSpell, updateSpell
} from '@/store/spellbookSlice';
import { MERKMALE, SPELL_CATALOG, VERBREITUNGEN, type SpellCatalogEntry } from '@/data/spells';
import { BookOpen, ChevronDown, Plus, Trash2 } from 'lucide-react';

const DEFAULT_ATTRIBUTES: [AttributeKey, AttributeKey, AttributeKey] = ['KL', 'KL', 'IN'];

const ALLE = 'alle';

/**
 * Hexenflüche führen keine Verbreitung, weil sie ausschließlich Hexen offenstehen –
 * unter dem Filter „Hexen" gehören sie trotzdem dazu.
 */
const passtZurVerbreitung = (entry: SpellCatalogEntry, verbreitung: string) => {
	if (verbreitung === ALLE) return true;
	if (entry.klasse === 'hexenfluch') return verbreitung === 'Hexen';
	return (entry.verbreitung ?? []).includes(verbreitung);
};

const Spellbook = () => {
	const dispatch = useDispatch();
	const spells = useSelector((state: RootState) => state.spellbook.spells);

	const [name, setName] = useState('');
	const [attributes, setAttributes] = useState<[AttributeKey, AttributeKey, AttributeKey]>(DEFAULT_ATTRIBUTES);
	const [cost, setCost] = useState(4);
	const [catalogOpen, setCatalogOpen] = useState(false);
	const [verbreitung, setVerbreitung] = useState(ALLE);
	const [merkmal, setMerkmal] = useState(ALLE);
	// Löschen ist der einzige Weg, einen Zauber samt Notiz zu verlieren – wie in der
	// Historie fragt die App vorher nach.
	const [pendingDelete, setPendingDelete] = useState<{ id: string; name: string } | null>(null);

	const full = spells.length >= SPELL_LIMIT;
	const owned = new Set(spells.map(spell => spell.catalogId).filter(Boolean));

	const catalog = useMemo(
		() =>
			SPELL_CATALOG.filter(
				entry =>
					passtZurVerbreitung(entry, verbreitung) &&
					(merkmal === ALLE || entry.merkmal === merkmal)
			),
		[verbreitung, merkmal]
	);

	const adopt = (entry: SpellCatalogEntry) => {
		dispatch(addSpell({
			id: nanoid(),
			catalogId: entry.id,
			name: entry.name,
			attributes: [...entry.attributes] as [AttributeKey, AttributeKey, AttributeKey],
			// Formelzauber starten bei 0 – die Zahl trägt der Spieler ein, der Wortlaut
			// steht als Erinnerung daneben.
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
		dispatch(addSpell({
			id: nanoid(),
			name: trimmed,
			attributes: [...attributes] as [AttributeKey, AttributeKey, AttributeKey],
			cost,
			value: 0
		}));
		setName('');
		setAttributes(DEFAULT_ATTRIBUTES);
		setCost(4);
	};

	return (
		<div className="space-y-6">
			<Card variant="parchment">
				<CardHeader>
					<CardTitle className="flex items-center gap-2">
						<BookOpen className="w-6 h-6" />
						Zauberbuch
					</CardTitle>
				</CardHeader>
				<CardContent>
					{spells.length === 0 ? (
						<p className="py-8 text-center text-sm text-muted-foreground">
							Noch keine Zauber. Lege unten einen eigenen an.
						</p>
					) : (
						<>
						{/* Schmale Screens bekommen Karten: sieben Spalten schieben AsP, FW und
						    Notiz sonst aus dem Bild. */}
						<div className="space-y-3 sm:hidden">
							{spells.map(spell => (
								<div
									key={spell.id}
									className="space-y-3 rounded-lg border border-aventurian-200 bg-aventurian-50/50 p-3 dark:border-aventurian-700 dark:bg-aventurian-900/30"
								>
									<div className="flex items-start justify-between gap-2">
										<div className="min-w-0">
											<div className="font-heading">{spell.name}</div>
											<div className="font-heading text-sm text-muted-foreground">
												{spell.attributes.join('/')}
												{spell.probeNote && (
													<span className="font-body text-magic-dark dark:text-magic-light"> {spell.probeNote}</span>
												)}
											</div>
											{spell.costText && (
												<div className="text-xs text-muted-foreground">{spell.costText}</div>
											)}
											{spell.castTime && (
												<div className="text-xs text-muted-foreground">Dauer {spell.castTime}</div>
											)}
										</div>
										<Button
											variant="ghost"
											size="icon"
											onClick={() => setPendingDelete({ id: spell.id, name: spell.name })}
											aria-label={`${spell.name} entfernen`}
										>
											<Trash2 className="h-4 w-4" />
										</Button>
									</div>

									<div className="flex flex-wrap items-end gap-3">
										<PropertyNumber
											label="AsP"
											value={spell.cost}
											max={SPELL_COST_MAX}
											size="s"
											ariaLabel={`AsP für ${spell.name}`}
											onChange={(value) => dispatch(updateSpell({ id: spell.id, changes: { cost: value } }))}
										/>
										<PropertyNumber
											label="FW"
											value={spell.value}
											max={TALENT_VALUE_MAX}
											size="s"
											ariaLabel={`Fertigkeitswert für ${spell.name}`}
											onChange={(value) => dispatch(updateSpell({ id: spell.id, changes: { value } }))}
										/>
									</div>

									<Input
										value={spell.note ?? ''}
										maxLength={SPELL_NOTE_MAX}
										placeholder="Notiz"
										aria-label={`Notiz zu ${spell.name}`}
										onChange={(event) => dispatch(updateSpell({
											id: spell.id,
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
										<th className="p-3 text-center font-heading">AsP</th>
										<th className="p-3 text-center font-heading">FW</th>
										<th className="p-3 text-left font-heading">Notiz</th>
										<th className="p-3 text-center font-heading"><span className="sr-only">Löschen</span></th>
									</tr>
								</thead>
								<tbody>
									{spells.map((spell, index) => (
										<tr
											key={spell.id}
											className={index % 2 === 0 ? 'bg-aventurian-50/50 dark:bg-aventurian-900/30' : ''}
										>
											<td className="p-3">
												<div className="font-heading">{spell.name}</div>
												{spell.costText && (
													<div className="text-xs text-muted-foreground">{spell.costText}</div>
												)}
											</td>
											<td className="p-3 text-center font-heading">
												{spell.attributes.join('/')}
												{spell.probeNote && (
													<div className="font-body text-xs text-magic-dark dark:text-magic-light">
														{spell.probeNote}
													</div>
												)}
											</td>
											<td className="p-3 text-center text-xs text-muted-foreground">
												{spell.castTime ?? '–'}
											</td>
											<td className="p-3">
												<PropertyNumber
													value={spell.cost}
													max={SPELL_COST_MAX}
													size="s"
													onChange={(value) => dispatch(updateSpell({ id: spell.id, changes: { cost: value } }))}
													className="mx-auto"
												/>
											</td>
											<td className="p-3">
												<PropertyNumber
													value={spell.value}
													max={TALENT_VALUE_MAX}
													size="s"
													onChange={(value) => dispatch(updateSpell({ id: spell.id, changes: { value } }))}
													className="mx-auto"
												/>
											</td>
											<td className="p-3">
												<Input
													value={spell.note ?? ''}
													maxLength={SPELL_NOTE_MAX}
													placeholder="Notiz"
													aria-label={`Notiz zu ${spell.name}`}
													onChange={(event) => dispatch(updateSpell({
														id: spell.id,
														changes: { note: event.target.value }
													}))}
													className="min-w-40 font-body"
												/>
											</td>
											<td className="p-3 text-center">
												<Button
													variant="ghost"
													size="icon"
													onClick={() => setPendingDelete({ id: spell.id, name: spell.name })}
													aria-label={`${spell.name} entfernen`}
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
								aria-label="Zauber aus dem Katalog wählen"
								disabled={full}
							>
								Zauber suchen…
								<ChevronDown className="opacity-50" />
							</Button>
						</PopoverTrigger>
						<PopoverContent className="w-[min(28rem,90vw)] p-0">
							<div className="flex gap-2 border-b p-2">
								<Select value={verbreitung} onValueChange={setVerbreitung}>
									<SelectTrigger className="flex-1 font-body" aria-label="Nach Verbreitung filtern">
										<SelectValue />
									</SelectTrigger>
									<SelectContent>
										<SelectItem value={ALLE} className="font-body">Alle Traditionen</SelectItem>
										{VERBREITUNGEN.map(name => (
											<SelectItem key={name} value={name} className="font-body">{name}</SelectItem>
										))}
									</SelectContent>
								</Select>
								<Select value={merkmal} onValueChange={setMerkmal}>
									<SelectTrigger className="flex-1 font-body" aria-label="Nach Merkmal filtern">
										<SelectValue />
									</SelectTrigger>
									<SelectContent>
										<SelectItem value={ALLE} className="font-body">Alle Merkmale</SelectItem>
										{MERKMALE.map(name => (
											<SelectItem key={name} value={name} className="font-body">{name}</SelectItem>
										))}
									</SelectContent>
								</Select>
							</div>
							<Command>
								<CommandInput placeholder="Zauber suchen…" className="font-body" />
								<CommandList>
									<CommandEmpty>Kein Zauber gefunden</CommandEmpty>
									<CommandGroup heading={`${catalog.length} von ${SPELL_CATALOG.length}`}>
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
														{entry.attributes.join('/')}
														{entry.probeNote ? ` (${entry.probeNote})` : ''} · {entry.costText}
														{entry.castTime ? ` · ${entry.castTime}` : ''} · {entry.merkmal}
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
						Übernommene Zauber lassen sich frei überschreiben. Bei Zaubern mit
						Kostenformel steht der Wortlaut in der Tabelle. Trage die Zahl ein,
						mit der du rechnest.
					</p>
				</CardContent>
			</Card>

			<Card variant="parchment">
				<CardHeader>
					<CardTitle className="text-lg">Eigenen Zauber anlegen</CardTitle>
				</CardHeader>
				<CardContent className="space-y-4">
					<Input
						value={name}
						maxLength={SPELL_NAME_MAX}
						placeholder="Name des Zaubers"
						aria-label="Name des Zaubers"
						onChange={(event) => setName(event.target.value)}
						className="font-heading"
					/>

					<div className="flex flex-wrap items-end gap-3">
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

						<PropertyNumber label="AsP" value={cost} max={SPELL_COST_MAX} size="s" onChange={setCost} />

						<Button variant="aventurian" onClick={create} disabled={!name.trim() || full}>
							<Plus className="mr-1 h-4 w-4" />
							Hinzufügen
						</Button>
					</div>

					{full && (
						<p className="text-sm text-failure-dark dark:text-failure-light">
							Das Zauberbuch fasst höchstens {SPELL_LIMIT} Zauber.
						</p>
					)}
				</CardContent>
			</Card>

			<ConfirmDialog
				open={pendingDelete !== null}
				onOpenChange={(open) => { if (!open) setPendingDelete(null); }}
				title="Zauber entfernen?"
				description={
					<>
						„{pendingDelete?.name}" verschwindet samt Notiz und Fertigkeitswert aus
						dem Zauberbuch. Das lässt sich nicht rückgängig machen.
					</>
				}
				confirmLabel="Entfernen"
				onConfirm={() => { if (pendingDelete) dispatch(removeSpell(pendingDelete.id)); }}
			/>
		</div>
	);
};

export default Spellbook;
