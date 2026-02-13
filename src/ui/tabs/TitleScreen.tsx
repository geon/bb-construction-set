import { ReactNode } from "react";
import {
	attempt,
	checkedAccess,
	padRight,
	range,
	repeat,
	uniqueBy,
} from "../../bb/functions";
import { FileInput } from "../FileInput";
import {
	imageDataFromImage,
	imageFromFile,
	paletteImageFromImageData,
} from "../../bb/image-data/image-data";
import {
	halfImageWidth,
	PaletteImage,
	parseLayout,
} from "../../bb/palette-image/palette-image";
import { Patch, patchFromSegment } from "../../bb/prg/io";
import { Coord2, origo } from "../../math/coord2";
import { grid } from "../../math/rect";
import { parseChar } from "../../bb/palette-image/char";
import { palette, PaletteIndex } from "../../bb/internal-data-formats/palette";
import {
	isEqualChar,
	serializeChar,
} from "../../bb/internal-data-formats/char";
import { emptyChar } from "../../bb/internal-data-formats/char-name";
import { ReadonlyUint8Array } from "../../bb/types";
import { BgColors } from "../../bb/internal-data-formats/bg-colors";

export function TitleScreen(props: {
	readonly setManualPatch: React.Dispatch<React.SetStateAction<Patch>>;
}): ReactNode {
	return (
		<FileInput
			accept={["bin"]}
			onChange={async (file) => {
				const imageElement = await imageFromFile(file);

				const patch = attempt(() =>
					getTitleScreenPatch(
						halfImageWidth(
							paletteImageFromImageData(imageDataFromImage(imageElement)),
						),
					),
				);

				if (patch.type !== "ok") {
					alert(`Could not parse bin: ${patch.error ?? "No reason."}`);
					return;
				}

				props.setManualPatch(patch.result);
			}}
		>
			Open...
		</FileInput>
	);
}

const emptyCharIndex = 0x20;
const defaultColor = (palette.blue + 8) as PaletteIndex;
const bgColors: BgColors = {
	light: palette.white,
	dark: palette.brown,
};

function getTitleScreenPatch(image: PaletteImage): Patch {
	const layout = grid(
		range<number>(1000).map((index) => ({
			index,
			size: { x: 4, y: 8 },
			pos: origo,
		})),
		40,
		origo,
	);

	const charPalette = [
		// The background is black by default.
		palette.black,
		bgColors.dark,
		bgColors.light,
		// Undefined, so color gets parsed.
		undefined,
	] as const;

	const coloredChars = parseLayout(layout, image).map((charImage) =>
		parseChar(charImage as PaletteImage<4, 8>, charPalette),
	);

	const deduplicatedChars = uniqueBy(
		coloredChars.map((x) => x.char),
		(char) => JSON.stringify(char),
	).filter((char) => !isEqualChar(char, emptyChar));

	const charsetAddress = 0x4000;
	const newCharsStartAddress = 0x4210;
	const codeBlockStartsHere = 0x4460;
	const maxChars = (codeBlockStartsHere - newCharsStartAddress) / 8;
	const numChars = deduplicatedChars.length;
	if (numChars > maxChars) {
		throw new Error(`Too many chars: ${numChars}, max: ${maxChars}`);
	}

	// The chars directly after 66 are not used. They are overwritten later with software sprites.
	const charSet = [
		repeat(undefined, (newCharsStartAddress - charsetAddress) / 8),
		deduplicatedChars,
	].flat();
	charSet[emptyCharIndex] = emptyChar;

	const fullScreenIndices = coloredChars.map(({ char, color }) => ({
		color: color ? color + 8 : defaultColor,
		charIndex: charSet.findIndex((x) => x && isEqualChar(x, char)),
	}));

	const drawCommands = fullScreenIndicesToDrawCommands(fullScreenIndices);
	const numDrawCommands = drawCommands.length;
	const textStartAddress = 0x462d;
	const endAddressOfSecondText = 0x47b4;
	// const maxDrawCommands = 0x46ef - textStartAddress;
	const maxDrawCommands = endAddressOfSecondText - textStartAddress;
	if (numDrawCommands > maxDrawCommands) {
		throw new Error(
			`Too many draw commands: ${numDrawCommands}, max: ${maxDrawCommands}`,
		);
	}

	return [
		patchFromSegment(
			{
				startAddress: newCharsStartAddress,
				length: maxChars,
			},
			new Uint8Array(deduplicatedChars.flatMap(serializeChar)),
		),
		patchFromSegment(
			{
				startAddress: textStartAddress,
				length: maxDrawCommands,
			},
			drawCommands,
		),
		// Remove the second draw call, so the consecutive draw commands memory can be used as one block.
		// Replace it with separate dark bg color.
		patchFromSegment(
			{
				startAddress: 0x4559,
				length: 7,
			},
			new Uint8Array(
				padRight(
					[
						// lda #
						0xa9,
						bgColors.dark,
						// sta $1c
						0x85,
						0x1c,
					],
					7,
					0xea,
				),
			),
		),
	].flat();
}

function fullScreenIndicesToDrawCommands(
	fullScreenIndices: {
		color: number;
		charIndex: number;
	}[],
): ReadonlyUint8Array {
	const toDraw = fullScreenIndices
		.map(({ color, charIndex }, screenIndex) => ({
			color,
			charIndex,
			screenIndex,
		}))
		.filter(({ charIndex }) => charIndex !== emptyCharIndex);

	return new Uint8Array([
		...(function* () {
			const firstChar = toDraw[0];
			if (firstChar) {
				yield* getCursorPositioningBytes(
					screenIndexToPos(firstChar.screenIndex),
				);
				yield firstChar.color ?? defaultColor;
			}

			const charCodeOffset = 0x20;

			for (let index = 0; index < toDraw.length; ++index) {
				const current = checkedAccess(toDraw, index);
				yield current.charIndex + charCodeOffset;

				const next = toDraw[index + 1];
				if (next === undefined) {
					continue;
				}
				if (next.color !== current.color) {
					yield next.color;
				}

				const stepSize = next.screenIndex - current.screenIndex;

				if (stepSize === 1) {
					continue;
				} else if (stepSize === 2 || stepSize === 3) {
					// Might as well just print spaces to advance the cursor small distances.
					yield* repeat(emptyCharIndex + charCodeOffset, stepSize - 1);
				} else {
					yield* getCursorPositioningBytes(screenIndexToPos(next.screenIndex));
				}
			}

			// Terminator.
			yield 0x10;
		})(),
	]);
}

function screenIndexToPos(index: number): Coord2 {
	return {
		x: index % 40,
		y: Math.floor(index / 40),
	};
}

function getCursorPositioningBytes(pos: Coord2): number[] {
	return [0x1f, pos.x, pos.y];
}
