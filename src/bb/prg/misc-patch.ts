import { chunk, zipObject } from "../functions";
import { levelSize } from "../game-definitions/level-size";
import {
	levelIsSymmetric,
	BubbleCurrentPerLineDefaults,
	platformTilesSize,
	Holes,
	PlatformTiles,
} from "../internal-data-formats/level";
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

		const bitRows = zipObject({
			fullRow: tiles,
			bubbleCurrent: bubbleCurrentPerLineDefaults.slice(1, -1),
		}).map(({ fullRow, bubbleCurrent }) => {
			const row = fullRow.slice(
				0,
				isSymmetric ? platformTilesSize.x / 2 : platformTilesSize.x
			);

			// So stupid.
			const bitPositions = (
				{
					symmetric: [0, 1],
					notSymmetric: [levelSize.x - 1, levelSize.x - 2],
				} as const
			)[isSymmetric ? "symmetric" : "notSymmetric"];

			// Encode the per-line bubble current into the edge of the platforms bitmap.
			row[bitPositions[0]] = !!(bubbleCurrent & 0b01);
			row[bitPositions[1]] = !!(bubbleCurrent & 0b10);

			return row;
		});

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
