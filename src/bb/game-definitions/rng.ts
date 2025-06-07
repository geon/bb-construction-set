import { byteToHex, range } from "../functions";

// Mutable state. Watch out.
type State = {
	regs: {
		A: number;
	};
	zp: {
		"26": number;
		"27": number;
		"58": number;
	};
	flags: {
		carry: boolean;
		zero: boolean;
		negative: boolean;
	};
};

export function createState(): State {
	return {
		regs: {
			A: 0,
		},
		zp: {
			"26": 0,
			"27": 0,
			"58": 0,
		},
		flags: {
			carry: false,
			zero: false,
			negative: false,
		},
	};
}

export function ldaZp(state: State, address: keyof State["zp"]): void {
	state.regs.A = state.zp[address];
	state.flags.zero = state.regs.A === 0;
	state.flags.negative = !!(state.regs.A & 0x80);
}

export function staZp(state: State, address: keyof State["zp"]): void {
	state.zp[address] = state.regs.A;
}

export function asl(state: State): void {
	state.regs.A <<= 1;
	state.flags.carry = !!(state.regs.A & 0x100);
	state.regs.A &= 0xff;
	state.flags.zero = state.regs.A === 0;
	state.flags.negative = !!(state.regs.A & 0x80);
}

export function rolZp(state: State, address: keyof State["zp"]): void {
	state.zp[address] <<= 1;
	state.zp[address] |= state.flags.carry ? 1 : 0;
	state.flags.carry = !!(state.zp[address] & 0x100);
	state.zp[address] &= 0xff;
	state.flags.zero = state.zp[address] === 0;
	state.flags.negative = !!(state.zp[address] & 0x80);
}

export function eorZp(state: State, address: keyof State["zp"]): void {
	state.regs.A ^= state.zp[address];
	state.flags.zero = state.regs.A === 0;
	state.flags.negative = !!(state.regs.A & 0x80);
}

export function adcZp(state: State, address: keyof State["zp"]): void {
	state.regs.A += state.zp[address] + (state.flags.carry ? 1 : 0);
	state.flags.zero = state.regs.A === 0;
	state.flags.carry = !!(state.regs.A & 0x100);
	state.regs.A &= 0xff;
	state.flags.negative = !!(state.regs.A & 0x80);
}

export function eorAbs(state: State, value: number): void {
	state.regs.A ^= value;
	state.flags.zero = state.regs.A === 0;
	state.flags.negative = !!(state.regs.A & 0x80);
}

export function and(state: State, value: number): void {
	state.regs.A &= value;
	state.flags.zero = state.regs.A === 0;
	state.flags.negative = !!(state.regs.A & 0x80);
}

export function adc(state: State, value: number): void {
	state.regs.A += value + (state.flags.carry ? 1 : 0);
	state.flags.zero = state.regs.A === 0;
	state.flags.carry = !!(state.regs.A & 0x100);
	state.regs.A &= 0xff;
	state.flags.negative = !!(state.regs.A & 0x80);
}

// e9ea lda 26
// e9ec asl
// e9ed rol 27
// e9ef rol 26
// e9f1 lda 27
// e9f3 eor 26
// e9f5 adc 27
// e9f7 eor dc06
// e9fa sta 26
// e9fc rts
function _e9ea(state: State) {
	const rows = [];

	// e9ea lda 26
	rows.push(getStateRow(state, "e9ea"));
	ldaZp(state, "26");

	// e9ec asl
	rows.push(getStateRow(state, "e9ec"));
	asl(state);

	// e9ed rol 27
	rows.push(getStateRow(state, "e9ed"));
	rolZp(state, "27");

	// e9ef rol 26
	rows.push(getStateRow(state, "e9ef"));
	rolZp(state, "26");

	// e9f1 lda 27
	rows.push(getStateRow(state, "e9f1"));
	ldaZp(state, "27");

	// e9f3 eor 26
	rows.push(getStateRow(state, "e9f3"));
	eorZp(state, "26");

	// e9f5 adc 27
	rows.push(getStateRow(state, "e9f5"));
	adcZp(state, "27");

	// e9f7 eor dc06
	rows.push(getStateRow(state, "e9f7"));
	const dc06 = 0xff;
	eorAbs(state, dc06);

	// e9fa sta 26
	rows.push(getStateRow(state, "e9fa"));
	staZp(state, "26");

	// e9fc rts
	rows.push(getStateRow(state, "e9fc"));

	// console.log("function _e9ea");
	// console.table(rows, ["pc", "A", "C", "zp26", "zp27"]);
}

