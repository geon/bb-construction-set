import { CharSegmentName } from "../game-definitions/char-segment-name";
import { CharBlock } from "./char-block";

export type CharGroup = ReadonlyArray<CharBlock>;

export type CharGroups = {
	readonly [Key in CharSegmentName]: CharGroup;
};
