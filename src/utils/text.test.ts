import { describe, expect, it } from 'vitest';
import { stripControlChars } from './text';

describe('stripControlChars', () => {
	it('lässt gewöhnlichen Text unangetastet', () => {
		expect(stripControlChars('Kleiner Schutzsegen')).toBe('Kleiner Schutzsegen');
		expect(stripControlChars('Praios (Ordnung) – 16 KaP')).toBe('Praios (Ordnung) – 16 KaP');
	});

	it('entfernt Bidi-Zeichen, die Text anders erscheinen lassen', () => {
		expect(stripControlChars(`Heilsegen${String.fromCodePoint(0x202e)}`)).toBe('Heilsegen');
		expect(stripControlChars(`${String.fromCodePoint(0x2066)}A${String.fromCodePoint(0x2069)}`)).toBe('A');
	});

	it('entfernt Zero-Width- und Steuerzeichen', () => {
		expect(stripControlChars(`A${String.fromCodePoint(0x200b)}B`)).toBe('AB');
		expect(stripControlChars(`A${String.fromCodePoint(0x0007)}B`)).toBe('AB');
		expect(stripControlChars(`${String.fromCodePoint(0xfeff)}A`)).toBe('A');
	});

	it('lässt Zeichen jenseits der BMP unversehrt', () => {
		expect(stripControlChars('Rondra 🛡')).toBe('Rondra 🛡');
	});

	it('kommt mit leerem Text zurecht', () => {
		expect(stripControlChars('')).toBe('');
	});
});
