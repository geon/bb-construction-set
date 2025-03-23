import { useRef, useEffect, useState } from "react";
import { drawSpritesToCanvas } from "./bb/draw-levels-to-canvas";
import { SpriteGroupName, SpriteGroup } from "./bb/sprite";

export function SpritesViewer(props: {
	readonly spriteGroups: Record<SpriteGroupName, SpriteGroup>;
}): React.ReactNode {
	const spriteCanvasRef = useRef<HTMLCanvasElement>(null);
	const [error, setError] = useState<string | undefined>();

	useEffect(() => {
		if (!spriteCanvasRef.current) {
			return;
		}
		try {
			drawSpritesToCanvas(props.spriteGroups, spriteCanvasRef.current);
		} catch (error) {
			if (error instanceof Error) {
				setError(error.message);
			}
			throw error;
		}
	}, [props.spriteGroups, spriteCanvasRef.current]);

	return error ? <p>{error}</p> : <canvas ref={spriteCanvasRef} />;
}
