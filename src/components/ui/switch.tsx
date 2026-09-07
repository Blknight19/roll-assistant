import { cn } from '@/lib/utils';

type SwitchProps = {
  checked: boolean;
  onCheckedChange: (checked: boolean) => void;
  id?: string;
  'aria-label'?: string;
  className?: string;
};

const Switch = ({ checked, onCheckedChange, className, ...props }: SwitchProps) => (
  <button
    type="button"
    role="switch"
    aria-checked={checked}
    onClick={() => onCheckedChange(!checked)}
    className={cn(
      'relative inline-flex h-6 w-11 shrink-0 cursor-pointer items-center rounded-full border-2 border-transparent transition-colors',
      checked ? 'bg-parchment-600 dark:bg-parchment-500' : 'bg-muted-foreground/40',
      className
    )}
    {...props}
  >
    <span
      className={cn(
        'pointer-events-none block h-5 w-5 rounded-full bg-background shadow-lg transition-transform',
        checked ? 'translate-x-5' : 'translate-x-0'
      )}
    />
  </button>
);

export { Switch };
