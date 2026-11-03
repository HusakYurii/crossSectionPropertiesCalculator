import type { BoundingBox, Point } from "../../../../../interfaces/common/types";
import { setDimensionLabelOffset, type AppSessionState, type Store } from "../../../../../store/store";
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
 * reference point is never lost.
 *
 * The lines come from BaseDimensions; this class adds the number next to the line and its hit box.
 */
export class DimensionsWithTextLabel extends BaseDimensions {
	private _shapeUid: string;
	private _axis: ArrowAxis;
	private _store: Store;
	private _sessionState: AppSessionState;
	private _cachedHitBox: BoundingBox = { x: 0, y: 0, width: 0, height: 0 };
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

	get isHighlighted(): boolean {
		return this._isHighlighted;
	}

	setHighlighted(value: boolean): void {
		this._isHighlighted = value;
	}

	setOffset(value: number): void {
		setDimensionLabelOffset(this._shapeUid, this._axis, value);
	}

	/** undefined once the shape is deleted from the store */
	private get _shapePosition(): Point | undefined {
		return this._store.geometryExtra[this._shapeUid]?.position;
	}

	private _lineFor({ x, y }: Point): { from: Point; to: Point } {
		if (this._axis === 'x') {
			const lineY = y + this.offset;
			return { from: { x: 0, y: lineY }, to: { x, y: lineY } };
		}

		const lineX = x + this.offset;
		return { from: { x: lineX, y: 0 }, to: { x: lineX, y } };
	}

	private _labelFor({ x, y }: Point): string {
		return this._axis === 'x' ? `${Math.round(x)}` : `${Math.round(y)}`;
	}

	protected _getGeometry(): DimensionGeometry | null {
		const shapePosition = this._shapePosition;
		// the shape was deleted and this label is waiting to be removed: there is nothing to draw
		if (!shapePosition) {
			return null;
		}

		const { from, to } = this._lineFor(shapePosition);
		// once the line is dragged away, a dashed line keeps the shape center it measures from in sight
		return { from, to, connector: this.offset !== 0 ? [shapePosition, to] : undefined };
	}

	protected _drawLabel(context: CanvasRenderingContext2D, { from, to }: DimensionGeometry): void {
		const shapePosition = this._shapePosition;
		if (!shapePosition) {
			return;
		}

		const mid = { x: (from.x + to.x) / 2, y: (from.y + to.y) / 2 };
		const pivot = this._axis === 'x' ? PIVOT.BOTTOM_CENTER : PIVOT.RIGHT_CENTER;
		const label = this._labelFor(shapePosition);

		// the pivot puts the label's edge right on the line, so push it away from it:
		// an X arrow's label sits above the line, a Y arrow's label sits left of it
		const padding = getScaledSize(context, LABEL_PADDING);
		const labelAt = this._axis === 'x'
			? { x: mid.x, y: mid.y + padding }
			: { x: mid.x - padding, y: mid.y };

		const fontWeight = this._isHighlighted ? 'bold' : 'normal';
		drawUprightText(context, label, labelAt, this._style.color, LABEL_FONT_SIZE, pivot, fontWeight);
		this._cachedHitBox = measureUprightTextBox(context, label, labelAt, LABEL_FONT_SIZE, pivot, fontWeight);
	}

	contains(point: Point): boolean {
		return point.x >= this._cachedHitBox.x && point.x <= this._cachedHitBox.x + this._cachedHitBox.width
			&& point.y >= this._cachedHitBox.y && point.y <= this._cachedHitBox.y + this._cachedHitBox.height;
	}
}
