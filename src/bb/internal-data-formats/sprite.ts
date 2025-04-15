import { Tuple } from "../tuple";
import { PaletteIndex } from "./palette";

export interface Sprite {
	readonly bitmap: Tuple<number, 63>;
}

export type SpriteGroup = {
	readonly sprites: ReadonlyArray<Sprite>;
	readonly color: PaletteIndex;
};
