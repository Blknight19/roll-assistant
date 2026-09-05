import { describe, expect, it } from 'vitest';
import {
	CIRCUMSTANCES,
	circumstanceModifier,
	costLocked,
	costWithCircumstances,
	maxModifications,
	toggleCircumstance
} from './circumstances';

describe('CIRCUMSTANCES', () => {
	it('vergibt jede id nur einmal', () => {
		const ids = CIRCUMSTANCES.map(c => c.id);
		expect(new Set(ids).size).toBe(ids.length);
	});

	it('trägt die Werte des Regelwiki', () => {
		const by = (id: string) => CIRCUMSTANCES.find(c => c.id === id)!.modifier;
		expect(by('ort-tempel')).toBe(1);
		expect(by('ort-gegenspieler')).toBe(-5);
		expect(by('zeit-feiertag')).toBe(2);
		expect(by('zeit-namenlose-tage')).toBe(-5);
		expect(by('technik-ohne-gebet')).toBe(-2);
		expect(by('mod-erzwingen')).toBe(1);
		expect(by('mod-kosten-senken')).toBe(-1);
	});

	it('bietet Ort und Zeit nur Zeremonien an, Technik nur Liturgien', () => {
		const gruppe = (name: string) => CIRCUMSTANCES.filter(c => c.group === name);
		for (const c of [...gruppe('ort'), ...gruppe('zeit'), ...gruppe('sonstiges')]) {
			expect(c.appliesTo, c.id).toEqual(['zeremonie']);
		}
		for (const c of gruppe('technik')) expect(c.appliesTo, c.id).toEqual(['liturgie']);
	});
});

describe('circumstanceModifier', () => {
	it('summiert aktive Umstände', () => {
		expect(circumstanceModifier(['zeit-namenlose-tage', 'ort-tempel'])).toBe(-4);
	});

	it('ignoriert unbekannte ids und liefert 0 statt −0', () => {
		expect(circumstanceModifier(['gibtsnicht'])).toBe(0);
		expect(Object.is(circumstanceModifier([]), 0)).toBe(true);
	});
});

describe('toggleCircumstance', () => {
	it('schaltet einen Umstand an und aus', () => {
		expect(toggleCircumstance([], 'technik-ohne-gebet')).toEqual(['technik-ohne-gebet']);
		expect(toggleCircumstance(['technik-ohne-gebet'], 'technik-ohne-gebet')).toEqual([]);
	});

	it('lässt in Ort und Zeit nur je einen Umstand zu', () => {
		expect(toggleCircumstance(['ort-tempel', 'zeit-monat'], 'ort-gegenspieler')).toEqual([
			'zeit-monat',
			'ort-gegenspieler'
		]);
	});

	it('lässt Modifikationen nebeneinander zu', () => {
		expect(toggleCircumstance(['mod-erzwingen'], 'mod-dauer-senken')).toEqual([
			'mod-erzwingen',
			'mod-dauer-senken'
		]);
	});

	it('lässt eine unbekannte id die Auswahl nicht verändern', () => {
		expect(toggleCircumstance(['ort-tempel'], 'gibtsnicht')).toEqual(['ort-tempel']);
	});
});

describe('costWithCircumstances', () => {
	it('verdoppelt bei Erzwingen und halbiert bei Kosten senken', () => {
		expect(costWithCircumstances(16, ['mod-erzwingen'])).toBe(32);
		expect(costWithCircumstances(16, ['mod-kosten-senken'])).toBe(8);
		expect(costWithCircumstances(16, ['mod-erzwingen', 'mod-kosten-senken'])).toBe(16);
	});

	it('fällt nie unter 1 KaP und lässt 0 bei 0', () => {
		expect(costWithCircumstances(1, ['mod-kosten-senken'])).toBe(1);
		expect(costWithCircumstances(0, ['mod-kosten-senken'])).toBe(0);
	});

	it('lässt Umstände ohne Kostenwirkung den Betrag unberührt', () => {
		expect(costWithCircumstances(16, ['ort-tempel', 'technik-ohne-gebet'])).toBe(16);
	});
});

describe('maxModifications', () => {
	it('erlaubt je vier volle FW-Punkte eine Modifikation', () => {
		expect(maxModifications(3)).toBe(0);
		expect(maxModifications(4)).toBe(1);
		expect(maxModifications(12)).toBe(3);
	});
});

describe('costLocked', () => {
	it('erkennt den Wortlaut der Quelle', () => {
		expect(costLocked('8 KaP (Kosten sind nicht modifizierbar)')).toBe(true);
		expect(costLocked('8 KaP')).toBe(false);
		expect(costLocked(undefined)).toBe(false);
	});
});
