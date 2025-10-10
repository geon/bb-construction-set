import { useState } from "react";
import { ImageDataCanvas, ImageDataCanvasProps } from "./ImageDataCanvas";
import { Coord2, equal, floor, scale, subtract } from "../math/coord2";
import { levelWidth } from "../bb/game-definitions/level-size";

export type ClickDragCanvasDragEventHandlers = {
	onClick?: (coord: Coord2) => void;
	onDragStart?: (coord: Coord2) => void;
	onDragUpdate?: (coord: Coord2) => void;
	onDragEnd?: () => void;
};

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
	> &
		ClickDragCanvasDragEventHandlers
): React.ReactNode {
	const { onDragStart, onDragUpdate, onDragEnd, onClick, ...rest } = props;

	let [dragCoord, setDragCoord] = useState<Coord2 | undefined>(undefined);
	let [hasDragged, setHasDragged] = useState<boolean>(false);

	return (
		<ImageDataCanvas
			{...rest}
			onMouseDown={(event) => {
				const eventCoord = getEventCoord(event);
				if (!dragCoord) {
					onDragStart?.(eventCoord);
				}
				setDragCoord(eventCoord);
				setHasDragged(false);
			}}
			onMouseUp={(event) => {
				if (!hasDragged) {
					onClick?.(getEventCoord(event));
				}
				onDragEnd?.();
				setDragCoord(undefined);
			}}
			onMouseMove={(event) => {
				if (!dragCoord) {
					return;
				}
				const eventCoord = getEventCoord(event);
				if (equal(eventCoord, dragCoord)) {
					return;
				}
				onDragUpdate?.(eventCoord);
				setDragCoord(eventCoord);
				setHasDragged(true);
			}}
		/>
	);
}

function getEventCoord(event: React.MouseEvent<HTMLCanvasElement, MouseEvent>) {
	const page: Coord2 = { x: event.clientX, y: event.clientY };
	const elementLocation: Coord2 = event.currentTarget.getBoundingClientRect();
	const scaleFactor =
		levelWidth / event.currentTarget.getBoundingClientRect().width;
	const clickCoord = scale(subtract(page, elementLocation), scaleFactor);
	const eventCoord = floor(clickCoord);
	return eventCoord;
}
