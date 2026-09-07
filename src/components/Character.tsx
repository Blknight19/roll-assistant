import { useCallback, useMemo, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import PropertyNumber from './PropertyNumber';
import TalentRow, { TalentListItem } from './TalentRow';
import CastingBooks from './CastingBooks';
import type { RootState } from '@/store';
import { ATTRIBUTE_KEYS, ATTRIBUTE_MAX, ATTRIBUTE_MIN, setAttribute } from '@/store/attributesSlice';
import { updateTalent } from '@/store/talentsSlice';
import { useCastingDomains } from '@/hooks/useCastingDomains';
import { User, Sparkles } from 'lucide-react';

const Character = () => {
	const dispatch = useDispatch();
	const attributes = useSelector((state: RootState) => state.attributes);
	const talents = useSelector((state: RootState) => state.talents.talents);
	const domains = useCastingDomains();
	const CastingIcon = domains.icon;

	// Über dreißig Zeilen sind ohne Suche nicht zu überblicken – der Wurf-Tab hat
	// sie längst, der Charakterbogen bisher nicht.
	const [filter, setFilter] = useState('');
	const visibleTalents = useMemo(() => {
		const needle = filter.trim().toLowerCase();
		return needle ? talents.filter(talent => talent.name.toLowerCase().includes(needle)) : talents;
	}, [talents, filter]);

	const handleTalentChange = useCallback(
		(id: string, value: number) => { dispatch(updateTalent({ id, value })); },
		[dispatch]
	);

	return (
		<div className="w-full max-w-6xl mx-auto">
			<Tabs defaultValue="attributes" className="w-full">
				<TabsList className={`grid w-full ${domains.any ? 'grid-cols-3' : 'grid-cols-2'} h-auto mb-6`}>
					<TabsTrigger value="attributes" className="font-heading flex flex-col items-center gap-1 py-2" aria-label="Eigenschaften">
						<User className="w-4 h-4" />
						<span className="text-[11px] sm:text-xs leading-none">Eigenschaften</span>
					</TabsTrigger>
					<TabsTrigger value="talents" className="font-heading flex flex-col items-center gap-1 py-2" aria-label="Talente">
						<Sparkles className="w-4 h-4" />
						<span className="text-[11px] sm:text-xs leading-none">Talente</span>
					</TabsTrigger>
					{domains.any && (
						<TabsTrigger value="casting" className="font-heading flex flex-col items-center gap-1 py-2" aria-label={domains.bookLabel}>
							<CastingIcon className="w-4 h-4" />
							<span className="text-[11px] sm:text-xs leading-none">{domains.bookLabel}</span>
						</TabsTrigger>
					)}
				</TabsList>

				{/* Eigenschaften */}
				<TabsContent value="attributes">
					<Card variant="parchment">
						<CardHeader>
							<CardTitle className="flex items-center gap-2">
								<User className="w-6 h-6" />
								Eigenschaften
							</CardTitle>
						</CardHeader>
						<CardContent>
							<div className="grid grid-cols-1 md:grid-cols-4 sm:grid-cols-2 gap-6">
								{ATTRIBUTE_KEYS.map((key) => (
									<div
										key={key}
										className="flex flex-col items-center p-6 rounded-lg bg-aventurian-100/50 dark:bg-aventurian-800/50 hover:bg-aventurian-200/50 dark:hover:bg-aventurian-700/50 transition-colors"
									>
										<PropertyNumber
											label={key}
											value={attributes[key]}
											min={ATTRIBUTE_MIN}
											max={ATTRIBUTE_MAX}
											onChange={(value) => dispatch(setAttribute({ key, value }))}
											size="m"
										/>
									</div>
								))}
							</div>
						</CardContent>
					</Card>
				</TabsContent>

				{/* Talente */}
				<TabsContent value="talents">
					<Card variant="parchment">
						<CardHeader>
							<CardTitle className="flex items-center gap-2">
								<Sparkles className="w-6 h-6" />
								Talente
							</CardTitle>
						</CardHeader>
						<CardContent className="space-y-4">
							<Input
								value={filter}
								placeholder="Talent filtern…"
								aria-label="Talente filtern"
								onChange={(event) => setFilter(event.target.value)}
								className="max-w-xs font-body"
							/>

							{visibleTalents.length === 0 ? (
								<p className="py-8 text-center text-sm text-muted-foreground">
									Kein Talent gefunden
								</p>
							) : (
							<>
							{/* Schmale Screens bekommen eine Liste: die Tabelle ist 544 px breit und
							    schiebt den Wert-Stepper aus dem Bild. */}
							<div className="space-y-2 sm:hidden">
								{visibleTalents.map((talent) => (
									<TalentListItem key={talent.id} talent={talent} onChange={handleTalentChange} />
								))}
							</div>

							<div className="hidden overflow-x-auto sm:block">
								<table className="min-w-full text-sm">
									<thead className="sticky top-0 bg-aventurian-100 dark:bg-aventurian-800 z-10">
										<tr className="border-b-2 border-aventurian-400 dark:border-aventurian-600">
											<th className="p-3 text-left font-heading">Name</th>
											<th className="p-3 text-center font-heading">Eig. 1</th>
											<th className="p-3 text-center font-heading">Eig. 2</th>
											<th className="p-3 text-center font-heading">Eig. 3</th>
											<th className="p-3 text-center font-heading">Wert</th>
										</tr>
									</thead>
									<tbody>
										{visibleTalents.map((talent, index) => (
											<TalentRow
												key={talent.id}
												talent={talent}
												striped={index % 2 === 0}
												onChange={handleTalentChange}
											/>
										))}
									</tbody>
								</table>
							</div>
							</>
							)}
						</CardContent>
					</Card>
				</TabsContent>

				{domains.any && (
					<TabsContent value="casting">
						<CastingBooks />
					</TabsContent>
				)}

			</Tabs>
		</div>
	);
};

export default Character;