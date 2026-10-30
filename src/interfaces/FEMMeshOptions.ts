/**
 * Settings of the FEM mesh. Every field is optional: whatever is left out (or is not a usable
 * number) falls back to DEFAULT_FEM_MESH_OPTIONS in FEMCrossSectionPropertiesSolver.
 */
export interface FEMMeshOptions {
	/** how many passes of edge flipping improve the triangles */
	improvePasses?: number;
	/** how many times every triangle is split into 4 after refinement (the triangle count grows 4x per level) */
	subdivideLevels?: number;
	/** floor for the longest boundary segment the resampling allows */
	minSegmentLength?: number;
	/** refinement splits every triangle that has a smaller angle than this, in degrees */
	minAngleDeg?: number;
	/** refinement stops after adding this many extra points */
	maxSteinerPoints?: number;
	/** refinement stops after this many iterations */
	maxIterations?: number;
}

export const DEFAULT_FEM_MESH_OPTIONS: Required<FEMMeshOptions> = {
	improvePasses: 10,
	subdivideLevels: 0,
	minSegmentLength: 2,
	minAngleDeg: 28,
	maxSteinerPoints: 500,
	maxIterations: 1000,
};
