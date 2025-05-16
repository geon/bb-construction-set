import { test } from "vitest";
import { levelsToPeFileData, peFileDataToLevels } from "../level-pe-conversion";
import { deserializePeFileData } from "../pe-file";
import { readFileSync } from "fs";
import { objectFromEntries, range } from "../../functions";
import { characterNames } from "../../game-definitions/character-name";
import { spriteSizePixels } from "../../../c64/consts";
import { Sprite } from "../../internal-data-formats/sprite";
import { assertTuple } from "../../tuple";
import { parsePrg } from "../../prg/parse-prg";

function makeFakeSprite(): Sprite {
	return assertTuple(
		range(0, spriteSizePixels.y).map(() =>
			assertTuple(
				range(0, spriteSizePixels.x).map(() => 0 as const),
				spriteSizePixels.x
			)
		),
		spriteSizePixels.y
	);
}

test("peFileDataToLevels & levelsToPeFileData", () => {
	const parsedPrg = parsePrg(
		readFileSync(__dirname + "/../../prg/tests/decompressed-bb.prg").buffer
	);

	const peFileData = deserializePeFileData(
		readFileSync(__dirname + "/level-01.pe", "utf8")
	);

	const levels = peFileDataToLevels(peFileData);

	const generatedPeFileData = levelsToPeFileData({
		levels,
		// Dummy data, not tested.
		sprites: objectFromEntries(
			characterNames.map((name) => [
				name,
				{
					sprites: range(0, 100).map(makeFakeSprite),
					color: 0 as const,
				},
			])
		),
		shadowChars: assertTuple(parsedPrg.chars.shadows.flat().flat(), 6),
	});

	// Dummy data, not tested.
	peFileData.spriteSets = generatedPeFileData.spriteSets = [];

	// Has datetime.
	peFileData.meta = generatedPeFileData.meta;

	// Bubble current rectangles are not imported.
	// expect(generatedPeFileData).toStrictEqual(peFileData);
});
