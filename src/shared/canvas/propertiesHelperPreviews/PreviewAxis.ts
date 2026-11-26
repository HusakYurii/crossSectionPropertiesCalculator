import type { Point } from "@/shared/types/geometry";
import type { DrawableTarget } from "../core/DrawTargetsCollection.types";
import { PIVOT, cssPxToWorld, drawUprightText, getScaledSize } from "../core/drawUtils";
import { AXIS_STYLE } from '../canvasStyle';

export type PreviewAxisParams = {
	uid: string;
	xLabel: string;
	yLabel: string;
	xColor: string;
	yColor: string;
	/** dash pattern in screen px, [dash, gap, dash, gap, ...] */
	dash?: number[];
	/** font size of the two labels in screen px; 18 when left out */
	labelFontSize?: number;
	/** CSS px kept free under the top edge of the canvas for the labels, so they stay clear of what floats over it; 0 when left out */
	labelTopReserve?: number;
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
	private _labelFontSize: number;
	private _labelTopReserve: number;
	private _rotation = 0;
	private _center: Point = { x: 0, y: 0 };
	private _visible = true;

	constructor(params: PreviewAxisParams) {
		this.uid = params.uid;
		this._xLabel = params.xLabel;
		this._yLabel = params.yLabel;
		this._xColor = params.xColor;
		this._yColor = params.yColor;
		this._dash = params.dash ?? [...AXIS_STYLE.DASH];
		this._labelFontSize = params.labelFontSize ?? AXIS_STYLE.LABEL_FONT_SIZE;
		this._labelTopReserve = params.labelTopReserve ?? 0;
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

		context.lineWidth = getScaledSize(context, AXIS_STYLE.LINE_WIDTH);
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
		const inset = getScaledSize(context, AXIS_STYLE.LABEL_INSET);
		// the gap grows with the font, so a bigger label does not touch its line
		const gap = getScaledSize(context, AXIS_STYLE.LABEL_GAP * this._labelFontSize / AXIS_STYLE.LABEL_FONT_SIZE);
		// the lowest y a label may have; above it the label would sit under what floats over the top of the canvas
		const limit = Math.max(worldY1, worldY2) - cssPxToWorld(context, this._labelTopReserve) - getScaledSize(context, this._labelFontSize / 2);
		const xLabelAt = this._labelPosition(xDir, yDir, xPos - inset, gap, cx, cy, limit);
		const yLabelAt = this._labelPosition(yDir, xDir, yPos - inset, gap, cx, cy, limit);
		drawUprightText(context, this._xLabel, xLabelAt, this._xColor, this._labelFontSize, PIVOT.CENTER);
		drawUprightText(context, this._yLabel, yLabelAt, this._yColor, this._labelFontSize, PIVOT.CENTER);

		context.strokeStyle = strokeStyle;
		context.fillStyle = fillStyle;
		context.lineWidth = lineWidth;
		context.setLineDash(dash);
	}

	/**
	 * Where a label sits: `t` along its axis (`dir`), nudged `gap` toward the other axis (`perp`). A label above `limit`
	 * slides back along its own axis when that axis points upward, otherwise it goes to the lower side of its line.
	 */
	private _labelPosition(dir: Point, perp: Point, t: number, gap: number, cx: number, cy: number, limit: number): Point {
		const at = (along: number, side: number): Point => ({
			x: cx + dir.x * along + perp.x * side,
			y: cy + dir.y * along + perp.y * side,
		});
		const first = at(t, gap);
		if (first.y <= limit) {
			return first;
		}
		if (dir.y > 0.2) {
			const slid = t - (first.y - limit) / dir.y;
			if (slid >= 0) {
				return at(slid, gap);
			}
		}
		// the lower side of the line
		return at(t, perp.y > 0 ? -gap : gap);
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
