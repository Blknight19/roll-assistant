import { describe, expect, it } from 'vitest';
import {
	CONDITION_PENALTY_CAP,
	conditionModifier,
	conditionNote,
	effectivePain,
	incapacitationReason,
	isIncapacitated,
	painFromLife,
	totalLevels,
	type ConditionTarget
} from './conditionRules';
import { emptyConditionLevels, type ConditionId } from '@/data/conditions';

const levels = (partial: Partial<Record<ConditionId, number>>) => ({ ...emptyConditionLevels(), ...partial });

const klettern: ConditionTarget = { kind: 'talent', id: '3', group: 'koerper', be: 'ja' };
const singen: ConditionTarget = { kind: 'talent', id: '9', group: 'koerper', be: 'evtl' };
const rechnen: ConditionTarget = { kind: 'talent', id: '38', group: 'wissen', be: 'nein' };
const zechen: ConditionTarget = { kind: 'talent', id: '14', group: 'koerper', be: 'nein' };
const at: ConditionTarget = { kind: 'kampf', value: 'AT' };
const fk: ConditionTarget = { kind: 'kampf', value: 'FK' };
const ini: ConditionTarget = { kind: 'kampf', value: 'INI' };
const zauber: ConditionTarget = { kind: 'zauber' };
const liturgie: ConditionTarget = { kind: 'liturgie' };

describe('painFromLife', () => {
	it('gibt je Schwelle ¾, ½, ¼ eine Stufe und ab 5 LeP eine weitere', () => {
		expect(painFromLife(23, 30)).toBe(0);
		expect(painFromLife(22, 30)).toBe(1);
		expect(painFromLife(15, 30)).toBe(2);
		expect(painFromLife(7, 30)).toBe(3);
		expect(painFromLife(5, 30)).toBe(4);
	});

	it('vergleicht ohne Rundung: 22 von 30 liegt unter 22,5', () => {
		expect(painFromLife(22, 30)).toBe(1);
		expect(painFromLife(23, 30)).toBe(0);
	});

	it('liefert 0 ohne Maximum', () => {
		expect(painFromLife(0, 0)).toBe(0);
	});
});

describe('effectivePain', () => {
	it('addiert Zusatzstufe und deckelt bei IV', () => {
		expect(effectivePain(2, 1, false)).toBe(3);
		expect(effectivePain(3, 3, false)).toBe(4);
	});

	it('senkt mit Zäher Hund um 1 und hält 0', () => {
		expect(effectivePain(2, 0, true)).toBe(1);
		expect(effectivePain(0, 0, true)).toBe(0);
		expect(effectivePain(0, 1, true)).toBe(0);
	});
});

describe('conditionModifier – Profil „alle"', () => {
	it('trifft Talent, Kampf, Fernkampf, Zauber und Liturgie, nicht die Initiative', () => {
		const l = levels({ betaeubung: 2 });
		for (const target of [klettern, rechnen, at, fk, zauber, liturgie]) {
			expect(conditionModifier(l, target).modifier, JSON.stringify(target)).toBe(-2);
		}
		expect(conditionModifier(l, ini).modifier).toBe(0);
	});

	it('zählt Stufe IV als −4', () => {
		expect(conditionModifier(levels({ schmerz: 4 }), klettern).modifier).toBe(-4);
	});
});

describe('conditionModifier – Paralyse', () => {
	it('trifft Bewegung und Kampf, nicht Wissenstalente', () => {
		const l = levels({ paralyse: 2 });
		expect(conditionModifier(l, klettern).modifier).toBe(-2);
		expect(conditionModifier(l, at).modifier).toBe(-2);
		expect(conditionModifier(l, zauber).modifier).toBe(-2);
		expect(conditionModifier(l, rechnen).modifier).toBe(0);
		expect(conditionModifier(l, ini).modifier).toBe(0);
	});
});

describe('conditionModifier – Belastung', () => {
	const l = levels({ belastung: 2 });

	it('trifft Talente mit BE ja, evtl. nur mit Option, nein nie', () => {
		expect(conditionModifier(l, klettern).modifier).toBe(-2);
		expect(conditionModifier(l, singen).modifier).toBe(0);
		expect(conditionModifier(l, singen, { belastungGilt: true }).modifier).toBe(-2);
		expect(conditionModifier(l, rechnen).modifier).toBe(0);
	});

	it('trifft AT, PA, AW und INI, nicht FK, Zauber oder Liturgie', () => {
		expect(conditionModifier(l, at).modifier).toBe(-2);
		expect(conditionModifier(l, { kind: 'kampf', value: 'PA' }).modifier).toBe(-2);
		expect(conditionModifier(l, { kind: 'kampf', value: 'AW' }).modifier).toBe(-2);
		expect(conditionModifier(l, ini).modifier).toBe(-2);
		expect(conditionModifier(l, fk).modifier).toBe(0);
		expect(conditionModifier(l, zauber).modifier).toBe(0);
		expect(conditionModifier(l, liturgie).modifier).toBe(0);
	});
});

describe('conditionModifier – Berauscht', () => {
	it('trifft nur Zechen', () => {
		const l = levels({ berauscht: 3 });
		expect(conditionModifier(l, zechen).modifier).toBe(-3);
		expect(conditionModifier(l, klettern).modifier).toBe(0);
		expect(conditionModifier(l, at).modifier).toBe(0);
	});
});

