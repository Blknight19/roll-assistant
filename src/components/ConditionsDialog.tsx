import { useState, type ReactNode } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { toast } from 'sonner';
import {
	Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import ConditionRow from './ConditionRow';
import type { RootState } from '@/store';
import { resetConditions, setConditionLevel } from '@/store/conditionsSlice';
import {
	CONDITIONS, CONDITION_MAX_LEVEL, ROMAN_LEVELS, ZECHEN_TALENT_ID, type ConditionId
} from '@/data/conditions';
import { useConditions } from '@/hooks/useConditions';
import { incapacitationReason, type ConditionTarget } from '@/utils/conditionRules';
import { signedModifier } from '@/utils/format';
import { Activity, RotateCcw } from 'lucide-react';

/** Schlimmster Fall für die Fußzeile: ein Talent, das jedes Erschwernis-Profil trifft. */
const WORST_CASE: ConditionTarget = {
	kind: 'talent',
	id: ZECHEN_TALENT_ID,
	group: 'koerper',
	be: 'ja'
};

/** Der Auslöser kommt von außen (HeroBar), der Dialog bringt Inhalt und Fußzeile mit. */
const ConditionsDialog = ({ children }: { children: ReactNode }) => {
	const dispatch = useDispatch();
	const [open, setOpen] = useState(false);
	const stored = useSelector((state: RootState) => state.conditions.levels);
	const life = useSelector((state: RootState) => state.combat.life);
	const isBlessed = useSelector((state: RootState) => state.karma.isBlessed);
	const conditions = useConditions();
	const worst = conditions.modifierFor(WORST_CASE);
	const reason = incapacitationReason(conditions.levels);

	const setLevel = (id: ConditionId, level: number) => {
		dispatch(setConditionLevel({ id, level }));
		if (id === 'berauscht' && level === CONDITION_MAX_LEVEL) {
			toast.info('Berauscht IV: 1 Stufe Betäubung, Berauscht auf 0');
		}
	};

	const painHint = `aus LeP: ${ROMAN_LEVELS[conditions.painFromLife]} (${life.current} / ${life.max})`
		+ (conditions.toughDog ? ' · Zäher Hund −1' : '');

	return (
		<Dialog open={open} onOpenChange={setOpen}>
			<DialogTrigger asChild>{children}</DialogTrigger>
			<DialogContent className="max-h-[85vh] max-w-2xl overflow-y-auto">
				<DialogHeader>
					<DialogTitle className="flex items-center gap-2 font-heading">
						<Activity className="h-5 w-5 text-amber-700 dark:text-amber-400" />
						Zustände
					</DialogTitle>
				</DialogHeader>

				<div className="space-y-3">
					{CONDITIONS
						.filter(condition => condition.id !== 'entrueckung' || isBlessed)
						.map(condition => (
							<ConditionRow
								key={condition.id}
								condition={condition}
								value={stored[condition.id]}
								effective={conditions.levels[condition.id]}
								pickerLabel={condition.id === 'schmerz' ? 'Zusätzliche Stufe Schmerz' : `Stufe ${condition.name}`}
								hint={condition.id === 'schmerz' ? painHint : undefined}
								onChange={(level) => setLevel(condition.id, level)}
							/>
						))}
				</div>

				<div className="flex flex-wrap items-center justify-between gap-3 border-t border-border pt-3 text-sm">
					<div>
						<p>
							{conditions.totalLevels} {conditions.totalLevels === 1 ? 'Stufe' : 'Stufen'} gesamt ·
							Erschwernis bis zu {worst.modifier === 0 ? '±0' : signedModifier(worst.modifier)}
							{worst.capped ? ' (Deckel)' : ''}
						</p>
						{reason && (
							<p className="font-semibold text-failure-dark dark:text-failure-light">
								Handlungsunfähig – {reason}
							</p>
						)}
					</div>
					<Button variant="outline" size="sm" onClick={() => dispatch(resetConditions())}>
						<RotateCcw className="mr-1 h-4 w-4" />
						Alle zurücksetzen
					</Button>
				</div>
			</DialogContent>
		</Dialog>
	);
};

export default ConditionsDialog;
