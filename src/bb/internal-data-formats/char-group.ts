import { CharSegmentName } from "../game-definitions/char-segment-name";
import { Char } from "./char";
import { Tuple } from "../tuple";

// TODO: Fix height/width ordering.
export type CharBlock<Height extends number, Width extends number> =
	// The chars are column-order just like in the game.
	Tuple<Tuple<Char, Height>, Width>;

export type CharGroup<
	Width extends number,
	Height extends number
> = ReadonlyArray<CharBlock<Height, Width>>;

export type CharGroups = {
	readonly [Key in CharSegmentName]: CharGroup<number, number>;
};
