import { degToRad } from "../../../../../mathUtils/anglesMath";

// principal axes closer than this to the shape's own x / y axes (mod 90deg) would be drawn on top of them
export const PRINCIPAL_COINCIDE_EPS = degToRad(0.5);

/**
 * True when the principal axes are turned away from the shape's own x / y axes by more than the
 * threshold, so drawing them adds something. Both angles are in radians, counterclockwise from world X.
 */
export function principalAxesDiffer(thetaP: number, shapeRotation = 0): boolean {
	const quarter = Math.PI / 2;
	const diff = Math.abs(((thetaP - shapeRotation) % quarter + quarter) % quarter);
	return Math.min(diff, quarter - diff) > PRINCIPAL_COINCIDE_EPS;
}
