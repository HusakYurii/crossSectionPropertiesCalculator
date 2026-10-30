import { degToRad } from "../../../../mathUtils/anglesMath";
import { rotatePoint } from "../../../../solvers/poligonUtils/rotatePoint";
import type { Point } from "../../../../interfaces/common/types";
import type { LeaderSide, LeaderVertical } from "../../../middle/view/canvas/drawUtils";

export type AnnotationFrame = {
	/** local polygon coords -> preview world coords (rotated like the solver does, then centered) */
	p: (x: number, y: number) => Point;
	/** shape rotation in radians, for the dimension lines */
	rotation: number;
	/** rotates the direction a leader goes out of its anchor, so it keeps pointing into the same open space */
	leader: (side: LeaderSide, vertical: LeaderVertical) => { side: LeaderSide; vertical: LeaderVertical };
};

/**
 * Anchors are written in the shape's own unrotated local frame (see the
 * polygon strategies). This frame applies the same rotation the solver bakes
 * into the polygon (degrees, about the local origin, see AbstractPolygonBuildStrategy)
 * and then subtracts the centroid, because the preview draws every polygon point
 * as `rotated local - centroid`. `centroid` must come from the solver run with the
 * same rotation.
 */
export function createFrame(rotationDeg: number | undefined, centroid: Point): AnnotationFrame {
	const degrees = rotationDeg ?? 0;
	const rotation = degToRad(degrees);
	const origin = { x: 0, y: 0 };

	return {
		p: (x, y) => {
			const r = rotatePoint({ x, y }, origin, degrees);
			return { x: r.x - centroid.x, y: r.y - centroid.y };
		},
		rotation,
		leader: (side, vertical) => {
			const r = rotatePoint(
				{ x: side === 'right' ? 1 : -1, y: vertical === 'top' ? 1 : -1 },
				origin,
				degrees
			);
			// tiny epsilon so an exact 45deg turn doesn't flip on float noise
			return {
				side: r.x >= -1e-9 ? 'right' : 'left',
				vertical: r.y >= -1e-9 ? 'top' : 'bottom',
			};
		},
	};
}
