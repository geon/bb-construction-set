import { Tuple } from "../tuple";
import { Char } from "./char";

export type CharBlock =
	// The chars are column-order just like in the game.
	ReadonlyArray<ReadonlyArray<Char>>;

type Char4Tuple = Tuple<Char, 4>;

export function charBlockFromTuple(tuple: Char4Tuple): CharBlock {
	return [
		[tuple[0], tuple[2]],
		[tuple[1], tuple[3]],
	];
}

export function tupleFromBlockFrom2x2CharBlock(
	charBlock: CharBlock
): Char4Tuple {
	return [
		charBlock[0]![0]!,
		charBlock[1]![0]!,
		charBlock[0]![1]!,
		charBlock[1]![1]!,
	];
}
