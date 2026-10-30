import type { Point } from "../../../../interfaces/common/types";

/** distance between two grid lines, in world units */
export const GRID_CELL_SIZE = 10;

/**
 * Dragging always lands on whole numbers; holding Shift snaps to the grid lines instead.
 * Shared by every canvas that drags things around (shapes, polygon points).
 */
export function getSnapStep(event: { shiftKey: boolean }): number {
	return event.shiftKey ? GRID_CELL_SIZE : 1;
}

/** nearest multiple of `step`; `|| 0` turns -0 into 0 so nothing ever shows up as "-0" */
export function snapValue(value: number, step: number): number {
	return (Math.round(value / step) * step) || 0;
}

export function snapPoint(point: Point, step: number): Point {
	return { x: snapValue(point.x, step), y: snapValue(point.y, step) };
}
