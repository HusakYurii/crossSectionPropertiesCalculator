import type { BoundingBox, Point } from "../../../../../interfaces/common/types";
import { clearDimensionLabelAlong, setDimensionLabelOffset, type AppSessionState, type DimensionLabelOffsetKey, type Store } from "../../../../../store/store";
import {
	PIVOT,
	drawUprightText,
	getScaledSize,
	measureUprightTextBox,
} from "../drawUtils";
import { BaseDimensions, type DimensionGeometry } from "./BaseDimensions";

const LINE_WIDTH = 2.7;
const ARROW_HEAD_SIZE = 13.5;
const DASH_SIZE = 6.5;
const LABEL_FONT_SIZE = 22;
const LABEL_PADDING = 6;
// a dimension shorter than this (world mm) gets its arrow heads outside the ends, so they don't cover the number
const SMALL_DIMENSION = 20;
// length of the tails the outside arrow heads sit on, in arrow heads
const TAIL_FACTOR = 1.5;

export type ArrowAxis = 'x' | 'y';

export type DimensionsWithTextLabelParams = {
	uid: string;
	shapeUid: string;
	axis: ArrowAxis;
	store: Store;
	sessionState: AppSessionState;
	color: string;
	/** in screen pixels, like every size here; the editor's look when left out */
	lineWidth?: number;
	arrowHeadSize?: number;
};

/**
 * A distance arrow (shape center -> its X or Y axis) with a draggable
 * label. Dragging offsets the whole arrow line perpendicular to its own
 * axis (an X-axis arrow slides along Y, a Y-axis arrow slides along X);
 * when offset, a dashed connector is drawn back to the shape center so the
 * reference point is never lost. The number can also slide along the line, even past its ends; a solid
 * line then runs under or beside it. Its position along the line is `along`: the world offset of the number's
 * center from the line's midpoint. Without a stored value it is automatic.
 *
 * A dimension shorter than SMALL_DIMENSION has its arrow heads outside the ends, on short tails, pointing
 * inward, and its automatic number sits outside too.
 *
 * The lines come from BaseDimensions; this class lays out the number next to the line and keeps its hit box.
 */
export class DimensionsWithTextLabel extends BaseDimensions {
	private _shapeUid: string;
	private _axis: ArrowAxis;
	private _store: Store;
	private _sessionState: AppSessionState;
	private _cachedHitBox: BoundingBox = { x: 0, y: 0, width: 0, height: 0 };
	// where the number goes, worked out by the last layout in _getGeometry
	private _labelAt: Point = { x: 0, y: 0 };
	private _autoAlong = 0;
	// hovered or dragged: the number is drawn bold to show it can be grabbed
	private _isHighlighted = false;

	constructor(params: DimensionsWithTextLabelParams) {
		super(params.uid, {
			color: params.color,
			lineWidth: params.lineWidth ?? LINE_WIDTH,
			arrowHeadSize: params.arrowHeadSize ?? ARROW_HEAD_SIZE,
			dashSize: DASH_SIZE,
		});
		this._shapeUid = params.shapeUid;
		this._axis = params.axis;
		this._store = params.store;
		this._sessionState = params.sessionState;
	}

	get shapeUid(): string {
		return this._shapeUid;
	}

	get axis(): ArrowAxis {
		return this._axis;
	}

	get offset(): number {
		return this._sessionState.dimensionLabelOffsets[this._shapeUid]?.[this._axis] ?? 0;
	}

	private get _alongKey(): DimensionLabelOffsetKey {
		return this._axis === 'x' ? 'xAlong' : 'yAlong';
	}

