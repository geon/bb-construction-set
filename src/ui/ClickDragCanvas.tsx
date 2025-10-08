import { useState } from "react";
import { ImageDataCanvas, ImageDataCanvasProps } from "./ImageDataCanvas";
import { Coord2, scale, subtract } from "../math/coord2";
import { levelWidth } from "../bb/game-definitions/level-size";

export function ClickDragCanvas(
	props: Omit<
		ImageDataCanvasProps,
		| "onClick"
		| "onMouseDown"
		| "onMouseUp"
		| "onMouseMove"
		| "onDragStart"
		| "onDragUpdate"
		| "onDragEnd"
	> & {
		onClick?: (coord: Coord2) => void;
		onDragStart?: (coord: Coord2) => void;
		onDragUpdate?: (coord: Coord2) => void;
		onDragEnd?: () => void;
	}
): React.ReactNode {
	const { onDragStart, onDragUpdate, onDragEnd, onClick, ...rest } = props;

	let [dragCoord, setDragCoord] = useState<Coord2 | undefined>(undefined);
	let [hasDragged, setHasDragged] = useState<boolean>(false);

	return (
		<ImageDataCanvas
			{...rest}
			onMouseDown={(event) => {
				const tileCoord: Coord2 = getTileCoord(event);
				if (!dragCoord) {
					onDragStart?.(tileCoord);
				}
				setDragCoord(tileCoord);
				setHasDragged(false);
			}}
			onMouseUp={(event) => {
				if (!hasDragged) {
					onClick?.(getTileCoord(event));
				}
				onDragEnd?.();
				setDragCoord(undefined);
			}}
			onMouseMove={(event) => {
				if (!dragCoord) {
					return;
				}
				const tileCoord: Coord2 = getTileCoord(event);
				if (tileCoord.x === dragCoord.x && tileCoord.y === dragCoord.y) {
					return;
				}
				onDragUpdate?.(tileCoord);
				setDragCoord(tileCoord);
				setHasDragged(true);
			}}
		/>
	);
}

function getTileCoord(event: React.MouseEvent<HTMLCanvasElement, MouseEvent>) {
	const page: Coord2 = { x: event.clientX, y: event.clientY };
	const rect = event.currentTarget.getBoundingClientRect();
	const elementLocation: Coord2 = rect;
	const scaleFactor = rect.width / levelWidth;
	const clickCoord = scale(subtract(page, elementLocation), 1 / scaleFactor);
	const tileCoord: Coord2 = {
		x: Math.floor(clickCoord.x),
		y: Math.floor(clickCoord.y),
	};
	return tileCoord;
}
