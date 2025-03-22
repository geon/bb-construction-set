import { zipObject, chunk } from "./functions";
import { Tiles, levelIsSymmetric, BubbleCurrentPerLineDefaults } from "./level";
import { maxAsymmetric } from "./prg/data-locations";

export function writeHoles(
	tileses: readonly Tiles[],
	bubbleCurrentPerLineDefaultses: readonly BubbleCurrentPerLineDefaults[]
): Uint8Array {
	const tilesHalfBytes = tileses.map((tiles) => {
		const topLeft = !tiles[0][10];
		const topRight = !tiles[0][20];
		const bottomLeft = !tiles[24][10];
		const bottomRight = !tiles[24][20];

		return (
			((topLeft ? 1 : 0) << 0) +
			((topRight ? 1 : 0) << 1) +
			((bottomLeft ? 1 : 0) << 2) +
			((bottomRight ? 1 : 0) << 3)
		);
	});

	const currentsHalfBytes = bubbleCurrentPerLineDefaultses.map(
		(bubbleCurrentPerLineDefaults) => {
			return (
				// The most significant bits are the bubble current of the top and bottom rows.
				((bubbleCurrentPerLineDefaults[0]! & 0b01 ? 1 : 0) << 4) +
				((bubbleCurrentPerLineDefaults[0]! & 0b10 ? 1 : 0) << 5) +
				((bubbleCurrentPerLineDefaults[24]! & 0b01 ? 1 : 0) << 6) +
				((bubbleCurrentPerLineDefaults[24]! & 0b10 ? 1 : 0) << 7)
			);
		}
	);

	const bytes = zipObject({
		tilesHalfBytes,
		currentsHalfBytes,
	}).map(
		({ tilesHalfBytes, currentsHalfBytes }) =>
			tilesHalfBytes + currentsHalfBytes
	);

	return new Uint8Array(bytes);
}

export function writeSymmetry(tileses: readonly Tiles[]): Uint8Array {
	const asymmetricLevels = tileses.filter((tiles) => !levelIsSymmetric(tiles));
	if (asymmetricLevels.length > maxAsymmetric) {
		throw new Error(
			`Too many asymmetric levels: ${asymmetricLevels.length}. Should be max ${maxAsymmetric}.`
		);
	}

	const tilesBits = tileses.map(
		(tiles) => (levelIsSymmetric(tiles) ? 1 : 0) << 7
	);

	return new Uint8Array(tilesBits);
}

export function writeBitmaps(
	tileses: readonly Tiles[],
	bubbleCurrentPerLineDefaultses: readonly BubbleCurrentPerLineDefaults[]
): Uint8Array {
	// Write platforms bitmap
	const levelBitmapBytes = tileses.flatMap((tiles, levelIndex) => {
		const isSymmetric = levelIsSymmetric(tiles);

		const bitRows = [];
		for (let rowIndex = 1; rowIndex < 24; ++rowIndex) {
			const row = tiles[rowIndex]!.slice(0, isSymmetric ? 16 : 32);

			// So stupid.
			const bitPositions = (
				{
					symmetric: [0, 1],
					notSymmetric: [31, 30],
				} as const
			)[isSymmetric ? "symmetric" : "notSymmetric"];

			// Encode the per-line bubble current into the edge of the platforms bitmap.
			row[bitPositions[0]] = !!(
				bubbleCurrentPerLineDefaultses[levelIndex]![rowIndex]! & 0b01
			);
			row[bitPositions[1]] = !!(
				bubbleCurrentPerLineDefaultses[levelIndex]![rowIndex]! & 0b10
			);

			bitRows.push(row);
		}

		const byteRows = bitRows
			.map((row) => chunk(row, 8))
			.map((row) =>
				row.map(
					(bits) =>
						((bits[0] ? 1 : 0) << 7) +
						((bits[1] ? 1 : 0) << 6) +
						((bits[2] ? 1 : 0) << 5) +
						((bits[3] ? 1 : 0) << 4) +
						((bits[4] ? 1 : 0) << 3) +
						((bits[5] ? 1 : 0) << 2) +
						((bits[6] ? 1 : 0) << 1) +
						((bits[7] ? 1 : 0) << 0)
				)
			);

		return byteRows.flat();
	});
	const maxLevelBytes = 46 * 100 + 46 * maxAsymmetric;
	if (levelBitmapBytes.length > maxLevelBytes) {
		throw new Error("Too many level bytes.");
	}
	return new Uint8Array(levelBitmapBytes);
}
