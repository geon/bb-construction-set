import { expect, test } from "vitest";
import { PaletteImage } from "../palette-image";
import {
	decodeBmp,
	encodeBmp,
	parseInfoHeader,
	serializeInfoHeader,
} from "../bmp";

const image: PaletteImage = [[0, 1, 2, 3, 4]];

test("parseInfoHeader/serializeInfoHeader", () => {
	const header = {
		width: 640,
		height: 350,
	};

	const serialized = serializeInfoHeader(header);
	const parsed = parseInfoHeader(serialized);

	expect({
		width: parsed.width,
		height: parsed.height,
	}).toStrictEqual(header);
});

test("encodeBmp/decodeBmp", () => {
	const encoded = encodeBmp(image);
	const decoded = decodeBmp(encoded);
	expect(decoded).toStrictEqual(image);
});
