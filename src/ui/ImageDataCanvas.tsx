import { useRef, useEffect, ComponentPropsWithoutRef } from "react";

export type ImageDataCanvasProps = {
	readonly imageData: ImageData;
} & ComponentPropsWithoutRef<"canvas">;

export function ImageDataCanvas({
	imageData,
	...canvasProps
}: ImageDataCanvasProps): React.ReactNode {
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
