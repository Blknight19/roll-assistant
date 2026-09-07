import * as React from 'react';
import { cva, type VariantProps } from 'class-variance-authority';
import { cn } from '@/lib/utils';

const cardVariants = cva(
  'rounded-lg border text-card-foreground shadow-sm transition-all duration-200',
  {
    variants: {
      variant: {
        default: 'bg-card',
        parchment: 'bg-parchment border-aventurian-300 dark:border-aventurian-700',
        success: 'bg-success/10 border-success',
        failure: 'bg-failure/10 border-failure',
        critical: 'bg-critical/10 border-critical',
        magic: 'bg-magic/10 border-magic',
        karma: 'bg-karma/10 border-karma',
      },
    },
    defaultVariants: {
      variant: 'default',
    },
  }
);

export interface CardProps
  extends React.HTMLAttributes<HTMLDivElement>,
    VariantProps<typeof cardVariants> {
  ref?: React.Ref<HTMLDivElement>
}

function Card({ className, variant, ref, ...props }: CardProps) {
  return (
    <div
      ref={ref}
      className={cn(cardVariants({ variant }), className)}
      {...props}
    />
  );
}
Card.displayName = 'Card';

interface CardHeaderProps extends React.HTMLAttributes<HTMLDivElement> {
  ref?: React.Ref<HTMLDivElement>
}

function CardHeader({ className, ref, ...props }: CardHeaderProps) {
  return (
    <div
      ref={ref}
      className={cn('flex flex-col space-y-1.5 p-6', className)}
      {...props}
    />
  );
}
CardHeader.displayName = 'CardHeader';

interface CardTitleProps extends React.HTMLAttributes<HTMLHeadingElement> {
  ref?: React.Ref<HTMLHeadingElement>
}

/** `h2`, weil die Seite genau eine `h1` trägt und die Karten flach darunter liegen. */
function CardTitle({ className, ref, ...props }: CardTitleProps) {
  return (
    <h2
      ref={ref}
      className={cn('font-heading text-2xl font-semibold leading-none tracking-tight', className)}
      {...props}
    />
  );
}
CardTitle.displayName = 'CardTitle';

interface CardDescriptionProps extends React.HTMLAttributes<HTMLDivElement> {
  ref?: React.Ref<HTMLDivElement>
}

function CardDescription({ className, ref, ...props }: CardDescriptionProps) {
  return (
    <div
      ref={ref}
      className={cn('text-sm text-muted-foreground', className)}
      {...props}
    />
  );
}
CardDescription.displayName = 'CardDescription';

interface CardContentProps extends React.HTMLAttributes<HTMLDivElement> {
  ref?: React.Ref<HTMLDivElement>
}

function CardContent({ className, ref, ...props }: CardContentProps) {
  return (
    <div 
      ref={ref} 
      className={cn('p-6 pt-0', className)} 
      {...props} 
    />
  );
}
CardContent.displayName = 'CardContent';

interface CardFooterProps extends React.HTMLAttributes<HTMLDivElement> {
  ref?: React.Ref<HTMLDivElement>
}

function CardFooter({ className, ref, ...props }: CardFooterProps) {
  return (
    <div
      ref={ref}
      className={cn('flex items-center p-6 pt-0', className)}
      {...props}
    />
  );
}
CardFooter.displayName = 'CardFooter';

export { Card, CardHeader, CardFooter, CardTitle, CardDescription, CardContent };