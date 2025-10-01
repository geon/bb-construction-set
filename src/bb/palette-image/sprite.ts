import { spriteSizePixels } from "../../c64/consts";
import { origo } from "../../math/coord2";
import { LayoutRect, flexbox } from "../../math/rect";
import { mapRecord, range, chunk } from "../functions";
import { SpriteGroupName } from "../game-definitions/sprite-segment-name";
import {
	SubPalette,
	PaletteIndex,
	palette,
} from "../internal-data-formats/palette";
import { SpriteGroups, Sprite } from "../internal-data-formats/sprite";
import { spriteCounts } from "../prg/data-locations";
import { PaletteImage, drawLayout } from "./palette-image";

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
				})
			)
	);

	const spriteGroupRects = mapRecord(spriteRects, (rects, groupName) => {
		const multiWidth = spriteGroupMultiWidths[groupName];
		const gap = multiWidth === 1 ? { x: 4, y: 8 } : origo;
		return flexbox(
			chunk(rects, multiWidth === 1 ? 4 : multiWidth).map((row) =>
				flexbox(row, "row", gap.x)
			),
			"column",
			gap.y
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
					8
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
									0
								),
								spriteGroupRects.bonusMelonBottom,
							],
							"column",
							0
						),
						spriteGroupRects.bonusDiamond,
					],
					"row",
					4,
					"end"
				),
				flexbox(
					[spriteGroupRects.hexagonExplosion, spriteGroupRects.boxyExplosion],
					"row",
					8
				),
			],
		].map((chunk) => flexbox(chunk, "column", 3 * 8)),
		"row",
		3 * 4
	);
}

export function drawSprites(spriteGroups: SpriteGroups): PaletteImage {
	const sprites = Object.values(
		mapRecord(spriteGroups, (spriteGroup) => {
			return spriteGroup.sprites.map((sprite) =>
				drawSprite(sprite, getSpritePalette(spriteGroup.color))
			);
		})
	).flat();

	const layout = layOutSpriteGroups();

	return drawLayout(layout, sprites);
}

export function drawSprite(
	sprite: Sprite,
	spritePalette: SubPalette
): PaletteImage {
	return sprite.map((row) =>
		row.map((pixelValue) =>
			pixelValue ? spritePalette[pixelValue] : undefined
		)
	);
}

export function getSpritePalette(color: PaletteIndex): SubPalette {
	return [
		//
		palette.black,
		palette.red,
		color,
		palette.white,
	];
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
