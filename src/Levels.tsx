import { useRef, useEffect, useState } from "react";
import {
	drawLevelsToCanvas,
	drawPlatformCharsToCanvas,
} from "./bb/draw-levels-to-canvas";
import { Level, levelIsSymmetric } from "./bb/level";
import {
	maxAsymmetric,
	maxSidebars,
	maxMonsters,
} from "./bb/prg/data-locations";

export function Levels(props: {
	readonly fileName: string;
	readonly fileSize: number;
	readonly levels: readonly Level[];
}): React.ReactNode {
	const levelsCanvasRef = useRef<HTMLCanvasElement>(null);
	const platformCharsCanvasRef = useRef<HTMLCanvasElement>(null);
	const [error, setError] = useState<string | undefined>();

	useEffect(() => {
		(async () => {
			if (!(levelsCanvasRef.current && platformCharsCanvasRef.current)) {
				return;
			}
			try {
				drawLevelsToCanvas(props.levels, levelsCanvasRef.current);
				drawPlatformCharsToCanvas(props.levels, platformCharsCanvasRef.current);
			} catch (error) {
				if (error instanceof Error) {
					setError(error.message);
				}
				throw error;
			}
		})();
	}, [props.levels, levelsCanvasRef.current, platformCharsCanvasRef.current]);

	return error ? (
		<p>{error}</p>
	) : (
		<>
			<p>
				{props.levels.filter((level) => !levelIsSymmetric(level.tiles)).length}/
				{maxAsymmetric} are asymmetric
				<br />
				{props.levels.filter((level) => level.sidebarChars).length}/
				{maxSidebars} have side decor
				<br />
				{props.levels.flatMap((level) => level.monsters).length}/{maxMonsters}{" "}
				monsters
			</p>
			<canvas ref={levelsCanvasRef} />
			<br />
			<canvas ref={platformCharsCanvasRef} />
		</>
	);
}
