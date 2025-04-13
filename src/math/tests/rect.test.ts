import { expect, test } from "vitest";
import { bottomRight } from "../rect";

test("bottomRight", () => {
	expect(
		bottomRight({
			pos: { x: 123, y: 456 },
			size: { x: 10, y: 1 },
		})
	).toMatchSnapshot();
});
