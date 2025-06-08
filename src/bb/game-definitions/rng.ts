import { byteToHex, range } from "../functions";

// Mutable state. Watch out.
type State = {
	regs: {
		A: number;
		X: number;
		Y: number;
	};
	zp: {
		"04": number;
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
			X: 0,
			Y: 0,
		},
		zp: {
			"04": 0,
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

function load(state: State, reg: keyof State["regs"], value: number) {
	state.regs[reg] = value;
	state.flags.zero = state.regs[reg] === 0;
	state.flags.negative = !!(state.regs[reg] & 0x80);
}

export function lda(state: State, value: number): void {
	load(state, "A", value);
}

export function ldaZp(state: State, address: keyof State["zp"]): void {
	load(state, "A", state.zp[address]);
}

export function ldxZp(state: State, address: keyof State["zp"]): void {
	load(state, "X", state.zp[address]);
}

export function ldyZp(state: State, address: keyof State["zp"]): void {
	load(state, "Y", state.zp[address]);
}

export function staZp(state: State, address: keyof State["zp"]): void {
	state.zp[address] = state.regs.A;
}
export function stxZp(state: State, address: keyof State["zp"]): void {
	state.zp[address] = state.regs.X;
}
export function styZp(state: State, address: keyof State["zp"]): void {
	state.zp[address] = state.regs.Y;
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

export function adc(state: State, value: number): void {
	state.regs.A += value + (state.flags.carry ? 1 : 0);
	state.flags.zero = state.regs.A === 0;
	state.flags.carry = !!(state.regs.A & 0x100);
	state.regs.A &= 0xff;
	state.flags.negative = !!(state.regs.A & 0x80);
}

export function sbc(state: State, value: number): void {
	state.regs.A += (~value & 0xff) + (!state.flags.carry ? 1 : 0);
	state.flags.carry = !!(state.regs.A & 0x100);
	state.regs.A &= 0xff;
	state.flags.zero = state.regs.A == 0;
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

export function ora(state: State, value: number): void {
	state.regs.A |= value;
	state.flags.zero = state.regs.A === 0;
	state.flags.negative = !!(state.regs.A & 0x80);
}

export function cmp(state: State, value: number): void {
	let result = state.regs.A + (~value & 0xff) + (!state.flags.carry ? 1 : 0);
	state.flags.carry = !!(result & 0x100);
	result &= 0xff;
	state.flags.zero = result == 0;
	state.flags.negative = !!(result & 0x80);
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

// 2bfc ldx 26
// 2bfe ldy 27
// 2c00 lda 10
// 2c02 sta 26
// 2c04 sta 27
// 2c06 jsr e9ea
// 2c09 clc
// 2c0a adc #01
// 2c0c and #1f
// 2c0e stx 26
// 2c10 sty 27
// 2c12 sta 04

// 2c14 jsr e9ea
// 2c17 and #0f
// 2c19 bne 2c24
// 2c1b jsr e9ea
// 2c1e and #01
// 2c20 ora #1e
// 2c22 bne 2c32
// 2c24 cmp #07
// 2c26 bcc 2c2d
// 2c28 lda 04
// 2c2a jmp 2c32
// 2c2d jsr e9ea
// 2c30 and #1f
// 2c32 tax

function _2bfc(state: State, levelIndex: number): void {
	const rows = [];

	// 2bfc ldx 26
	rows.push(getStateRow(state, "2bfc"));
	ldxZp(state, "26");

	// 2bfe ldy 27
	rows.push(getStateRow(state, "2bfe"));
	ldyZp(state, "27");

	// 2c00 lda 10
	rows.push(getStateRow(state, "2c00"));
	// zp10 is the level index.
	lda(state, levelIndex);

	// 2c02 sta 26
	rows.push(getStateRow(state, "2c02"));
	staZp(state, "26");

	// 2c04 sta 27
	rows.push(getStateRow(state, "2c04"));
	staZp(state, "27");

	// 2c06 jsr e9ea
	rows.push(getStateRow(state, "2c06"));
	_e9ea(state);

	// 2c09 clc
	rows.push(getStateRow(state, "2c09"));
	state.flags.carry = false;

	// 2c0a adc #01
	rows.push(getStateRow(state, "2c0a"));
	adc(state, 0x01);

	// 2c0c and #1f
	rows.push(getStateRow(state, "2c0c"));
	and(state, 0x1f);

	// 2c0e stx 26
	rows.push(getStateRow(state, "2c0e"));
	stxZp(state, "26");

	// 2c10 sty 27
	rows.push(getStateRow(state, "2c10"));
	styZp(state, "27");

	// 2c12 sta 04
	rows.push(getStateRow(state, "2c12"));
	staZp(state, "04");

	// 2c14 jsr e9ea
	rows.push(getStateRow(state, "2c14"));
	_e9ea(state);

	// 2c17 and #0f
	rows.push(getStateRow(state, "2c17"));
	and(state, 0x0f);

	// 2c19 bne 2c24
	rows.push(getStateRow(state, "2c19"));
	if (state.flags.zero) {
		// 2c1b jsr e9ea
		rows.push(getStateRow(state, "2c1b"));
		_e9ea(state);

		// 2c1e and #01
		rows.push(getStateRow(state, "2c1e"));
		and(state, 0x01);

		// 2c20 ora #1e
		rows.push(getStateRow(state, "2c20"));
		ora(state, 0x1e);

		// 2c22 bne 2c32
		rows.push(getStateRow(state, "2c22"));
		if (!state.flags.zero) {
			// console.table(rows);
			return;
		}
	}

	// 2c24 cmp #07
	rows.push(getStateRow(state, "2c24"));
	cmp(state, 0x07);

	// 2c26 bcc 2c2d
	rows.push(getStateRow(state, "2c26"));
	if (state.flags.carry) {
		// 2c28 lda 04
		ldaZp(state, "04");

		// 2c2a jmp 2c32
		rows.push(getStateRow(state, "2c2a"));
		// console.table(rows);

		return;
	}

	// 2c2d jsr e9ea
	rows.push(getStateRow(state, "2c2d"));
	// console.table(rows);
	_e9ea(state);

	// 2c30 and #1f
	// There are 32 normal powerup items + 3 special. 0x1f == dec31
	and(state, 0x1f);

	// 2c32 tax
}

export function getRandomItemIndices(
	state: State,
	levelIndex: number
): {
	readonly points: number;
	readonly powerups: number;
} {
	console.table([getStateRow(state, "")]);

	_093f(state);

	// Called inbetween from unrelated code.
	_e9ea(state);
	_e9ea(state);
	_e9ea(state);

	_2bb0(state);
	const points = state.regs.A;

	_2bfc(state, levelIndex);
	const powerups = state.regs.A;

	return { points, powerups };
}
