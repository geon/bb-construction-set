import { Coord2 } from "../../math/coord2";
import { ItemCategoryName } from "../prg/data-locations";

export type PerLevelItemSpawnPositions = Record<ItemCategoryName, Coord2>;

export type ItemSpawnPositions = ReadonlyArray<PerLevelItemSpawnPositions>;
