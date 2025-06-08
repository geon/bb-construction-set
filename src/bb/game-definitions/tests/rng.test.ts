import { expect, suite, test } from "vitest";
import {
	adcZp,
	asl,
	cmp,
	createRng,
	createState,
	eorAbs,
	eorZp,
	getRandomItemIndices,
	ldaZp,
	rolZp,
	sbc,
	staZp,
} from "../rng";
import { range } from "../../functions";

test("ldaZp zero", () => {
	const state = createState();

	state.zp["26"] = 0;
	ldaZp(state, "26");
	expect(state.regs.A).toBe(0);
	expect(state.flags.carry).toBeFalsy();
	expect(state.flags.zero).toBeTruthy();
	expect(state.flags.negative).toBeFalsy();
});

test("ldaZp positive", () => {
	const state = createState();

	state.zp["26"] = 1;
	ldaZp(state, "26");
	expect(state.regs.A).toBe(1);
	expect(state.flags.carry).toBeFalsy();
	expect(state.flags.zero).toBeFalsy();
	expect(state.flags.negative).toBeFalsy();
});

test("ldaZp negative", () => {
	const state = createState();

	state.zp["26"] = 255;
	ldaZp(state, "26");
	expect(state.regs.A).toBe(255);
	expect(state.flags).toStrictEqual({
		carry: false,
		zero: false,
		negative: true,
	});
});

test("ldaZp e9f1, itter 2", () => {
	const state = createState();

	state.regs.A = 0xfe;
	state.flags.carry = true;
	state.zp["26"] = 0xfe;
	state.zp["27"] = 0x01;
	ldaZp(state, "27");
	expect(state.regs.A).toBe(0x01);
	expect({
		"26": state.zp["26"],
		"27": state.zp["27"],
	}).toStrictEqual({
		"26": 0xfe,
		"27": 0x01,
	});
});

test("staZp", () => {
	const state = createState();

	state.regs.A = 123;
	staZp(state, "26");
	expect(state.zp["26"]).toStrictEqual(123);
});

test("asl zero", () => {
	const state = createState();

	state.regs.A = 0;
	asl(state);
	expect(state.regs.A).toStrictEqual(0);
	expect(state.flags).toStrictEqual({
		carry: false,
		zero: true,
		negative: false,
	});
});

test("asl positive", () => {
	const state = createState();

	state.regs.A = 1;
	asl(state);
	expect(state.regs.A).toStrictEqual(2);
	expect(state.flags).toStrictEqual({
		carry: false,
		zero: false,
		negative: false,
	});
});

test("asl negative", () => {
	const state = createState();

	state.regs.A = 0x40;
	asl(state);
	expect(state.regs.A).toStrictEqual(0x80);
	expect(state.flags).toStrictEqual({
		carry: false,
		zero: false,
		negative: true,
	});
});

test("asl carry", () => {
	const state = createState();

	state.regs.A = 0x81;
	asl(state);
	expect(state.regs.A).toStrictEqual(0x02);
	expect(state.flags).toStrictEqual({
		carry: true,
		zero: false,
		negative: false,
	});
});

test("rol zero", () => {
	const state = createState();

	state.zp["26"] = 0;
	rolZp(state, "26");
	expect(state.zp["26"]).toStrictEqual(0);
	expect(state.flags).toStrictEqual({
		carry: false,
		zero: true,
		negative: false,
	});
});

test("rol in carry", () => {
	const state = createState();

	state.zp["26"] = 0;
	state.flags.carry = true;
	rolZp(state, "26");
	expect(state.zp["26"]).toStrictEqual(1);
	expect(state.flags).toStrictEqual({
		carry: false,
		zero: false,
		negative: false,
	});
});

test("rol positive", () => {
	const state = createState();

	state.zp["26"] = 1;
	rolZp(state, "26");
	expect(state.zp["26"]).toStrictEqual(2);
	expect(state.flags).toStrictEqual({
		carry: false,
		zero: false,
		negative: false,
	});
});

test("rol negative", () => {
	const state = createState();

	state.zp["26"] = 0x40;
	rolZp(state, "26");
	expect(state.zp["26"]).toStrictEqual(0x80);
	expect(state.flags).toStrictEqual({
		carry: false,
		zero: false,
		negative: true,
	});
});

test("rol carry", () => {
	const state = createState();

	state.zp["26"] = 0x81;
	rolZp(state, "26");
	expect(state.zp["26"]).toStrictEqual(0x02);
	expect(state.flags).toStrictEqual({
		carry: true,
		zero: false,
		negative: false,
	});
});

test("eor zero", () => {
	const state = createState();

	state.regs.A = 0b1111;
	state.zp["26"] = 0b1111;
	eorZp(state, "26");
	expect(state.regs.A).toStrictEqual(0b0000);
	expect(state.flags).toStrictEqual({
		carry: false,
		zero: true,
		negative: false,
	});
});

