import type { HollowRectangleGeometry, RoundedHollowRectangleGeometry } from "@/shared/shapes/types/RectSection.types";
import { GenericBeamView } from "./GenericBeamView";

/**
 * Hollow rectangle. The polygon is the outer ring followed by the inner ring (see
 * HollowRectangleStrategy), so both rings go into one path and an even-odd fill leaves
 * the hole empty, without erasing what is drawn behind it.
 */
export class HollowRectangleBeam extends GenericBeamView<HollowRectangleGeometry | RoundedHollowRectangleGeometry> {

	protected override _fillRule: CanvasFillRule = 'evenodd';

	protected override _buildPath(): Path2D {
		const points = this._cachedPathPoints;
		const { outer } = this._deps.getHollowRectangleRingLengths(this._geometryConfig);

		const path = new Path2D();
		for (const ring of [points.slice(0, outer), points.slice(outer)]) {
			path.moveTo(ring[0].x, ring[0].y);
			for (let i = 1; i < ring.length; i++) {
				path.lineTo(ring[i].x, ring[i].y);
			}
			path.closePath();
		}
		return path;
	}
}
