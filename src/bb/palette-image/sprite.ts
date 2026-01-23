import { spriteSizePixels } from "../../c64/consts";
import { origo } from "../../math/coord2";
import { LayoutRect, flexbox } from "../../math/rect";
import {
	mapRecord,
	range,
	chunk,
	zipObject,
	strictChunk,
	repeat,
} from "../functions";
import { SpriteGroupName } from "../game-definitions/sprite-segment-name";
import {
	SubPalette,
	PaletteIndex,
	palette,
	SubPaletteIndex,
} from "../internal-data-formats/palette";
import {
	SpriteGroups,
	Sprite,
	SpriteGroup,
} from "../internal-data-formats/sprite";
import { spriteCounts, spriteMasks } from "../prg/data-locations";
import { assertTuple } from "../tuple";
import {
	PaletteImage,
	blitPaletteImage,
	drawLayout,
	parseLayout,
} from "./palette-image";

export function getSpritePalette(color: PaletteIndex): SubPalette {
	return [
		//
		undefined,
		palette.red,
		color,
		palette.white,
	];
}

export function getOpaqueSpritePalette(color: PaletteIndex): SubPalette {
	return assertTuple([palette.black, ...getSpritePalette(color).slice(1)], 4);
}

export const spriteGroupMultiWidths: Record<SpriteGroupName, number> = {
	player: 1,
	bubbleBuster: 1,
	incendo: 1,
	colley: 1,
	hullaballoon: 1,
	beluga: 1,
	willyWhistle: 1,
	stoner: 1,
	superSocket: 1,
	playerInBubbleA: 2,
	playerInBubbleB: 2,
	bossFacingLeft: 3,
	bossInBubble: 3,
	bossFacingRight: 3,
	bonusCupCake: 2,
	bonusMelonTopLeft: 1,
	bonusMelonTopRight: 1,
	bonusMelonBottom: 2,
	bonusDiamond: 2,
	hexagonExplosion: 1,
	boxyExplosion: 1,
};

export function layOutSpriteGroups(): LayoutRect {
	let index = 0;
	const spriteRects = mapRecord(
		spriteCounts,
		(count): ReadonlyArray<LayoutRect> =>
			range(count).map(
				(): LayoutRect => ({
					pos: origo,
					size: spriteSizePixels,
					index: index++,
				}),
			),
	);

	const spriteGroupRects = mapRecord(spriteRects, (rects, groupName) => {
		const multiWidth = spriteGroupMultiWidths[groupName];
		const gap = multiWidth === 1 ? { x: 4, y: 8 } : origo;
		return flexbox(
			chunk(rects, multiWidth === 1 ? 4 : multiWidth).map((row) =>
				flexbox(row, "row", gap.x),
			),
			"column",
			gap.y,
		);
	});

	return flexbox(
		[
			[
				spriteGroupRects.player,
				spriteGroupRects.bubbleBuster,
				spriteGroupRects.stoner,
				spriteGroupRects.beluga,
			],
			[
				spriteGroupRects.hullaballoon,
				spriteGroupRects.colley,
				spriteGroupRects.incendo,
				spriteGroupRects.willyWhistle,
				spriteGroupRects.superSocket,
			],
			[
				flexbox(
					[spriteGroupRects.playerInBubbleA, spriteGroupRects.playerInBubbleB],
					"row",
					8,
				),
				spriteGroupRects.bossFacingLeft,
				spriteGroupRects.bossFacingRight,
				spriteGroupRects.bossInBubble,
				flexbox(
					[
						spriteGroupRects.bonusCupCake,
						flexbox(
							[
								flexbox(
									[
										spriteGroupRects.bonusMelonTopLeft,
										spriteGroupRects.bonusMelonTopRight,
									],
									"row",
									0,
								),
								spriteGroupRects.bonusMelonBottom,
							],
							"column",
							0,
						),
						spriteGroupRects.bonusDiamond,
					],
					"row",
					4,
					"end",
				),
				flexbox(
					[spriteGroupRects.hexagonExplosion, spriteGroupRects.boxyExplosion],
					"row",
					8,
				),
			],
		].map((chunk) => flexbox(chunk, "column", 3 * 8)),
		"row",
		3 * 4,
	);
}

export function drawSprites(spriteGroups: SpriteGroups): PaletteImage {
	const sprites = Object.values(
		mapRecord(spriteGroups, (spriteGroup, groupName) => {
			const maskBytes = spriteMasks[groupName];
			if (!maskBytes) {
				// Draw the sprites opaque, so they get the black background..
				return spriteGroup.sprites.map((sprite) =>
					drawSprite(sprite, getOpaqueSpritePalette(spriteGroup.color)),
				);
			}

			return zipObject({
				sprite: spriteGroup.sprites,
				// Build masked black backgrounds from the maskBytes.
				maskedBg: strictChunk(
					strictChunk(
						maskBytes.flatMap((x) => repeat(x ? palette.black : undefined, 4)),
						spriteSizePixels.x,
					),
					spriteSizePixels.y,
				),
			}).map(({ sprite, maskedBg }) => {
				// Draw transparent sprite on masked bg.
				blitPaletteImage(
					maskedBg,
					drawSprite(sprite, getSpritePalette(spriteGroup.color)),
					origo,
				);
				return maskedBg;
			});
		}),
	).flat();

	const layout = layOutSpriteGroups();

	return drawLayout(layout, sprites);
}

export function drawSprite(
	sprite: Sprite,
	spritePalette: SubPalette,
): PaletteImage {
	return sprite.map((row) =>
		row.map((pixelValue) =>
			pixelValue !== undefined ? spritePalette[pixelValue] : undefined,
		),
	);
}

export function parseSprites(image: PaletteImage): SpriteGroups {
	const layout = layOutSpriteGroups();
	const images = parseLayout(layout, image);

	let index = 0;
	let color: PaletteIndex = palette.green;
	return mapRecord(spriteCounts, (count): SpriteGroup => {
		const sprites = images.slice(index, index + count).map((image) => {
			const parsed = parseSprite(image, color);
			color = parsed.color;
			return parsed.sprite;
		});
		index += count;

		return {
			color,
			sprites,
		};
	});
}

export function parseSprite(
	image: PaletteImage,
	tryColor: PaletteIndex,
): {
	readonly sprite: Sprite;
	readonly color: PaletteIndex;
} {
	let spritePalette = getOpaqueSpritePalette(tryColor);

	const sprite = assertTuple(
		image.map((row) =>
			assertTuple(
				row.map((pixelValue) => {
					const color = pixelValue ?? palette.black;
					let subPaletteIndex = spritePalette.indexOf(color) as
						| SubPaletteIndex
						| -1;
					if (subPaletteIndex === -1) {
						spritePalette = getOpaqueSpritePalette(color);
						subPaletteIndex = 2; // The argument to getSpritePalette is on index 2.
					}
					return subPaletteIndex;
				}),
				spriteSizePixels.x,
			),
		),
		spriteSizePixels.y,
	);

	return { sprite, color: spritePalette[2]! };
}
