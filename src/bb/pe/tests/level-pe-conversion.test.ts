import { test } from "vitest";
import { levelsToPeFileData, peFileDataToLevels } from "../level-pe-conversion";
import { deserializePeFileData } from "../pe-file";
import { readFileSync } from "fs";
import { Sprites } from "../level-pe-conversion";
import { spriteHeight, spriteWidthBytes } from "../../../c64/consts";
import { objectFromEntries } from "../../functions";
import { characterNames } from "../../game-definitions/character-name";

test("peFileDataToLevels & levelsToPeFileData", () => {
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
					sprites: Array(100).fill(Array(numSpriteBytes).fill(0)),
					color: 0,
				},
			])
		) as Sprites,
	});

	// Dummy data, not tested.
	peFileData.spriteSets = generatedPeFileData.spriteSets = [];

	// Has datetime.
	peFileData.meta = generatedPeFileData.meta;

	// Bubble current rectangles are not imported.
	// expect(generatedPeFileData).toStrictEqual(peFileData);
});
export const numSpriteBytes = spriteWidthBytes * spriteHeight;
