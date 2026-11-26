import type { Point } from '@/shared/types/geometry';
import { roundTo } from "./round";

/** Snapping of dragged shapes and polygon points. */
export const SNAP = {
	/** the steps the user can pick, in mm */
	STEPS: [10, 5, 1, 0.5, 0.1, 0.05],
	DEFAULT_STEP: 1,
	/** decimals kept when snapping is off (one finer than the smallest step) and after snapping */
	FREE_DECIMALS: 2,
} as const;

export type SnapStep = typeof SNAP.STEPS[number];

/**
 * Shared by every canvas that drags things around (shapes, polygon points).
 * `step` is in mm, or null when snapping is off; then the value is only rounded to SNAP.FREE_DECIMALS.
 */
export function snapValue(value: number, step: number | null): number {
	if (step === null) {
		return roundTo(value, SNAP.FREE_DECIMALS);
	}
	// the inner roundTo fixes ties like 0.35 / 0.1 = 3.4999999999999996, the outer one cleans 0.15000000000000002
	return roundTo(Math.round(roundTo(value / step, 9)) * step, SNAP.FREE_DECIMALS);
}

export function snapPoint(point: Point, step: number | null): Point {
	return { x: snapValue(point.x, step), y: snapValue(point.y, step) };
}

/** the step of the snap control, or null while the magnet is off */
export function getActiveSnapStep(snapping: { enabled: boolean; step: number }): number | null {
	return snapping.enabled ? snapping.step : null;
}

/**
 * `start`: the value the locked axis keeps. `raw`: the unsnapped target. `moveDelta`: the real cursor
 * movement since the press, which picks the axis (|dx| >= |dy| → horizontal). With lock false it is just snapPoint(raw, step).
 * The locked axis is not snapped, so a shape at x = 12.345 stays at 12.345.
 */
export function lockAndSnap(start: Point, raw: Point, moveDelta: Point, step: number | null, lock: boolean): Point {
	if (!lock) {
		return snapPoint(raw, step);
	}
	if (Math.abs(moveDelta.x) >= Math.abs(moveDelta.y)) {
		return { x: snapValue(raw.x, step), y: start.y };
	}
	return { x: start.x, y: snapValue(raw.y, step) };
}
