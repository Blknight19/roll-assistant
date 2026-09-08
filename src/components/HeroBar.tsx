import { useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { Input } from '@/components/ui/input';
import type { RootState } from '@/store';
import { CHARACTER_NAME_MAX, setCharacterName } from '@/store/profileSlice';
import { Activity, Pencil, User } from 'lucide-react';
import ResourceBar from './ResourceBar';
import ConditionsDialog from './ConditionsDialog';
import ConditionBadges from './ConditionBadges';
import { useConditions } from '@/hooks/useConditions';

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
	const conditions = useConditions();
	const hasConditions = conditions.active.length > 0;
	const conditionLabel = hasConditions
		? `Zustände bearbeiten: ${conditions.active.map(entry => `${entry.name} ${entry.roman}`).join(', ')}`
			+ (conditions.incapacitated ? ', handlungsunfähig' : '')
		: 'Zustände';
	const [editing, setEditing] = useState(false);

	return (
		<div className="mb-6 grid grid-cols-[minmax(0,1fr)_auto] items-start gap-x-2 gap-y-2 rounded-lg border border-parchment-300 bg-card px-4 py-3 dark:border-parchment-700 lg:grid-cols-[minmax(0,1fr)_auto_auto] lg:gap-x-3">
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
					className="col-start-1 row-start-1 h-9 max-w-[16rem] font-heading"
				/>
			) : (
				<button
					type="button"
					onClick={() => setEditing(true)}
					className="group col-start-1 row-start-1 flex min-w-0 items-center gap-2 self-center rounded-md py-1 text-left focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
					aria-label="Name des Helden bearbeiten"
				>
					<User className="h-4 w-4 shrink-0 text-parchment-600 dark:text-parchment-400" />
					<span className="truncate font-heading font-semibold">
						{name || <span className="text-muted-foreground">Held benennen</span>}
					</span>
					<Pencil className="h-3.5 w-3.5 shrink-0 text-muted-foreground opacity-0 transition-opacity group-hover:opacity-100" />
				</button>
			)}

			{/* Bis `lg` bekommt der Name die erste Zeile allein und die Leisten stehen als
			    Messer nebeneinander darunter. Die einreihige Fassung braucht rund 1000 px –
			    darunter bliebe für den Namen nichts übrig. `flex-wrap` fängt den Rest ab. */}
			<div
				className="col-span-2 col-start-1 row-start-2 flex min-w-0 flex-wrap items-start gap-x-3 gap-y-1 self-center lg:col-span-1 lg:col-start-2 lg:row-start-1 lg:items-center lg:gap-x-3"
			>
				<ResourceBar label="LeP" current={life.current} max={life.max} tone="life" compact className="lg:w-36" />
				{isSpellcaster && (
					<ResourceBar label="AsP" current={asp.current} max={asp.max} tone="astral" compact className="lg:w-36" />
				)}
				{isBlessed && (
					<ResourceBar label="KaP" current={kap.current} max={kap.max} tone="karma" compact className="lg:w-36" />
				)}
			</div>

			{/* Immer sichtbar, auch ohne aktiven Zustand: der Knopf ist der einzige Weg in
			    den Dialog, die Abzeichen darunter sind reine Anzeige. */}
			<ConditionsDialog>
				<button
					type="button"
					aria-label={conditionLabel}
					className="col-start-2 row-start-1 flex h-10 w-10 shrink-0 items-center justify-center self-center rounded-md hover:bg-accent focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring lg:col-start-3"
				>
					<Activity className="h-5 w-5 text-muted-foreground" />
				</button>
			</ConditionsDialog>

			{hasConditions && (
				<div className="col-span-2 col-start-1 row-start-3 flex min-w-0 flex-wrap items-center gap-1 lg:col-span-3 lg:row-start-2">
					<ConditionBadges active={conditions.active} incapacitated={conditions.incapacitated} />
				</div>
			)}
		</div>
	);
};

export default HeroBar;
