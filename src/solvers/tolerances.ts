/** Tolerances of the mesh triangulation (triangulate). */
export const TRIANGULATION_TOLERANCES = {
	DEDUPE_EPSILON: 1e-6,
	DEDUPE_EPSILON_SQ: 1e-6 * 1e-6,
	/** Triangles below this area are treated as invisible/degenerate rather than "thin" — see refineMesh. */
	AREA_EPSILON: 1e-4,
	/** Relative tolerance (cross product vs squared edge length) for "this point lies on this edge" — see insertPoint. */
	COLLINEAR_EPS: 1e-12,
	BRIDGE_EPSILON: 1e-4,
} as const;

/** Decimals the section properties are rounded to (toFixed) in every solver. */
export const RESULT_PRECISION = {
	SECTION_PROPERTIES: 2,
	/** each triangle is solved with many more decimals than the result shows, so rounding does not add up over thousands of triangles */
	FEM_TRIANGLE: 10,
	/** the two rings are solved at a higher precision so the subtraction doesn't lose digits */
	HOLLOW_RECTANGLE_RING: 8,
} as const;

/** Tolerances of the Green theorem calculator. */
export const GREEN_THEOREM_TOLERANCES = {
	/** Ixy and Ix - Iy this small, next to the size of Ix / Iy, are floating point noise and not a real asymmetry */
	SYMMETRY_EPS: 1e-9,
	/** the closing point of a ring may differ from the first one by rounding in the last digits (a circle built from cos / sin) */
	CLOSING_POINT_EPS: 1e-9,
} as const;

/** Tolerances of the polygon and mesh helpers. */
export const POLYGON_TOLERANCES = {
	/** points closer than this to the point before them are dropped */
	DUPLICATE_POINT_EPS: 1e-9,
	/** a triangle with less area than this is a sliver with nothing to add */
	MIN_TRIANGLE_AREA: 1e-9,
} as const;

/** How many points a polygon needs to be a shape. */
export const POLYGON_LIMITS = {
	/** an open list of points, as the user draws it: fewer than this is not a shape */
	MIN_OPEN_POINTS: 3,
	/** a closed ring: 3 distinct points plus the one that closes the polygon */
	MIN_CLOSED_POINTS: 4,
} as const;
