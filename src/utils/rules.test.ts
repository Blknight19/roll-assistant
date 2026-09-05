import { describe, expect, it } from 'vitest';
import {
  canSustain,
  castingCost,
  evaluateCombatRoll,
  evaluateTalentCheck,
  upkeepModifier,
  withBonusFp
} from './rules';

describe('evaluateTalentCheck', () => {
  it('gelingt ohne FP-Verlust, wenn alle Würfel unter den Eigenschaften liegen', () => {
    const r = evaluateTalentCheck([13, 13, 13], 7, 0, [5, 10, 13]);
    expect(r.perDieShortfall).toEqual([0, 0, 0]);
    expect(r.fp).toBe(7);
    expect(r.success).toBe(true);
    expect(r.qs).toBe(3);
  });

  it('zieht pro Würfel nur den Fehlbetrag ab', () => {
    const r = evaluateTalentCheck([11, 12, 13], 6, 0, [14, 12, 20]);
    expect(r.perDieShortfall).toEqual([-3, 0, -7]);
    expect(r.fp).toBe(-4);
    expect(r.success).toBe(false);
  });

  it('FP 0 ist ein Erfolg mit QS 1', () => {
    const r = evaluateTalentCheck([10, 10, 10], 4, 0, [12, 12, 10]);
    expect(r.fp).toBe(0);
    expect(r.success).toBe(true);
    expect(r.qs).toBe(1);
  });

  it.each([
    [1, 1],
    [3, 1],
    [4, 2],
    [6, 2],
    [7, 3],
    [10, 4],
    [13, 5],
    [16, 6],
  ])('FP %i ergibt QS %i', (fp, qs) => {
    const r = evaluateTalentCheck([15, 15, 15], fp, 0, [10, 10, 10]);
    expect(r.fp).toBe(fp);
    expect(r.qs).toBe(qs);
  });

  it('deckelt QS bei 6, auch bei sehr hohem Talentwert', () => {
    const r = evaluateTalentCheck([15, 15, 15], 25, 0, [10, 10, 10]);
    expect(r.fp).toBe(25);
    expect(r.qs).toBe(6);
  });

  it('behandelt negative Modifikatoren als Erschwernis', () => {
    // Erschwernis -2 senkt die effektive Eigenschaft: 13 - 2 = 11 < Wurf 12
    const r = evaluateTalentCheck([13, 13, 13], 5, -2, [12, 5, 5]);
    expect(r.perDieShortfall).toEqual([-1, 0, 0]);
    expect(r.fp).toBe(4);
  });

  it('behandelt positive Modifikatoren als Erleichterung', () => {
    const r = evaluateTalentCheck([10, 10, 10], 5, 3, [13, 5, 5]);
    expect(r.perDieShortfall).toEqual([0, 0, 0]);
    expect(r.fp).toBe(5);
  });

  it('erkennt den kritischen Erfolg bei zwei Einsen, auch mit negativen FP', () => {
    const r = evaluateTalentCheck([8, 8, 8], 0, -10, [1, 1, 20]);
    expect(r.special).toBe('krit');
    expect(r.success).toBe(true);
  });

  it('erkennt den Patzer bei zwei Zwanzigern, auch mit positiven FP', () => {
    const r = evaluateTalentCheck([20, 20, 20], 10, 0, [20, 20, 1]);
    expect(r.special).toBe('patzer');
    expect(r.success).toBe(false);
  });

  it('drei Einsen sind ebenfalls ein kritischer Erfolg', () => {
    expect(evaluateTalentCheck([8, 8, 8], 0, 0, [1, 1, 1]).special).toBe('krit');
  });
});

