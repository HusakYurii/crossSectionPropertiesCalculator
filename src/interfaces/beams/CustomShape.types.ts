import type { Point } from "../common/types";
import type { FEMMeshOptions } from "../FEMMeshOptions";
import type { Geometry } from "./common.types";

/**
 * A polygon the user draws point by point. `points` are the polygon vertices in the order
 * they were added, in the shape's own frame; the polygon closes itself from the last point
 * back to the first, so the first point is not repeated at the end.
 */
export interface CustomShapeGeometry extends Geometry {
	type: 'CUSTOM_SHAPE'
	points: Point[];
	/** settings of the FEM solver; anything missing (a shape saved before they existed) uses the solver defaults */
	femOptions?: FEMMeshOptions;
}
