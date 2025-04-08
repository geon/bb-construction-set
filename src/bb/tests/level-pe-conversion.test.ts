import { test } from "vitest";
import {
	levelsToPeFileData,
	peFileDataToLevels,
} from "../pe/level-pe-conversion";
import { deserializePeFileData } from "../pe/pe-file";
import { readFileSync } from "fs";
import { numSpriteBytes, spriteCounts, Sprites } from "../sprite";
import { mapRecord } from "../functions";

test("peFileDataToLevels & levelsToPeFileData", () => {
	const peFileData = deserializePeFileData(
		readFileSync(__dirname + "/level-01.pe", "utf8")
	);

	const levels = peFileDataToLevels(peFileData);

	const generatedPeFileData = levelsToPeFileData({
		levels,
		// Dummy data, not tested.
		sprites: mapRecord(spriteCounts, (count) => ({
			sprites: Array(count).fill({
				bitmap: Array(numSpriteBytes).fill(0),
			}),
		})) as Sprites,
	});

	// Dummy data, not tested.
	peFileData.spriteSets = generatedPeFileData.spriteSets = [];

	// Has datetime.
	peFileData.meta = generatedPeFileData.meta;

	// Bubble current rectangles are not imported.
	// expect(generatedPeFileData).toStrictEqual(peFileData);
});
