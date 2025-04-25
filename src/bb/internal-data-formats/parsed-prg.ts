import { Level } from "./level";
import { SpriteGroups } from "./sprite";
import { ItemGroups } from "../prg/items";

export type ParsedPrg = {
	readonly levels: readonly Level[];
	readonly sprites: SpriteGroups;
	readonly items: ItemGroups;
};
