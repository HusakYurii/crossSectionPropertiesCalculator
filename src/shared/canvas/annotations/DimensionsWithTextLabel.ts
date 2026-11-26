import type { BoundingBox, Point } from "@/shared/types/geometry";
import type { DimensionLabelOffsetKey } from "@/shared/types/dimensionLabels";
import {
	PIVOT,
	drawUprightText,
	getScaledSize,
	measureUprightTextBox,
} from "../core/drawUtils";
import { CANVAS_FONT, EDITABLE_DIMENSION_STYLE } from '../canvasStyle';
import { BaseDimensions } from "./BaseDimensions";
import type { DimensionGeometry } from "./BaseDimensions.types";
import type { ArrowAxis, DimensionSource } from "./DimensionsWithTextLabel.types";

export type DimensionsWithTextLabelParams = {
	uid: string;
	axis: ArrowAxis;
	/** written before the number, e.g. "Cx: "; nothing when left out */
	labelPrefix?: string;
	/** the point it measures to and the place its offsets are kept */
	source: DimensionSource;
	/** false: the number can be dragged but not edited; true when left out */
	editable?: boolean;
	color: string;
	/** in screen pixels, like every size here; the editor's look when left out */
	lineWidth?: number;
	arrowHeadSize?: number;
};

/**
 * A distance arrow (the source's point -> its X or Y axis) with a draggable
 * label. Dragging offsets the whole arrow line perpendicular to its own
 * axis (an X-axis arrow slides along Y, a Y-axis arrow slides along X);
 * when offset, a dashed connector is drawn back to that point so the
 * reference point is never lost. The number can also slide along the line, even past its ends; a solid
 * line then runs under or beside it. Its position along the line is `along`: the world offset of the number's
 * center from the line's midpoint. Without a stored value it is automatic.
 *
 * A dimension shorter than EDITABLE_DIMENSION_STYLE.SMALL_DIMENSION has its arrow heads outside the ends, on short tails, pointing
 * inward, and its automatic number sits outside too.
 *
 * The lines come from BaseDimensions; this class lays out the number next to the line and keeps its hit box.
 */
export class DimensionsWithTextLabel extends BaseDimensions {
	private _source: DimensionSource;
	private _axis: ArrowAxis;
	private _editable: boolean;
	private _labelPrefix: string;
	// null while there is nothing drawn (before the first draw, or no position)
	private _cachedHitBox: BoundingBox | null = null;
	// where the number goes, worked out by the last layout in _getGeometry
	private _labelAt: Point = { x: 0, y: 0 };
	private _autoAlong = 0;
	// hovered or dragged: the number is drawn bold to show it can be grabbed
	private _isHighlighted = false;

	constructor(params: DimensionsWithTextLabelParams) {
		super(params.uid, {
			color: params.color,
			lineWidth: params.lineWidth ?? EDITABLE_DIMENSION_STYLE.LINE_WIDTH,
			arrowHeadSize: params.arrowHeadSize ?? EDITABLE_DIMENSION_STYLE.ARROW_HEAD_SIZE,
			dashSize: EDITABLE_DIMENSION_STYLE.DASH_SIZE,
		});
		this._source = params.source;
		this._axis = params.axis;
		this._editable = params.editable ?? true;
		this._labelPrefix = params.labelPrefix ?? '';
	}

	get sourceId(): string {
		return this._source.id;
	}

	/** undefined when the label does not belong to a shape */
	get shapeUid(): string | undefined {
		return this._source.shapeUid;
	}

	/** whether the number can be typed over */
	get isEditable(): boolean {
		return this._editable;
	}

	get axis(): ArrowAxis {
		return this._axis;
	}

	get offset(): number {
		return this._source.getOffset(this._axis) ?? 0;
	}

	private get _alongKey(): DimensionLabelOffsetKey {
		return this._axis === 'x' ? 'xAlong' : 'yAlong';
	}

	/** the stored position along the line; undefined means automatic */
	private get _storedAlong(): number | undefined {
		return this._source.getOffset(this._alongKey);
	}

	/** where the number is along the line, from its midpoint: the stored value or else the automatic one of the last layout */
	get along(): number {
		return this._storedAlong ?? this._autoAlong;
	}

	/** the automatic position along the line as of the last layout; dropping a number near it makes it automatic again */
	get autoAlong(): number {
		return this._autoAlong;
	}

	get isHighlighted(): boolean {
		return this._isHighlighted;
	}

	setHighlighted(value: boolean): void {
		this._isHighlighted = value;
	}

	/** the exact position on this axis, not the rounded number the label shows; undefined once the source has no position (its shape is deleted) */
	get value(): number | undefined {
		const position = this._position;
		return position && (this._axis === 'x' ? position.x : position.y);
	}

	/**
	 * World point of the number's box edge that sits on the arrow: bottom center for an X label, right
	 * center for a Y label. Read from the measured box, so it is valid after the first draw.
	 */
	get labelAnchor(): Point {
		if (!this._cachedHitBox) {
			return this._labelAt;
		}
		const { x, y, width, height } = this._cachedHitBox;
		return this._axis === 'x' ? { x: x + width / 2, y } : { x: x + width, y: y + height / 2 };
	}

	setOffset(value: number): void {
		this._source.setOffset(this._axis, value);
	}

