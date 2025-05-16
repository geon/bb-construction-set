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
] as const;
export type LevelDataSegmentName = (typeof levelDataSegmentNames)[number];
