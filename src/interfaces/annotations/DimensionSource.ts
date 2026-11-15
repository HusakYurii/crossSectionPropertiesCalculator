import type { Point } from "../common/types";
import type { DimensionLabelOffsetKey } from "../../store/store";
import type { ArrowAxis } from "../../components/middle/view/canvas/annotations/DimensionsWithTextLabel";

/**
 * Where a DimensionsWithTextLabel measures from and where it keeps the offsets the user dragged it to.
 * The label draws a distance from the world origin to `getPosition()`; the source decides what that point is.
 */
export interface DimensionSource {
	/** shape uid, or another stable id for a source that is not a shape */
	readonly id: string;
	/** only for a source that is backed by a shape in the store */
	readonly shapeUid?: string;
	/** undefined means there is nothing to draw */
	getPosition(): Point | undefined;
	getOffset(key: DimensionLabelOffsetKey): number | undefined;
	setOffset(key: DimensionLabelOffsetKey, value: number): void;
	/** back to the automatic position along the line */
	clearAlong(axis: ArrowAxis): void;
}
