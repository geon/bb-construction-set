import {
	PlatformTiles,
	Holes,
	platformTilesSize,
} from "../internal-data-formats/level";
import { Tiles } from "../internal-data-formats/tiles";
import { assertTuple } from "../tuple";

export function parseLevelTiles(tiles: Tiles): {
	readonly tiles: PlatformTiles;
	readonly holes: Holes;
} {
	return {
		tiles: assertTuple(
			tiles.map((row) => assertTuple(row, platformTilesSize.x)).slice(1, -1),
			platformTilesSize.y
		),
		holes: {
			top: {
				left: tiles[0][9],
				right: tiles[0][19],
			},
			bottom: {
				left: tiles[24][9],
				right: tiles[24][19],
			},
		},
	};
}
