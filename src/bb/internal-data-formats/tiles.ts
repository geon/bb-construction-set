import { range } from "../functions";
import { levelSize } from "../game-definitions/level-size";
import { assertTuple, Tuple } from "../tuple";
import { Holes, Level, PlatformTiles, platformTilesSize } from "./level";

type TileRow = Tuple<boolean, typeof levelSize.x>;
export type Tiles = Tuple<TileRow, typeof levelSize.y>;

export function getTiles(level: Level): Tiles {
	return [
		drawHoles(level.holes.top),
		...level.tiles,
		drawHoles(level.holes.bottom),
	];
}

function drawHoles(row: Holes["top"]): Tuple<boolean, 32> {
	return assertTuple(
		[
			range(9).map(() => true),
			range(4).map(() => !row.left),
			range(6).map(() => true),
			range(4).map(() => !row.right),
			range(9).map(() => true),
		].flat(),
		32
	);
}

export function getPlatformTilesAndHoles(
	tiles: Tiles
): Pick<Level, "tiles" | "holes"> {
	const platformTiles: PlatformTiles = assertTuple(
		tiles.slice(1, -1),
		platformTilesSize.y
	);
	const holes: Holes = {
		top: {
			left: !tiles[0][9],
			right: !tiles[0][19],
		},
		bottom: {
			left: !tiles[24][9],
			right: !tiles[24][19],
		},
	};

	return {
		tiles: platformTiles,
		holes,
	};
}
