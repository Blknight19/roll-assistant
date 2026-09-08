import { useDispatch, useSelector } from 'react-redux';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Switch } from '@/components/ui/switch';
import {
	Select, SelectContent, SelectItem, SelectTrigger, SelectValue
} from '@/components/ui/select';
import type { RootState } from '@/store';
import { setBlessed, setTradition } from '@/store/karmaSlice';
import { setSpellcaster } from '@/store/spellbookSlice';
import { setToughDog } from '@/store/conditionsSlice';
import { TRADITIONEN } from '@/data/liturgies';
import { User } from 'lucide-react';

/** Wert des Select-Eintrags für „keine Tradition" – Radix erlaubt keinen leeren Wert. */
const ANDERE = 'andere';

/**
 * Charakterbezogene Schalter – bewusst getrennt von `RulesSettings`: die dortigen
 * Einstellungen gehören der App, dieser hier wandert mit in die .held-Datei.
 */
const HeroSettings = () => {
	const dispatch = useDispatch();
	const isSpellcaster = useSelector((state: RootState) => state.spellbook.isSpellcaster);
	const isBlessed = useSelector((state: RootState) => state.karma.isBlessed);
	const tradition = useSelector((state: RootState) => state.karma.tradition);
	const toughDog = useSelector((state: RootState) => state.conditions.toughDog);

	return (
		<Card variant="parchment">
			<CardHeader>
				<CardTitle className="flex items-center gap-2">
					<User className="w-5 h-5" />
					Held
				</CardTitle>
			</CardHeader>
			<CardContent className="space-y-5">
				<div className="flex items-center justify-between gap-4">
					<div className="text-left">
						<label htmlFor="is-spellcaster" className="font-semibold">
							Zauberkundig
						</label>
						<p className="text-sm text-muted-foreground">
							Blendet den Magie-Tab, die AsP-Leiste und das Zauberbuch ein.
							Ausschalten blendet sie nur aus. Zauber und AsP bleiben erhalten.
						</p>
					</div>
					<Switch
						id="is-spellcaster"
						checked={isSpellcaster}
						onCheckedChange={(checked) => dispatch(setSpellcaster(checked))}
						aria-label="Held ist zauberkundig"
					/>
				</div>

				<div className="flex items-center justify-between gap-4">
					<div className="text-left">
						<label htmlFor="is-blessed" className="font-semibold">
							Geweiht
						</label>
						<p className="text-sm text-muted-foreground">
							Blendet den Liturgie-Tab, die KaP-Leiste und das Liturgienbuch ein.
							Ausschalten blendet sie nur aus. Liturgien und KaP bleiben erhalten.
						</p>
					</div>
					<Switch
						id="is-blessed"
						checked={isBlessed}
						onCheckedChange={(checked) => dispatch(setBlessed(checked))}
						aria-label="Held ist geweiht"
					/>
				</div>

				{isBlessed && (
					<div className="flex items-center justify-between gap-4">
						<div className="text-left">
							<label htmlFor="tradition" className="font-semibold">
								Tradition
							</label>
							<p className="text-sm text-muted-foreground">
								Filtert den Liturgienkatalog vor und liefert den Richtwert für die
								Karmaenergie.
							</p>
						</div>
						<Select
							value={tradition || ANDERE}
							onValueChange={(value) => dispatch(setTradition(value === ANDERE ? '' : value))}
						>
							<SelectTrigger id="tradition" className="w-44 shrink-0 font-body" aria-label="Tradition wählen">
								<SelectValue />
							</SelectTrigger>
							<SelectContent>
								<SelectItem value={ANDERE} className="font-body">Andere / keine</SelectItem>
								{/* Eine Tradition aus einer importierten Datei muss der Katalog nicht
								    kennen. Ohne eigenen Eintrag stünde das Feld leer da, obwohl ein
								    Wert gesetzt ist – der Spieler sähe nicht, was sein Held ist. */}
								{tradition !== '' && !TRADITIONEN.includes(tradition) && (
									<SelectItem value={tradition} className="font-body">
										{tradition} (unbekannt)
									</SelectItem>
								)}
								{TRADITIONEN.map(name => (
									<SelectItem key={name} value={name} className="font-body">{name}</SelectItem>
								))}
							</SelectContent>
						</Select>
					</div>
				)}

				<div className="flex items-center justify-between gap-4">
					<div className="text-left">
						<label htmlFor="tough-dog" className="font-semibold">
							Zäher Hund
						</label>
						<p className="text-sm text-muted-foreground">
							Der Held ignoriert die höchste Stufe des Zustands Schmerz. Die App zieht sie bei
							der Herleitung aus den LeP ab.
						</p>
					</div>
					<Switch
						id="tough-dog"
						checked={toughDog}
						onCheckedChange={(checked) => dispatch(setToughDog(checked))}
						aria-label="Vorteil Zäher Hund"
					/>
				</div>
			</CardContent>
		</Card>
	);
};

export default HeroSettings;
