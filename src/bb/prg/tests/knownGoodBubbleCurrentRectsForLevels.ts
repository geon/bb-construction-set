import { BubbleCurrentRectangles } from "../../internal-data-formats/level";

// Read from emulator by stepping and and inspecting registers in debugger.
export const knownGoodBubbleCurrentRectsForLevels: BubbleCurrentRectangles[] = [
	{
		type: "rectangles",
		rectangles: [
			{
				type: "rectangle",
				rect: {
					pos: {
						left: 0,
						top: 1,
					},
					width: 14,
					height: 4,
				},
				direction: 1,
			},
			{
				type: "symmetry",
			},
		],
	},
	{
		type: "copy",
		levelIndex: 0,
	},
	{
		type: "rectangles",
		rectangles: [
			{
				type: "rectangle",
				direction: 0,
				rect: {
					pos: {
						left: 0,
						top: 3,
					},
					width: 11,
					height: 1,
				},
			},
			{
				type: "rectangle",
				direction: 0,
				rect: {
					pos: {
						left: 0,
						top: 4,
					},
					width: 5,
					height: 16,
				},
			},
			{
				type: "rectangle",
				direction: 0,
				rect: {
					pos: {
						left: 14,
						top: 17,
					},
					width: 2,
					height: 7,
				},
			},
			{
				type: "rectangle",
				direction: 2,
				rect: {
					pos: {
						left: 15,
						top: 1,
					},
					width: 1,
					height: 7,
				},
			},
			{
				type: "rectangle",
				direction: 0,
				rect: {
					pos: {
						left: 15,
						top: 8,
					},
					width: 1,
					height: 6,
				},
			},
			{
				type: "rectangle",
				direction: 0,
				rect: {
					pos: {
						left: 14,
						top: 10,
					},
					width: 1,
					height: 5,
				},
			},
			{
				type: "symmetry",
			},
		],
	},
];
