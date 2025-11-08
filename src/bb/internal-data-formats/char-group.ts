import { CharSegmentName } from "../game-definitions/char-segment-name";
import { Char } from "./char";

export type CharBlock =
	// The chars are column-order just like in the game.
	ReadonlyArray<ReadonlyArray<Char>>;

export type CharGroup = ReadonlyArray<CharBlock>;

export type CharGroups = {
	readonly [Key in CharSegmentName]: CharGroup;
};
