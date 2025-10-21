import { Coord2 } from "../../math/coord2";
import { ItemCategoryName } from "../prg/data-locations";
import { Tuple } from "../tuple";

export type PerLevelItemSpawnPositions = Record<ItemCategoryName, Coord2>;

export type ItemSpawnPositions = Tuple<PerLevelItemSpawnPositions, 100>;
