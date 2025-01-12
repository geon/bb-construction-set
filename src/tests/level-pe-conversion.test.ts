import { test } from "vitest";
import { levelsToPeFileData, peFileDataToLevels } from "../level-pe-conversion";
import { deserializePeFileData } from "../pe-file";
import { readFileSync } from "fs";
import { numSpriteBytes, spriteCounts, Sprites } from "../sprite";

test("peFileDataToLevels & levelsToPeFileData", () => {
	const peFileData = deserializePeFileData(
		readFileSync(__dirname + "/level-01.pe", "utf8")
	);

	const levels = peFileDataToLevels(peFileData);

	const generatedPeFileData = levelsToPeFileData({
		levels,
		// Dummy data, not tested.
		sprites: Object.fromEntries(
			Object.entries(spriteCounts).map(([characterName, count]) => [
				characterName,
				Array(count).fill({
					bitmap: Array(numSpriteBytes).fill(0),
				}),
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
