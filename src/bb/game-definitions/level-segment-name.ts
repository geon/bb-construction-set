export const levelDataSegmentNames = [
	"symmetry",
	"sidebarCharsIndex",
	"bitmaps",
	"platformChars",
	"bgColors",
	"sidebarChars",
	"holeMetadata",
	"monsters",
	"windCurrents",
	"bubbleSpawns",
	"itemSpawnPositionsA",
	"itemSpawnPositionsB",
	"itemSpawnPositionsC",
] as const;
export type LevelDataSegmentName = (typeof levelDataSegmentNames)[number];
