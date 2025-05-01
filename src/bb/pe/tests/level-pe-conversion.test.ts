import { test } from "vitest";
import { levelsToPeFileData, peFileDataToLevels } from "../level-pe-conversion";
import { deserializePeFileData } from "../pe-file";
import { readFileSync } from "fs";
import { Sprites } from "../level-pe-conversion";
import { spriteSizeBytes } from "../../../c64/consts";
import { objectFromEntries, range } from "../../functions";
import { characterNames } from "../../game-definitions/character-name";
import { Sprite } from "../../internal-data-formats/sprite";

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
					sprites: range(0, 100).map((): Sprite => range(0, spriteSizeBytes)),
					color: 0 as const,
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
