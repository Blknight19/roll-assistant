import { toast } from 'sonner';
import { store } from '@/store';
import { ATTRIBUTE_KEYS, setAttribute } from '@/store/attributesSlice';
import { COMBAT_STAT_KEYS, updateCombatStat, updateLifeStat } from '@/store/combatSlice';
import {
	PERSISTED_VERSION,
	isFiniteNumber,
	isRecord,
	migratePersisted
} from '@/store/persistence';
import { setCharacterName } from '@/store/profileSlice';
import { setHistory } from '@/store/rollSlice';
import { setConfirmCriticals, setNoLiturgyFumble } from '@/store/settingsSlice';
import { setKarma } from '@/store/karmaSlice';
import { setSpellbook } from '@/store/spellbookSlice';
import { updateTalent } from '@/store/talentsSlice';

/** Eine Charakterdatei ist ein paar Kilobyte groß; alles darüber ist keine. */
const MAX_IMPORT_BYTES = 5 * 1024 * 1024;

/** @returns ob der Import angewendet wurde – die UI meldet nur dann Erfolg. */
export const importCharacter = async (file: File): Promise<boolean> => {
	if (file.size > MAX_IMPORT_BYTES) {
		toast.error('Datei ist zu groß für eine Charakterdatei');
		return false;
	}

	let data: unknown;
	try {
		data = JSON.parse(decodeURIComponent(atob(await file.text())));
	} catch (error) {
		// Details bewusst nur in die Konsole: die rohe Exception im Toast half
		// niemandem und legte Interna offen.
		// eslint-disable-next-line no-console
		console.warn('Charakterdatei konnte nicht gelesen werden:', error);
		toast.error('Datei konnte nicht gelesen werden (keine gültige Charakterdatei)');
		return false;
	}

	if (!isRecord(data)) {
		toast.error('Unerwartetes Dateiformat');
		return false;
	}

	if (isFiniteNumber(data.version) && data.version > PERSISTED_VERSION) {
		toast.error(`Datei-Version ${data.version} wird von dieser App-Version nicht unterstützt`);
		return false;
	}

	// Dieselben Sanitizer wie beim Laden aus dem localStorage: eine Validierung
	// für ein Format, statt zweier, die auseinanderdriften.
	const imported = migratePersisted(data);
	if (!imported) {
		toast.error('Unerwartetes Dateiformat');
		return false;
	}

	const dispatch = store.dispatch;
	dispatch(setCharacterName(imported.profile.name));
	for (const key of ATTRIBUTE_KEYS) {
		dispatch(setAttribute({ key, value: imported.attributes[key] }));
	}
	for (const talent of imported.talents.talents) {
		dispatch(updateTalent({ id: talent.id, value: talent.value }));
	}
	for (const key of COMBAT_STAT_KEYS) {
		dispatch(updateCombatStat({ key, value: imported.combat[key] }));
	}
	dispatch(updateLifeStat(imported.combat.life));
	dispatch(setSpellbook(imported.spellbook));
	dispatch(setKarma(imported.karma));
	dispatch(setHistory(imported.roll.history));
	dispatch(setConfirmCriticals(imported.settings.confirmCriticals));
	dispatch(setNoLiturgyFumble(imported.settings.noLiturgyFumble));

	toast.success('Import erfolgreich');
	return true;
};
