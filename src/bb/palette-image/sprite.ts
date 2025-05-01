import { spriteSize, spriteSizePixels } from "../../c64/consts";
import { origo } from "../../math/coord2";
import { LayoutRect, flexbox, leafs } from "../../math/rect";
import { mapRecord, range, chunk, zipObject } from "../functions";
import { SpriteGroupName } from "../game-definitions/sprite-segment-name";
import { SubPalette, PaletteIndex } from "../internal-data-formats/palette";
import { SpriteGroups, Sprite } from "../internal-data-formats/sprite";
import { spriteCounts } from "../prg/data-locations";
import { PaletteImage, blitPaletteImage } from "./palette-image";

export function layOutSpriteGroups(): LayoutRect {
	let index = 0;
	const spriteRects = mapRecord(
		spriteCounts,
		(count): ReadonlyArray<LayoutRect> =>
			range(0, count).map(
				(): LayoutRect => ({
					pos: origo,
					size: { x: spriteSize.x / 2, y: spriteSize.y },
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
					[spriteGroupRects.bonusCupCake, spriteGroupRects.bonusMelon],
					"row",
					8
				),
				spriteGroupRects.bonusDiamond,
			],
		].map((chunk) => flexbox(chunk, "column", 3 * 8)),
		"row",
		3 * 4
	);
}

export function drawSpritesToCanvas(spriteGroups: SpriteGroups): PaletteImage {
	const sprites = Object.values(
		mapRecord(spriteGroups, (spriteGroup) => {
			return spriteGroup.sprites.map((sprite) =>
				drawSprite(sprite, getSpritePalette(spriteGroup.color))
			);
		})
	).flat();

	const layout = layOutSpriteGroups();
	const spritePositions = leafs(layout).map(({ pos }) => pos);

	const image: PaletteImage = {
		width: layout.size.x,
		height: layout.size.y,
		data: [],
	};
	for (const { sprite, pos } of zipObject({
		sprite: sprites,
		pos: spritePositions,
	})) {
		blitPaletteImage(image, sprite, pos.x, pos.y);
	}

	return image;
}

export function drawSprite(
	sprite: Sprite,
	spritePalette: SubPalette
): PaletteImage {
	return {
		width: spriteSizePixels.x,
		height: spriteSizePixels.y,
		data: sprite
			.flat()
			.map((pixelValue) =>
				pixelValue ? spritePalette[pixelValue] : undefined
			),
	};
}

export function getSpritePalette(color: PaletteIndex): SubPalette {
	return [
		0, // Transparent (Black)
		2, // Dark red
		color,
		1, // White
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
	bonusMelon: 2,
	bonusDiamond: 2,
};
