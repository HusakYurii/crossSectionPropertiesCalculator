import type { Point } from '../../interfaces/common/types';


export function isPointInPolygon(point: Point, polygon: Point[]): boolean {
	if (polygon.length < 3) {
		return false;
	}

	let inside = false;
	const { x, y } = point;

	for (let i = 0, j = polygon.length - 1; i < polygon.length; j = i++) {
		const xi = polygon[i].x;
		const yi = polygon[i].y;
		const xj = polygon[j].x;
		const yj = polygon[j].y;
		const intersectsRay =
			(yi > y) !== (yj > y) &&
			x < ((xj - xi) * (y - yi)) / (yj - yi) + xi;

		if (intersectsRay) {
			inside = !inside;
		}
	}

	return inside;
}

export function doSegmentsIntersect(a1: Point, a2: Point, b1: Point, b2: Point): boolean {
	const denominator =
		(b2.y - b1.y) * (a2.x - a1.x) -
		(b2.x - b1.x) * (a2.y - a1.y);

	if (denominator === 0) {
		return false;
	}

	const ua =
		((b2.x - b1.x) * (a1.y - b1.y) - (b2.y - b1.y) * (a1.x - b1.x)) /
		denominator;
	const ub =
		((a2.x - a1.x) * (a1.y - b1.y) - (a2.y - a1.y) * (a1.x - b1.x)) /
		denominator;

	return ua >= 0 && ua <= 1 && ub >= 0 && ub <= 1;
}

export function doPolygonsIntersect(a: Point[], b: Point[]): boolean {
	if (a.length < 3 || b.length < 3) {
		return false;
	}

	for (let i = 0; i < a.length; i++) {
		const a1 = a[i];
		const a2 = a[(i + 1) % a.length];

		for (let j = 0; j < b.length; j++) {
			const b1 = b[j];
			const b2 = b[(j + 1) % b.length];

			if (doSegmentsIntersect(a1, a2, b1, b2)) {
				return true;
			}
		}
	}

	if (isPointInPolygon(a[0], b)) {
		return true;
	}

	if (isPointInPolygon(b[0], a)) {
		return true;
	}

	return false;
}
