export const spriteGroupNames = [
	"player",
	"bubbleBuster",
	"incendo",
	"colley",
	"hullaballoon",
	"beluga",
	"willyWhistle",
	"stoner",
	"superSocket",
	"playerInBubble",
	"bossFacingLeft",
	"bossInBubble",
	"bossFacingRight",
	"bonusCupCake",
	"bonusMelon",
	"bonusDiamond",
] as const;
export type SpriteDataSegmentName = (typeof spriteGroupNames)[number];
