import { createSlice } from '@reduxjs/toolkit';
import type { PayloadAction } from '@reduxjs/toolkit';
import type { AttributeKey } from './attributesSlice';

export type Talent = {
	id: string;
	name: string;
	attribute1: AttributeKey;
	attribute2: AttributeKey;
	attribute3: AttributeKey;
	value: number;
}

export type TalentState = {
	talents: Talent[]
}

export const initialTalentState: TalentState = {
	talents: [
		{ id: '1', name: 'Fliegen', attribute1: 'MU', attribute2: 'IN', attribute3: 'GE', value: 0 },
		{ id: '2', name: 'Gaukeleien', attribute1: 'MU', attribute2: 'CH', attribute3: 'FF', value: 0 },
		{ id: '3', name: 'Klettern', attribute1: 'MU', attribute2: 'GE', attribute3: 'KK', value: 0 },
		{ id: '4', name: 'Körperbeherrschung', attribute1: 'GE', attribute2: 'GE', attribute3: 'KO', value: 0 },
		{ id: '5', name: 'Kraftakt', attribute1: 'KO', attribute2: 'KK', attribute3: 'KK', value: 0 },
		{ id: '6', name: 'Reiten', attribute1: 'CH', attribute2: 'GE', attribute3: 'KK', value: 0 },
		{ id: '7', name: 'Schwimmen', attribute1: 'GE', attribute2: 'KO', attribute3: 'KK', value: 0 },
		{ id: '8', name: 'Selbstbeherrschung', attribute1: 'MU', attribute2: 'MU', attribute3: 'KO', value: 0 },
		{ id: '9', name: 'Singen', attribute1: 'KL', attribute2: 'CH', attribute3: 'KO', value: 0 },
		{ id: '10', name: 'Sinnesschärfe', attribute1: 'KL', attribute2: 'IN', attribute3: 'IN', value: 0 },
		{ id: '11', name: 'Tanzen', attribute1: 'KL', attribute2: 'CH', attribute3: 'GE', value: 0 },
		{ id: '12', name: 'Taschendiebstahl', attribute1: 'MU', attribute2: 'FF', attribute3: 'GE', value: 0 },
		{ id: '13', name: 'Verbergen', attribute1: 'MU', attribute2: 'IN', attribute3: 'GE', value: 0 },
		{ id: '14', name: 'Zechen', attribute1: 'KL', attribute2: 'KO', attribute3: 'KK', value: 0 },
		{ id: '15', name: 'Bekehren & Überzeugen', attribute1: 'MU', attribute2: 'KL', attribute3: 'CH', value: 0 },
		{ id: '16', name: 'Betören', attribute1: 'MU', attribute2: 'CH', attribute3: 'CH', value: 0 },
		{ id: '17', name: 'Einschüchtern', attribute1: 'MU', attribute2: 'IN', attribute3: 'CH', value: 0 },
		{ id: '18', name: 'Etikette', attribute1: 'KL', attribute2: 'IN', attribute3: 'CH', value: 0 },
		{ id: '19', name: 'Gassenwissen', attribute1: 'KL', attribute2: 'IN', attribute3: 'CH', value: 0 },
		{ id: '20', name: 'Menschenkenntnis', attribute1: 'KL', attribute2: 'IN', attribute3: 'CH', value: 0 },
		{ id: '21', name: 'Überreden', attribute1: 'MU', attribute2: 'IN', attribute3: 'CH', value: 0 },
		{ id: '22', name: 'Verkleiden', attribute1: 'IN', attribute2: 'CH', attribute3: 'GE', value: 0 },
		{ id: '23', name: 'Willenskraft', attribute1: 'MU', attribute2: 'IN', attribute3: 'CH', value: 0 },
		{ id: '24', name: 'Fährtensuche', attribute1: 'MU', attribute2: 'IN', attribute3: 'GE', value: 0 },
		{ id: '25', name: 'Fesseln', attribute1: 'KL', attribute2: 'FF', attribute3: 'KK', value: 0 },
		{ id: '26', name: 'Fischen & Angeln', attribute1: 'FF', attribute2: 'GE', attribute3: 'KO', value: 0 },
		{ id: '27', name: 'Orientierung', attribute1: 'KL', attribute2: 'IN', attribute3: 'IN', value: 0 },
		{ id: '28', name: 'Pflanzenkunde', attribute1: 'KL', attribute2: 'FF', attribute3: 'KO', value: 0 },
		{ id: '29', name: 'Tierkunde', attribute1: 'MU', attribute2: 'MU', attribute3: 'CH', value: 0 },
		{ id: '30', name: 'Wildnisleben', attribute1: 'MU', attribute2: 'GE', attribute3: 'KO', value: 0 },
		{ id: '31', name: 'Brett- & Glücksspiel', attribute1: 'KL', attribute2: 'KL', attribute3: 'IN', value: 0 },
		{ id: '32', name: 'Geographie', attribute1: 'KL', attribute2: 'KL', attribute3: 'IN', value: 0 },
		{ id: '33', name: 'Geschichtswissen', attribute1: 'KL', attribute2: 'KL', attribute3: 'IN', value: 0 },
		{ id: '34', name: 'Götter & Kulte', attribute1: 'KL', attribute2: 'KL', attribute3: 'IN', value: 0 },
		{ id: '35', name: 'Kriegskunst', attribute1: 'MU', attribute2: 'KL', attribute3: 'IN', value: 0 },
		{ id: '36', name: 'Magiekunde', attribute1: 'KL', attribute2: 'KL', attribute3: 'IN', value: 0 },
		{ id: '37', name: 'Mechanik', attribute1: 'KL', attribute2: 'KL', attribute3: 'FF', value: 0 },
		{ id: '38', name: 'Rechnen', attribute1: 'KL', attribute2: 'KL', attribute3: 'IN', value: 0 },
		{ id: '39', name: 'Rechtskunde', attribute1: 'KL', attribute2: 'KL', attribute3: 'IN', value: 0 },
		{ id: '40', name: 'Sagen & Legenden', attribute1: 'KL', attribute2: 'KL', attribute3: 'IN', value: 0 },
		{ id: '41', name: 'Sphärenkunde', attribute1: 'KL', attribute2: 'KL', attribute3: 'IN', value: 0 },
		{ id: '42', name: 'Sternkunde', attribute1: 'KL', attribute2: 'KL', attribute3: 'IN', value: 0 },
		{ id: '43', name: 'Alchemie', attribute1: 'MU', attribute2: 'KL', attribute3: 'FF', value: 0 },
		{ id: '44', name: 'Boote & Schiffe', attribute1: 'FF', attribute2: 'GE', attribute3: 'KK', value: 0 },
		{ id: '45', name: 'Fahrzeuge', attribute1: 'CH', attribute2: 'FF', attribute3: 'KO', value: 0 },
		{ id: '46', name: 'Handel', attribute1: 'KL', attribute2: 'IN', attribute3: 'CH', value: 0 },
		{ id: '47', name: 'Heilkunde Gift', attribute1: 'MU', attribute2: 'KL', attribute3: 'IN', value: 0 },
		{ id: '48', name: 'Heilkunde Krankheiten', attribute1: 'MU', attribute2: 'IN', attribute3: 'KO', value: 0 },
		{ id: '49', name: 'Heilkunde Seele', attribute1: 'IN', attribute2: 'CH', attribute3: 'KO', value: 0 },
		{ id: '50', name: 'Heilkunde Wunden', attribute1: 'KL', attribute2: 'FF', attribute3: 'FF', value: 0 },
		{ id: '51', name: 'Holzbearbeitung', attribute1: 'FF', attribute2: 'GE', attribute3: 'KK', value: 0 },
		{ id: '52', name: 'Lebensmittelbearbeitung', attribute1: 'IN', attribute2: 'FF', attribute3: 'FF', value: 0 },
		{ id: '53', name: 'Lederbearbeitung', attribute1: 'FF', attribute2: 'GE', attribute3: 'KO', value: 0 },
		{ id: '54', name: 'Malen & Zeichnen', attribute1: 'IN', attribute2: 'FF', attribute3: 'FF', value: 0 },
		{ id: '55', name: 'Metallbearbeitung', attribute1: 'FF', attribute2: 'KO', attribute3: 'KK', value: 0 },
		{ id: '56', name: 'Musizieren', attribute1: 'CH', attribute2: 'FF', attribute3: 'KO', value: 0 },
		{ id: '57', name: 'Schlösserknacken', attribute1: 'IN', attribute2: 'FF', attribute3: 'FF', value: 0 },
		{ id: '58', name: 'Steinbearbeitung', attribute1: 'FF', attribute2: 'FF', attribute3: 'KK', value: 0 },
		{ id: '59', name: 'Stoffbearbeitung', attribute1: 'KL', attribute2: 'FF', attribute3: 'FF', value: 0 }
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