function getStateRow(state: State, pc: string) {
	return {
		pc,
		A: byteToHex(state.regs.A),
		C: state.flags.carry ? 1 : 0,
		zp26: byteToHex(state.zp["26"]),
		zp27: byteToHex(state.zp["27"]),
	};
}

export function createRng(state: State): () => number {
	return () => {
		_e9ea(state);
		return state.regs.A;
	};
}

// 093f jsr e9ea
// 0942 and #1e
// 0944 adc #0a
// 0946 sta 58
function _093f(state: State) {
	// 093f jsr e9ea
	_e9ea(state);

	// 0942 and #1e
	// 0x1e == 0b00011110
	// This would have been 0x1f to keep 5 bits randomness, but the carry-bit
	// is pre-cleared, so it doesn't have to be cleared before adding at 0944.
	and(state, 0x1e);

	// 0944 adc #0a
	// The carry bit is randomly set in jsr e9ea
	adc(state, 0x0a);

	// 0946 sta 58
	staZp(state, "58");
}

// 2bb0 jsr e9ea
// 2bb3 and #03
// 2bb5 adc 58
// 2bb7 cmp #2f
// 2bb9 bcc 2bbd
// 2bbb lda #2e
// 2bbd tax
function _2bb0(state: State) {
	// 2bb0 jsr e9ea
	_e9ea(state);

	// 2bb0 and #03
	and(state, 0x03);

	// 2bb5 adc 58
	adcZp(state, "58");

	// 2bb7 cmp #2f
	// 2bb9 bcc 2bbd
	// 2bbb lda #2e
	// There are 47 points items. 0x2e == dec46.
	state.regs.A = Math.min(state.regs.A, 0x2e);

	// 2bbd tax

	// 2bc7 lda #$00
	// 2bc9 sta $05
	// 2bcb sta $58
	// state.zp["58"] = 0;
}

// 2c2d jsr e9ea
// 2c30 and #1f
// 2c32 tax
function _2c2d(state: State) {
	// 2c2d jsr e9ea
	_e9ea(state);

	// 2c30 and #1f
	// There are 32 normal powerup items + 3 special. 0x1f == dec31
	and(state, 0x1f);

	// 2c32 tax
}

export function initializeRandomSeedForFirstLevel(
	state: State,
	waitFrames: number
) {
	const rng = createRng(state);

	// The rng is updated once per frame.
	for (const _ of range(waitFrames)) {
		do {
			rng();
			// 08b6 cmp #$19 // dec25
			// 08b8 bcs 08b3 // loop until A <= 24
		} while (state.regs.A >= 0x19);
	}
}

export function getRandomItemIndices(state: State): {
	readonly points: number;
	readonly powerups: number;
} {
	_093f(state);

	// Called inbetween from unrelated code.
	_e9ea(state);
	_e9ea(state);
	_e9ea(state);

	_2bb0(state);
	const points = state.regs.A;

	// Called inbetween from unrelated code.
	_e9ea(state);
	_e9ea(state);

	_2c2d(state);
	const powerups = state.regs.A;

	return { points, powerups };
}

const randomItemIndicesWithStartStates = [
	{
		"26": 0xb1,
		"27": 0x06,
		points: 0x0e,
		powerup: 0x00,
	},
	{
		"26": 0x38,
		"27": 0xcc,
		points: 0x2d,
		powerup: 0x00,
	},
	{
		"26": 0x45,
		"27": 0xda,
		points: 0x1a,
		powerup: 0x00,
	},
	{
		"26": 0x93,
		"27": 0xd0,
		points: 0x24,
		powerup: 0x0c,
	},
	{
		"26": 0x95,
		"27": 0x10,
		points: 0x1f,
		powerup: 0x00,
	},
];
randomItemIndicesWithStartStates;