test("eor positive", () => {
	const state = createState();

	state.regs.A = 0b1100;
	state.zp["26"] = 0b1010;
	eorZp(state, "26");
	expect(state.regs.A).toStrictEqual(0b0110);
	expect(state.flags).toStrictEqual({
		carry: false,
		zero: false,
		negative: false,
	});
});

test("eor negative", () => {
	const state = createState();

	state.regs.A = 0;
	state.zp["26"] = 0x80;
	eorZp(state, "26");
	expect(state.regs.A).toStrictEqual(0x80);
	expect(state.flags).toStrictEqual({
		carry: false,
		zero: false,
		negative: true,
	});
});

test("adc zero", () => {
	const state = createState();

	state.regs.A = 0;
	state.zp["26"] = 0;
	adcZp(state, "26");
	expect(state.regs.A).toStrictEqual(0);
	expect(state.flags).toStrictEqual({
		carry: false,
		zero: true,
		negative: false,
	});
});

test("adc zero with carry", () => {
	const state = createState();

	state.regs.A = 0;
	state.zp["26"] = 0;
	state.flags.carry = true;
	adcZp(state, "26");
	expect(state.regs.A).toStrictEqual(1);
	expect(state.flags).toStrictEqual({
		carry: false,
		zero: false,
		negative: false,
	});
});

test("adc positive", () => {
	const state = createState();

	state.regs.A = 1;
	state.zp["26"] = 1;
	adcZp(state, "26");
	expect(state.regs.A).toStrictEqual(2);
	expect(state.flags).toStrictEqual({
		carry: false,
		zero: false,
		negative: false,
	});
});

test("adc negative", () => {
	const state = createState();

	state.regs.A = 0x7f;
	state.zp["26"] = 1;
	adcZp(state, "26");
	expect(state.regs.A).toStrictEqual(0x80);
	expect(state.flags).toStrictEqual({
		carry: false,
		zero: false,
		negative: true,
	});
});

test("adc carry", () => {
	const state = createState();

	state.regs.A = 0xff;
	state.zp["26"] = 2;
	adcZp(state, "26");
	expect(state.regs.A).toStrictEqual(0x01);
	expect(state.flags).toStrictEqual({
		carry: true,
		zero: false,
		negative: false,
	});
});

