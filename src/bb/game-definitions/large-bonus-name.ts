import { SpriteGroupName } from "./sprite-segment-name";

export type LargeBonusName =
	| "cupCake"
	| "melon"
	| "yellowDiamond"
	| "blueDiamond"
	| "purpleDiamond";

export const largeBonusSpriteGroupNames = {
	cupCake: "bonusCupCake",
	melon: "bonusMelonBottom",
	// I don't have 3 diamonds in the sprite sheet, so just use the one.
	yellowDiamond: "bonusDiamond",
	blueDiamond: "bonusDiamond",
	purpleDiamond: "bonusDiamond",
} as const satisfies Record<LargeBonusName, SpriteGroupName>;

export const largeBonusSpriteGroupNames_inverse: Partial<
	Record<SpriteGroupName, LargeBonusName>
> = {
	bonusMelonBottom: "melon",
	bonusCupCake: "cupCake",
	bonusDiamond: "blueDiamond",
} satisfies Record<
	(typeof largeBonusSpriteGroupNames)[keyof typeof largeBonusSpriteGroupNames],
	LargeBonusName
>;
