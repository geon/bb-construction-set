export function getDesignatedPowerupItemIndex(levelIndex: number): number {
	return (32 - levelIndex * 2) & 0x1f;
}
