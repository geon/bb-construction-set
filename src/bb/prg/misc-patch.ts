import { bitsToByte } from "../bit-twiddling";
import { chunk, zipObject } from "../functions";
import { levelSize } from "../game-definitions/level-size";
import {
	levelIsSymmetric,
	BubbleCurrentPerLineDefaults,
	Holes,
	PlatformTiles,
} from "../internal-data-formats/level";
import { getTileRow } from "../internal-data-formats/tiles";
import { maxAsymmetric } from "./data-locations";

export function writeHoles(holeses: readonly Holes[]): Uint8Array {
	const tilesHalfBytes = holeses.map((holes) => {
		return (
			((holes.top.left ? 1 : 0) << 0) +
			((holes.top.right ? 1 : 0) << 1) +
			((holes.bottom.left ? 1 : 0) << 2) +
			((holes.bottom.right ? 1 : 0) << 3)
		);
	});

	return new Uint8Array(tilesHalfBytes);
}

export function writeBubbleCurrentInHoles(
	bubbleCurrentPerLineDefaultses: readonly BubbleCurrentPerLineDefaults[]
): Uint8Array {
	const currentsHalfBytes = bubbleCurrentPerLineDefaultses.map(
		(bubbleCurrentPerLineDefaults) =>
			// The most significant bits are the bubble current of the top and bottom rows.
			(bubbleCurrentPerLineDefaults[0] << 4) |
			(bubbleCurrentPerLineDefaults[24] << 6)
	);

	return new Uint8Array(currentsHalfBytes);
}

export function writeSymmetry(tileses: readonly PlatformTiles[]): Uint8Array {
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
	tileses: readonly PlatformTiles[],
	bubbleCurrentPerLineDefaultses: readonly BubbleCurrentPerLineDefaults[]
): Uint8Array {
	// Write platforms bitmap
	const levelBitmapBytes = tileses.flatMap((tiles, levelIndex) => {
		const isSymmetric = levelIsSymmetric(tiles);
		const bubbleCurrentPerLineDefaults =
			bubbleCurrentPerLineDefaultses[levelIndex]!;

		const fullRows = tiles.map(getTileRow);
		const rows = !isSymmetric
			? fullRows
			: fullRows.map((fullRow) => fullRow.slice(0, levelSize.x / 2));

		const bitRows = zipObject({
			row: rows,
			bubbleCurrent: bubbleCurrentPerLineDefaults.slice(1, -1),
		}).map(({ row, bubbleCurrent }) => {
			// So stupid.
			const bitPositions = (
				{
					symmetric: [0, 1],
					notSymmetric: [levelSize.x - 1, levelSize.x - 2],
				} as const
			)[isSymmetric ? "symmetric" : "notSymmetric"];

			// Encode the per-line bubble current into the edge of the platforms bitmap.
			const bits = [...row];
			bits[bitPositions[0]] = !!(bubbleCurrent & 0b01);
			bits[bitPositions[1]] = !!(bubbleCurrent & 0b10);

			return bits;
		});

		const byteRows = bitRows
			.map((row) => chunk(row, 8))
			.flat()
			.map(bitsToByte);

		return byteRows;
	});
	const maxLevelBytes = 46 * 100 + 46 * maxAsymmetric;
	if (levelBitmapBytes.length > maxLevelBytes) {
		throw new Error("Too many level bytes.");
	}
	return new Uint8Array(levelBitmapBytes);
}
