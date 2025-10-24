export const levelDataSegmentNames = [
	"symmetry",
	"sidebarCharsIndex",
	"bitmaps",
	"platformChars",
	"bgColors",
	"sidebarChars",
	"holes",
	"bubbleCurrentInHoles",
	"monsters",
	"windCurrents",
	"bubbleSpawns",
	"itemSpawnPositionsA",
	"itemSpawnPositionsB",
	"itemSpawnPositionsC",
] as const;
export type LevelDataSegmentName = (typeof levelDataSegmentNames)[number];
