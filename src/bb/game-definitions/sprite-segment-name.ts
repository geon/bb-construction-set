export const spriteDataSegmentNames = [
	"characters",
	"playerInBubble",
	"bossA",
	"bossB",
	"bonusCupCake",
	"bonusMelon",
	"bonusDiamond",
] as const;
export type SpriteDataSegmentName = (typeof spriteDataSegmentNames)[number];
