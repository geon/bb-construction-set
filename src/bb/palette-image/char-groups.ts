import { Coord2, origo } from "../../math/coord2";
import { LayoutRect, boundingBox, flexbox, grid } from "../../math/rect";
import {
	mapRecord,
	padRight,
	range,
	strictChunk,
	zipObject,
} from "../functions";
import { charGroupMeta } from "../prg/char-groups";
import {
	CharBlock,
	CharGroup,
	CharGroups,
} from "../internal-data-formats/char-group";
import { drawLayout, PaletteImage, parseLayout } from "./palette-image";
import { drawChar, getCharPalette, parseChar } from "./char";
import { assertTuple } from "../tuple";
import { CharSegmentName } from "../game-definitions/char-segment-name";
import { Char } from "../internal-data-formats/char";
import { PaletteIndex, SubPalette } from "../internal-data-formats/palette";

function layoutLargeLightning(index: number) {
	// 4x4 grid, but 2 corners are missing 3 chars each.
	// [o][o][x][x]
	// [x][x][x][o]
	// [o][x][x][x]
	// [x][x][o][o]
	const positions: ReadonlyArray<Coord2> = [
		{ x: 2, y: 0 },
		{ x: 3, y: 0 },
		{ x: 0, y: 1 },
		{ x: 1, y: 1 },
		{ x: 2, y: 1 },
		{ x: 1, y: 2 },
		{ x: 2, y: 2 },
		{ x: 3, y: 2 },
		{ x: 0, y: 3 },
		{ x: 1, y: 3 },
	];

	const { width, height } = charGroupMeta.largeLightning;
	if (positions.length !== width * height) {
		throw new Error(
			`Bad char count for largeLightning. Was ${positions.length}, should be ${
				width * height
			}.`
		);
	}

	const children = positions.map(
		(pos): LayoutRect => ({
			pos: { x: pos.x * 4, y: pos.y * 8 },
			size: { x: 4, y: 8 },
			index: index++,
		})
	);

	return {
		...boundingBox(children),
		children,
	};
}

export function layOutChars(): LayoutRect {
	let index = 0;
	const rectGroups = mapRecord(
		charGroupMeta,
		(group, groupName): ReadonlyArray<LayoutRect> =>
			range(group.count).map(() => {
				if (groupName === "largeLightning") {
					const layout = layoutLargeLightning(index);
					index += layout.children.length;
					return layout;
				}

				return charGroupMeta[groupName].transposed
					? flexbox(
							range(group.height).map(
								(): LayoutRect =>
									flexbox(
										range(group.width).map(
											(): LayoutRect => ({
												pos: origo,
												size: { x: 4, y: 8 },
												index: index++,
											})
										),
										"row",
										0
									)
							),
							"column",
							0
					  )
					: flexbox(
							range(group.width).map(
								(): LayoutRect =>
									flexbox(
										range(group.height).map(
											(): LayoutRect => ({
												pos: origo,
												size: { x: 4, y: 8 },
												index: index++,
											})
										),
										"column",
										0
									)
							),
							"row",
							0
					  );
			})
	);

	const laidOutCharGroups = mapRecord(rectGroups, (rects, groupName) =>
		grid(
			rects,
			{
				drunkAndInvaderWeapon: 5,
				lightning: 1,
				items: Math.ceil(Math.sqrt(rectGroups.items.length)),
			}[groupName as string] ?? 4,
			{ x: 4, y: 8 }
		)
	);

	return flexbox(
		[
			[
				laidOutCharGroups.bubbleBlow,
				laidOutCharGroups.specialBubbles,
				laidOutCharGroups.extendBubbles,
			],
			[
				laidOutCharGroups.bubblePop,
				laidOutCharGroups.fire,
				laidOutCharGroups.baronVonBlubba,
				laidOutCharGroups.stonerWeapon,
				laidOutCharGroups.drunkAndInvaderWeapon,
				flexbox(
					[laidOutCharGroups.incendoWeapon, laidOutCharGroups.lightning],
					"row",
					4
				),
			],
			[
				laidOutCharGroups.items,
				laidOutCharGroups.bonusRoundCircles,
				laidOutCharGroups.largeLightning,
				laidOutCharGroups.flowingWater,
				laidOutCharGroups.fireOnGroundA,
				laidOutCharGroups.fireOnGround,
				laidOutCharGroups.secretLevelPlatform,
				laidOutCharGroups.secretLevelSideDecor,
				laidOutCharGroups.secretLevelPedestal,
				laidOutCharGroups.secretLevelPedestalRightEdge,
				laidOutCharGroups.secretLevelPedestalDoor,
				laidOutCharGroups.secretLevelBasementDoor,
				laidOutCharGroups.shadows,
			],
		].map((chunk) => flexbox(chunk, "column", 3 * 8)),
		"row",
		4 * 4
	);
}

