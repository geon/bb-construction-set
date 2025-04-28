import { SpriteGroupName } from "../game-definitions/sprite-segment-name";
import { Tuple } from "../tuple";
import { PaletteIndex } from "./palette";

export type Sprite = Tuple<number, 63>;

export type SpriteGroup = {
	readonly sprites: ReadonlyArray<Sprite>;
	readonly color: PaletteIndex;
};

export type SpriteGroups = Record<SpriteGroupName, SpriteGroup>;
