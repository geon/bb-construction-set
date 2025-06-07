import {
	byteToHex,
	chunk,
	groupBy,
	isDefined,
	mapRecord,
} from "../bb/functions";
import { createRng, createState } from "../bb/game-definitions/rng";

export function range(length: number, from: number = 0): ReadonlyArray<number> {
	return Array(length)
		.fill(undefined)
		.map((_, index) => index + from);
}

const state = createState();
const rng = createRng(state);

const rands = [];
for (const _ of range(0xffff)) {
	rands.push(rng());
}

let cycleLength: number | undefined;
const initialZp = { ...state.zp };
for (const index of range(0xffff)) {
	rng();
	if (
		state.zp["26"] === initialZp["26"] &&
		state.zp["27"] === initialZp["27"]
	) {
		cycleLength = index + 1;
		break;
	}
}

const distribution = mapRecord(groupBy(rands, byteToHex), (x) => x?.length);

const allHex = range(0x100).map(byteToHex);

console.log(
	"distribution",
	allHex.map(
		(hex) =>
			hex +
			" " +
			range(Math.round((distribution[hex] ?? 0) / 8))
				.map(() => "*")
				.join()
	)
);
console.log(
	"distribution min/max",
	Math.min(...Object.values(distribution).filter(isDefined)),
	Math.max(...Object.values(distribution).filter(isDefined))
);
const allHexSet = new Set(allHex);
if (allHexSet.size !== 0x100) {
	console.log(chunk(allHex.sort(), 16).map((chunk) => chunk.join(" ")));
	console.log(allHexSet.size);
	throw new Error("Hex generation broken.");
}
console.log(
	"missing",
	Object.keys(distribution).filter((x) => !allHexSet.has(x))
);
console.log(
	"cycle length",
	cycleLength,
	cycleLength && Math.round((cycleLength / 0xffff) * 100) + " %"
);
console.log("missing", cycleLength && 0xffff - cycleLength);
console.log("last state", state);