suite("sbc", () => {
	suite("no carry", () => {
		suite("result", () => {
			test("-1", () => {
				const state = createState();
				state.regs.A = 2;
				sbc(state, 3);
				expect(state.regs.A).toBe(0xff);
			});
			test("0", () => {
				const state = createState();
				state.regs.A = 2;
				sbc(state, 2);
				expect(state.regs.A).toBe(0);
			});
			test("+1", () => {
				const state = createState();
				state.regs.A = 2;
				sbc(state, 1);
				expect(state.regs.A).toBe(1);
			});
		});

		suite("flags", () => {
			// C	Carry Flag	Set if A >= M
			suite("carry", () => {
				test("-1", () => {
					const state = createState();
					state.regs.A = 2;
					sbc(state, 3);
					expect(state.flags.carry).toBeFalsy();
				});
				test("0", () => {
					const state = createState();
					state.regs.A = 2;
					sbc(state, 2);
					expect(state.flags.carry).toBeTruthy();
				});
				test("+1", () => {
					const state = createState();
					state.regs.A = 2;
					sbc(state, 1);
					expect(state.flags.carry).toBeTruthy();
				});
			});

			// Z	Zero Flag	Set if A = M
			suite("zero", () => {
				test("-1", () => {
					const state = createState();
					state.regs.A = 2;
					sbc(state, 3);
					expect(state.flags.zero).toBeFalsy();
				});
				test("0", () => {
					const state = createState();
					state.regs.A = 2;
					sbc(state, 2);
					expect(state.flags.zero).toBeTruthy();
				});
				test("+1", () => {
					const state = createState();
					state.regs.A = 2;
					sbc(state, 1);
					expect(state.flags.zero).toBeFalsy();
				});
			});

			// N	Negative Flag	Set if bit 7 of the result is set
			suite("negative", () => {
				test("-1", () => {
					const state = createState();
					state.regs.A = 2;
					sbc(state, 3);
					expect(state.flags.negative).toBeTruthy();
				});
				test("0", () => {
					const state = createState();
					state.regs.A = 2;
					sbc(state, 2);
					expect(state.flags.negative).toBeFalsy();
				});
				test("+1", () => {
					const state = createState();
					state.regs.A = 2;
					sbc(state, 1);
					expect(state.flags.negative).toBeFalsy();
				});
			});
		});
	});

	suite("carry", () => {
		suite("result", () => {
			test("-1", () => {
				const state = createState();
				state.regs.A = 2;
				state.flags.carry = true;
				sbc(state, 3 - 1);
				expect(state.regs.A).toBe(0xff);
			});
			test("0", () => {
				const state = createState();
				state.regs.A = 2;
				state.flags.carry = true;
				sbc(state, 2 - 1);
				expect(state.regs.A).toBe(0);
			});
			test("+1", () => {
				const state = createState();
				state.regs.A = 2;
				state.flags.carry = true;
				sbc(state, 1 - 1);
				expect(state.regs.A).toBe(1);
			});
		});

		suite("flags", () => {
			// C	Carry Flag	Set if A >= M
			suite("carry", () => {
				test("-1", () => {
					const state = createState();
					state.regs.A = 2;
					state.flags.carry = true;
					sbc(state, 3 - 1);
					expect(state.flags.carry).toBeFalsy();
				});
				test("0", () => {
					const state = createState();
					state.regs.A = 2;
					state.flags.carry = true;
					sbc(state, 2 - 1);
					expect(state.flags.carry).toBeTruthy();
				});
				test("+1", () => {
					const state = createState();
					state.regs.A = 2;
					state.flags.carry = true;
					sbc(state, 1 - 1);
					expect(state.flags.carry).toBeTruthy();
				});
			});

			// Z	Zero Flag	Set if A = M
			suite("zero", () => {
				test("-1", () => {
					const state = createState();
					state.regs.A = 2;
					state.flags.carry = true;
					sbc(state, 3 - 1);
					expect(state.flags.zero).toBeFalsy();
				});
				test("0", () => {
					const state = createState();
					state.regs.A = 2;
					state.flags.carry = true;
					sbc(state, 2 - 1);
					expect(state.flags.zero).toBeTruthy();
				});
				test("+1", () => {
					const state = createState();
					state.regs.A = 2;
					state.flags.carry = true;
					sbc(state, 1 - 1);
					expect(state.flags.zero).toBeFalsy();
				});
			});

			// N	Negative Flag	Set if bit 7 of the result is set
			suite("negative", () => {
				test("-1", () => {
					const state = createState();
					state.regs.A = 2;
					state.flags.carry = true;
					sbc(state, 3 - 1);
					expect(state.flags.negative).toBeTruthy();
				});
				test("0", () => {
					const state = createState();
					state.regs.A = 2;
					state.flags.carry = true;
					sbc(state, 2 - 1);
					expect(state.flags.negative).toBeFalsy();
				});
				test("+1", () => {
					const state = createState();
					state.regs.A = 2;
					state.flags.carry = true;
					sbc(state, 1 - 1);
					expect(state.flags.negative).toBeFalsy();
				});
			});
		});
	});
});

