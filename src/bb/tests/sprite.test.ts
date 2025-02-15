import { expect, test } from "vitest";
import { readSprites } from "../prg/sprites";
import { getPrgByteAtAddress, getPrgStartAddress } from "../prg/io";
import { readFileSync } from "fs";

test("readSprites snapshot", () => {
	const prg = readFileSync(__dirname + "/decompressed-bb.prg").buffer;
	const startAddres = getPrgStartAddress(prg);
	const getByte = (address: number) =>
		getPrgByteAtAddress(new Uint8Array(prg), startAddres, address);

	const sprites = readSprites(getByte);

	expect(sprites).toMatchSnapshot();
});
