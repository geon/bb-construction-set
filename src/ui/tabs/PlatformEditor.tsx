import { Level } from "../../bb/internal-data-formats/level";
import { imageDataFromPaletteImage } from "../../bb/image-data/image-data";
import { drawLevelTiles } from "../../bb/palette-image/level";
import { ClickDragCanvas } from "../ClickDragCanvas";
import { clickDragCanvasEventHandlerProviders } from "../ClickDragCanvasEventHandlerProvider";

export function PlatformEditor(props: {
	readonly level: Level;
	readonly setLevel: (level: Level) => void;
}): JSX.Element {
	return (
		<clickDragCanvasEventHandlerProviders.PlatformEditor
			level={props.level}
			setLevel={props.setLevel}
		>
			{(eventHandlers) => (
				<ClickDragCanvas
					style={{ width: "100%" }}
					imageData={imageDataFromPaletteImage(
						drawLevelTiles(props.level.tiles)
					)}
					{...eventHandlers}
				/>
			)}
		</clickDragCanvasEventHandlerProviders.PlatformEditor>
	);
}