suite("cmp", () => {
	suite("no carry", () => {
		suite("flags", () => {
			// C	Carry Flag	Set if A >= M
			suite("carry", () => {
				test("-1", () => {
					const state = createState();
					state.regs.A = 2;
					cmp(state, 3);
					expect(state.flags.carry).toBeFalsy();
				});
				test("0", () => {
					const state = createState();
					state.regs.A = 2;
					cmp(state, 2);
					expect(state.flags.carry).toBeTruthy();
				});
				test("+1", () => {
					const state = createState();
					state.regs.A = 2;
					cmp(state, 1);
					expect(state.flags.carry).toBeTruthy();
				});
			});

			// Z	Zero Flag	Set if A = M
			suite("zero", () => {
				test("-1", () => {
					const state = createState();
					state.regs.A = 2;
					cmp(state, 3);
					expect(state.flags.zero).toBeFalsy();
				});
				test("0", () => {
					const state = createState();
					state.regs.A = 2;
					cmp(state, 2);
					expect(state.flags.zero).toBeTruthy();
				});
				test("+1", () => {
					const state = createState();
					state.regs.A = 2;
					cmp(state, 1);
					expect(state.flags.zero).toBeFalsy();
				});
			});

			// N	Negative Flag	Set if bit 7 of the result is set
			suite("negative", () => {
				test("-1", () => {
					const state = createState();
					state.regs.A = 2;
					cmp(state, 3);
					expect(state.flags.negative).toBeTruthy();
				});
				test("0", () => {
					const state = createState();
					state.regs.A = 2;
					cmp(state, 2);
					expect(state.flags.negative).toBeFalsy();
				});
				test("+1", () => {
					const state = createState();
					state.regs.A = 2;
					cmp(state, 1);
					expect(state.flags.negative).toBeFalsy();
				});
			});
		});
	});

	suite("carry", () => {
		suite("flags", () => {
			// C	Carry Flag	Set if A >= M
			suite("carry", () => {
				test("-1", () => {
					const state = createState();
					state.regs.A = 2;
					state.flags.carry = true;
					cmp(state, 3 - 1);
					expect(state.flags.carry).toBeFalsy();
				});
				test("0", () => {
					const state = createState();
					state.regs.A = 2;
					state.flags.carry = true;
					cmp(state, 2 - 1);
					expect(state.flags.carry).toBeTruthy();
				});
				test("+1", () => {
					const state = createState();
					state.regs.A = 2;
					state.flags.carry = true;
					cmp(state, 1 - 1);
					expect(state.flags.carry).toBeTruthy();
				});
			});

			// Z	Zero Flag	Set if A = M
			suite("zero", () => {
				test("-1", () => {
					const state = createState();
					state.regs.A = 2;
					state.flags.carry = true;
					cmp(state, 3 - 1);
					expect(state.flags.zero).toBeFalsy();
				});
				test("0", () => {
					const state = createState();
					state.regs.A = 2;
					state.flags.carry = true;
					cmp(state, 2 - 1);
					expect(state.flags.zero).toBeTruthy();
				});
				test("+1", () => {
					const state = createState();
					state.regs.A = 2;
					state.flags.carry = true;
					cmp(state, 1 - 1);
					expect(state.flags.zero).toBeFalsy();
				});
			});

			// N	Negative Flag	Set if bit 7 of the result is set
			suite("negative", () => {
				test("-1", () => {
					const state = createState();
					state.regs.A = 2;
					state.flags.carry = true;
					cmp(state, 3 - 1);
					expect(state.flags.negative).toBeTruthy();
				});
				test("0", () => {
					const state = createState();
					state.regs.A = 2;
					state.flags.carry = true;
					cmp(state, 2 - 1);
					expect(state.flags.negative).toBeFalsy();
				});
				test("+1", () => {
					const state = createState();
					state.regs.A = 2;
					state.flags.carry = true;
					cmp(state, 1 - 1);
					expect(state.flags.negative).toBeFalsy();
				});
			});
		});
	});
});

test("eorAbs zero", () => {
	const state = createState();

	state.regs.A = 0b1111;
	eorAbs(state, 0b1111);
	expect(state.regs.A).toStrictEqual(0b0000);
	expect(state.flags).toStrictEqual({
		carry: false,
		zero: true,
		negative: false,
	});
});

test("eorAbs positive", () => {
	const state = createState();

	state.regs.A = 0b1100;
	eorAbs(state, 0b1010);
	expect(state.regs.A).toStrictEqual(0b0110);
	expect(state.flags).toStrictEqual({
		carry: false,
		zero: false,
		negative: false,
	});
});

test("eorAbs negative", () => {
	const state = createState();

	state.regs.A = 0;
	eorAbs(state, 0x80);
	expect(state.regs.A).toStrictEqual(0x80);
	expect(state.flags).toStrictEqual({
		carry: false,
		zero: false,
		negative: true,
	});
});

test("createRng", () => {
	const rngSequenceFromDebugger = [
		0xff, 0xfe, 0xfc, 0xf8, 0xf0, 0xe0, 0xc0, 0x80, 0x00, 0x02, 0x0a, 0x1a,
		0x4a, 0xaa, 0xa9, 0xab,
	];

	const state = createState();
	state.regs.A = 3;
	const rng = createRng(state);
	const rands = range(rngSequenceFromDebugger.length).map(rng);

	expect(rands).toStrictEqual(rngSequenceFromDebugger);
});

test("getRandomItemIndices", () => {
	const firstLevelRandomItemIndicesWithStartStates = [
		{
			zp: { "26": 0xb1, "27": 0x06 },
			items: { points: 0x0e, powerups: 0x00 },
		},
		{
			zp: { "26": 0x38, "27": 0xcc },
			items: { points: 0x2d, powerups: 0x00 },
		},
		{
			zp: { "26": 0x45, "27": 0xda },
			items: { points: 0x1a, powerups: 0x00 },
		},
		{
			zp: { "26": 0x93, "27": 0xd0 },
			items: { points: 0x24, powerups: 0x0c },
		},
		{
			zp: { "26": 0x95, "27": 0x10 },
			items: { points: 0x1f, powerups: 0x00 },
		},
		{
			zp: { "26": 0x53, "27": 0xb4 },
			items: { points: 0x15, powerups: 0x06 },
		},
	];

	const rands = firstLevelRandomItemIndicesWithStartStates.map((x) => {
		const state = createState();
		state.zp = { ...state.zp, ...x.zp };
		return getRandomItemIndices(state, 0);
	});

	expect(rands).toStrictEqual(
		firstLevelRandomItemIndicesWithStartStates.map((x) => x.items)
	);
});
