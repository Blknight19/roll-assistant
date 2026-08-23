/**
 * Ein Fenster, das nie neu geladen wird – die installierte PWA ist genau das –
 * fragt von sich aus nie nach einer neuen Version. Also stündlich nachfragen.
 */
export const UPDATE_CHECK_INTERVAL_MS = 60 * 60 * 1000;

type Updatable = { update: () => Promise<unknown> };

/** Startet den Intervall-Check und gibt zurück, wie man ihn wieder stoppt. */
export const startUpdateCheck = (registration: Updatable, intervalMs: number) => {
	const timer = setInterval(() => {
		// Offline schlägt `update()` fehl; das ist kein Grund, die Kette abreißen zu lassen.
		void registration.update().catch(() => {});
	}, intervalMs);

	return () => clearInterval(timer);
};
