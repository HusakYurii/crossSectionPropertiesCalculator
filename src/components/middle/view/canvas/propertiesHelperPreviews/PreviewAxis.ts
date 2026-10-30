import type { Point } from "../../../../../interfaces/common/types";
import type { DrawableTarget } from "../DrawTargetsCollection";
import { PIVOT, drawUprightText, getScaledSize } from "../drawUtils";

const LINE_WIDTH = 1.5;
const DASH_SIZE = 8;
const GAP_SIZE = 6;
const LABEL_FONT_SIZE = 18;
const LABEL_INSET = 40;
const LABEL_GAP = 12;

export type PreviewAxisParams = {
	uid: string;
	xLabel: string;
	yLabel: string;
	xColor: string;
	yColor: string;
	/** dash pattern in screen px, [dash, gap, dash, gap, ...] */
	dash?: number[];
};

/**
 * A pair of dashed perpendicular axes through a center (the world origin unless `setCenter` says
 * otherwise; in the shape preview the origin is the shape centroid). They are turned by `setRotation`,
 * run across the whole visible canvas and carry a label near the far end of each.
 * Used for the shape's own x / y axes and for its principal u / v axes.
 */
export class PreviewAxis implements DrawableTarget {
	public readonly uid: string;

	private _xLabel: string;
	private _yLabel: string;
	private _xColor: string;
	private _yColor: string;
	private _dash: number[];
	private _rotation = 0;
	private _center: Point = { x: 0, y: 0 };
	private _visible = true;

	constructor(params: PreviewAxisParams) {
		this.uid = params.uid;
		this._xLabel = params.xLabel;
		this._yLabel = params.yLabel;
		this._xColor = params.xColor;
		this._yColor = params.yColor;
		this._dash = params.dash ?? [DASH_SIZE, GAP_SIZE];
	}

	setVisible(visible: boolean): void {
		this._visible = visible;
	}

	/** where the axes cross, in world coordinates */
	setCenter(center: Point): void {
		this._center = { x: center.x, y: center.y };
	}

	/** angle of the x axis from the world X axis, counterclockwise, in radians */
	setRotation(radians: number): void {
		this._rotation = radians;
	}

	draw(props: { context: CanvasRenderingContext2D }): void {
		const { context } = props;
		if (!this._visible) {
			return;
		}

		// visible world rect: invert the current transform for the canvas corners
		// (no rotation/skew here, so only scale a/d and translation e/f matter)
		const { a, d, e, f } = context.getTransform();
		const { width, height } = context.canvas;
		if (!a || !d) {
			return;
		}

		const worldX1 = (0 - e) / a;
		const worldX2 = (width - e) / a;
		const worldY1 = (0 - f) / d;
		const worldY2 = (height - f) / d;

		// the visible rect relative to the center, because the rays below start at the center
		const { x: cx, y: cy } = this._center;
		const rect = {
			minX: Math.min(worldX1, worldX2) - cx,
			maxX: Math.max(worldX1, worldX2) - cx,
			minY: Math.min(worldY1, worldY2) - cy,
			maxY: Math.max(worldY1, worldY2) - cy,
		};

		// the shape's axes in world space; rotating the context instead would
		// distort getScaledSize, which reads the transform scale
		const cos = Math.cos(this._rotation);
		const sin = Math.sin(this._rotation);
		const xDir: Point = { x: cos, y: sin };
		const yDir: Point = { x: -sin, y: cos };

		const strokeStyle = context.strokeStyle;
		const fillStyle = context.fillStyle;
		const lineWidth = context.lineWidth;
		const dash = context.getLineDash();

		context.lineWidth = getScaledSize(context, LINE_WIDTH);
		context.setLineDash(this._dash.map((value) => getScaledSize(context, value)));

		const xPos = PreviewAxis._rayLength(xDir, rect);
		const xNeg = PreviewAxis._rayLength({ x: -xDir.x, y: -xDir.y }, rect);
		const yPos = PreviewAxis._rayLength(yDir, rect);
		const yNeg = PreviewAxis._rayLength({ x: -yDir.x, y: -yDir.y }, rect);

		context.strokeStyle = this._xColor;
		context.beginPath();
		context.moveTo(cx - xDir.x * xNeg, cy - xDir.y * xNeg);
		context.lineTo(cx + xDir.x * xPos, cy + xDir.y * xPos);
		context.stroke();

		context.strokeStyle = this._yColor;
		context.beginPath();
		context.moveTo(cx - yDir.x * yNeg, cy - yDir.y * yNeg);
		context.lineTo(cx + yDir.x * yPos, cy + yDir.y * yPos);
		context.stroke();

		context.setLineDash([]);

		// labels sit near the positive end of each axis, nudged off the line toward the other axis
		const inset = getScaledSize(context, LABEL_INSET);
		const gap = getScaledSize(context, LABEL_GAP);
		const xLabelAt: Point = {
			x: cx + xDir.x * (xPos - inset) + yDir.x * gap,
			y: cy + xDir.y * (xPos - inset) + yDir.y * gap,
		};
		const yLabelAt: Point = {
			x: cx + yDir.x * (yPos - inset) + xDir.x * gap,
			y: cy + yDir.y * (yPos - inset) + xDir.y * gap,
		};
		drawUprightText(context, this._xLabel, xLabelAt, this._xColor, LABEL_FONT_SIZE, PIVOT.CENTER);
		drawUprightText(context, this._yLabel, yLabelAt, this._yColor, LABEL_FONT_SIZE, PIVOT.CENTER);

		context.strokeStyle = strokeStyle;
		context.fillStyle = fillStyle;
		context.lineWidth = lineWidth;
		context.setLineDash(dash);
	}

	/** distance from the center to where a ray along `dir` leaves the rect, which is given relative to the center (0 if the center is outside) */
	private static _rayLength(
		dir: Point,
		rect: { minX: number; maxX: number; minY: number; maxY: number }
	): number {
		const tx = dir.x > 1e-9 ? rect.maxX / dir.x : dir.x < -1e-9 ? rect.minX / dir.x : Infinity;
		const ty = dir.y > 1e-9 ? rect.maxY / dir.y : dir.y < -1e-9 ? rect.minY / dir.y : Infinity;
		const t = Math.min(tx, ty);
		return Number.isFinite(t) ? Math.max(t, 0) : 0;
	}
}
