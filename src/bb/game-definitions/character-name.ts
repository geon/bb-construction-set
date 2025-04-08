export const characterNames = [
	"player",
	"bubbleBuster",
	"incendo",
	"colley",
	"hullaballoon",
	"beluga",
	"willyWhistle",
	"stoner",
	"superSocket",
] as const;

export type CharacterName = (typeof characterNames)[number];

export function isCharacterName(text: string): text is CharacterName {
	return characterNames.includes(text as CharacterName);
}
