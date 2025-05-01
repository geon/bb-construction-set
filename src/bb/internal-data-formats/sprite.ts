import { spriteSizePixels } from "../../c64/consts";
import { SpriteGroupName } from "../game-definitions/sprite-segment-name";
import { ReadonlyTuple } from "../tuple";
import { PaletteIndex, SubPaletteIndex } from "./palette";

export type PixelSprite = ReadonlyTuple<
	ReadonlyTuple<SubPaletteIndex, typeof spriteSizePixels.x>,
	typeof spriteSizePixels.y
>;

export type Sprite = ReadonlyTuple<number, 63>;

export type SpriteGroup = {
	readonly sprites: ReadonlyArray<Sprite>;
	readonly color: PaletteIndex;
};

export type SpriteGroups = Record<SpriteGroupName, SpriteGroup>;
