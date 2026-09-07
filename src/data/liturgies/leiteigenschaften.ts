import type { AttributeKey } from '@/store/attributesSlice';

/** Leiteigenschaft der Zwölfgötter-Traditionen laut Regelwiki – nur für den KaP-Richtwert. */
export const LEITEIGENSCHAFTEN: Record<string, AttributeKey> = {
	Praios: 'KL',
	Rondra: 'MU',
	Efferd: 'CH',
	Travia: 'KL',
	Boron: 'MU',
	Hesinde: 'KL',
	Firun: 'MU',
	Tsa: 'CH',
	Phex: 'IN',
	Peraine: 'IN',
	Ingerimm: 'IN',
	Rahja: 'CH'
};

/** Karmaenergie-Grundwert des Vorteils Geweihter. */
export const KAP_GRUNDWERT = 20;
