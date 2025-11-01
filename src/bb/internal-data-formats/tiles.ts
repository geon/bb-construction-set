import { range } from "../functions";
import { levelSize } from "../game-definitions/level-size";
import { assertTuple, mapTuple, MutableTuple, Tuple } from "../tuple";
import { Holes, Level, platformTilesSize } from "./level";

type TileRow = Tuple<boolean, typeof levelSize.x>;
export type Tiles = Tuple<TileRow, typeof levelSize.y>;

export function createTiles(): MutableTuple<
	MutableTuple<boolean, typeof levelSize.x>,
	typeof levelSize.y
> {
	return mapTuple(range(levelSize.y), () =>
		mapTuple(range(levelSize.x), () => false)
	);
}

export function getTiles(level: Level): Tiles {
	return assertTuple(
		[
			drawHoles(level.holes.top),
			...level.tiles.slice(1, -1),
			drawHoles(level.holes.bottom),
		],
		levelSize.y
	);
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
	const platformTiles: Tiles = assertTuple(tiles, platformTilesSize.y);
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
