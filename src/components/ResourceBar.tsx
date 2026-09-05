import { fillPercent } from '@/store/combatSlice';

type ResourceBarProps = {
	label: string;
	current: number;
	max: number;
	/** LeP zeigen Schmerzstufen als Ampel; AsP und KaP haben kein Gegenstück. */
	tone: 'life' | 'astral' | 'karma';
	className?: string;
};

/** Geteilte Ressourcenleiste für LeP und AsP – gleiche Form, unterschiedliche Bedeutung. */
const ResourceBar = ({ label, current, max, tone, className = '' }: ResourceBarProps) => {
	const ratio = max > 0 ? (current / max) * 100 : 0;
	const width = fillPercent(current, max);
	const fill = tone === 'astral'
		? 'bg-magic'
		: tone === 'karma'
			? 'bg-karma'
			: ratio > 66 ? 'bg-success' : ratio > 33 ? 'bg-amber-500' : 'bg-failure';

	return (
		<div className="flex items-center gap-2">
			<span className="text-[0.65rem] font-semibold uppercase tracking-widest text-muted-foreground">
				{label}
			</span>
			<div
				className={`relative h-4 overflow-hidden rounded-full border border-aventurian-400 bg-muted dark:border-aventurian-600 ${className}`}
				role="img"
				aria-label={`${label} ${current} von ${max}`}
			>
				<div className={`h-full ${fill} transition-all duration-500`} style={{ width: `${width}%` }} />
				{/* Schwellen der Schmerzstufen bei ¼, ½ und ¾ – nur bei LeP, AsP kennen keine. */}
				{tone === 'life' && [25, 50, 75].map((mark) => (
					<div
						key={mark}
						className="absolute top-0 h-full w-px bg-foreground/25"
						style={{ left: `${mark}%` }}
					/>
				))}
			</div>
			<span className="whitespace-nowrap font-heading text-sm font-semibold tabular-nums">
				{current} / {max}
			</span>
		</div>
	);
};

export default ResourceBar;
