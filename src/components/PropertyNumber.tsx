import React, { useEffect, useId, useRef, useState } from 'react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Minus, Plus } from 'lucide-react';
import { cn } from '@/lib/utils';

interface PropertyNumberProps {
  label?: string;
  onChange: (newValue: number) => void;
  value: number;
  /** Bewusst ohne Default: eine fehlende Obergrenze soll auffallen, statt still zu kappen. */
  max: number;
  min?: number;
  size?: 'm' | 's';
  className?: string;
  /**
   * Vorlesename, wenn kein sichtbares Label passt. Ohne ihn heißen alle Stepper
   * einer Liste gleich („Wert erhöhen") und sind per Screenreader nicht zu
   * unterscheiden.
   */
  ariaLabel?: string;
}

const REPEAT_DELAY_MS = 400;
const REPEAT_INTERVAL_MS = 80;

const PropertyNumber: React.FC<PropertyNumberProps> = ({
  label = '',
  onChange,
  value,
  max,
  min = 0,
  size = 'm',
  className,
  ariaLabel
}) => {
  const inputId = useId();
  const spokenName = ariaLabel || label;

  // Während des Tippens darf das Feld leer sein – sonst lässt sich 8 nicht zu 15
  // ändern, ohne vorher alles zu markieren. Beim Verlassen wird normalisiert.
  const [draft, setDraft] = useState<string | null>(null);

  // Aktuellen Wert für die Auto-Repeat-Callbacks frisch halten
  const valueRef = useRef(value);
  valueRef.current = value;

  const repeatTimeout = useRef<ReturnType<typeof setTimeout>>(undefined);
  const repeatInterval = useRef<ReturnType<typeof setInterval>>(undefined);

  // Breit genug für dreistellige Werte (LeP) – das schmale Feld schnitt die 10 ab.
  const inputSizes = {
    m: 'w-[4.5rem] h-16 text-3xl px-1',
    s: 'w-16 h-12 text-xl px-1',
  };

  const labelMargin = size === 'm' ? 'mb-2' : 'mb-1';

  const step = (delta: number) => {
    const next = Math.min(max, Math.max(min, valueRef.current + delta));
    if (next !== valueRef.current) onChange(next);
  };

  const stopRepeat = () => {
    clearTimeout(repeatTimeout.current);
    clearInterval(repeatInterval.current);
  };

  const startRepeat = (delta: number) => {
    stopRepeat();
    step(delta);
    // Der Button kann am Limit disabled werden und feuert dann kein
    // pointerup mehr – deshalb global auf das Loslassen hören.
    window.addEventListener('pointerup', stopRepeat, { once: true });
    repeatTimeout.current = setTimeout(() => {
      repeatInterval.current = setInterval(() => step(delta), REPEAT_INTERVAL_MS);
    }, REPEAT_DELAY_MS);
  };

  useEffect(() => stopRepeat, []);

  const clamp = (candidate: number) => Math.min(max, Math.max(min, candidate));

  const handleInputChange = (raw: string) => {
    setDraft(raw);
    if (raw === '' || raw === '-') return;
    const parsed = Number(raw);
    if (!Number.isFinite(parsed)) return;
    onChange(clamp(parsed));
  };

  const handleBlur = () => {
    if (draft !== null && draft !== String(value)) {
      const parsed = Number(draft);
      onChange(Number.isFinite(parsed) && draft !== '' ? clamp(parsed) : value);
    }
    setDraft(null);
  };

  const stepperProps = (delta: number) => ({
    // Klick nur für Tastatur (detail === 0); Pointer läuft über pointerdown + Auto-Repeat
    onClick: (e: React.MouseEvent) => { if (e.detail === 0) step(delta); },
    onPointerDown: () => startRepeat(delta),
    onPointerUp: stopRepeat,
    onPointerLeave: stopRepeat,
    onPointerCancel: stopRepeat,
  });

  return (
    <div className={cn('flex flex-col items-center', className)}>
      {label && (
        <label
          htmlFor={inputId}
          className={cn(
            'text-sm font-heading font-semibold uppercase tracking-wide text-parchment-700 dark:text-parchment-300',
            labelMargin
          )}
        >
          {label}
        </label>
      )}

      <div className="flex items-center gap-1">
        <Button
          type="button"
          variant="outline"
          size="icon"
          disabled={value <= min}
          className="h-11 w-11 rounded-full"
          aria-label={`${spokenName || 'Wert'} verringern`}
          {...stepperProps(-1)}
        >
          <Minus className="h-4 w-4" />
        </Button>

        <Input
          id={inputId}
          type="number"
          inputMode="numeric"
          value={draft ?? value}
          onChange={(e) => handleInputChange(e.target.value)}
          onBlur={handleBlur}
          min={min}
          max={max}
          aria-label={spokenName || undefined}
          className={cn(
            'text-center font-heading font-bold border-2 border-parchment-400 dark:border-parchment-600',
            'focus:border-parchment-600 dark:focus:border-parchment-400',
            'bg-card',
            inputSizes[size]
          )}
        />

        <Button
          type="button"
          variant="outline"
          size="icon"
          disabled={value >= max}
          className="h-11 w-11 rounded-full"
          aria-label={`${spokenName || 'Wert'} erhöhen`}
          {...stepperProps(1)}
        >
          <Plus className="h-4 w-4" />
        </Button>
      </div>
    </div>
  );
};

export default PropertyNumber;
