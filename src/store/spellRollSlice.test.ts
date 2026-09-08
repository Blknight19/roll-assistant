import { describe, expect, it } from 'vitest';
import {
	markLastRollRefunded,
	selectSpell,
	setSpellLastRoll,
	setSpellModifier,
	spellRollReducer,
	toggleSpellGottgefaellig,
	type SpellRoll
} from './spellRollSlice';
import type { TalentCheckResult } from '@/utils/rules';

const ergebnis: TalentCheckResult = {
	dice: [5, 5, 5],
	perDieShortfall: [0, 0, 0],
	fp: 6,
	success: true,
	qs: 2,
	special: null
};

const wurf = (overrides: Partial<SpellRoll> = {}): SpellRoll => ({
	spellId: 'z1',
	spellName: 'Odem Arcanum',
	entries: [{ attribute: 'KL', value: 13 }],
	modifier: 0,
	taw: 10,
	aspSpent: 4,
	duration: 'aufrechterhaltend',
	result: ergebnis,
	...overrides
});

describe('spellRollReducer', () => {
	it('merkt sich nur die Auswahl, keine Zauberwerte', () => {
		const state = spellRollReducer(undefined, selectSpell('z1'));
		expect(state.spellId).toBe('z1');
		// Fertigkeitswert, Kosten und Wirkungsdauer liest die Ansicht live aus dem
		// Zauberbuch – hier abgelegt würden sie beim nächsten Änderung veralten.
		expect(Object.keys(state).sort()).toEqual(
			['gottgefaellig', 'lastRoll', 'lastRollBooked', 'modifier', 'spellId'].sort()
		);
	});

	it('verwirft das alte Ergebnis beim Wechsel des Zaubers', () => {
		let state = spellRollReducer(undefined, selectSpell('z1'));
		state = spellRollReducer(state, setSpellLastRoll(wurf()));
		expect(state.lastRoll).not.toBeNull();

		state = spellRollReducer(state, selectSpell('z2'));
		expect(state.lastRoll).toBeNull();
		expect(state.lastRollBooked).toBe(false);
	});

	it('markiert einen neuen Wurf als gebucht und die Rücknahme als ungebucht', () => {
		let state = spellRollReducer(undefined, setSpellLastRoll(wurf()));
		expect(state.lastRollBooked).toBe(true);

		state = spellRollReducer(state, markLastRollRefunded());
		expect(state.lastRollBooked).toBe(false);
		// Der Wurf bleibt sichtbar – nur die Buchung gilt als zurückgenommen.
		expect(state.lastRoll).not.toBeNull();
	});

	it('behält den Modifikator über einen Zauberwechsel hinweg', () => {
		let state = spellRollReducer(undefined, setSpellModifier(-2));
		state = spellRollReducer(state, selectSpell('z1'));
		expect(state.modifier).toBe(-2);
	});

	it('setzt den Chip „gottgefällig" beim Wechsel des Zaubers zurück', () => {
		let state = spellRollReducer(undefined, toggleSpellGottgefaellig());
		expect(state.gottgefaellig).toBe(true);
		state = spellRollReducer(state, selectSpell('z2'));
		expect(state.gottgefaellig).toBe(false);
	});
});
