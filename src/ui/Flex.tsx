import styled, { css } from "styled-components";

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
		readonly $spaceBetween?: boolean;
	}
>`
	display: flex;
	flex-direction: ${(props) => ("$col" in props ? "column" : "row")};
	gap: ${({ $gap }) => $gap ?? "1em"};
	${({ $spaceBetween }) =>
		!$spaceBetween
			? ""
			: css`
					justify-content: space-between;
			  `};
`;
