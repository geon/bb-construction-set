import { range } from "../functions";
import { CharName } from "../game-definitions/char-name";
import { levelSize } from "../game-definitions/level-size";
import { ShadowChars } from "../prg/shadow-chars";
import { Tuple, assertTuple } from "../tuple";
import { Char } from "./char";
import { Level } from "./level";
import { getTiles } from "./tiles";

export function levelToCharNames(
	level: Level
): Tuple<Tuple<CharName, typeof levelSize.x>, typeof levelSize.y> {
	// Create canvas.
	const chars: CharName[][] = range(levelSize.y).map(() =>
		range(levelSize.x).map(() => "empty")
	);

	// Draw the platforms.
	for (const [tileY, row] of getTiles(level).entries()) {
		for (const [tileX, tile] of row.entries()) {
			chars[tileY]![tileX]! = tile ? "platform" : "empty";
		}
	}

	// Draw the shadows.
	for (const [indexY, row] of chars.entries()) {
		for (const [indexX, char] of row.entries()) {
			if (char === "platform") {
				continue;
			}

			if (indexX > 0 && chars[indexY]![indexX - 1]! === "platform") {
				if (indexY > 0 && chars[indexY - 1]![indexX]! === "platform") {
					chars[indexY]![indexX]! = "shadowInnerCorner";
					continue;
				}
				if (
					indexX > 0 &&
					indexY > 0 &&
					chars[indexY - 1]![indexX - 1]! === "platform"
				) {
					chars[indexY]![indexX]! = "shadowRight";
					continue;
				}
				chars[indexY]![indexX]! = "shadowEndRight";
				continue;
			}

			if (indexY > 0 && chars[indexY - 1]![indexX]! === "platform") {
				if (
					indexX > 0 &&
					indexY > 0 &&
					chars[indexY - 1]![indexX - 1]! === "platform"
				) {
					chars[indexY]![indexX]! = "shadowUnder";
					continue;
				}

				chars[indexY]![indexX]! = "shadowEndUnder";
				continue;
			}

			if (
				indexX > 0 &&
				indexY > 0 &&
				chars[indexY - 1]![indexX - 1]! === "platform"
			) {
				chars[indexY]![indexX]! = "shadowOuterCorner";
				continue;
			}
		}
	}

	// Draw the 2x2 char sidebar tiles.
	for (let indexY = 0; indexY < levelSize.y; ++indexY) {
		const left = indexY % 2 ? "sideBorderBottomLeft" : "sideBorderTopLeft";
		const right = indexY % 2 ? "sideBorderBottomRight" : "sideBorderTopRight";

		chars[indexY]![0]! = left;
		chars[indexY]![1]! = right;
		chars[indexY]![levelSize.x - 2]! = left;
		chars[indexY]![levelSize.x - 1]! = right;
	}

	return assertTuple(
		chars.map((x) => assertTuple(x, levelSize.x)),
		levelSize.y
	);
}

export function makeCharset(
	level: Level,
	shadowChars: ShadowChars
): Readonly<Record<CharName, Char>> {
	const emptyChar: Char = [
		[0, 0, 0, 0],
		[0, 0, 0, 0],
		[0, 0, 0, 0],
		[0, 0, 0, 0],
		[0, 0, 0, 0],
		[0, 0, 0, 0],
		[0, 0, 0, 0],
		[0, 0, 0, 0],
	];

	return {
		empty: emptyChar,
		platform: level.platformChar,
		sideBorderTopLeft: level.sidebarChars?.[0]![0] ?? level.platformChar,
		sideBorderTopRight: level.sidebarChars?.[1]![0] ?? level.platformChar,
		sideBorderBottomLeft: level.sidebarChars?.[0]![1] ?? level.platformChar,
		sideBorderBottomRight: level.sidebarChars?.[1]![1] ?? level.platformChar,
		shadowEndUnder: shadowChars[0],
		shadowOuterCorner: shadowChars[1],
		shadowEndRight: shadowChars[2],
		shadowUnder: shadowChars[3],
		shadowRight: shadowChars[4],
		shadowInnerCorner: shadowChars[5],
	};
}
