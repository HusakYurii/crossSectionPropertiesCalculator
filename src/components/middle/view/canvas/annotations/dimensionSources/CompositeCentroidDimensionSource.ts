import type { Point } from "../../../../../../interfaces/common/types";
import { clearCompositeLabelAlong, setCompositeLabelOffset, type AppSessionState, type DimensionLabelOffsetKey } from "../../../../../../store/store";
import type { ArrowAxis } from "../DimensionsWithTextLabel";
import type { DimensionSource } from "../../../../../../interfaces/annotations/DimensionSource";

/**
 * The section centroid: its position is set from outside, its offsets are kept in the session state so they are
 * saved with the project. They are not in the undo history: dragging this label is a view change, not an edit.
 */
export class CompositeCentroidDimensionSource implements DimensionSource {
	readonly id = 'section-centroid';

	private _sessionState: AppSessionState;
	private _position: Point | undefined;

	constructor(sessionState: AppSessionState) {
		this._sessionState = sessionState;
	}

	/** undefined when there is nothing to measure */
	setPosition(position: Point | undefined): void {
		this._position = position && { x: position.x, y: position.y };
	}

	getPosition(): Point | undefined {
		return this._position;
	}

	getOffset(key: DimensionLabelOffsetKey): number | undefined {
		return this._sessionState.compositeLabelOffsets[key];
	}

	setOffset(key: DimensionLabelOffsetKey, value: number): void {
		setCompositeLabelOffset(key, value);
	}

	clearAlong(axis: ArrowAxis): void {
		clearCompositeLabelAlong(axis);
	}
}
