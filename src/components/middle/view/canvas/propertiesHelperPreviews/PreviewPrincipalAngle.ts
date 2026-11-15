import type { Point } from "../../../../../interfaces/common/types";
import { radToDeg } from "../../../../../mathUtils/anglesMath";
import type { DrawableTarget } from "../DrawTargetsCollection";
import { drawUprightText, getScaledSize } from "../drawUtils";
import { AXIS_STYLE, PRINCIPAL_ANGLE_STYLE } from "../../../../../constants/canvasStyle";

// a rotation smaller than this (0.01 degrees) has no arc to draw
const MIN_ARC_ROTATION = 0.01 * Math.PI / 180;
// below this the text goes beside the X axis, above it along the bisector
const BISECTOR_FROM = Math.PI / 4;

export type PreviewPrincipalAngleOptions = {
	/** font size of the text in screen px; the default size of the axis labels when left out */
	fontSize?: number;
};

export type PrincipalAngleParams = {
	/** where the angle is measured at, in world coordinates */
	center: Point;
	/** angle of the U axis, counterclockwise from world X, in radians */
	rotation: number;
};

/**
 * The rotation of the principal axes: an arc at the centroid from world X to the U axis and the text
 * "θp = 12.34°" next to it, in the color of U. A rotation too small to see leaves out the arc and keeps the text.
 */
export class PreviewPrincipalAngle implements DrawableTarget {
	public readonly uid = 'preview-principal-angle';

	private _center: Point = { x: 0, y: 0 };
	private _rotation = 0;
	private _visible = true;
	private _fontSize: number;

	constructor(options: PreviewPrincipalAngleOptions = {}) {
		this._fontSize = options.fontSize ?? AXIS_STYLE.LABEL_FONT_SIZE;
	}

	setVisible(visible: boolean): void {
		this._visible = visible;
	}

	setAngle(params: PrincipalAngleParams): void {
		this._center = { x: params.center.x, y: params.center.y };
		this._rotation = params.rotation;
	}

	draw(props: { context: CanvasRenderingContext2D }): void {
		if (!this._visible) {
			return;
		}

		const { context } = props;
		const { x: cx, y: cy } = this._center;
		const color = AXIS_STYLE.PRINCIPAL_COLORS.u;

		if (Math.abs(this._rotation) > MIN_ARC_ROTATION) {
			const strokeStyle = context.strokeStyle;
			const lineWidth = context.lineWidth;
			const dash = context.getLineDash();

			context.strokeStyle = color;
			context.lineWidth = getScaledSize(context, PRINCIPAL_ANGLE_STYLE.LINE_WIDTH);
			context.setLineDash([]);
			// drawn in world coordinates, where the U axis points at (cos, sin) of the rotation, so the arc ends on it;
			// a negative rotation has to sweep the other way round
			context.beginPath();
			context.arc(cx, cy, getScaledSize(context, PRINCIPAL_ANGLE_STYLE.ARC_RADIUS), 0, this._rotation, this._rotation < 0);
			context.stroke();

			context.strokeStyle = strokeStyle;
			context.lineWidth = lineWidth;
			context.setLineDash(dash);
		}

		// up to 2 decimals; + 0 turns a rounded -0 into 0
		const text = `θp = ${parseFloat(radToDeg(this._rotation).toFixed(2)) + 0}°`;
		const radius = getScaledSize(context, PRINCIPAL_ANGLE_STYLE.ARC_RADIUS);
		if (Math.abs(this._rotation) < BISECTOR_FROM) {
			// a small angle leaves no room beside the arc: the text starts at the arc radius, just off the X axis
			// on the side away from U, so it clears both the axis and the arc (pivot y 0 is the top edge, y 1 the bottom)
			const pad = getScaledSize(context, PRINCIPAL_ANGLE_STYLE.LABEL_PAD);
			const below = this._rotation >= 0;
			drawUprightText(context, text, { x: cx + radius, y: below ? cy - pad : cy + pad }, color, this._fontSize, { x: 0, y: below ? 0 : 1 });
		} else {
			// a big angle: the text sits outside the middle of the arc, with the corner of its box nearest the center on the bisector
			const mid = this._rotation / 2;
			const distance = radius + getScaledSize(context, PRINCIPAL_ANGLE_STYLE.LABEL_GAP);
			const at: Point = { x: cx + Math.cos(mid) * distance, y: cy + Math.sin(mid) * distance };
			drawUprightText(context, text, at, color, this._fontSize, { x: Math.cos(mid) >= 0 ? 0 : 1, y: Math.sin(mid) >= 0 ? 1 : 0 });
		}
	}
}
