import { cn } from '@/lib/utils';

interface DiceIconProps {
  value: number;
  size?: 'sm' | 'md' | 'lg';
  variant?: 'default' | 'success' | 'failure' | 'critical';
  className?: string;
}

const DiceIcon = ({ value, size = 'md', variant = 'default', className }: DiceIconProps) => {
  const sizeClasses = {
    sm: 'w-10 h-10 text-sm',
    md: 'w-14 h-14 text-lg',
    lg: 'w-20 h-20 text-2xl',
  };

  const variantClasses = {
    default: 'bg-card border-parchment-400 text-foreground',
    success: 'bg-success/20 border-success text-success-dark dark:text-success-light',
    failure: 'bg-failure/20 border-failure text-failure-dark dark:text-failure-light',
    critical: 'bg-critical/20 border-critical text-critical-dark dark:text-critical-light animate-glow',
  };

  return (
    <div
      className={cn(
        'flex items-center justify-center rounded-lg border-2 font-heading font-bold shadow-md transition-all duration-200',
        sizeClasses[size],
        variantClasses[variant],
        className
      )}
    >
      {value}
    </div>
  );
};

export default DiceIcon;