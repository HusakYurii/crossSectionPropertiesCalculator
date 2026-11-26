import type { Point } from '@/shared/types/geometry';
import type { Store } from '@/store/store';

// two points closer than this (mm) on both axes are the same point
const SAME_POINT_TOLERANCE = 1e-9;

/**
 * The points of a shape's polygon relative to its centroid, so world = position + offset.
 * The closing point of every ring repeats its first one and is dropped; the polygon order is kept.
 */
export function getShapeVertexOffsets(store: Store, uid: string): Point[] {
	const polygon = store.crossSectionPolygon[uid];
	const properties = store.crossSectionProperties[uid];
	if (!polygon || !properties) {
		return [];
	}

	const offsets: Point[] = [];
	for (const p of polygon) {
		const offset = { x: p.x - properties.centroid_x, y: p.y - properties.centroid_y };
		const isKnown = offsets.some((o) => Math.abs(o.x - offset.x) <= SAME_POINT_TOLERANCE && Math.abs(o.y - offset.y) <= SAME_POINT_TOLERANCE);
		!isKnown && offsets.push(offset);
	}
	return offsets;
}
