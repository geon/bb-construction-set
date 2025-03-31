import { useRef, useEffect } from "react";

export function ImageDataCanvas(props: {
	readonly imageData: ImageData;
}): React.ReactNode {
	const canvasRef = useRef<HTMLCanvasElement>(null);

	useEffect(() => {
		if (!canvasRef.current) {
			return;
		}
		canvasRef.current.width = props.imageData.width;
		canvasRef.current.height = props.imageData.height;
		const ctx = canvasRef.current.getContext("2d");
		ctx && ctx.putImageData(props.imageData, 0, 0);
	}, [props.imageData]);

	return <canvas ref={canvasRef} />;
}
