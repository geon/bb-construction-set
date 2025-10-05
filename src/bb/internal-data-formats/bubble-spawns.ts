export const validSpecialBubbleNames = [
	"lightning",
	"fire",
	"water",
	"extend",
] as const;

export type SpecialBubbleName = (typeof validSpecialBubbleNames)[number];

export type PerLevelBubbleSpawns = Record<SpecialBubbleName, boolean>;

export type BubbleSpawns = ReadonlyArray<PerLevelBubbleSpawns>;
