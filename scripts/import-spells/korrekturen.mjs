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
	}
};
