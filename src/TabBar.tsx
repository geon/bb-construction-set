import React, { ComponentPropsWithoutRef, ReactNode } from "react";
import styled from "styled-components";

interface TabBarItemStyleProps {
	readonly active: boolean;
}
const TabBarItemStyle = styled(
	({
		active,
		...props
	}: TabBarItemStyleProps & ComponentPropsWithoutRef<"button">) => (
		<button
			{...props}
			className={props.className + " " + (active ? "active" : "")}
		/>
	)
)<TabBarItemStyleProps>``;

export const TabBarStyle = styled.div`
	display: flex;
	flex-direction: row;
	gap: 1em;

	${TabBarItemStyle} {
		position: relative;
		&:before {
			content: "";
			position: absolute;
			left: 50%;
			top: calc(100% + 10px);
			width: 5px;
			height: 5px;
			border-radius: 100%;

			background: transparent;
			transition: background 0.2s;
		}

		&.active {
			&:before {
				background: rgba(255, 255, 255, 0.87);
				@media (prefers-color-scheme: light) {
					background: #213547;
				}
				transition: background 0.2s;
			}
		}
	}
`;

type Tab = {
	readonly title: string | ReactNode;
	readonly render: () => ReactNode | ReadonlyArray<ReactNode>;
};

export function TabBar<TId extends string, TInitialTabId extends TId>(props: {
	readonly initialTabId: TInitialTabId;
	readonly tabs: Record<TId, Tab>;
}): ReactNode {
	const [activeTabId, setActiveTabId] = React.useState<TId>(props.initialTabId);

	return (
		<>
			<TabBarStyle>
				{entries(props.tabs).map(([id, tab]) => {
					return (
						<TabBarItemStyle
							key={id}
							active={id === activeTabId}
							onClick={() => setActiveTabId(id)}
						>
							{tab.title}
						</TabBarItemStyle>
					);
				})}
			</TabBarStyle>
			{props.tabs[activeTabId].render()}
		</>
	);
}

function entries<TKey extends string, TValue>(
	record: Record<TKey, TValue>
): (readonly [TKey, TValue])[] {
	return Object.entries(record) as unknown as (readonly [TKey, TValue])[];
}
