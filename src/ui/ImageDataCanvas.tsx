import { useRef, useEffect } from "react";

export function ImageDataCanvas({
	imageData,
}: {
	readonly imageData: ImageData;
}): React.ReactNode {
	const canvasRef = useRef<HTMLCanvasElement>(null);

	useEffect(() => {
		if (!canvasRef.current) {
			return;
		}
		canvasRef.current.width = imageData.width;
		canvasRef.current.height = imageData.height;
		const ctx = canvasRef.current.getContext("2d");
		ctx && ctx.putImageData(imageData, 0, 0);
	}, [imageData]);

	return <canvas ref={canvasRef} style={{ imageRendering: "pixelated" }} />;
}