	setAlong(value: number): void {
		this._source.setOffset(this._alongKey, value);
	}

	/** back to the automatic position */
	resetAlong(): void {
		this._source.clearAlong(this._axis);
	}

	/** undefined once the source has no position (its shape is deleted from the store) */
	private get _position(): Point | undefined {
		return this._source.getPosition();
	}

	private _labelFor({ x, y }: Point): string {
		// up to 2 decimals; + 0 turns a rounded -0 into 0
		const v = this._axis === 'x' ? x : y;
		return `${this._labelPrefix}${parseFloat(v.toFixed(2)) + 0}`;
	}

	private get _pivot() {
		return this._axis === 'x' ? PIVOT.BOTTOM_CENTER : PIVOT.RIGHT_CENTER;
	}

	protected _getGeometry(context: CanvasRenderingContext2D): DimensionGeometry | null {
		const position = this._position;
		// the source has no position (its shape was deleted and this label is waiting to be removed): there is nothing to draw
		if (!position) {
			this._cachedHitBox = null;
			return null;
		}

		const isX = this._axis === 'x';
		const value = isX ? position.x : position.y;
		// the line runs from 0 to value along the axis; the other coordinate is where the line is moved to
		const lineCoord = (isX ? position.y : position.x) + this.offset;
		const pointAt = (coord: number): Point => isX ? { x: coord, y: lineCoord } : { x: lineCoord, y: coord };
		const unit: Point = isX ? { x: 1, y: 0 } : { x: 0, y: 1 };

		// ends by position along the axis, not by from / to, so value 0 and negative values stay right
		const lo = Math.min(0, value);
		const hi = Math.max(0, value);
		const mid = (lo + hi) / 2;
		const isSmall = Math.abs(value) < EDITABLE_DIMENSION_STYLE.SMALL_DIMENSION;
		const tail = isSmall ? getScaledSize(context, EDITABLE_DIMENSION_STYLE.TAIL_FACTOR * this._style.arrowHeadSize) : 0;

		// layout is measured at normal weight so hovering (bold) can't move the number or flicker the extension line
		const label = this._labelFor(position);
		const box = measureUprightTextBox(context, label, { x: 0, y: 0 }, CANVAS_FONT.LABEL_SIZE, this._pivot, 'normal');
		const extent = isX ? box.width : box.height;

		if (!isSmall) {
			this._autoAlong = 0;
		} else if (isX) {
			// above the line, the number's right edge at the left tail tip
			this._autoAlong = lo - tail - extent / 2 - mid;
		} else {
			// beside the top arrow head, its top edge at the tail tip, but never lower than the end itself:
			// the X dimension line or the X axis runs through hi and would strike the number through
			this._autoAlong = hi + Math.max(tail, extent) - extent / 2 - mid;
		}

		const center = mid + this.along;
		// the pivot puts the label's edge right on the line, so push it away from it:
		// an X arrow's label sits above the line, a Y arrow's label sits left of it
		const padding = getScaledSize(context, EDITABLE_DIMENSION_STYLE.LABEL_PADDING);
		this._labelAt = isX ? { x: center, y: lineCoord + padding } : { x: lineCoord - padding, y: center };

		const extensionLines: [Point, Point][] = [];
		const loEnd = isSmall ? lo - tail : lo;
		const hiEnd = isSmall ? hi + tail : hi;
		if (isSmall) {
			extensionLines.push([pointAt(lo), pointAt(loEnd)], [pointAt(hi), pointAt(hiEnd)]);
		}
		// the number is outside the line: carry the line to its far edge
		if (center + extent / 2 > hiEnd) {
			extensionLines.push([pointAt(hiEnd), pointAt(center + extent / 2)]);
		}
		if (center - extent / 2 < loEnd) {
			extensionLines.push([pointAt(loEnd), pointAt(center - extent / 2)]);
		}

		const from = pointAt(0);
		const to = pointAt(value);
		const fromIsLo = value >= 0;
		const negate = ({ x, y }: Point): Point => ({ x: -x, y: -y });
		const arrowsOutside = isSmall
			? { fromOutward: fromIsLo ? negate(unit) : unit, toOutward: fromIsLo ? unit : negate(unit) }
			: undefined;

		return {
			from,
			to,
			extensionLines: extensionLines.length > 0 ? extensionLines : undefined,
			// once the line is dragged away, a dashed line keeps the point it measures from in sight
			connector: this.offset !== 0 ? [position, to] : undefined,
			arrowsOutside,
		};
	}

	protected _drawLabel(context: CanvasRenderingContext2D): void {
		const position = this._position;
		if (!position) {
			return;
		}

		const label = this._labelFor(position);
		const fontWeight = this._isHighlighted ? 'bold' : 'normal';
		drawUprightText(context, label, this._labelAt, this._style.color, CANVAS_FONT.LABEL_SIZE, this._pivot, fontWeight);
		this._cachedHitBox = measureUprightTextBox(context, label, this._labelAt, CANVAS_FONT.LABEL_SIZE, this._pivot, fontWeight);
	}

	contains(point: Point): boolean {
		const box = this._cachedHitBox;
		return !!box && point.x >= box.x && point.x <= box.x + box.width
			&& point.y >= box.y && point.y <= box.y + box.height;
	}
}
