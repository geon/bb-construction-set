import styled from "styled-components";

export const Flex = styled.div<
	(
		| {
				readonly $row: true;
		  }
		| {
				readonly $col: true;
		  }
	) & {
		readonly $gap?: string;
	}
>`
	display: flex;
	flex-direction: ${(props) => ("$col" in props ? "column" : "row")};
	gap: ${({ $gap }) => $gap ?? "1em"};
`;
