import { useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { Input } from '@/components/ui/input';
import type { RootState } from '@/store';
import { CHARACTER_NAME_MAX, setCharacterName } from '@/store/profileSlice';
import { Pencil, User } from 'lucide-react';
import ResourceBar from './ResourceBar';
import ConditionsDialog from './ConditionsDialog';
import ConditionBadges from './ConditionBadges';
import { useConditions } from '@/hooks/useConditions';
import { cn } from '@/lib/utils';

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
	const conditionLabel = conditions.active.length === 0
		? 'Zustände'
		: `Zustände bearbeiten: ${conditions.active.map(entry => `${entry.name} ${entry.roman}`).join(', ')}`
			+ (conditions.incapacitated ? ', handlungsunfähig' : '');
	const [editing, setEditing] = useState(false);

	return (
		<div className="mb-6 flex flex-wrap items-center gap-3 rounded-lg border border-parchment-300 bg-card px-4 py-3 dark:border-parchment-700">
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
					<User className="h-4 w-4 shrink-0 text-parchment-600 dark:text-parchment-400" />
					<span className="truncate font-heading font-semibold">
						{name || <span className="text-muted-foreground">Held benennen</span>}
					</span>
					<Pencil className="h-3.5 w-3.5 shrink-0 text-muted-foreground opacity-0 transition-opacity group-hover:opacity-100" />
				</button>
			)}

			{/* `flex-wrap` ab `sm`: drei Leisten und der Zustände-Auslöser passen auf
			    mittleren Breiten nicht mehr in eine Zeile neben den Heldennamen. */}
			<div className="ml-auto flex flex-col items-end gap-1 sm:flex-row sm:flex-wrap sm:items-center sm:justify-end sm:gap-x-4 sm:gap-y-1">
				<ResourceBar label="LeP" current={life.current} max={life.max} tone="life" className="w-24 sm:w-36" />
				{isSpellcaster && (
					<ResourceBar label="AsP" current={asp.current} max={asp.max} tone="astral" className="w-24 sm:w-36" />
				)}
				{isBlessed && (
					<ResourceBar label="KaP" current={kap.current} max={kap.max} tone="karma" className="w-24 sm:w-36" />
				)}
				{/* Zustände wirken auf jedem Tab – der Auslöser steht deshalb neben den Ressourcen. */}
				<ConditionsDialog>
					<button
						type="button"
						aria-label={conditionLabel}
						className={cn(
							'flex flex-wrap items-center justify-end gap-1 rounded-md focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring',
							conditions.active.length === 0 ? 'h-10 w-10 justify-center hover:bg-accent' : 'min-h-9 px-1'
						)}
					>
						<ConditionBadges active={conditions.active} incapacitated={conditions.incapacitated} />
					</button>
				</ConditionsDialog>
			</div>
		</div>
	);
};

export default HeroBar;
