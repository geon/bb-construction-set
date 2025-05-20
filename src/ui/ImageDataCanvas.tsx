import { useRef, useEffect } from "react";

export function ImageDataCanvas({
	imageData,
	...canvasProps
}: {
	readonly imageData: ImageData;
} & React.CanvasHTMLAttributes<HTMLCanvasElement>): React.ReactNode {
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

	return (
		<canvas
			{...canvasProps}
			style={{ ...canvasProps.style, imageRendering: "pixelated" }}
			ref={canvasRef}
		/>
	);
}
