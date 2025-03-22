import { useRef, useEffect, useState } from "react";
import { drawSpritesToCanvas } from "./bb/draw-levels-to-canvas";
import { Sprites } from "./bb/sprite";

export function SpritesViewer(props: {
	readonly sprites: Sprites;
}): React.ReactNode {
	const spriteCanvasRef = useRef<HTMLCanvasElement>(null);
	const [error, setError] = useState<string | undefined>();

	useEffect(() => {
		if (!spriteCanvasRef.current) {
			return;
		}
		try {
			drawSpritesToCanvas(props.sprites, spriteCanvasRef.current);
		} catch (error) {
			if (error instanceof Error) {
				setError(error.message);
			}
			throw error;
		}
	}, [props.sprites, spriteCanvasRef.current]);

	return error ? <p>{error}</p> : <canvas ref={spriteCanvasRef} />;
}