export function getAllChars(charGroups: CharGroups): ReadonlyArray<Char> {
	return Object.values(charGroups).flat(3);
}

export function getAllCharMasks(
	charGroups: CharGroups
): ReadonlyArray<Char | undefined> {
	const sharedBubbleMask = assertTuple(charGroups.bubbleBlow.slice(12 + 8), 4);
	const bubbleBasedMasks: Partial<
		Record<CharSegmentName, ReadonlyArray<CharBlock<number, number>>>
	> = {
		specialBubbles: range(3).flatMap(() => sharedBubbleMask),
		extendBubbles: range(5).flatMap(() => sharedBubbleMask),
		stonerWeapon: [sharedBubbleMask[0], sharedBubbleMask[2]],
	};

	return Object.values(
		mapRecord(charGroups, (charGroup, groupName) => {
			const mixedChars = charGroup.flat().flat();

			const masks = padRight(
				charGroupMeta[groupName].hasMask
					? mixedChars.slice(mixedChars.length / 2)
					: bubbleBasedMasks[groupName]?.flat().flat() ?? [],
				mixedChars.length,
				undefined
			);

			return masks;
		})
	).flat();
}

export function getAllCharPalettes(): ReadonlyArray<SubPalette> {
	const bgColors = {
		bgColorDark: 9, // Brown
		bgColorLight: 1, // White
	} as const;

	return Object.values(
		mapRecord(charGroupMeta, (meta) => {
			const numChars = meta.count * meta.width * meta.height;
			return range(numChars).map(() => getCharPalette(5, bgColors));
		})
	).flat();
}

export function drawCharGroups(charGroups: CharGroups): PaletteImage {
	const charImages = zipObject({
		char: getAllChars(charGroups),
		mask: getAllCharMasks(charGroups),
		palette: getAllCharPalettes(),
	}).map((maskedChar) =>
		drawChar(maskedChar.char, maskedChar.palette, maskedChar.mask)
	);
	const layout = layOutChars();
	return drawLayout(layout, charImages);
}

function reassembleAllChars(
	chars: readonly { char: Char; color: PaletteIndex | undefined }[]
): CharGroups {
	let groupStart = 0;
	return mapRecord(charGroupMeta, (meta): CharGroup<number, number> => {
		const groupEnd = groupStart + meta.count * meta.width * meta.height;
		const groupChars = chars
			.slice(groupStart, groupEnd)
			.map(({ char }) => char);
		groupStart = groupEnd;

		return strictChunk(strictChunk(groupChars, meta.height), meta.width);
	});
}

export function parseCharGroups(image: PaletteImage): CharGroups {
	const layout = layOutChars();

	const chars = zipObject({
		image: parseLayout(layout, image),
		palette: getAllCharPalettes(),
	}).map(({ image, palette }) =>
		parseChar(image as PaletteImage<4, 8>, palette)
	);

	return reassembleAllChars(chars);
}
