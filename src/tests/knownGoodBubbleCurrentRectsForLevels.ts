import { BubbleCurrents } from "../level";

// Read from emulator by stepping and and inspecting registers in debugger.
export const knownGoodBubbleCurrentRectsForLevels: BubbleCurrents[] = [
	{
		type: "rectangles",
		perLineDefaults: [
			2, 2, 2, 2, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0,
		],
		rectangles: [
			{
				type: "rectangle",
				left: 0,
				top: 1,
				width: 14,
				height: 4,
				direction: 1,
			},
			{
				type: "symmetry",
			},
		],
	},
	{
		type: "copy",
		perLineDefaults: [
			2, 2, 2, 2, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0,
		],
		levelIndex: 0,
	},
	{
		type: "rectangles",
		perLineDefaults: [
			0, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 0, 3, 3, 3, 3, 0, 1, 1, 1, 1, 0,
		],
		rectangles: [
			{
				type: "rectangle",
				direction: 0,
				left: 0,
				top: 3,
				width: 11,
				height: 1,
			},
			{
				type: "rectangle",
				direction: 0,
				left: 0,
				top: 4,
				width: 5,
				height: 16,
			},
			{
				type: "rectangle",
				direction: 0,
				left: 14,
				top: 17,
				width: 2,
				height: 7,
			},
			{
				type: "rectangle",
				direction: 2,
				left: 15,
				top: 1,
				width: 1,
				height: 7,
			},
			{
				type: "rectangle",
				direction: 0,
				left: 15,
				top: 8,
				width: 1,
				height: 6,
			},
			{
				type: "rectangle",
				direction: 0,
				left: 14,
				top: 10,
				width: 1,
				height: 5,
			},
			{
				type: "symmetry",
			},
		],
	},
];
