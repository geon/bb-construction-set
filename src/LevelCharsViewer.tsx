import { useRef, useEffect, useState } from "react";
import { drawPlatformCharsToCanvas } from "./bb/draw-levels-to-canvas";
import { Level } from "./bb/level";
import { maxSidebars } from "./bb/prg/data-locations";

export function LevelCharsViewer(props: {
	readonly levels: readonly Level[];
}): React.ReactNode {
	const platformCharsCanvasRef = useRef<HTMLCanvasElement>(null);
	const [error, setError] = useState<string | undefined>();

	useEffect(() => {
		(async () => {
			if (!platformCharsCanvasRef.current) {
				return;
			}
			try {
				const platformCharsImage = drawPlatformCharsToCanvas(props.levels);
				platformCharsCanvasRef.current.width = platformCharsImage.width;
				platformCharsCanvasRef.current.height = platformCharsImage.height;
				const ctx = platformCharsCanvasRef.current.getContext("2d");
				ctx && ctx.putImageData(platformCharsImage, 0, 0);
			} catch (error) {
				if (error instanceof Error) {
					setError(error.message);
				}
				throw error;
			}
		})();
	}, [props.levels, platformCharsCanvasRef.current]);

	return error ? (
		<p>{error}</p>
	) : (
		<>
			<p>
				{props.levels.filter((level) => level.sidebarChars).length}/
				{maxSidebars} have side decor
			</p>
			<canvas ref={platformCharsCanvasRef} />
		</>
	);
}
