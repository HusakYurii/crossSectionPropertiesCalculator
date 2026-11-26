/** rounds to the given number of decimal places; `|| 0` turns -0 into 0, so a point never shows up as "-0" */
export function roundTo(value: number, decimals: number): number {
	const factor = 10 ** decimals;
	const scaled = value * factor;
	if (!Number.isFinite(scaled)) {
		return value || 0;
	}
	// toPrecision(15) removes float noise, so 0.5005 * 1000 = 500.49999999999994 still rounds up
	return Math.round(Number(scaled.toPrecision(15))) / factor || 0;
}
