import { Coord2 } from "../math/coord2";
import { IntegerInput } from "./IntegerInput";
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
			<IntegerInput
				value={props.coord[props.axis]}
				onChange={(newValue) =>
					props.onChange({ ...props.coord, [props.axis]: newValue })
				}
			/>
		</label>
	);
}
