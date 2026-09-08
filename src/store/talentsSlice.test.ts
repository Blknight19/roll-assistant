import { describe, expect, it } from 'vitest';
import { initialTalentState } from './talentsSlice';
import { ZECHEN_TALENT_ID } from '@/data/conditions';

const talents = initialTalentState.talents;
const byName = (name: string) => talents.find(t => t.name === name)!;

describe('Talentliste', () => {
	it('umfasst 59 Talente mit Gruppe und Belastungsspalte', () => {
		expect(talents).toHaveLength(59);
		for (const talent of talents) {
			expect(['koerper', 'gesellschaft', 'natur', 'wissen', 'handwerk'], talent.name).toContain(talent.group);
			expect(['ja', 'evtl', 'nein'], talent.name).toContain(talent.be);
		}
	});

	it('kennt Zechen unter der id, die Berauscht trifft', () => {
		expect(byName('Zechen').id).toBe(ZECHEN_TALENT_ID);
		expect(byName('Zechen').be).toBe('nein');
	});

	it('trägt die Belastungsspalte des Regelwiki', () => {
		expect(byName('Klettern').be).toBe('ja');
		expect(byName('Singen').be).toBe('evtl');
		expect(byName('Sinnesschärfe').be).toBe('evtl');
		expect(byName('Selbstbeherrschung').be).toBe('nein');
		expect(byName('Verkleiden').be).toBe('ja');
		expect(byName('Fischen & Angeln').be).toBe('evtl');
		expect(byName('Pflanzenkunde').be).toBe('evtl');
		expect(byName('Handel').be).toBe('nein');
		expect(byName('Heilkunde Seele').be).toBe('nein');
		expect(byName('Alchemie').be).toBe('ja');
	});

	it('ordnet die Wissenstalente der Gruppe wissen zu, alle ohne Belastung', () => {
		const wissen = talents.filter(t => t.group === 'wissen');
		expect(wissen).toHaveLength(12);
		expect(wissen.every(t => t.be === 'nein')).toBe(true);
		expect(wissen.map(t => t.name)).toContain('Rechnen');
	});
});
