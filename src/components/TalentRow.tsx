import { memo } from 'react';
import PropertyNumber from './PropertyNumber';
import { TALENT_VALUE_MAX, type Talent } from '@/store/talentsSlice';

type TalentRowProps = {
	talent: Talent;
	striped: boolean;
	onChange: (id: string, value: number) => void;
};

const TalentRow = memo(({ talent, striped, onChange }: TalentRowProps) => (
	<tr
		className={`
			border-b border-parchment-200 dark:border-parchment-700
			hover:bg-parchment-100/50 dark:hover:bg-parchment-800/50
			transition-colors
			${striped ? 'bg-parchment-50/30 dark:bg-parchment-900/30' : ''}
		`}
	>
		<td className="p-3 text-base">{talent.name}</td>
		{[talent.attribute1, talent.attribute2, talent.attribute3].map((attribute, index) => (
			<td key={index} className="p-3 text-center">
				<span className="px-2 py-1 rounded bg-parchment-200 dark:bg-parchment-700 font-heading text-xs">
					{attribute}
				</span>
			</td>
		))}
		<td className="p-3 text-center">
			<PropertyNumber
				value={talent.value}
				max={TALENT_VALUE_MAX}
				size="s"
				ariaLabel={talent.name}
				onChange={(value) => onChange(talent.id, value)}
			/>
		</td>
	</tr>
));

TalentRow.displayName = 'TalentRow';

/**
 * Dieselbe Zeile für schmale Screens. Die Tabelle braucht 544 px und schob den
 * Stepper – das einzige Bedienelement des Screens – aus dem Bild; hier steht er
 * neben dem Namen, die Eigenschaften rutschen darunter.
 */
export const TalentListItem = memo(({ talent, onChange }: Omit<TalentRowProps, 'striped'>) => (
	<div className="flex items-center justify-between gap-3 rounded-lg border border-parchment-200 bg-parchment-50/30 p-3 dark:border-parchment-700 dark:bg-parchment-900/30">
		<div className="min-w-0">
			{/* Umbrechen statt abschneiden: „Körperbeherrschung" wäre sonst nicht mehr
			    von „Körperkraft" zu unterscheiden. */}
			<div className="break-words text-base">{talent.name}</div>
			<div className="mt-1 flex flex-wrap gap-1">
				{[talent.attribute1, talent.attribute2, talent.attribute3].map((attribute, index) => (
					<span
						key={index}
						className="rounded bg-parchment-200 px-2 py-0.5 font-heading text-xs dark:bg-parchment-700"
					>
						{attribute}
					</span>
				))}
			</div>
		</div>
		<PropertyNumber
			value={talent.value}
			max={TALENT_VALUE_MAX}
			size="s"
			ariaLabel={talent.name}
			onChange={(value) => onChange(talent.id, value)}
		/>
	</div>
));

TalentListItem.displayName = 'TalentListItem';

export default TalentRow;
