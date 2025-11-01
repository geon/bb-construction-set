import { range } from "../functions";
import { levelSize } from "../game-definitions/level-size";
import { mapTuple, MutableTuple, Tuple } from "../tuple";
import { Level } from "./level";

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
	return level.tiles;
}
