import type { Point } from "../../../../../interfaces/common/types";
import type { DrawableTarget } from "../DrawTargetsCollection";
import { drawOriginCross } from "../drawUtils";

// the same cross and size GenericBeamView draws at the shape's origin, which is the centroid in the preview
const COLOR = 'rgba(0, 0, 0, 0.6)';
const CROSS_SIZE = 6;
const LINE_WIDTH = 2.7;

/** Small cross on the shape centroid, for a canvas that draws the shape where it is and not centered on it. */
export class PreviewCentroid implements DrawableTarget {
	public readonly uid = 'preview-centroid';

	private _center: Point = { x: 0, y: 0 };

	setCenter(center: Point): void {
		this._center = { x: center.x, y: center.y };
	}

	draw(props: { context: CanvasRenderingContext2D }): void {
		drawOriginCross(props.context, this._center, COLOR, CROSS_SIZE, LINE_WIDTH);
	}
}
