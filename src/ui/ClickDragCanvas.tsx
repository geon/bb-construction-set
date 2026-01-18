import { useState } from "react";
import { ImageDataCanvas, ImageDataCanvasProps } from "./ImageDataCanvas";
import {
	Coord2,
	divide,
	equal,
	floor,
	multiply,
	subtract,
} from "../math/coord2";

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
		ClickDragCanvasDragEventHandlers,
): React.ReactNode {
	const { onDragStart, onDragUpdate, onDragEnd, onClick, ...rest } = props;

	let [dragCoord, setDragCoord] = useState<Coord2 | undefined>(undefined);
	let [hasDragged, setHasDragged] = useState<boolean>(false);

	const imageSize: Coord2 = {
		x: props.imageData.width,
		y: props.imageData.height,
	};

	return (
		<ImageDataCanvas
			{...rest}
			onMouseDown={(event) => {
				const eventCoord = getEventCoord(event, imageSize);
				if (!dragCoord) {
					onDragStart?.(eventCoord);
				}
				setDragCoord(eventCoord);
				setHasDragged(false);
			}}
			onMouseUp={(event) => {
				if (!hasDragged) {
					onClick?.(getEventCoord(event, imageSize));
				}
				onDragEnd?.();
				setDragCoord(undefined);
			}}
			onMouseMove={(event) => {
				if (!dragCoord) {
					return;
				}
				const eventCoord = getEventCoord(event, imageSize);
				if (equal(eventCoord, dragCoord)) {
					return;
				}
				onDragUpdate?.(eventCoord);
				setDragCoord(eventCoord);
				setHasDragged(true);
			}}
			onMouseLeave={() => {
				onDragEnd?.();
				setDragCoord(undefined);
			}}
			onMouseEnter={(event) => {
				if (event.buttons === 1) {
					// The user is still dragging or started dragging outside, so start dragging.
					const eventCoord = getEventCoord(event, imageSize);
					if (!dragCoord) {
						onDragStart?.(eventCoord);
					}
					setDragCoord(eventCoord);
					setHasDragged(false);
				}
			}}
		/>
	);
}

function getEventCoord(
	event: React.MouseEvent<HTMLCanvasElement, MouseEvent>,
	imageSize: Coord2,
) {
	const eventCoordOnPage: Coord2 = { x: event.clientX, y: event.clientY };
	const elementLocation: Coord2 = event.currentTarget.getBoundingClientRect();
	const eventCoordOnElement = subtract(eventCoordOnPage, elementLocation);
	const elementSize: Coord2 = {
		x: event.currentTarget.getBoundingClientRect().width,
		y: event.currentTarget.getBoundingClientRect().height,
	};
	return floor(multiply(imageSize, divide(eventCoordOnElement, elementSize)));
}
