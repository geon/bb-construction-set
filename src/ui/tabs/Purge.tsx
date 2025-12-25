import { ReactNode } from "react";

export function Purge(props: { readonly purge: () => void }): ReactNode {
	return (
		<button onClick={() => props.purge()}>
			Purge everything but graphics and levels
		</button>
	);
}