describe('evaluateCombatRoll', () => {
  it('gelingt bei Wurf <= Zielwert', () => {
    const r = evaluateCombatRoll(12, 0, 12);
    expect(r.success).toBe(true);
    expect(r.target).toBe(12);
  });

  it('misslingt bei Wurf > Zielwert', () => {
    expect(evaluateCombatRoll(12, 0, 13).success).toBe(false);
  });

  it('verrechnet den Modifikator in den Zielwert', () => {
    expect(evaluateCombatRoll(12, -4, 10).success).toBe(false);
    expect(evaluateCombatRoll(12, 4, 15).success).toBe(true);
  });

  it('ohne Bestätigungswurf ist die 1 ein Auto-Krit', () => {
    const r = evaluateCombatRoll(10, 0, 1);
    expect(r.special).toBe('krit');
    expect(r.success).toBe(true);
    expect(r.confirmation).toBeUndefined();
  });

  it('ohne Bestätigungswurf ist die 20 ein Auto-Patzer', () => {
    const r = evaluateCombatRoll(10, 0, 20);
    expect(r.special).toBe('patzer');
    expect(r.success).toBe(false);
  });

  it('bestätigter Krit: Bestätigung <= Zielwert', () => {
    const r = evaluateCombatRoll(10, 0, 1, 10);
    expect(r.special).toBe('krit');
    expect(r.success).toBe(true);
    expect(r.confirmation).toEqual({ roll: 10, confirmed: true });
  });

  it('unbestätigter Krit ist ein normaler Treffer', () => {
    const r = evaluateCombatRoll(10, 0, 1, 11);
    expect(r.special).toBeNull();
    expect(r.success).toBe(true);
    expect(r.confirmation).toEqual({ roll: 11, confirmed: false });
  });

  it('bestätigter Patzer: Bestätigung > Zielwert', () => {
    const r = evaluateCombatRoll(10, 0, 20, 11);
    expect(r.special).toBe('patzer');
    expect(r.success).toBe(false);
    expect(r.confirmation).toEqual({ roll: 11, confirmed: true });
  });

  it('unbestätigter Patzer ist ein normaler Fehlschlag', () => {
    const r = evaluateCombatRoll(10, 0, 20, 10);
    expect(r.special).toBeNull();
    expect(r.success).toBe(false);
    expect(r.confirmation).toEqual({ roll: 10, confirmed: false });
  });

  it('die Bestätigung nutzt den modifizierten Zielwert', () => {
    // Zielwert 10 - 3 = 7; Bestätigung 8 > 7 → Krit nicht bestätigt
    expect(evaluateCombatRoll(10, -3, 1, 8).special).toBeNull();
    expect(evaluateCombatRoll(10, -3, 1, 7).special).toBe('krit');
  });

  // Festgehaltenes Verhalten, kein bestätigtes Regelwissen: ab einem modifizierten
  // Zielwert von 20 kann der Bestätigungswurf nicht mehr scheitern bzw. gelingen.
  // Ob eine gewürfelte 20 hier trotzdem nie bestätigt, ist am Regelwerk zu klären
  // (siehe REVIEW.md, R2). Der Test pinnt den Status quo, damit er nicht unbemerkt kippt.
  describe('Randfall: Zielwert >= 20', () => {
    it('bestätigt derzeit jeden Krit, auch bei einer gewürfelten 20', () => {
      expect(evaluateCombatRoll(20, 0, 1, 20)).toMatchObject({
        special: 'krit',
        confirmation: { roll: 20, confirmed: true },
      });
    });

    it('bestätigt derzeit keinen Patzer', () => {
      expect(evaluateCombatRoll(20, 0, 20, 20)).toMatchObject({
        special: null,
        confirmation: { roll: 20, confirmed: false },
      });
    });
  });
});

describe('castingCost', () => {
  // Hilfswürfe: [10,10,10] bei Eigenschaften 15 gelingt, [20,20,5] ist ein Patzer.
  const erfolg = () => evaluateTalentCheck([15, 15, 15], 10, 0, [10, 10, 10]);
  const misserfolg = () => evaluateTalentCheck([10, 10, 10], 0, 0, [18, 18, 10]);
  const krit = () => evaluateTalentCheck([15, 15, 15], 10, 0, [1, 1, 10]);
  const patzer = () => evaluateTalentCheck([15, 15, 15], 10, 0, [20, 20, 10]);

  it('bucht bei Erfolg die vollen Kosten', () => {
    expect(castingCost(8, erfolg())).toBe(8);
  });

  it('bucht bei Misserfolg die halben Kosten', () => {
    expect(castingCost(8, misserfolg())).toBe(4);
  });

  it('rundet halbe Kosten auf', () => {
    expect(castingCost(7, misserfolg())).toBe(4);
    expect(castingCost(1, misserfolg())).toBe(1);
  });

  it('bucht beim kritischen Erfolg die halben Kosten', () => {
    expect(castingCost(8, krit())).toBe(4);
  });

  it('bucht beim Patzer die halben Kosten', () => {
    expect(castingCost(8, patzer())).toBe(4);
  });

  it('bleibt bei Kosten 0 bei 0', () => {
    expect(castingCost(0, erfolg())).toBe(0);
    expect(castingCost(0, misserfolg())).toBe(0);
  });

  it('behandelt negative Kosten wie 0', () => {
    expect(castingCost(-5, erfolg())).toBe(0);
  });
});

