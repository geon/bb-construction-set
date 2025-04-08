export const itemDataSegmentNames = [
	"bubbleBlow",
	"bubblePop",
	// "rest",
	"baronVonBlubba",
	"specialBubbles",
	"lightning",
	"fire",
	"extendBubbles",
	"stonerWeapon",
	"drunkAndInvaderWeapon",
	"incendoWeapon",
	"items",
	"largeLightning",
	"bonusRoundCircles",
] as const;
export type ItemDataSegmentName = (typeof itemDataSegmentNames)[number];
