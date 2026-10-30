import type { Point } from "../../../../../interfaces/common/types";
import {
	PIVOT,
	drawUprightText,
	getScaledSize,
	measureUprightTextBox,
} from "../drawUtils";
import { BaseDimensions, type DimensionGeometry } from "./BaseDimensions";

const LINE_WIDTH = 1.89;
const ARROW_HEAD_SIZE = 9.45;
const LABEL_FONT_SIZE = 22;
const EXTENSION_OVERSHOOT = 8;
const LABEL_PADDING = 6;
const MIN_ARROW_SPAN = 40;
// the canvas background (--color-surface-canvas), so the box that sits on the line leaves no visible edge
const DEFAULT_LABEL_BACKGROUND = '#fafbfc';

export type DimensionsWithLabelParams = {
	uid: string;
	start: Point;
	end: Point;
	/** axis the dimension line is parallel to, in the shape's own frame */
	along: 'X' | 'Y';
	/** shape rotation in radians; turns the axes (and so the line, extension lines and offset) with the shape */
	rotation?: number;
	/**
	 * Screen-pixel distance of the dimension line from the anchors, perpendicular
	 * to `along`. Sign picks the side in the shape's frame (world y is up: +y is
	 * up, +x is right when unrotated).
	 */
	offset: number;
	label: string;
	color?: string;
	/** fill of the box behind the label; the canvas color unless the dimension is drawn on something else */
	labelBackground?: string;
};

/**
 * Static annotation: extension lines from two anchors and a dimension line
 * with arrow heads, from BaseDimensions. The label is centered on the line with a background box under
 * it, so the line looks as if it runs through the text without being drawn through it.
 */
export class DimensionsWithLabel extends BaseDimensions {
	private _start: Point;
	private _end: Point;
	private _along: 'X' | 'Y';
	private _rotation: number;
	private _offset: number;
	private _label: string;
	private _labelBackground: string;

	constructor(params: DimensionsWithLabelParams) {
		super(params.uid, {
			color: params.color ?? 'black',
			lineWidth: LINE_WIDTH,
			arrowHeadSize: ARROW_HEAD_SIZE,
		});
		this._start = params.start;
		this._end = params.end;
		this._along = params.along;
		this._rotation = params.rotation ?? 0;
		this._offset = params.offset;
		this._label = params.label;
		this._labelBackground = params.labelBackground ?? DEFAULT_LABEL_BACKGROUND;
	}

	/** the unit vector the offset runs along (perpendicular to the line), and which side of the shape it is on */
	private _normalAndSide(): { normal: Point; side: number } {
		// the shape's axes in world space: the line runs along one, its offset along the other
		const cos = Math.cos(this._rotation);
		const sin = Math.sin(this._rotation);
		const normal = this._along === 'X' ? { x: -sin, y: cos } : { x: cos, y: sin };
		return { normal, side: Math.sign(this._offset) || 1 };
	}

	protected _getGeometry(context: CanvasRenderingContext2D): DimensionGeometry {
		const { normal, side } = this._normalAndSide();
		const offset = getScaledSize(context, this._offset);
		const overshoot = getScaledSize(context, EXTENSION_OVERSHOOT) * side;

		// dimension line endpoints: anchors pushed along the normal
		const from = { x: this._start.x + normal.x * offset, y: this._start.y + normal.y * offset };
		const to = { x: this._end.x + normal.x * offset, y: this._end.y + normal.y * offset };

		// extension lines: anchor -> a bit past the dimension line
		const reach = (tip: Point): Point => ({ x: tip.x + normal.x * overshoot, y: tip.y + normal.y * overshoot });
		return {
			from,
			to,
			extensionLines: [[this._start, reach(from)], [this._end, reach(to)]],
		};
	}

	protected _drawLabel(context: CanvasRenderingContext2D, { from, to }: DimensionGeometry): void {
		const mid = { x: (from.x + to.x) / 2, y: (from.y + to.y) / 2 };
		const box = measureUprightTextBox(context, this._label, mid, LABEL_FONT_SIZE, PIVOT.CENTER);
		const padding = getScaledSize(context, LABEL_PADDING);

		const length = Math.hypot(to.x - from.x, to.y - from.y);
		const dir = length ? { x: (to.x - from.x) / length, y: (to.y - from.y) / length } : { x: 1, y: 0 };
		// half the label's extent measured along the line, so a tilted line still leaves room for the box
		const halfGap = (Math.abs(dir.x) * box.width + Math.abs(dir.y) * box.height) / 2 + padding;

		if (length >= 2 * halfGap + getScaledSize(context, MIN_ARROW_SPAN)) {
			// the text is centered on the line, on top of a box in the canvas color that hides the line behind it
			context.fillStyle = this._labelBackground;
			context.fillRect(box.x - padding, box.y - padding, box.width + 2 * padding, box.height + 2 * padding);

			drawUprightText(context, this._label, mid, this._style.color, LABEL_FONT_SIZE, PIVOT.CENTER);
			return;
		}

		// too short for the label on the line without covering an arrow head: it goes just outside the line, with no box
		const { normal, side } = this._normalAndSide();
		const outward = { x: normal.x * side, y: normal.y * side };
		const pivot = { x: 0.5 - 0.5 * outward.x, y: 0.5 + 0.5 * outward.y };
		drawUprightText(context, this._label, mid, this._style.color, LABEL_FONT_SIZE, pivot);
	}
}
