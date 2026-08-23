/**
 * Die Browser-APIs, die ein Reset anfasst. Injizierbar, weil der Test sie sonst
 * nicht beobachten kann – und weil ältere Browser sie nicht alle mitbringen.
 */
export type AppCacheEnv = {
	getRegistrations?: () => Promise<readonly { unregister: () => Promise<boolean> }[]>;
	cacheKeys?: () => Promise<string[]>;
	deleteCache?: (key: string) => Promise<boolean>;
	reload: () => void;
};

export const browserCacheEnv = (): AppCacheEnv => ({
	getRegistrations: 'serviceWorker' in navigator
		? () => navigator.serviceWorker.getRegistrations()
		: undefined,
	cacheKeys: typeof caches !== 'undefined' ? () => caches.keys() : undefined,
	deleteCache: typeof caches !== 'undefined' ? (key: string) => caches.delete(key) : undefined,
	reload: () => location.reload()
});

/**
 * Wirft Service Worker und deren Caches weg und lädt neu. Der localStorage bleibt
 * unberührt: der Charakter überlebt, nur die ausgelieferten Dateien werden frisch geholt.
 */
export const resetAppCache = async (env: AppCacheEnv = browserCacheEnv()) => {
	try {
		const registrations = (await env.getRegistrations?.()) ?? [];
		await Promise.all(registrations.map(registration => registration.unregister()));

		const keys = (await env.cacheKeys?.()) ?? [];
		await Promise.all(keys.map(key => env.deleteCache?.(key)));
	} catch {
		// Gesperrter Speicher darf niemanden festhalten – neu geladen wird trotzdem.
	}
	env.reload();
};
