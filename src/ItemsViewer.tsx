import { useRef, useEffect, useState } from "react";
import { drawItemsToCanvas } from "./bb/draw-levels-to-canvas";
import { CharBlock } from "./bb/charset-char";

export function ItemsViewer(props: {
	readonly items: CharBlock[];
}): React.ReactNode {
	const canvasRef = useRef<HTMLCanvasElement>(null);
	const [error, setError] = useState<string | undefined>();

	useEffect(() => {
		if (!canvasRef.current) {
			return;
		}
		try {
			const imageData = drawItemsToCanvas(props.items);
			canvasRef.current.width = imageData.width;
			canvasRef.current.height = imageData.height;
			const ctx = canvasRef.current.getContext("2d");
			ctx && ctx.putImageData(imageData, 0, 0);
		} catch (error) {
			if (error instanceof Error) {
				setError(error.message);
			}
			throw error;
		}
	}, [props.items, canvasRef.current]);

	return error ? <p>{error}</p> : <canvas ref={canvasRef} />;
}
