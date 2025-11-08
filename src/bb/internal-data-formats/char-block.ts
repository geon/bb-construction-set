import { Char } from "./char";

export type CharBlock =
	// The chars are column-order just like in the game.
	ReadonlyArray<ReadonlyArray<Char>>;
