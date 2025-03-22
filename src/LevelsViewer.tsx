import { useRef, useEffect, useState } from "react";
import { drawLevelsToCanvas } from "./bb/draw-levels-to-canvas";
import { Level, levelIsSymmetric } from "./bb/level";
import { maxAsymmetric, maxMonsters } from "./bb/prg/data-locations";
import { CharacterName } from "./bb/sprite";
import { PaletteIndex } from "./bb/palette";

export function LevelsViewer(props: {
	readonly levels: readonly Level[];
	readonly spriteColors: Record<CharacterName, PaletteIndex>;
}): React.ReactNode {
	const levelsCanvasRef = useRef<HTMLCanvasElement>(null);
	const [error, setError] = useState<string | undefined>();

	useEffect(() => {
		(async () => {
			if (!levelsCanvasRef.current) {
				return;
			}
			try {
				drawLevelsToCanvas(
					props.levels,
					props.spriteColors,
					levelsCanvasRef.current
				);
			} catch (error) {
				if (error instanceof Error) {
					setError(error.message);
				}
				throw error;
			}
		})();
	}, [props.levels, levelsCanvasRef.current]);

	return error ? (
		<p>{error}</p>
	) : (
		<>
			<p>
				{props.levels.filter((level) => !levelIsSymmetric(level.tiles)).length}/
				{maxAsymmetric} are asymmetric
				<br />
				{props.levels.flatMap((level) => level.monsters).length}/{maxMonsters}{" "}
				monsters
			</p>
			<canvas ref={levelsCanvasRef} />
		</>
	);
}