describe('upkeepModifier', () => {
  it('ist ohne laufende Zauber 0', () => {
    expect(upkeepModifier(0)).toBe(0);
  });

  it('gibt −1 pro laufendem Zauber', () => {
    expect(upkeepModifier(1)).toBe(-1);
    expect(upkeepModifier(3)).toBe(-3);
  });

  it('ignoriert negative Eingaben', () => {
    expect(upkeepModifier(-2)).toBe(0);
  });
});

describe('canSustain', () => {
  it('erlaubt genau die Wirkungsdauer „aufrechterhaltend"', () => {
    expect(canSustain('aufrechterhaltend')).toBe(true);
  });

  it('ignoriert Groß-/Kleinschreibung und umgebende Leerzeichen', () => {
    expect(canSustain('  Aufrechterhaltend ')).toBe(true);
    expect(canSustain('AUFRECHTERHALTEND')).toBe(true);
  });

  it('schließt „sofort" aus', () => {
    expect(canSustain('sofort')).toBe(false);
  });

  it('schließt feste Wirkungsdauern aus – sie laufen ohne Konzentration weiter', () => {
    expect(canSustain('QS x 3 Minuten')).toBe(false);
    expect(canSustain('1 Minute')).toBe(false);
    expect(canSustain('5 Kampfrunden')).toBe(false);
    expect(canSustain('QS x 15 Minuten, danach verweht der Nebel')).toBe(false);
    expect(canSustain('Bis zum nächsten Schuss, maximal QS x 2 Kampfrunden')).toBe(false);
  });

  it('erlaubt den Knopf ohne Angabe – ein selbst eingetragener Zauber', () => {
    expect(canSustain(undefined)).toBe(true);
  });

  it('lässt einen leeren String nicht durch – eine Angabe ist da, sie sagt nur nichts', () => {
    expect(canSustain('')).toBe(false);
  });
});

describe('evaluateTalentCheck mit ignoreFumble', () => {
  it('zählt zwei Zwanzigen ohne die Option als Patzer', () => {
    const r = evaluateTalentCheck([15, 15, 15], 12, 0, [20, 20, 5]);
    expect(r.special).toBe('patzer');
    expect(r.success).toBe(false);
  });

  it('rechnet zwei Zwanzigen mit der Option wie gewöhnliche Würfel', () => {
    const r = evaluateTalentCheck([15, 15, 15], 12, 0, [20, 20, 5], { ignoreFumble: true });
    expect(r.special).toBeNull();
    expect(r.perDieShortfall).toEqual([-5, -5, 0]);
    expect(r.fp).toBe(2);
    expect(r.success).toBe(true);
  });

  it('lässt zwei Einsen von der Option unberührt', () => {
    const r = evaluateTalentCheck([15, 15, 15], 12, 0, [1, 1, 20], { ignoreFumble: true });
    expect(r.special).toBe('krit');
  });
});

describe('withBonusFp', () => {
  it('hebt FP und QS an', () => {
    const base = evaluateTalentCheck([15, 15, 15], 5, 0, [10, 10, 10]);
    expect(base.qs).toBe(2);
    const boosted = withBonusFp(base, 4);
    expect(boosted.fp).toBe(9);
    expect(boosted.qs).toBe(3);
  });

  it('deckelt die QS weiter bei 6', () => {
    const base = evaluateTalentCheck([15, 15, 15], 16, 0, [10, 10, 10]);
    expect(withBonusFp(base, 6).qs).toBe(6);
  });

  it('lässt Würfel, Ausgang und Sonderfall unverändert', () => {
    const base = evaluateTalentCheck([15, 15, 15], 5, 0, [1, 1, 10]);
    const boosted = withBonusFp(base, 3);
    expect(boosted.dice).toEqual(base.dice);
    expect(boosted.special).toBe('krit');
    expect(boosted.success).toBe(true);
  });
});
