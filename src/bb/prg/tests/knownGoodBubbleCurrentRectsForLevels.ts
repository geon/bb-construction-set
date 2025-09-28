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
						x: 0,
						y: 1,
					},
					size: {
						x: 14,
						y: 4,
					},
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
						x: 0,
						y: 3,
					},
					size: {
						x: 11,
						y: 1,
					},
				},
			},
			{
				type: "rectangle",
				direction: 0,
				rect: {
					pos: {
						x: 0,
						y: 4,
					},
					size: {
						x: 5,
						y: 16,
					},
				},
			},
			{
				type: "rectangle",
				direction: 0,
				rect: {
					pos: {
						x: 14,
						y: 17,
					},
					size: {
						x: 2,
						y: 7,
					},
				},
			},
			{
				type: "rectangle",
				direction: 2,
				rect: {
					pos: {
						x: 15,
						y: 1,
					},
					size: {
						x: 1,
						y: 7,
					},
				},
			},
			{
				type: "rectangle",
				direction: 0,
				rect: {
					pos: {
						x: 15,
						y: 8,
					},
					size: {
						x: 1,
						y: 6,
					},
				},
			},
			{
				type: "rectangle",
				direction: 0,
				rect: {
					pos: {
						x: 14,
						y: 10,
					},
					size: {
						x: 1,
						y: 5,
					},
				},
			},
			{
				type: "symmetry",
			},
		],
	},
];
