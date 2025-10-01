import { Coord2, origo } from "../../math/coord2";
import { LayoutRect, boundingBox, flexbox, grid } from "../../math/rect";
import {
	mapRecord,
	padRight,
	range,
	strictChunk,
	zipObject,
} from "../functions";
import { charGroupMeta } from "../game-definitions/char-segment-name";
import { CharGroup, CharGroups } from "../internal-data-formats/char-group";
import {
	doubleImageWidth,
	drawLayout,
	halfImageWidth,
	mapLayout,
	PaletteImage,
	parseLayout,
} from "./palette-image";
import {
	drawChar,
	drawHiresChar,
	getCharPalette,
	parseChar,
	parseHiresChar,
} from "./char";
import { Char } from "../internal-data-formats/char";
import {
	palette,
	PaletteIndex,
	SubPalette,
} from "../internal-data-formats/palette";
import { BgColors } from "../internal-data-formats/bg-colors";

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
				shadows: 6,
				fontLifeDotLines: 1000,
				fontPunctuation: 1000,
				fontHurryUp: 1,
			}[groupName as string] ?? 4,
			{ x: 4, y: 8 }
		)
	);

	return flexbox(
		[
			flexbox(
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
						flexbox(
							[
								laidOutCharGroups.largeLightning,
								flexbox(
									[
										flexbox(
											[
												laidOutCharGroups.secretLevelPlatform,
												laidOutCharGroups.secretLevelPedestal,
											],
											"row",
											4
										),
										flexbox(
											[
												laidOutCharGroups.secretLevelSideDecor,
												laidOutCharGroups.secretLevelPedestalDoor,
												laidOutCharGroups.secretLevelBasementDoor,
											],
											"row",
											4
										),
									],
									"column",
									4
								),
							],
							"row",
							12
						),
						flexbox(
							[
								flexbox(
									[
										laidOutCharGroups.shadows,
										flexbox(
											[
												laidOutCharGroups.flowingWater,
												laidOutCharGroups.fireOnGroundA,
												laidOutCharGroups.fireOnGround,
											],
											"row",
											4
										),

										laidOutCharGroups.fontHurryUp,
									],
									"column",
									12
								),
								laidOutCharGroups.fontLevelNumbers6px,
							],
							"row",
							4 * 3
						),
					],
				].map((chunk) => flexbox(chunk, "column", 3 * 8)),
				"row",
				4 * 4
			),
			flexbox(
				[
					flexbox(
						[
							laidOutCharGroups.fontAlpha,
							laidOutCharGroups.fontNumeric,
							laidOutCharGroups.fontLifeDotLines,
							laidOutCharGroups.fontPunctuation,
						],
						"row",
						4 * 3
					),
					flexbox(
						[
							laidOutCharGroups.fontFatneck,
							laidOutCharGroups.fontRuddyHelloThere,
						],
						"row",
						8
					),
				],
				"column",
				8
			),
		],
		"column",
		8 * 4
	);
}

export function getAllChars(charGroups: CharGroups): ReadonlyArray<Char> {
	return Object.values(charGroups).flat(3);
}

export function getAllCharMasks(
	charGroups: CharGroups
): ReadonlyArray<Char | undefined> {
	return Object.values(
		mapRecord(charGroups, (charGroup, groupName) => {
			const mixedChars = charGroup.flat().flat();

			const masks = padRight(
				charGroupMeta[groupName].hasMask
					? mixedChars.slice(mixedChars.length / 2)
					: [],

				mixedChars.length,
				undefined
			);

			return masks;
		})
	).flat();
}

export function getAllCharMulticolor(): ReadonlyArray<boolean> {
	return Object.values(
		mapRecord(charGroupMeta, (meta) => {
			const numChars = meta.count * meta.width * meta.height;
			return range(numChars).map(() => meta.multicolor);
		})
	).flat();
}

export function getAllCharPalettes(): ReadonlyArray<SubPalette> {
	const bgColors: BgColors = {
		dark: palette.brown,
		light: palette.white,
	};

	return Object.values(
		mapRecord(charGroupMeta, (meta) => {
			const numChars = meta.count * meta.width * meta.height;
			return range(numChars).map(() => getCharPalette(palette.green, bgColors));
		})
	).flat();
}

export function drawCharGroups(charGroups: CharGroups): PaletteImage {
	const charImages = zipObject({
		char: getAllChars(charGroups),
		mask: getAllCharMasks(charGroups),
		palette: getAllCharPalettes(),
		multicolor: getAllCharMulticolor(),
	}).map((maskedChar) =>
		maskedChar.multicolor
			? doubleImageWidth(
					drawChar(maskedChar.char, maskedChar.palette, maskedChar.mask)
			  )
			: drawHiresChar(maskedChar.char, maskedChar.palette[3])
	);
	const layout = layOutChars();
	return drawLayout(
		mapLayout(layout, (rect) => ({
			pos: {
				x: rect.pos.x * 2,
				y: rect.pos.y,
			},
			size: {
				x: rect.size.x * 2,
				y: rect.size.y,
			},
		})),
		charImages
	);
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
	const layout = mapLayout(layOutChars(), (rect) => ({
		pos: {
			x: rect.pos.x * 2,
			y: rect.pos.y,
		},
		size: {
			x: rect.size.x * 2,
			y: rect.size.y,
		},
	}));

	const chars = zipObject({
		image: parseLayout(layout, image),
		palette: getAllCharPalettes(),
		multicolor: getAllCharMulticolor(),
	}).map(({ image, palette, multicolor }) =>
		multicolor
			? parseChar(halfImageWidth(image) as PaletteImage<4, 8>, palette)
			: parseHiresChar(image as PaletteImage<8, 8>)
	);

	return reassembleAllChars(chars);
}
