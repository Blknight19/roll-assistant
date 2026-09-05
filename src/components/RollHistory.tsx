import { useState } from 'react';
import type { RootState } from '@/store';
import { clearHistory, type RollHistoryEntry } from '@/store/rollSlice';
import { useDispatch, useSelector } from 'react-redux';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import ConfirmDialog from './ConfirmDialog';
import { Trash2, Dices, Swords, Scroll, Wand2, Church, type LucideIcon } from 'lucide-react';

/**
 * Icon, Farbe und Zählername je Wurfart – an einer Stelle, damit eine neue Art nicht
 * wieder nur zur Hälfte ankommt. Die Magie-Farbe gehört seit dem Magie-Modul dem
 * Zauber; die Talentprobe trägt jetzt den Bronzeton der App.
 */
const ROLL_TYPE_STYLES = {
	Talent: {
		icon: Scroll,
		color: 'text-aventurian-600 dark:text-aventurian-400',
		plural: 'Talente'
	},
	Kampf: {
		icon: Swords,
		color: 'text-failure-dark dark:text-failure-light',
		plural: 'Kämpfe'
	},
	Zauber: {
		icon: Wand2,
		color: 'text-magic-dark dark:text-magic-light',
		plural: 'Zauber'
	},
	Liturgie: {
		icon: Church,
		color: 'text-karma-dark dark:text-karma-light',
		plural: 'Liturgien'
	},
	Einzel: {
		icon: Dices,
		color: 'text-foreground',
		plural: 'Einzelwürfe'
	}
} satisfies Record<string, { icon: LucideIcon; color: string; plural: string }>;

type RollType = keyof typeof ROLL_TYPE_STYLES;

const ROLL_TYPE_ORDER = Object.keys(ROLL_TYPE_STYLES) as RollType[];

const styleFor = (type: string) =>
	ROLL_TYPE_STYLES[type as RollType] ?? { icon: Dices, color: 'text-foreground', plural: type };

/** Uhrzeit reicht nur für heute – 100 Einträge können mehrere Spielabende umfassen. */
const formatRollDate = (iso: string): string => {
	const date = new Date(iso);
	if (Number.isNaN(date.getTime())) return '';

	const time = date.toLocaleTimeString('de-DE', { hour: '2-digit', minute: '2-digit' });
	const isToday = date.toDateString() === new Date().toDateString();
	if (isToday) return time;

	return `${date.toLocaleDateString('de-DE', { day: '2-digit', month: '2-digit' })} ${time}`;
};

const RollHistory = () => {
	const dispatch = useDispatch();
	const rollHistory: RollHistoryEntry[] = useSelector((state: RootState) => state.roll.history);
	const isSpellcaster = useSelector((state: RootState) => state.spellbook.isSpellcaster);
	const isBlessed = useSelector((state: RootState) => state.karma.isBlessed);
	const [confirmOpen, setConfirmOpen] = useState(false);

	const countOf = (type: RollType) => rollHistory.filter(entry => entry.type === type).length;

	// „Zauber" und „Liturgie" erscheinen für die jeweilige Fähigkeit – und auch sonst,
	// solange noch solche Würfe in der Historie stehen (der Schalter versteckt nur,
	// er löscht nichts).
	const shownTypes = ROLL_TYPE_ORDER.filter(type =>
		(type !== 'Zauber' || isSpellcaster || countOf('Zauber') > 0) &&
		(type !== 'Liturgie' || isBlessed || countOf('Liturgie') > 0)
	);

	return (
		<div className="w-full max-w-4xl mx-auto space-y-6">
			{/* Header */}
			<Card variant="parchment">
				<CardHeader>
					<div className="flex justify-between items-center">
						<CardTitle className="flex items-center gap-2">
							<Scroll className="w-6 h-6" />
							Wurf-Historie
						</CardTitle>
						<Button
							variant="destructive"
							size="sm"
							onClick={() => setConfirmOpen(true)}
							disabled={rollHistory.length === 0}
						>
							<Trash2 className="w-4 h-4 mr-2" />
							Löschen
						</Button>
					</div>
				</CardHeader>
			</Card>

			<ConfirmDialog
				open={confirmOpen}
				onOpenChange={setConfirmOpen}
				title="Historie löschen?"
				description="Alle gespeicherten Würfe werden entfernt. Das kann nicht rückgängig gemacht werden."
				confirmLabel="Historie löschen"
				onConfirm={() => dispatch(clearHistory())}
			/>

			{/* Empty State */}
			{rollHistory.length === 0 ? (
				<Card variant="parchment">
					<CardContent className="text-center py-16">
						<Dices className="w-20 h-20 mx-auto mb-6 float-dice text-aventurian-500" />
						<h3 className="text-2xl font-heading font-semibold mb-3">
							Noch keine Würfe
						</h3>
						<p className="text-muted-foreground mb-6">
							Würfle deine erste Probe und sie erscheint hier!
						</p>
						<div className="flex flex-wrap justify-center gap-2 text-sm text-muted-foreground">
							{shownTypes.map((type, index) => {
								const { icon: Icon, plural } = ROLL_TYPE_STYLES[type];
								return (
									<span key={type} className="flex items-center gap-2">
										{index > 0 && <span>•</span>}
										<span className="flex items-center gap-1">
											<Icon className="w-4 h-4" /> {plural}
										</span>
									</span>
								);
							})}
						</div>
					</CardContent>
				</Card>
			) : (
				/* History List */
				<div className="space-y-3">
					{rollHistory.map((roll, index) => {
						const { icon: Icon, color } = styleFor(roll.type);
						return (
						<Card
							key={roll.id}
							variant="parchment"
							className="hover:shadow-md transition-all duration-200 animate-in fade-in slide-in-from-top-2"
							style={{ animationDelay: `${Math.min(index, 10) * 50}ms` }}
						>
							<CardContent className="p-4">
								<div className="flex items-start justify-between gap-4">
									{/* Icon & Type */}
									<div className="flex items-center gap-3">
										<div className={color}>
											<Icon className="w-4 h-4" />
										</div>
										<div className="flex-1">
											<div className="flex items-center gap-2 mb-1">
												<span className={`font-heading font-semibold ${color}`}>
													{roll.type}
												</span>
												<span className="text-xs text-muted-foreground">
													{formatRollDate(roll.date)}
												</span>
											</div>
											<p className="text-sm">{roll.result}</p>
											{/* Ein Segen wird ohne Probe gewirkt und hat keine Würfel. */}
											{roll.values.length > 0 && (
												<p className="text-xs text-muted-foreground mt-1">
													Würfel: {roll.values.join(', ')}
												</p>
											)}
										</div>
									</div>
								</div>
							</CardContent>
						</Card>
						);
					})}
				</div>
			)}

			{/* Footer Stats */}
			{rollHistory.length > 0 && (
				<Card variant="parchment">
					<CardContent className="p-4">
						<div className="flex flex-wrap justify-center gap-8 text-sm text-muted-foreground">
							<div className="text-center">
								<p className="font-heading font-semibold text-foreground text-lg">
									{rollHistory.length}
								</p>
								<p>Gesamt</p>
							</div>
							{shownTypes.map(type => (
								<div key={type} className="text-center">
									<p className={`font-heading font-semibold text-lg ${ROLL_TYPE_STYLES[type].color}`}>
										{countOf(type)}
									</p>
									<p>{ROLL_TYPE_STYLES[type].plural}</p>
								</div>
							))}
						</div>
					</CardContent>
				</Card>
			)}
		</div>
	);
};

export default RollHistory;