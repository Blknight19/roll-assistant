// Regelwerk-Logik für DSA-5-Proben. Vorzeichen-Konvention wie im Regelwerk:
// negativer Modifikator = Erschwernis, positiver = Erleichterung.

export type Special = 'krit' | 'patzer' | null;

export type TalentCheckResult = {
  dice: [number, number, number];
  /** Pro Würfel die verlorenen FP (immer <= 0). */
  perDieShortfall: [number, number, number];
  /** Übrige Fertigkeitspunkte: TaW + Summe der Shortfalls. */
  fp: number;
  success: boolean;
  /** Qualitätsstufe 1-6, nur bei Erfolg aussagekräftig. */
  qs: number;
  special: Special;
};

export type CheckOptions = {
  /** Optionalregel „Keine Patzer bei Liturgien": zwei Zwanzigen sind gewöhnliche Würfel. */
  ignoreFumble?: boolean;
};

/** Qualitätsstufe 1-6 aus den übrigen Fertigkeitspunkten. */
const qsFor = (fp: number): number => Math.min(6, Math.max(1, Math.ceil(fp / 3)));

export const evaluateTalentCheck = (
  attrs: [number, number, number],
  taw: number,
  modifier: number,
  dice: [number, number, number],
  options: CheckOptions = {},
): TalentCheckResult => {
  const ones = dice.filter(d => d === 1).length;
  const twenties = dice.filter(d => d === 20).length;
  const special: Special =
    ones >= 2 ? 'krit' : twenties >= 2 && !options.ignoreFumble ? 'patzer' : null;

  const perDieShortfall = dice.map((die, i) => Math.min(0, attrs[i] + modifier - die)) as [
    number,
    number,
    number,
  ];
  const fp = taw + perDieShortfall.reduce((sum, v) => sum + v, 0);

  const success = special === 'krit' || (special !== 'patzer' && fp >= 0);

  return { dice, perDieShortfall, fp, success, qs: qsFor(fp), special };
};

/**
 * Kritischer Erfolg bei Liturgien: „Wenn es für den Geweihten nützlich ist, können 1W6
 * Punkte auf die FP addiert werden." Die QS folgt den neuen FP.
 */
export const withBonusFp = (result: TalentCheckResult, bonus: number): TalentCheckResult => {
  const fp = result.fp + Math.max(0, Math.trunc(bonus));
  return { ...result, fp, qs: qsFor(fp) };
};

export type CombatRollResult = {
  d20: number;
  /** Effektiver Zielwert: Kampfwert + Modifikator. */
  target: number;
  success: boolean;
  special: Special;
  confirmation?: { roll: number; confirmed: boolean };
};

/**
 * Bewertet einen Kampfwurf. Ohne `confirmationRoll` gelten 1/20 direkt als
 * Krit/Patzer (Hausregel, Toggle aus); mit Bestätigungswurf entscheidet der
 * zweite W20 gegen denselben Zielwert (DSA-5-Grundregel).
 */
export const evaluateCombatRoll = (
  value: number,
  modifier: number,
  d20: number,
  confirmationRoll?: number,
): CombatRollResult => {
  const target = value + modifier;

  if (d20 === 1) {
    if (confirmationRoll === undefined) {
      return { d20, target, success: true, special: 'krit' };
    }
    const confirmed = confirmationRoll <= target;
    return {
      d20,
      target,
      success: true,
      special: confirmed ? 'krit' : null,
      confirmation: { roll: confirmationRoll, confirmed },
    };
  }

  if (d20 === 20) {
    if (confirmationRoll === undefined) {
      return { d20, target, success: false, special: 'patzer' };
    }
    const confirmed = confirmationRoll > target;
    return {
      d20,
      target,
      success: false,
      special: confirmed ? 'patzer' : null,
      confirmation: { roll: confirmationRoll, confirmed },
    };
  }

  return { d20, target, success: d20 <= target, special: null };
};

/**
 * Fällige Punkte (AsP oder KaP) nach Ausgang der Probe. Volle Kosten nur beim schlichten
 * Erfolg; misslungene Proben kosten laut Regelwerk „die Hälfte", ein kritischer Erfolg
 * ebenfalls. Ohne Rundungsregel im Buch wird aufgerundet – das ist die verbreitete
 * Auslegung und für den Helden die teurere, also die sichere.
 */
export const castingCost = (cost: number, result: TalentCheckResult): number => {
  const base = Math.max(0, Math.round(cost));
  const halved = result.special === 'krit' || !result.success;
  return halved ? Math.ceil(base / 2) : base;
};

/** Jeder aufrechterhaltene Zauber erschwert alle weiteren Zauberproben um 1. */
export const upkeepModifier = (activeCount: number): number =>
  // `|| 0` normalisiert -0 zu +0, da `toBe` in Tests mit Object.is vergleicht.
  -Math.max(0, Math.trunc(activeCount)) || 0;

/**
 * Ob ein Zauber Konzentration bindet und damit aufrechterhalten werden kann.
 * Nur die Wirkungsdauer „aufrechterhaltend" tut das. Ein Zauber mit fester Dauer
 * („QS x 3 Minuten", „5 Kampfrunden", …) läuft von allein weiter – niemand
 * konzentriert sich darauf, also erschwert er auch keine weitere Zauberprobe.
 * Fehlt die Angabe ganz (selbst eingetragener Zauber), bleibt der Knopf erlaubt:
 * die App weiß es dort nicht besser als der Spieler.
 */
export const canSustain = (duration?: string): boolean =>
  duration === undefined || /^\s*aufrechterhaltend\s*$/i.test(duration);