	/** the stored position along the line; undefined means automatic */
	private get _storedAlong(): number | undefined {
		return this._sessionState.dimensionLabelOffsets[this._shapeUid]?.[this._alongKey];
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

	/** the exact position on this axis, not the rounded number the label shows; undefined once the shape is deleted */
	get value(): number | undefined {
		const position = this._shapePosition;
		return position && (this._axis === 'x' ? position.x : position.y);
	}

	/**
	 * World point of the number's box edge that sits on the arrow: bottom center for an X label, right
	 * center for a Y label. Read from the measured box, so it is valid after the first draw.
	 */
	get labelAnchor(): Point {
		const { x, y, width, height } = this._cachedHitBox;
		return this._axis === 'x' ? { x: x + width / 2, y } : { x: x + width, y: y + height / 2 };
	}

	setOffset(value: number): void {
		setDimensionLabelOffset(this._shapeUid, this._axis, value);
	}

	setAlong(value: number): void {
		setDimensionLabelOffset(this._shapeUid, this._alongKey, value);
	}

	/** back to the automatic position */
	resetAlong(): void {
		clearDimensionLabelAlong(this._shapeUid, this._axis);
	}

	/** undefined once the shape is deleted from the store */
	private get _shapePosition(): Point | undefined {
		return this._store.geometryExtra[this._shapeUid]?.position;
	}

	private _labelFor({ x, y }: Point): string {
		// up to 2 decimals; + 0 turns a rounded -0 into 0
		const v = this._axis === 'x' ? x : y;
		return `${parseFloat(v.toFixed(2)) + 0}`;
	}

	private get _pivot() {
		return this._axis === 'x' ? PIVOT.BOTTOM_CENTER : PIVOT.RIGHT_CENTER;
	}

	protected _getGeometry(context: CanvasRenderingContext2D): DimensionGeometry | null {
		const shapePosition = this._shapePosition;
		// the shape was deleted and this label is waiting to be removed: there is nothing to draw
		if (!shapePosition) {
			return null;
		}

		const isX = this._axis === 'x';
		const value = isX ? shapePosition.x : shapePosition.y;
		// the line runs from 0 to value along the axis; the other coordinate is where the line is moved to
		const lineCoord = (isX ? shapePosition.y : shapePosition.x) + this.offset;
		const pointAt = (coord: number): Point => isX ? { x: coord, y: lineCoord } : { x: lineCoord, y: coord };
		const unit: Point = isX ? { x: 1, y: 0 } : { x: 0, y: 1 };

		// ends by position along the axis, not by from / to, so value 0 and negative values stay right
		const lo = Math.min(0, value);
		const hi = Math.max(0, value);
		const mid = (lo + hi) / 2;
		const isSmall = Math.abs(value) < SMALL_DIMENSION;
		const tail = isSmall ? getScaledSize(context, TAIL_FACTOR * this._style.arrowHeadSize) : 0;

		// layout is measured at normal weight so hovering (bold) can't move the number or flicker the extension line
		const label = this._labelFor(shapePosition);
		const box = measureUprightTextBox(context, label, { x: 0, y: 0 }, LABEL_FONT_SIZE, this._pivot, 'normal');
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
		const padding = getScaledSize(context, LABEL_PADDING);
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
			// once the line is dragged away, a dashed line keeps the shape center it measures from in sight
			connector: this.offset !== 0 ? [shapePosition, to] : undefined,
			arrowsOutside,
		};
	}

	protected _drawLabel(context: CanvasRenderingContext2D): void {
		const shapePosition = this._shapePosition;
		if (!shapePosition) {
			return;
		}

		const label = this._labelFor(shapePosition);
		const fontWeight = this._isHighlighted ? 'bold' : 'normal';
		drawUprightText(context, label, this._labelAt, this._style.color, LABEL_FONT_SIZE, this._pivot, fontWeight);
		this._cachedHitBox = measureUprightTextBox(context, label, this._labelAt, LABEL_FONT_SIZE, this._pivot, fontWeight);
	}

	contains(point: Point): boolean {
		return point.x >= this._cachedHitBox.x && point.x <= this._cachedHitBox.x + this._cachedHitBox.width
			&& point.y >= this._cachedHitBox.y && point.y <= this._cachedHitBox.y + this._cachedHitBox.height;
	}
}
