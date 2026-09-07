/**
 * Stellen, an denen die Quelle von den Werten des Regelwerks abweicht. Diese Einträge
 * sind am Spieltisch bestätigt – sie zu entfernen holt die falschen Werte der Quelle
 * zurück, der Import überschreibt die erzeugten Dateien bei jedem Lauf vollständig.
 */
export const KORREKTUREN = {
	corpofesso: {
		grund: 'Regelwerk S. 289; Quelle nennt abweichend 16 AsP und QS x 2',
		felder: { cost: 8, costText: '8 AsP', duration: 'QS x 3 in KR' }
	},
	invercano: {
		grund: 'Aventurische Magie S. 134; Quelle nennt abweichend 2 Aktionen und QS x 2',
		felder: { castTime: '1 Aktion', duration: 'QS KR' }
	},
	paralysis: {
		grund: 'Regelwerk S. 296; Quelle nennt abweichend QS x 2 Minuten',
		felder: { duration: 'QS x 3 in Minuten' }
	},
	somnigravis: {
		grund: 'Regelwerk S. 298; Quelle nennt abweichend 8 Aktionen',
		felder: { castTime: '2 Aktionen' }
	},
	stillstand: {
		grund: 'Regelwiki nennt Kristallomanten mit; die Quelle führt diese Tradition kaum',
		felder: {
			verbreitung: ['Druiden', 'Geoden', 'Gildenmagier', 'Kristallomanten', 'Nachtalben']
		}
	},
	'pech-und-schwefel-strahl': {
		grund: 'Liturgien kosten KaP; die Quelle schreibt „8 AsP"',
		felder: { costText: '8 KaP (Kosten sind nicht modifizierbar)', cost: 8 }
	},
	'segnung-des-heims': {
		grund: 'Regelwiki nennt QS Tage; die Quelle noch QS x 3 Stunden',
		felder: { duration: 'QS Tage' }
	},
	erwachen: {
		grund: 'Boron hat die Aspekte Tod und Traum; Regelwiki nennt Boron (Traum)',
		felder: { verbreitung: ['Boron (Traum)'] }
	},
	geisterfalle: {
		grund: 'Boron hat die Aspekte Tod und Traum; Regelwiki nennt Tod und Traum',
		felder: { verbreitung: ['Allgemein-Schamanenritus', 'Boron (Tod)', 'Boron (Traum)'] }
	},
	eidechsenegeneration: {
		grund: 'Tippfehler der Quelle; Regelwiki: Eidechsenregeneration',
		felder: { name: 'Eidechsenregeneration' }
	},
	'eisbaergestalt': {
		grund: 'Regelwiki: Eisbärengestalt',
		felder: { name: 'Eisbärengestalt' }
	},
	'polarbaerenruf': {
		grund: 'Regelwiki: Eisbärenruf',
		felder: { name: 'Eisbärenruf' }
	},
	'grosse-waffenweihe': {
		grund: 'Regelwiki: Große Waffenweihe',
		felder: { name: 'Große Waffenweihe' }
	},
	tabuzone: {
		grund: 'Regelwiki: Tabu-Zone',
		felder: { name: 'Tabu-Zone' }
	},
	'brazoraghs-krieger': {
		grund: 'Quelle ohne Verbreitung; Regelwiki: Tairachschamanen (Zauberei)',
		felder: { verbreitung: ['Tairachschamanen (Zauberei)'] }
	},
	ogerruf: {
		grund: 'Quelle ohne Verbreitung; Regelwiki: Tairachschamanen (Zauberei)',
		felder: { verbreitung: ['Tairachschamanen (Zauberei)'] }
	},
	'herbeirufung-von-tairachs-dienern-nebelkraehen': {
		grund: 'Quelle ohne Verbreitung; Regelwiki nennt beide Aspekte',
		felder: {
			verbreitung: ['Tairachschamanen (Geisterwelt)', 'Tairachschamanen (Zauberei)']
		}
	}
};
