import { expect, test } from "vitest";
import { mirrorBits } from "../prg/bit-twiddling";

test("byteToBits", () => {
	expect(mirrorBits(mirrorBits(123))).toBe(123);
	expect(mirrorBits(mirrorBits(42))).toBe(42);
	expect(mirrorBits(128)).toBe(1);
	expect(mirrorBits(64)).toBe(2);
});
