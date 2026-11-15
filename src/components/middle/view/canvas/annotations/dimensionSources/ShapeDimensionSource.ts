import type { Point } from "../../../../../../interfaces/common/types";
import { clearDimensionLabelAlong, setDimensionLabelOffset, type AppSessionState, type DimensionLabelOffsetKey, type Store } from "../../../../../../store/store";
import type { ArrowAxis } from "../DimensionsWithTextLabel";
import type { DimensionSource } from "../../../../../../interfaces/annotations/DimensionSource";

/** The position of a shape in the store; its offsets live in the session state, so they are saved and undoable. */
export class ShapeDimensionSource implements DimensionSource {
	readonly id: string;
	readonly shapeUid: string;

	private _store: Store;
	private _sessionState: AppSessionState;

	constructor(shapeUid: string, store: Store, sessionState: AppSessionState) {
		this.id = shapeUid;
		this.shapeUid = shapeUid;
		this._store = store;
		this._sessionState = sessionState;
	}

	getPosition(): Point | undefined {
		return this._store.geometryExtra[this.shapeUid]?.position;
	}

	getOffset(key: DimensionLabelOffsetKey): number | undefined {
		return this._sessionState.dimensionLabelOffsets[this.shapeUid]?.[key];
	}

	setOffset(key: DimensionLabelOffsetKey, value: number): void {
		setDimensionLabelOffset(this.shapeUid, key, value);
	}

	clearAlong(axis: ArrowAxis): void {
		clearDimensionLabelAlong(this.shapeUid, axis);
	}
}
