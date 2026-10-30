import type { Point } from "../../interfaces/common/types";

const DEFAULT_EPSILON = 1e-9;

/**
 * Drops points that sit on top of the point just before them, which happens where an
 * arc starts or ends on an edge point (rounded corners, fillets) or where a radius is 0.
 * Only neighbours are compared, so a polygon that is closed by repeating its first point
 * as its last one keeps that closing point. Running it twice changes nothing.
 */
export const removeDuplicatePoints = (points: Point[], epsilon: number = DEFAULT_EPSILON): Point[] => {
	const result: Point[] = [];

	for (const point of points) {
		const previous = result[result.length - 1];
		if (previous && Math.abs(point.x - previous.x) <= epsilon && Math.abs(point.y - previous.y) <= epsilon) {
			continue;
		}
		result.push(point);
	}

	return result;
};
