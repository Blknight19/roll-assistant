import { registerSW } from 'virtual:pwa-register';
import { toast } from 'sonner';
import { UPDATE_CHECK_INTERVAL_MS, startUpdateCheck } from './appUpdate';

/**
 * Meldet den Service Worker an und bietet eine wartende neue Version zum Neuladen an.
 * Wer den Hinweis wegklickt, arbeitet mit der alten Version weiter – der alte Worker
 * behält seine Dateien, solange er nicht abgelöst wird.
 */
export const registerAppUpdate = () => {
	const updateSW = registerSW({
		onNeedRefresh() {
			toast('Neue Version verfügbar', {
				description: 'Neu laden, um sie zu benutzen. Dein Held bleibt gespeichert.',
				duration: Infinity,
				action: {
					label: 'Neu laden',
					onClick: () => void updateSW(true)
				}
			});
		},
		onRegisteredSW(_swUrl, registration) {
			if (registration) startUpdateCheck(registration, UPDATE_CHECK_INTERVAL_MS);
		}
	});
};
