import { byteToHex } from "../functions";

// Mutable state. Watch out.
type State = {
	regs: {
		A: number;
	};
	zp: {
		"26": number;
		"27": number;
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
