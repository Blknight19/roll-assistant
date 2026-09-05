import { useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { Input } from '@/components/ui/input';
import type { RootState } from '@/store';
import { CHARACTER_NAME_MAX, setCharacterName } from '@/store/profileSlice';
import { Pencil, User } from 'lucide-react';
import ResourceBar from './ResourceBar';
import { DEVOTION_LEVELS } from '@/data/liturgies/devotion';

/**
 * Name und Lebensenergie auf jedem Tab. Die LeP lag früher am Ende des Kampf-Tabs –
 * also genau dort, wo man mitten im Kampf am wenigsten hinsieht.
 */
const HeroBar = () => {
	const dispatch = useDispatch();
	const name = useSelector((state: RootState) => state.profile.name);
	const life = useSelector((state: RootState) => state.combat.life);
	const asp = useSelector((state: RootState) => state.spellbook.asp);
	const isSpellcaster = useSelector((state: RootState) => state.spellbook.isSpellcaster);
	const kap = useSelector((state: RootState) => state.karma.kap);
	const isBlessed = useSelector((state: RootState) => state.karma.isBlessed);
	const devotionLevel = useSelector((state: RootState) => state.karma.devotionLevel);
	const [editing, setEditing] = useState(false);

	return (
		<div className="mb-6 flex flex-wrap items-center gap-3 rounded-lg border border-aventurian-300 bg-card px-4 py-3 dark:border-aventurian-700">
			{editing ? (
				<Input
					autoFocus
					value={name}
					maxLength={CHARACTER_NAME_MAX}
					placeholder="Name des Helden"
					aria-label="Name des Helden"
					onChange={(event) => dispatch(setCharacterName(event.target.value))}
					onBlur={() => setEditing(false)}
					onKeyDown={(event) => {
						if (event.key === 'Enter' || event.key === 'Escape') setEditing(false);
					}}
					className="h-9 max-w-[16rem] font-heading"
				/>
			) : (
				<button
					type="button"
					onClick={() => setEditing(true)}
					className="group flex min-w-0 items-center gap-2 rounded-md py-1 text-left focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
					aria-label="Name des Helden bearbeiten"
				>
					<User className="h-4 w-4 shrink-0 text-aventurian-600 dark:text-aventurian-400" />
					<span className="truncate font-heading font-semibold">
						{name || <span className="text-muted-foreground">Held benennen</span>}
					</span>
					<Pencil className="h-3.5 w-3.5 shrink-0 text-muted-foreground opacity-0 transition-opacity group-hover:opacity-100" />
				</button>
			)}

			<div className="ml-auto flex flex-col items-end gap-1 sm:flex-row sm:items-center sm:gap-4">
				<ResourceBar label="LeP" current={life.current} max={life.max} tone="life" className="w-24 sm:w-36" />
				{isSpellcaster && (
					<ResourceBar label="AsP" current={asp.current} max={asp.max} tone="astral" className="w-24 sm:w-36" />
				)}
				{isBlessed && (
					<ResourceBar label="KaP" current={kap.current} max={kap.max} tone="karma" className="w-24 sm:w-36" />
				)}
				{/* Entrückung wirkt auf Talente und Zauber, also außerhalb des Liturgie-Tabs.
				    Deshalb steht die Stufe hier, wo sie auf jedem Tab sichtbar ist. */}
				{isBlessed && devotionLevel > 0 && (
					<span
						className="rounded-full border border-karma px-2 py-0.5 font-heading text-xs font-semibold text-karma-dark dark:text-karma-light"
						aria-label={`Entrückung Stufe ${devotionLevel}`}
					>
						E {DEVOTION_LEVELS[devotionLevel].roman}
					</span>
				)}
			</div>
		</div>
	);
};

export default HeroBar;
