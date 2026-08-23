import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { UPDATE_CHECK_INTERVAL_MS, startUpdateCheck } from './appUpdate';

beforeEach(() => vi.useFakeTimers());
afterEach(() => vi.useRealTimers());

describe('startUpdateCheck', () => {
	it('prüft nicht sofort – die Registrierung war gerade erst', () => {
		const update = vi.fn(async () => {});
		startUpdateCheck({ update }, 1000);
		expect(update).not.toHaveBeenCalled();
	});

	it('prüft nach jedem Intervall erneut', async () => {
		const update = vi.fn(async () => {});
		startUpdateCheck({ update }, 1000);

		await vi.advanceTimersByTimeAsync(3000);

		expect(update).toHaveBeenCalledTimes(3);
	});

	it('prüft nicht mehr, nachdem gestoppt wurde', async () => {
		const update = vi.fn(async () => {});
		const stop = startUpdateCheck({ update }, 1000);

		await vi.advanceTimersByTimeAsync(1000);
		stop();
		await vi.advanceTimersByTimeAsync(5000);

		expect(update).toHaveBeenCalledTimes(1);
	});

	it('prüft weiter, wenn ein Check fehlschlägt', async () => {
		// Offline wirft `update()` – ein einzelner Fehlschlag darf die Kette nicht abreißen.
		const update = vi.fn()
			.mockRejectedValueOnce(new Error('offline'))
			.mockResolvedValue(undefined);
		startUpdateCheck({ update }, 1000);

		await vi.advanceTimersByTimeAsync(2000);

		expect(update).toHaveBeenCalledTimes(2);
	});

	it('prüft stündlich', () => {
		expect(UPDATE_CHECK_INTERVAL_MS).toBe(60 * 60 * 1000);
	});
});
