import type { DrawTarget } from "../../../../interfaces/common/types";
import type { Point } from "../../../../interfaces/common/types";
import { getScaledLineWidth } from "../beams";
import { PIVOT, drawUprightText, getScaledSize } from "../canvas/drawUtils";
import { AXIS_STYLE } from "../../../../constants/canvasStyle";

export type MainAxisOptions = {
	/** write X and Y near the edges of the canvas, on their axes; off when left out */
	showLabels?: boolean;
	/** in screen px; PreviewAxis's default size when left out */
	labelFontSize?: number;
};

/**
 * X and Y axes through the world origin, drawn across the whole visible
 * canvas so they look infinite at any pan or zoom.
 */
export class MainAxis implements DrawTarget {
	static uid = 'mainAxis';

	public uid = MainAxis.uid;

	public showDebug: boolean = false;

	private _showLabels: boolean;
	private _labelFontSize: number;

	constructor(options: MainAxisOptions = {}) {
		this._showLabels = options.showLabels ?? false;
		this._labelFontSize = options.labelFontSize ?? AXIS_STYLE.LABEL_FONT_SIZE;
	}

	contains(_point: Point) {
		return false
	}

	intersect(_polygon: Point[]): boolean {
		return false;
	}

	draw(props: { context: CanvasRenderingContext2D; }) {

		const strokeStyle = props.context.strokeStyle;
		const fillStyle = props.context.fillStyle;
		const lineWidth = props.context.lineWidth;

		// visible world rect: invert the current transform for the canvas corners
		// (no rotation/skew here, so only scale a/d and translation e/f matter)
		const { a, d, e, f } = props.context.getTransform();
		const { width, height } = props.context.canvas;
		if (!a || !d) {
			return;
		}

		const worldX1 = (0 - e) / a;
		const worldX2 = (width - e) / a;
		const worldY1 = (0 - f) / d;
		const worldY2 = (height - f) / d;

		const minX = Math.min(worldX1, worldX2);
		const maxX = Math.max(worldX1, worldX2);
		const minY = Math.min(worldY1, worldY2);
		const maxY = Math.max(worldY1, worldY2);

		props.context.lineWidth = getScaledLineWidth(props.context);

		props.context.strokeStyle = AXIS_STYLE.COLORS.x;
		props.context.beginPath();
		props.context.moveTo(minX, 0);
		props.context.lineTo(maxX, 0);
		props.context.stroke();

		props.context.strokeStyle = AXIS_STYLE.COLORS.y;
		props.context.beginPath();
		props.context.moveTo(0, minY);
		props.context.lineTo(0, maxY);
		props.context.stroke();

		if (this._showLabels) {
			const inset = getScaledSize(props.context, AXIS_STYLE.LABEL_INSET);
			// a bigger label gets a bigger gap, as in PreviewAxis, so it doesn't touch the line
			const gap = getScaledSize(props.context, AXIS_STYLE.LABEL_GAP * this._labelFontSize / AXIS_STYLE.LABEL_FONT_SIZE);
			const half = getScaledSize(props.context, this._labelFontSize / 2);
			// the labels stay at the edges while panning; an axis that is out of view has none.
			// When the line is too close to the edge for the label, it goes to the other side of the line, so it is never cut off or crossed.
			if (minY <= 0 && maxY >= 0) {
				const at = { x: maxX - inset, y: maxY - gap >= half ? gap : -gap };
				drawUprightText(props.context, 'X', at, AXIS_STYLE.COLORS.x, this._labelFontSize, PIVOT.CENTER);
			}
			if (minX <= 0 && maxX >= 0) {
				const at = { x: maxX - gap >= half ? gap : -gap, y: maxY - inset };
				drawUprightText(props.context, 'Y', at, AXIS_STYLE.COLORS.y, this._labelFontSize, PIVOT.CENTER);
			}
		}

		props.context.strokeStyle = strokeStyle;
		props.context.fillStyle = fillStyle;
		props.context.lineWidth = lineWidth;

	}

	drawDebug(_props: { context: CanvasRenderingContext2D }): void {
	}

}
