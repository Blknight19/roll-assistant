import { useDispatch, useSelector } from 'react-redux';
import { nanoid } from '@reduxjs/toolkit';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import type { RootState } from '@/store';
import { changeKap } from '@/store/karmaSlice';
import { markBlessingRefunded, setLastBlessing } from '@/store/liturgyRollSlice';
import { addRoll } from '@/store/rollSlice';
import { LITURGY_CATALOG } from '@/data/liturgies';
import { HeartHandshake, RotateCcw } from 'lucide-react';

/** „Ihr Wirken kostet jeweils 1 KaP, die Liturgiedauer beträgt 1 Aktion." */
const SEGEN_KOSTEN = 1;

/** Segen brauchen keine Probe und wirken mit QS 1 – ein Tipp bucht und protokolliert. */
const BlessingBar = () => {
	const dispatch = useDispatch();
	const blessings = useSelector((state: RootState) => state.karma.blessings);
	const kap = useSelector((state: RootState) => state.karma.kap);
	const lastBlessing = useSelector((state: RootState) => state.liturgyRoll.lastBlessing);

	const known = LITURGY_CATALOG.filter(
		entry => entry.klasse === 'segen' && blessings.includes(entry.id)
	);
	const canAfford = kap.current >= SEGEN_KOSTEN;

	const cast = (id: string, name: string) => {
		if (!canAfford) return;
		dispatch(changeKap(-SEGEN_KOSTEN));
		dispatch(setLastBlessing({ catalogId: id, name }));
		dispatch(addRoll({
			id: nanoid(),
			type: 'Liturgie',
			// Ein Segen wird ohne Probe gewirkt – die Historie zeigt für ihn keine Würfel.
			values: [],
			result: `Segen: ${name} (QS 1) [−${SEGEN_KOSTEN} KaP]`,
			date: new Date().toISOString()
		}));
	};

	const undo = () => {
		if (!lastBlessing?.booked) return;
		dispatch(changeKap(SEGEN_KOSTEN));
		dispatch(markBlessingRefunded());
	};

	return (
		<Card variant="parchment">
			<CardHeader className="pb-3">
				<CardTitle className="flex items-center gap-2 text-lg">
					<HeartHandshake className="h-5 w-5 text-karma-dark dark:text-karma-light" />
					Segen
				</CardTitle>
			</CardHeader>
			<CardContent className="space-y-3">
				{known.length === 0 ? (
					<p className="text-sm text-muted-foreground">
						Wähle im Charakterbogen unter „Liturgien" die erworbenen Segen.
					</p>
				) : (
					<div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
						{known.map(entry => (
							<Button
								key={entry.id}
								variant="outline"
								className="h-auto min-h-11 flex-col items-start gap-0 px-3 py-2 text-left font-body"
								onClick={canAfford ? () => cast(entry.id, entry.name) : undefined}
								aria-disabled={!canAfford || undefined}
								aria-label={`${entry.name} wirken, ${SEGEN_KOSTEN} KaP`}
							>
								<span className="font-heading text-sm">{entry.name}</span>
								<span className="text-xs text-muted-foreground">{entry.duration}</span>
							</Button>
						))}
					</div>
				)}

				{!canAfford && known.length > 0 && (
					<p className="text-sm text-failure-dark dark:text-failure-light">
						Keine KaP mehr – ein Segen kostet {SEGEN_KOSTEN} KaP.
					</p>
				)}

				{lastBlessing && (
					<div
						className="flex flex-wrap items-center justify-between gap-2 border-t border-border pt-3 text-sm"
						aria-live="polite"
					>
						<span>
							{lastBlessing.booked
								? `${lastBlessing.name} gewirkt, −${SEGEN_KOSTEN} KaP (QS 1)`
								: `${lastBlessing.name}: Buchung zurückgenommen`}
						</span>
						{lastBlessing.booked && (
							<Button variant="outline" size="sm" onClick={undo}>
								<RotateCcw className="mr-1 h-4 w-4" />
								Rückgängig
							</Button>
						)}
					</div>
				)}
			</CardContent>
		</Card>
	);
};

export default BlessingBar;
