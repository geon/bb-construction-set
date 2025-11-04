export function clamp(a: number, min: number, max: number): number {
	return Math.min(max, Math.max(min, a));
}
