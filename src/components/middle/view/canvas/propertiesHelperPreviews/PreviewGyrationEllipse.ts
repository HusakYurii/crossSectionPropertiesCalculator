import type { Point } from "../../../../../interfaces/common/types";
import type { DrawableTarget } from "../DrawTargetsCollection";
import { getScaledSize } from "../drawUtils";
import { GYRATION_ELLIPSE_COLOR } from "../constants/axisColors";

const LINE_WIDTH = 1.5;
const DASH = [7, 5];

export type GyrationEllipseParams = {
	/** semi-axis along the principal U axis, in world units */
	semiAxisU: number;
	/** semi-axis along the principal V axis, in world units */
	semiAxisV: number;
	/** angle of the U axis, counterclockwise from world X, in radians */
	rotation: number;
	/** where the ellipse is centered, in world coordinates; the world origin when left out */
	center?: Point;
};

/**
 * Dashed ellipse of gyration (the central ellipse) centered on the shape centroid: the world origin in
 * the shape preview, or the `center` that is given. Its size is in world units, so it grows and shrinks with the shape.
 *
 * The radius of gyration about an axis is laid off along the PERPENDICULAR axis: the ellipse is long
 * where the section is long. So the semi-axis along U is r_v and the one along V is r_u. With that
 * convention the distance from the center to the ellipse's tangent that is parallel to any axis equals
 * the radius of gyration about that axis.
 */
export class PreviewGyrationEllipse implements DrawableTarget {
	public readonly uid = 'preview-gyration-ellipse';

	private _semiAxisU = 0;
	private _semiAxisV = 0;
	private _rotation = 0;
	private _center: Point = { x: 0, y: 0 };

	setEllipse(params: GyrationEllipseParams): void {
		this._semiAxisU = params.semiAxisU;
		this._semiAxisV = params.semiAxisV;
		this._rotation = params.rotation;
		this._center = params.center ? { x: params.center.x, y: params.center.y } : { x: 0, y: 0 };
	}

	draw(props: { context: CanvasRenderingContext2D }): void {
		const { context } = props;

		// nothing to draw before the first calculation, or for a shape without area (a negative radius would throw)
		if (!(this._semiAxisU > 0) || !(this._semiAxisV > 0)) {
			return;
		}

		const strokeStyle = context.strokeStyle;
		const lineWidth = context.lineWidth;
		const dash = context.getLineDash();

		context.strokeStyle = GYRATION_ELLIPSE_COLOR;
		context.lineWidth = getScaledSize(context, LINE_WIDTH);
		context.setLineDash(DASH.map((value) => getScaledSize(context, value)));

		context.beginPath();
		context.ellipse(this._center.x, this._center.y, this._semiAxisU, this._semiAxisV, this._rotation, 0, Math.PI * 2);
		context.stroke();

		context.strokeStyle = strokeStyle;
		context.lineWidth = lineWidth;
		context.setLineDash(dash);
	}
}
