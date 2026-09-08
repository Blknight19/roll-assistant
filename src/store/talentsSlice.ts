import { createSlice } from '@reduxjs/toolkit';
import type { PayloadAction } from '@reduxjs/toolkit';
import type { AttributeKey } from './attributesSlice';

export type TalentGroup = 'koerper' | 'gesellschaft' | 'natur' | 'wissen' | 'handwerk';

/** Belastungsspalte des Regelwiki: „Evtl." entscheidet die Szene, nicht der Held. */
export type TalentEncumbrance = 'ja' | 'evtl' | 'nein';

export type Talent = {
	id: string;
	name: string;
	attribute1: AttributeKey;
	attribute2: AttributeKey;
	attribute3: AttributeKey;
	value: number;
	group: TalentGroup;
	be: TalentEncumbrance;
}

export type TalentState = {
	talents: Talent[]
}

const talent = (
	id: string,
	name: string,
	[attribute1, attribute2, attribute3]: [AttributeKey, AttributeKey, AttributeKey],
	group: TalentGroup,
	be: TalentEncumbrance
): Talent => ({ id, name, attribute1, attribute2, attribute3, value: 0, group, be });

export const initialTalentState: TalentState = {
	talents: [
		talent('1', 'Fliegen', ['MU', 'IN', 'GE'], 'koerper', 'ja'),
		talent('2', 'Gaukeleien', ['MU', 'CH', 'FF'], 'koerper', 'ja'),
		talent('3', 'Klettern', ['MU', 'GE', 'KK'], 'koerper', 'ja'),
		talent('4', 'Körperbeherrschung', ['GE', 'GE', 'KO'], 'koerper', 'ja'),
		talent('5', 'Kraftakt', ['KO', 'KK', 'KK'], 'koerper', 'ja'),
		talent('6', 'Reiten', ['CH', 'GE', 'KK'], 'koerper', 'ja'),
		talent('7', 'Schwimmen', ['GE', 'KO', 'KK'], 'koerper', 'ja'),
		talent('8', 'Selbstbeherrschung', ['MU', 'MU', 'KO'], 'koerper', 'nein'),
		talent('9', 'Singen', ['KL', 'CH', 'KO'], 'koerper', 'evtl'),
		talent('10', 'Sinnesschärfe', ['KL', 'IN', 'IN'], 'koerper', 'evtl'),
		talent('11', 'Tanzen', ['KL', 'CH', 'GE'], 'koerper', 'ja'),
		talent('12', 'Taschendiebstahl', ['MU', 'FF', 'GE'], 'koerper', 'ja'),
		talent('13', 'Verbergen', ['MU', 'IN', 'GE'], 'koerper', 'ja'),
		talent('14', 'Zechen', ['KL', 'KO', 'KK'], 'koerper', 'nein'),
		talent('15', 'Bekehren & Überzeugen', ['MU', 'KL', 'CH'], 'gesellschaft', 'nein'),
		talent('16', 'Betören', ['MU', 'CH', 'CH'], 'gesellschaft', 'nein'),
		talent('17', 'Einschüchtern', ['MU', 'IN', 'CH'], 'gesellschaft', 'nein'),
		talent('18', 'Etikette', ['KL', 'IN', 'CH'], 'gesellschaft', 'nein'),
		talent('19', 'Gassenwissen', ['KL', 'IN', 'CH'], 'gesellschaft', 'nein'),
		talent('20', 'Menschenkenntnis', ['KL', 'IN', 'CH'], 'gesellschaft', 'nein'),
		talent('21', 'Überreden', ['MU', 'IN', 'CH'], 'gesellschaft', 'nein'),
		talent('22', 'Verkleiden', ['IN', 'CH', 'GE'], 'gesellschaft', 'ja'),
		talent('23', 'Willenskraft', ['MU', 'IN', 'CH'], 'gesellschaft', 'nein'),
		talent('24', 'Fährtensuche', ['MU', 'IN', 'GE'], 'natur', 'ja'),
		talent('25', 'Fesseln', ['KL', 'FF', 'KK'], 'natur', 'nein'),
		talent('26', 'Fischen & Angeln', ['FF', 'GE', 'KO'], 'natur', 'evtl'),
		talent('27', 'Orientierung', ['KL', 'IN', 'IN'], 'natur', 'nein'),
		talent('28', 'Pflanzenkunde', ['KL', 'FF', 'KO'], 'natur', 'evtl'),
		talent('29', 'Tierkunde', ['MU', 'MU', 'CH'], 'natur', 'ja'),
		talent('30', 'Wildnisleben', ['MU', 'GE', 'KO'], 'natur', 'ja'),
		talent('31', 'Brett- & Glücksspiel', ['KL', 'KL', 'IN'], 'wissen', 'nein'),
		talent('32', 'Geographie', ['KL', 'KL', 'IN'], 'wissen', 'nein'),
		talent('33', 'Geschichtswissen', ['KL', 'KL', 'IN'], 'wissen', 'nein'),
		talent('34', 'Götter & Kulte', ['KL', 'KL', 'IN'], 'wissen', 'nein'),
		talent('35', 'Kriegskunst', ['MU', 'KL', 'IN'], 'wissen', 'nein'),
		talent('36', 'Magiekunde', ['KL', 'KL', 'IN'], 'wissen', 'nein'),
		talent('37', 'Mechanik', ['KL', 'KL', 'FF'], 'wissen', 'nein'),
		talent('38', 'Rechnen', ['KL', 'KL', 'IN'], 'wissen', 'nein'),
		talent('39', 'Rechtskunde', ['KL', 'KL', 'IN'], 'wissen', 'nein'),
		talent('40', 'Sagen & Legenden', ['KL', 'KL', 'IN'], 'wissen', 'nein'),
		talent('41', 'Sphärenkunde', ['KL', 'KL', 'IN'], 'wissen', 'nein'),
		talent('42', 'Sternkunde', ['KL', 'KL', 'IN'], 'wissen', 'nein'),
		talent('43', 'Alchemie', ['MU', 'KL', 'FF'], 'handwerk', 'ja'),
		talent('44', 'Boote & Schiffe', ['FF', 'GE', 'KK'], 'handwerk', 'ja'),
		talent('45', 'Fahrzeuge', ['CH', 'FF', 'KO'], 'handwerk', 'ja'),
		talent('46', 'Handel', ['KL', 'IN', 'CH'], 'handwerk', 'nein'),
		talent('47', 'Heilkunde Gift', ['MU', 'KL', 'IN'], 'handwerk', 'ja'),
		talent('48', 'Heilkunde Krankheiten', ['MU', 'IN', 'KO'], 'handwerk', 'ja'),
		talent('49', 'Heilkunde Seele', ['IN', 'CH', 'KO'], 'handwerk', 'nein'),
		talent('50', 'Heilkunde Wunden', ['KL', 'FF', 'FF'], 'handwerk', 'ja'),
		talent('51', 'Holzbearbeitung', ['FF', 'GE', 'KK'], 'handwerk', 'ja'),
		talent('52', 'Lebensmittelbearbeitung', ['IN', 'FF', 'FF'], 'handwerk', 'ja'),
		talent('53', 'Lederbearbeitung', ['FF', 'GE', 'KO'], 'handwerk', 'ja'),
		talent('54', 'Malen & Zeichnen', ['IN', 'FF', 'FF'], 'handwerk', 'ja'),
		talent('55', 'Metallbearbeitung', ['FF', 'KO', 'KK'], 'handwerk', 'ja'),
		talent('56', 'Musizieren', ['CH', 'FF', 'KO'], 'handwerk', 'ja'),
		talent('57', 'Schlösserknacken', ['IN', 'FF', 'FF'], 'handwerk', 'ja'),
		talent('58', 'Steinbearbeitung', ['FF', 'FF', 'KK'], 'handwerk', 'ja'),
		talent('59', 'Stoffbearbeitung', ['KL', 'FF', 'FF'], 'handwerk', 'ja')
	]
};

/** Fertigkeitswerte steigen bis 25 – der frühere Deckel von 20 war zu niedrig. */
export const TALENT_VALUE_MAX = 25;

export const clampTalentValue = (value: number): number =>
	Math.min(TALENT_VALUE_MAX, Math.max(0, Math.round(value)));

const talentSlice = createSlice({
	name: 'talents',
	initialState: initialTalentState,
	reducers: {
		updateTalent: (state, action: PayloadAction<{ id: string, value: number }>) => {
			const talent = state.talents.find(entry => entry.id === action.payload.id);
			if (talent) talent.value = clampTalentValue(action.payload.value);
		}
	}
});

export const { updateTalent } = talentSlice.actions;
export const talentReducer = talentSlice.reducer; 