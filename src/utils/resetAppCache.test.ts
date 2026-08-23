import { describe, expect, it, vi } from 'vitest';
import { resetAppCache, type AppCacheEnv } from './resetAppCache';

/** Protokolliert die Reihenfolge, damit der Reload nachweislich zuletzt kommt. */
const env = (overrides: Partial<AppCacheEnv> = {}) => {
	const log: string[] = [];
	const unregister = vi.fn(async () => {
		log.push('unregister');
		return true;
	});
	const base: AppCacheEnv = {
		getRegistrations: async () => [{ unregister }, { unregister }],
		cacheKeys: async () => ['workbox-precache-v2', 'sonstiger-cache'],
		deleteCache: async (key: string) => {
			log.push(`delete:${key}`);
			return true;
		},
		reload: () => log.push('reload')
	};
	return { env: { ...base, ...overrides }, log, unregister };
};

describe('resetAppCache', () => {
	it('deregistriert jeden Service Worker', async () => {
		const { env: e, unregister } = env();
		await resetAppCache(e);
		expect(unregister).toHaveBeenCalledTimes(2);
	});

	it('löscht jeden Cache-Eintrag', async () => {
		const { env: e, log } = env();
		await resetAppCache(e);
		expect(log).toContain('delete:workbox-precache-v2');
		expect(log).toContain('delete:sonstiger-cache');
	});

	it('lädt erst neu, nachdem Worker und Caches weg sind', async () => {
		const { env: e, log } = env();
		await resetAppCache(e);
		expect(log[log.length - 1]).toBe('reload');
	});

	it('lädt auch ohne Service-Worker- und Cache-API neu', async () => {
		const { env: e, log } = env({ getRegistrations: undefined, cacheKeys: undefined });
		await resetAppCache(e);
		expect(log).toEqual(['reload']);
	});

	it('lädt auch dann neu, wenn das Aufräumen wirft', async () => {
		const { env: e, log } = env({
			getRegistrations: async () => {
				throw new Error('SecurityError');
			}
		});
		await resetAppCache(e);
		// Sonst säße genau der Nutzer fest, dem der Knopf helfen soll.
		expect(log[log.length - 1]).toBe('reload');
	});
});
