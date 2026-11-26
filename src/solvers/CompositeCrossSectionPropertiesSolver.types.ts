import type { Geometry } from "@/shared/shapes/types/common.types";
import type { Point } from "@/shared/types/geometry";
import type { CrossSectionProperties } from "@/shared/types/sectionProperties";
import type { Result, SolverError } from "./errors.types";

export type CompositeSolveErrorCode = 'no-shapes' | 'no-area';

export type CompositeSolveResult = Result<CrossSectionProperties, SolverError<CompositeSolveErrorCode>>;

/** The four store records of one shape, as plain data. */
export interface CompositePart {
	/** type (tube bounds use d1) + isNegative (the sign) */
	geometry: Geometry;
	/** the shape's own results */
	properties: CrossSectionProperties;
	/** its centroid in world coordinates */
	position: Point;
	/** its polygon in its own frame (for the extreme fibres) */
	polygon: Point[];
}
