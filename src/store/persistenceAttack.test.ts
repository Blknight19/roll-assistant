import { describe, expect, it } from 'vitest';
import { migratePersisted, toPersisted } from '@/store/persistence';

const BOES = {
  version: 5,
  activeCharacterId: 'held-1',
  boesartigOben: 'x',
  characters: [{
    id: 'held-1', name: 'A'.repeat(500), boesartigCharakter: 'x',
    attributes: { MU: 1e308, KL: -999, IN: NaN, CH: 'zwölf' },
    talents: [{ id: '3', value: 1e9 }],
    combat: { attack: 1e9, life: { current: -5, max: 1e9 } },
    spellbook: { isSpellcaster: 'ja', asp: { current: 1e9, max: 1e9 }, spells: [], upkeep: [] },
    karma: {
      isBlessed: 1, tradition: '\u202eRechtsnachLinks' + 'y'.repeat(200),
      kap: { current: Infinity, max: 1e9 },
      liturgies: Array.from({ length: 300 }, (_, i) => ({
        id: 'l' + i, klasse: 'liturgie', name: '<img src=x onerror=alert(1)>' + 'n'.repeat(300),
        attributes: ['MU', 'KL', 'IN'], cost: 1e9, value: 1e9,
        note: 'z'.repeat(5000), costText: 'c'.repeat(5000), probeNote: 'p'.repeat(5000),
        castTime: 't'.repeat(5000), duration: 'd'.repeat(5000), fremd: 'nutzlast'
      })),
      blessings: ['speisesegen', 'gibtsnicht', 42, null, 'speisesegen'],
      upkeep: Array.from({ length: 300 }, (_, i) => ({ id: 'u' + i, spellName: 'S', qs: 3 })),
      devotionLevel: 999
    }
  }],
  history: Array.from({ length: 500 }, (_, i) => ({
    id: 'h' + i, type: 'Liturgie', values: [1, 2, 3], result: 'r'.repeat(1000), date: '2026-01-01'
  })),
  settings: { confirmCriticals: 'ja', noLiturgyFumble: 1 }
};

describe('Präparierte Charakterdatei', () => {
  const s = migratePersisted(JSON.parse(JSON.stringify(BOES)))!;
  const out = toPersisted(s);
  const k = s.karma;

  it('startet überhaupt', () => expect(s).toBeDefined());
  it('klemmt Zahlen', () => {
    expect(s.attributes.MU).toBeLessThanOrEqual(20);
    expect(s.attributes.IN).toBe(8);
    expect(k.kap.max).toBeLessThanOrEqual(999);
    expect(Number.isFinite(k.kap.current)).toBe(true);
    expect(k.devotionLevel).toBe(4);
  });
  it('deckelt Listen', () => {
    expect(k.liturgies.length).toBeLessThanOrEqual(100);
    expect(k.upkeep.length).toBeLessThanOrEqual(100);
    expect(s.roll.history.length).toBeLessThanOrEqual(100);
  });
  it('kappt Texte', () => {
    expect(k.tradition.length).toBeLessThanOrEqual(40);
    expect(k.liturgies[0].name.length).toBeLessThanOrEqual(70);
    expect(k.liturgies[0].note!.length).toBeLessThanOrEqual(500);
    expect(s.profile.name.length).toBeLessThanOrEqual(40);
  });
  it('nimmt Booleans nur als Booleans', () => {
    expect(k.isBlessed).toBe(false);
    expect(s.spellbook.isSpellcaster).toBe(false);
    expect(s.settings.confirmCriticals).toBe(true);
    expect(s.settings.noLiturgyFumble).toBe(false);
  });
  it('verwirft unbekannte Segen und Dubletten', () => {
    expect(k.blessings).toEqual(['speisesegen']);
  });
  it('exportiert keine fremden Schlüssel', () => {
    const text = JSON.stringify(out);
    expect(text).not.toContain('boesartig');
    expect(text).not.toContain('nutzlast');
  });
  it('exportiert kein Bidi-Steuerzeichen in der Tradition', () => {
    expect(out.characters[0].karma.tradition).not.toMatch(/[\u202a-\u202e\u2066-\u2069]/);
  });
});
