import { Tuple } from "../tuple";
import { Level } from "./level";

export type Levels = Tuple<Level, 100>;
export type LevelIndex = keyof Levels;
