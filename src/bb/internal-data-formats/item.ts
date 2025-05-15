import { ItemDataSegmentName } from "../game-definitions/item-segment-name";
import { Char } from "./char";
import { ReadonlyTuple } from "../tuple";

export type Item<Height extends number, Width extends number> =
	// The chars are column-order just like in the game.
	ReadonlyTuple<ReadonlyTuple<Char, Height>, Width>;

export type CharGroup<
	Width extends number,
	Height extends number
> = ReadonlyArray<Item<Height, Width>>;

export type CharGroups = {
	readonly [Key in ItemDataSegmentName]: CharGroup<number, number>;
};
