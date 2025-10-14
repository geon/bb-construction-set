import { Coord2 } from "../math/coord2";
import { ParsedInput } from "./ParsedInput";
import { Setter } from "./types";

export function CoordFields(props: {
	coord: Coord2;
	onChange: Setter<Coord2>;
}): React.ReactNode {
	return (
		<>
			<AxisField {...props} axis="x" />
			<AxisField {...props} axis="y" />
		</>
	);
}

function AxisField(props: {
	coord: Coord2;
	onChange: Setter<Coord2>;
	axis: keyof Coord2;
}): React.ReactNode {
	return (
		<label>
			{props.axis}:{" "}
			<ParsedInput
				value={props.coord[props.axis]}
				onChange={(newValue) =>
					props.onChange({ ...props.coord, [props.axis]: newValue })
				}
				parse={(text) => {
					const num = parseInt(text, 10);
					if (Number.isNaN(num)) {
						return undefined;
					}
					// Only half precision on x-axis.
					return props.axis === "x" ? Math.floor(num / 2) * 2 : num;
				}}
				serialize={(value) => value.toString()}
			/>
		</label>
	);
}
