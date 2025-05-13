export const itemDataSegmentNames = [
	"bubbleBlow",
	"bubblePop",
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
	"flowingWater",
] as const;
export type ItemDataSegmentName = (typeof itemDataSegmentNames)[number];
