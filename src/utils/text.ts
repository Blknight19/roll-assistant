/**
 * C0-Steuerzeichen, Zero-Width- und Bidi-Zeichen. Letztere lassen Text anders erscheinen,
 * als er gespeichert ist – ein präparierter Liturgiename könnte im Buch als etwas anderes
 * gelesen werden, als die Datei enthält.
 *
 * Dieselbe Liste prüft `scripts/import-spells/parse.mjs` beim Katalog. Beide Eingangstore
 * für fremden Text müssen sie kennen: der Katalog zur Entwicklungszeit, die
 * `.held`-Datei und der localStorage zur Laufzeit.
 */
const IST_STEUERZEICHEN = (codePoint: number): boolean =>
	codePoint < 0x20 ||
	codePoint === 0x7f ||
	(codePoint >= 0x200b && codePoint <= 0x200f) ||
	(codePoint >= 0x202a && codePoint <= 0x202e) ||
	(codePoint >= 0x2066 && codePoint <= 0x2069) ||
	codePoint === 0xfeff;

/** Entfernt Steuer-, Zero-Width- und Bidi-Zeichen. Alles andere bleibt unangetastet. */
export const stripControlChars = (value: string): string => {
	let sauber = '';
	for (const zeichen of value) {
		if (!IST_STEUERZEICHEN(zeichen.codePointAt(0)!)) sauber += zeichen;
	}
	return sauber;
};
