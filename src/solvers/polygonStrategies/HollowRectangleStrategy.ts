import { SHAPE_TYPES } from "../../interfaces/beams/common.types";
import type { Geometry } from "../../interfaces/beams/common.types";
import type { HollowRectangleGeometry, RoundedHollowRectangleGeometry } from "../../interfaces/beams/RectSection.types";
import type { Point } from "../../interfaces/common/types";
import { buildArcPoints } from "../poligonUtils/buildArcPoints";
import { removeDuplicatePoints } from "../poligonUtils/removeDuplicatePoints";
import { AbstractPolygonBuildStrategy } from "./AbstractPolygonBuildStrategy";

/**
 * Number of points in the outer and the inner ring of the polygon HollowRectangleStrategy builds
 * for this geometry. The rings are cleaned of duplicate points separately, so they can differ in
 * length, and whoever splits the polygon back into rings has to use these.
 */
export const getHollowRectangleRingLengths = (
	geometry: HollowRectangleGeometry | RoundedHollowRectangleGeometry
): { outer: number; inner: number } => new HollowRectangleStrategy().getRingLengths(geometry);

/**
 * Hollow rectangle (optionally with rounded corners). The polygon is the outer ring
 * followed by the inner ring. Use getHollowRectangleRingLengths to split it back into rings.
 * One radius `r` is used for both rings.
 */
export class HollowRectangleStrategy extends AbstractPolygonBuildStrategy<HollowRectangleGeometry | RoundedHollowRectangleGeometry> {
	test(geometry: Geometry) {
		return geometry.type === SHAPE_TYPES.HOLLOW_RECTANGLE || geometry.type === SHAPE_TYPES.HOLLOW_ROUNDED_RECTANGLE;
	}

	execute(geometry: HollowRectangleGeometry | RoundedHollowRectangleGeometry) {
		const { outer, inner } = this._buildRings(geometry);
		return this._rotatePolygon([...outer, ...inner], { x: 0, y: 0 }, geometry.rotation);
	}

	getRingLengths(geometry: HollowRectangleGeometry | RoundedHollowRectangleGeometry): { outer: number; inner: number } {
		const { outer, inner } = this._buildRings(geometry);
		return { outer: outer.length, inner: inner.length };
	}

	/** the radius is clamped and the segments rounded up the same way for both rings */
	private _buildRings(geometry: HollowRectangleGeometry | RoundedHollowRectangleGeometry) {
		const { w1, h1, w2, h2, r } = geometry;
		const rounded = geometry.type === SHAPE_TYPES.HOLLOW_ROUNDED_RECTANGLE;

		// a whole number from the unclamped radius, so both rings get the same count and every arc ends on its end angle
		const segments = AbstractPolygonBuildStrategy.remapRadiusToSegments(r);

		// each ring is cleaned on its own, so the two keep their own length
		return {
			outer: removeDuplicatePoints(this._buildRing(w1, h1, r, segments, rounded)),
			inner: removeDuplicatePoints(this._buildRing(w2, h2, r, segments, rounded)),
		};
	}

	/**
	 * Closed ring of a rectangle centered on (0, 0); the last point repeats the first.
	 * Rounded rings keep the same point count for any radius (even 0) until duplicates are removed.
	 */
	private _buildRing(w: number, h: number, r: number, segments: number, rounded: boolean): Point[] {
		const hW = w / 2;
		const hH = h / 2;

		if (!rounded) {
			return [
				{ x: -hW, y: -hH },
				{ x: -hW, y: hH },
				{ x: hW, y: hH },
				{ x: hW, y: -hH },
				{ x: -hW, y: -hH },
			];
		}

		// a corner can never be rounder than the rectangle is wide
		const rr = Math.max(0, Math.min(r, hW, hH));

		return [
			{ x: -hW, y: -hH + rr },
			{ x: -hW, y: hH - rr },
			...buildArcPoints({ x: -hW + rr, y: hH - rr }, rr, Math.PI, Math.PI / 2, segments),
			{ x: hW - rr, y: hH },
			...buildArcPoints({ x: hW - rr, y: hH - rr }, rr, Math.PI / 2, 0, segments),
			{ x: hW, y: -hH + rr },
			...buildArcPoints({ x: hW - rr, y: -hH + rr }, rr, 0, -Math.PI / 2, segments),
			{ x: -hW + rr, y: -hH },
			...buildArcPoints({ x: -hW + rr, y: -hH + rr }, rr, Math.PI * 1.5, Math.PI, segments),
		];
	}
}
