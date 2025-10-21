import { Levels } from "./levels";
import { SpriteGroups } from "./sprite";
import { CharGroups } from "./char-group";
import { ItemGroups } from "./item-groups";
import { EnemyDeathBonusIndices } from "./enemy-death-bonuses";

export type ParsedPrg = {
	readonly levels: Levels;
	readonly sprites: SpriteGroups;
	readonly chars: CharGroups;
	readonly items: ItemGroups;
	readonly enemyDeathBonusIndices: EnemyDeathBonusIndices;
};
