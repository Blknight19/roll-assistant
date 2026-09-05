import { describe, expect, it } from 'vitest';
import { ATTRIBUTE_KEYS } from '@/store/attributesSlice';
import { canSustain } from '@/utils/rules';
import { LITURGY_CATALOG, TRADITIONEN, passtZurTradition, traditionOf } from './index';

describe('LITURGY_CATALOG', () => {
	it('umfasst den Bestand der Quelle aus Liturgien, Zeremonien und Segen', () => {
		expect(LITURGY_CATALOG.filter(e => e.klasse === 'liturgie')).toHaveLength(185);
		expect(LITURGY_CATALOG.filter(e => e.klasse === 'zeremonie')).toHaveLength(131);
		expect(LITURGY_CATALOG.filter(e => e.klasse === 'segen')).toHaveLength(12);
	});

	it('vergibt jede id nur einmal', () => {
		const ids = LITURGY_CATALOG.map(entry => entry.id);
		expect(new Set(ids).size).toBe(ids.length);
	});

	it('nennt für Liturgien und Zeremonien drei gültige Eigenschaften, für Segen keine', () => {
		for (const entry of LITURGY_CATALOG) {
			if (entry.klasse === 'segen') {
				expect(entry.attributes, entry.name).toBeUndefined();
				continue;
			}
			expect(entry.attributes, entry.name).toHaveLength(3);
			for (const attribute of entry.attributes!) {
				expect(ATTRIBUTE_KEYS, entry.name).toContain(attribute);
			}
		}
	});

	it('gibt Segen feste Kosten von 1 KaP und eine Aktion Dauer', () => {
		for (const entry of LITURGY_CATALOG.filter(e => e.klasse === 'segen')) {
			expect(entry.cost, entry.name).toBe(1);
			expect(entry.castTime, entry.name).toBe('1 Aktion');
			expect(entry.verbreitung, entry.name).toEqual(['Allgemein']);
		}
	});

	it('erklärt Kosten und Wirkungsdauer immer im Wortlaut', () => {
		for (const entry of LITURGY_CATALOG) {
			expect(entry.costText.trim(), entry.name).not.toBe('');
			expect(entry.duration.trim(), entry.name).not.toBe('');
			if (entry.cost !== null) expect(entry.cost, entry.name).toBeGreaterThanOrEqual(0);
		}
	});

	it('beziffert die eigenen Kosten nie in AsP', () => {
		// „Magiebann" nennt AsP zu Recht: er kostet KaP in Höhe der AsP des gebannten
		// Zaubers. Falsch wäre nur ein Betrag, der selbst auf AsP lautet.
		for (const entry of LITURGY_CATALOG) {
			expect(entry.costText, entry.name).not.toMatch(/^\d+\s*AsP/);
		}
	});

	it('lässt genau die „aufrechterhaltend"-Einträge aufrechterhalten', () => {
		const sustainable = LITURGY_CATALOG.filter(entry => canSustain(entry.duration));
		expect(sustainable.map(e => e.id)).toEqual(
			LITURGY_CATALOG.filter(e => e.duration === 'aufrechterhaltend').map(e => e.id)
		);
		expect(sustainable).toHaveLength(20);
	});

	it('nennt für jede Liturgie und Zeremonie eine Verbreitung', () => {
		for (const entry of LITURGY_CATALOG) {
			expect(entry.verbreitung, entry.name).not.toHaveLength(0);
		}
	});
});

describe('Traditionen', () => {
	it('schneidet den Aspekt ab', () => {
		expect(traditionOf('Praios (Ordnung)')).toBe('Praios');
		expect(traditionOf('Allgemein')).toBe('Allgemein');
	});

	it('führt die Zwölfgötter, aber nicht „Allgemein"', () => {
		const goetter = ['Praios', 'Rondra', 'Efferd', 'Travia', 'Boron', 'Hesinde',
			'Firun', 'Tsa', 'Phex', 'Peraine', 'Ingerimm', 'Rahja'];
		for (const gott of goetter) expect(TRADITIONEN).toContain(gott);
		expect(TRADITIONEN).not.toContain('Allgemein');
	});

	it('lässt „Allgemein"-Einträge jeder Tradition zu', () => {
		const objektsegen = LITURGY_CATALOG.find(e => e.id === 'objektsegen')!;
		expect(passtZurTradition(objektsegen, 'Rahja')).toBe(true);
		const wahrheit = LITURGY_CATALOG.find(e => e.id === 'wahrheit')!;
		expect(passtZurTradition(wahrheit, 'Praios')).toBe(true);
		expect(passtZurTradition(wahrheit, 'Rahja')).toBe(false);
	});
});
