import { fillPercent } from '@/store/combatSlice';

type ResourceBarProps = {
	label: string;
	current: number;
	max: number;
	/** LeP zeigen Schmerzstufen als Ampel; AsP und KaP haben kein Gegenstück. */
	tone: 'life' | 'astral' | 'karma';
	className?: string;
	/** Mobil Beschriftung und Zahl in eine Zeile, den Balken darunter über die volle Breite. */
	compact?: boolean;
};

/** Geteilte Ressourcenleiste für LeP und AsP – gleiche Form, unterschiedliche Bedeutung. */
const ResourceBar = ({ label, current, max, tone, className = '', compact = false }: ResourceBarProps) => {
	const ratio = max > 0 ? (current / max) * 100 : 0;
	const width = fillPercent(current, max);
	const fill = tone === 'astral'
		? 'bg-magic'
		: tone === 'karma'
			? 'bg-karma'
			: ratio > 66 ? 'bg-success' : ratio > 33 ? 'bg-amber-500' : 'bg-failure';

	return (
		<div
			className={`flex items-center gap-2 ${compact
				? 'min-w-0 flex-1 flex-wrap justify-between gap-y-1 sm:flex-none sm:flex-nowrap sm:justify-start'
				: ''}`}
		>
			<span className="text-[0.65rem] font-semibold uppercase tracking-widest text-muted-foreground">
				{label}
			</span>
			<div
				className={`relative h-4 overflow-hidden rounded-full border border-parchment-400 bg-muted dark:border-parchment-600 ${compact ? 'order-last basis-full sm:order-none sm:basis-auto' : ''} ${className}`}
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
