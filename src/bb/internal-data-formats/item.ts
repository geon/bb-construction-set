import { ItemDataSegmentName } from "../game-definitions/item-segment-name";
import { Char } from "./char";
import { ReadonlyTuple } from "../tuple";

export type Item<Height extends number, Width extends number> =
	// The chars are column-order just like in the game.
	ReadonlyTuple<ReadonlyTuple<Char, Height>, Width>;

export type ItemGroup<
	Width extends number,
	Height extends number
> = ReadonlyArray<{
	readonly item: Item<Height, Width>;
}>;

export type ItemGroups = {
	readonly [Key in ItemDataSegmentName]: ItemGroup<number, number>;
};
