import type { LiturgyCatalogEntry } from './types';

export const SEGEN: LiturgyCatalogEntry[] = [
	{
		id: 'eidsegen',
		klasse: 'segen',
		name: 'Eidsegen',
		cost: 1,
		costText: '1 KaP',
		castTime: '1 Aktion',
		range: '4 Schritt',
		duration: '1 Jahr',
		target: 'Kulturschaffende',
		verbreitung: ['Allgemein']
	},
	{
		id: 'feuersegen',
		klasse: 'segen',
		name: 'Feuersegen',
		cost: 1,
		costText: '1 KaP',
		castTime: '1 Aktion',
		range: 'selbst',
		duration: '5 Minuten',
		target: 'Kulturschaffende',
		verbreitung: ['Allgemein']
	},
	{
		id: 'geburtssegen',
		klasse: 'segen',
		name: 'Geburtssegen',
		cost: 1,
		costText: '1 KaP',
		castTime: '1 Aktion',
		range: 'Berührung',
		duration: 'in Zwölfgötterkirchen bis zum 12. Lebensjahr',
		target: 'Kulturschaffende',
		verbreitung: ['Allgemein']
	},
	{
		id: 'glueckssegen',
		klasse: 'segen',
		name: 'Glückssegen',
		cost: 1,
		costText: '1 KaP',
		castTime: '1 Aktion',
		range: 'Berührung',
		duration: '12 Stunden',
		target: 'Kulturschaffende',
		verbreitung: ['Allgemein']
	},
	{
		id: 'grabsegen',
		klasse: 'segen',
		name: 'Grabsegen',
		cost: 1,
		costText: '1 KaP',
		castTime: '1 Aktion',
		range: 'Berührung',
		duration: '12 Monate',
		target: 'Zone',
		verbreitung: ['Allgemein']
	},
	{
		id: 'harmoniesegen',
		klasse: 'segen',
		name: 'Harmoniesegen',
		cost: 1,
		costText: '1 KaP',
		castTime: '1 Aktion',
		range: 'Berührung',
		duration: '12 Stunden',
		target: 'Kulturschaffende',
		verbreitung: ['Allgemein']
	},
	{
		id: 'kleiner-heilsegen',
		klasse: 'segen',
		name: 'Kleiner Heilsegen',
		cost: 1,
		costText: '1 KaP',
		castTime: '1 Aktion',
		range: 'Berührung',
		duration: 'sofort',
		target: 'Kulturschaffende',
		verbreitung: ['Allgemein']
	},
	{
		id: 'kleiner-schutzsegen',
		klasse: 'segen',
		name: 'Kleiner Schutzsegen',
		cost: 1,
		costText: '1 KaP',
		castTime: '1 Aktion',
		range: '4 Schritt',
		duration: '4 Kampfrunden',
		target: 'Zone',
		verbreitung: ['Allgemein']
	},
	{
		id: 'speisesegen',
		klasse: 'segen',
		name: 'Speisesegen',
		cost: 1,
		costText: '1 KaP',
		castTime: '1 Aktion',
		range: 'Berührung',
		duration: 'sofort',
		target: 'Objekte',
		verbreitung: ['Allgemein']
	},
	{
		id: 'staerkungssegen',
		klasse: 'segen',
		name: 'Stärkungssegen',
		cost: 1,
		costText: '1 KaP',
		castTime: '1 Aktion',
		range: 'selbst',
		duration: '12 Kampfrunden',
		target: 'Kulturschaffende',
		verbreitung: ['Allgemein']
	},
	{
		id: 'tranksegen',
		klasse: 'segen',
		name: 'Tranksegen',
		cost: 1,
		costText: '1 KaP',
		castTime: '1 Aktion',
		range: 'Berührung',
		duration: 'sofort',
		target: 'Objekte',
		verbreitung: ['Allgemein']
	},
	{
		id: 'weisheitssegen',
		klasse: 'segen',
		name: 'Weisheitssegen',
		cost: 1,
		costText: '1 KaP',
		castTime: '1 Aktion',
		range: 'Berührung',
		duration: '12 Stunden',
		target: 'Kulturschaffende',
		verbreitung: ['Allgemein']
	}
];
