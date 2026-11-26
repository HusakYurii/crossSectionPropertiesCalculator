/**
 * Angle conversions shared by every place that mixes degrees and radians. Geometry rotations and the
 * principal axis angle are stored in degrees; Math.sin / cos / atan2 and the canvas work in radians.
 */
export const degToRad = (degrees: number): number => (degrees * Math.PI) / 180;

export const radToDeg = (radians: number): number => (radians * 180) / Math.PI;