describe('conditionModifier – Entrückung', () => {
	it('erschwert Talent und Zauber, gefällig erleichtert sie ab II', () => {
		const l = levels({ entrueckung: 2 });
		expect(conditionModifier(l, klettern).modifier).toBe(-2);
		expect(conditionModifier(l, zauber).modifier).toBe(-2);
		expect(conditionModifier(l, klettern, { gottgefaellig: true }).modifier).toBe(1);
		expect(conditionModifier(levels({ entrueckung: 1 }), klettern, { gottgefaellig: true }).modifier).toBe(0);
	});

	it('lässt Liturgien und Kampf unberührt', () => {
		const l = levels({ entrueckung: 3 });
		expect(conditionModifier(l, liturgie).modifier).toBe(0);
		expect(conditionModifier(l, at).modifier).toBe(0);
	});
});

describe('conditionModifier – Deckel und Summen', () => {
	it('kappt die Erschwernis bei −5 und meldet das', () => {
		const result = conditionModifier(levels({ betaeubung: 3, furcht: 3 }), klettern);
		expect(result.modifier).toBe(-CONDITION_PENALTY_CAP);
		expect(result.capped).toBe(true);
		expect(result.parts.map(p => p.value)).toEqual([-3, -3]);
	});

	it('addiert die Entrückungs-Erleichterung erst nach dem Deckel', () => {
		const result = conditionModifier(
			levels({ betaeubung: 3, furcht: 3, entrueckung: 3 }),
			klettern,
			{ gottgefaellig: true }
		);
		expect(result.modifier).toBe(-3);
	});

	it('führt Posten in Dialog-Reihenfolge mit Stufe und Wert', () => {
		const result = conditionModifier(levels({ furcht: 1, schmerz: 2 }), klettern);
		expect(result.parts.map(p => [p.id, p.roman, p.value])).toEqual([
			['schmerz', 'II', -2],
			['furcht', 'I', -1]
		]);
	});

	it('liefert −0 nie, sondern +0', () => {
		expect(Object.is(conditionModifier(emptyConditionLevels(), klettern).modifier, 0)).toBe(true);
	});
});

describe('Handlungsunfähigkeit', () => {
	it('bei Stufe IV eines harten Zustands, nicht bei Entrückung oder Berauscht', () => {
		expect(incapacitationReason(levels({ betaeubung: 4 }))).toBe('Betäubung IV');
		expect(incapacitationReason(levels({ schmerz: 4 }))).toBe('Schmerz IV');
		expect(incapacitationReason(levels({ paralyse: 4 }))).toBe('Paralyse IV');
		expect(incapacitationReason(levels({ entrueckung: 4 }))).toBeUndefined();
		expect(incapacitationReason(levels({ berauscht: 4 }))).toBeUndefined();
	});

	it('ab 8 Stufen gesamt, auch ohne einzelne IV', () => {
		const l = levels({ berauscht: 3, schmerz: 3, furcht: 2 });
		expect(totalLevels(l)).toBe(8);
		expect(incapacitationReason(l)).toBe('8 Stufen');
		expect(isIncapacitated(levels({ schmerz: 3, furcht: 3 }))).toBe(false);
		expect(conditionModifier(l, klettern).incapacitated).toBe(true);
	});
});

describe('Sperre bei Verwirrung III', () => {
	it('sperrt Zauber, Liturgie und Wissenstalente, nicht Körpertalente', () => {
		const l = levels({ verwirrung: 3 });
		expect(conditionModifier(l, zauber).blockedReason).toBe('Verwirrung III: Zaubern ist unmöglich.');
		expect(conditionModifier(l, liturgie).blockedReason).toBe('Verwirrung III: Liturgien wirken ist unmöglich.');
		expect(conditionModifier(l, rechnen).blockedReason).toBe('Verwirrung III: Wissenstalente sind unmöglich.');
		expect(conditionModifier(l, klettern).blockedReason).toBeUndefined();
		expect(conditionModifier(l, at).blockedReason).toBeUndefined();
	});

	it('sperrt bei II nicht und nennt bei IV die Stufe IV', () => {
		expect(conditionModifier(levels({ verwirrung: 2 }), zauber).blockedReason).toBeUndefined();
		expect(conditionModifier(levels({ verwirrung: 4 }), zauber).blockedReason).toBe('Verwirrung IV: Zaubern ist unmöglich.');
	});
});

describe('conditionNote', () => {
	it('nennt jeden Posten mit Stufe und Vorzeichen', () => {
		const result = conditionModifier(levels({ schmerz: 2, furcht: 1 }), klettern);
		expect(conditionNote(result)).toBe('Schmerz II −2, Furcht I −1');
	});

	it('nennt den Deckel', () => {
		const result = conditionModifier(levels({ betaeubung: 3, furcht: 3 }), klettern);
		expect(conditionNote(result)).toBe('Betäubung III −3, Furcht III −3 (Deckel −5)');
	});

	it('bleibt ohne Posten leer', () => {
		expect(conditionNote(conditionModifier(emptyConditionLevels(), klettern))).toBeUndefined();
	});
});
