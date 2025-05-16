import { Level } from "./level";
import { SpriteGroups } from "./sprite";
import { CharGroups } from "./char-group";

export type ParsedPrg = {
	readonly levels: readonly Level[];
	readonly sprites: SpriteGroups;
	readonly chars: CharGroups;
};
