import styled, { css } from "styled-components";

export const Flex = styled.div<
	(
		| {
				readonly $row: true;
		  }
		| {
				readonly $col: true;
		  }
	) &
		(
			| {
					readonly $spaceBetween: true;
			  }
			| {
					readonly $center: true;
			  }
			| {}
		) & {
			readonly $gap?: string;
		}
>`
	display: flex;
	flex-direction: ${(props) => ("$col" in props ? "column" : "row")};
	gap: ${({ $gap }) => $gap ?? "1em"};
	${(props) =>
		!("$spaceBetween" in props)
			? ""
			: css`
					justify-content: space-between;
				`};
	${(props) =>
		!("$center" in props)
			? ""
			: css`
					justify-content: center;
				`};
`;
