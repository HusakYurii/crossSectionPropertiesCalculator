import {
	buildConstrainedEdges,
	improveTriangulation,
	refineMesh,
	resamplePolygon,
	subdivideTriangles,
	triangulate,
} from "./femTriangulator/triangulate";
import { radToDeg } from "../mathUtils/anglesMath";
import { calculateCrossSectionProperties, principalAxisAngleRad } from "./propertyStrategies/greenTheoremCalculator";
import type { KeyCache, Triangle } from "./femTriangulator/triangulate";
import type { Point } from "../interfaces/common/types";
import { DEFAULT_FEM_MESH_OPTIONS, type FEMMeshOptions } from "../interfaces/FEMMeshOptions";
import { EMPTY_CROSS_SECTION_PROPERTIES, type CrossSectionProperties } from "../interfaces/sectionProperties";

const PRECISION = 2;
// each triangle is solved with many more decimals than the result shows, so rounding does not add up over thousands of triangles
const TRIANGLE_PRECISION = 10;
// a triangle with less area than this is a sliver with nothing to add
const MIN_TRIANGLE_AREA = 1e-9;

export class FEMCrossSectionPropertiesSolver {

	/**
	 * Section properties of a closed polygon from its mesh: every triangle is solved on its own with
	 * the polygon (Green's theorem) solver, then the parts are combined about the centroid of the whole
	 * with the parallel axis theorem. For now it gives the same properties as the polygon solver
	 * (area, centroid, inertia, principal axes, moduli); torsion and shear are still to come.
	 * `options` are the mesh settings; whatever is not passed uses DEFAULT_FEM_MESH_OPTIONS.
	 */
	calculate(polygon: Point[], options: FEMMeshOptions = {}): CrossSectionProperties {
		return this.solve(polygon, options).properties;
	}

	/**
	 * Same as calculate, but also hands back the mesh the properties were summed from, so it can
	 * be drawn without meshing the polygon a second time.
	 */
	solve(polygon: Point[], options: FEMMeshOptions = {}): { properties: CrossSectionProperties; triangles: Triangle[] } {
		const triangles = this.buildMesh(polygon, options);

		// 1. every triangle on its own, with the same Green's theorem solver the polygon shapes use
		const parts: CrossSectionProperties[] = [];
		for (const [p1, p2, p3] of triangles) {
			// the triangle is passed closed like the app's other rings; the Green solver drops the repeated point
			const part = calculateCrossSectionProperties([p1, p2, p3, p1], TRIANGLE_PRECISION);
			if (part.A > MIN_TRIANGLE_AREA) {
				parts.push(part);
			}
		}

		// 2. area and centroid of the whole: the centroid is the area-weighted mean of the parts' centroids
		let A = 0;
		let Sx = 0;
		let Sy = 0;
		for (const part of parts) {
			A += part.A;
			Sx += part.A * part.centroid_x;
			Sy += part.A * part.centroid_y;
		}

		if (!(A > 0)) {
			return { properties: { ...EMPTY_CROSS_SECTION_PROPERTIES }, triangles };
		}

		const centroid_x = Sx / A;
		const centroid_y = Sy / A;

		// 3. each part's own (centroidal) inertia moved to the centroid of the whole with the parallel axis
		// theorem, I = Ic + A * d^2 (and Ixy = Ixy,c + A * dx * dy), then added up
		let Ix = 0;
		let Iy = 0;
		let Ixy = 0;
		for (const part of parts) {
			const dx = part.centroid_x - centroid_x;
			const dy = part.centroid_y - centroid_y;
			Ix += part.Ix + part.A * dy * dy;
			Iy += part.Iy + part.A * dx * dx;
			Ixy += part.Ixy + part.A * dx * dy;
		}

		const theta_p_rad = principalAxisAngleRad(Ix, Iy, Ixy);
		const traceOver2 = (Ix + Iy) / 2;
		const radius = Math.sqrt(Math.pow((Ix - Iy) / 2, 2) + Math.pow(Ixy, 2));
		const I_u = traceOver2 + radius;
		const I_v = traceOver2 - radius;

		// the boundary gives the extreme fibers
		let x_min = Infinity, x_max = -Infinity, y_min = Infinity, y_max = -Infinity;
		for (const { x, y } of polygon) {
			x_min = Math.min(x_min, x);
			x_max = Math.max(x_max, x);
			y_min = Math.min(y_min, y);
			y_max = Math.max(y_max, y);
		}
		const c_top = y_max - centroid_y;
		const c_bot = centroid_y - y_min;
		const c_rt = x_max - centroid_x;
		const c_lf = centroid_x - x_min;

		const round = (value: number) => parseFloat(value.toFixed(PRECISION));

		const properties: CrossSectionProperties = {
			A: round(A),
			centroid_x: round(centroid_x),
			centroid_y: round(centroid_y),
			Ix: round(Ix),
			Iy: round(Iy),
			Ixy: round(Ixy),
			theta_p_deg: round(radToDeg(theta_p_rad)),
			I_u: round(I_u),
			I_v: round(I_v),
			Ip: round(Ix + Iy),
			rx: round(Math.sqrt(Ix / A)),
			ry: round(Math.sqrt(Iy / A)),
			r_u: round(Math.sqrt(I_u / A)),
			r_v: round(Math.sqrt(I_v / A)),
			Wx_top: round(c_top > 0 ? Ix / c_top : 0),
			Wx_bot: round(c_bot > 0 ? Ix / c_bot : 0),
			Wy_rt: round(c_rt > 0 ? Iy / c_rt : 0),
			Wy_lf: round(c_lf > 0 ? Iy / c_lf : 0),
		};

		return { properties, triangles };
	}

	/**
	 * Meshes a closed polygon into triangles: resample the boundary, triangulate it,
	 * flip edges to improve the triangles, add Steiner points where they are too thin,
	 * then optionally subdivide.
	 */
	buildMesh(polygonPoints: Point[], options: FEMMeshOptions = {}): Triangle[] {
		const settings = this._resolveOptions(options);

		// the boundary is resampled with the shortest edge as spacing, but never finer than minSegmentLength
		let shortestEdge = Number.MAX_SAFE_INTEGER;
		for (let i = 0; i < polygonPoints.length - 1; i++) {
			const curr = polygonPoints[i];
			const next = polygonPoints[i + 1];
			const dx = next.x - curr.x;
			const dy = next.y - curr.y;
			shortestEdge = Math.min(shortestEdge, Math.hypot(dx, dy));
		}

		const resampled = resamplePolygon(polygonPoints, Math.max(shortestEdge, settings.minSegmentLength));
		const cache: KeyCache = new WeakMap();
		const { polygon, constrainedEdges } = buildConstrainedEdges(resampled, cache);
		const triangulated = triangulate(polygon);
		const improved = improveTriangulation(triangulated, settings.improvePasses, cache);
		const refined = refineMesh(improved, constrainedEdges, polygon, {
			minAngleDeg: settings.minAngleDeg,
			maxSteinerPoints: settings.maxSteinerPoints,
			maxIterations: settings.maxIterations,
		}, cache);
		return subdivideTriangles(refined, settings.subdivideLevels);
	}

	/**
	 * Fills what is missing with the defaults, and keeps what is given inside a range the mesher can
	 * handle: a value that is not a number (an emptied input) uses the default, and the others are
	 * clamped, so no input can make the solver loop for ever or build millions of triangles.
	 */
	private _resolveOptions(options: FEMMeshOptions): Required<FEMMeshOptions> {
		const pick = (value: number | undefined, fallback: number, min: number, max: number, integer = false) => {
			if (typeof value !== 'number' || !Number.isFinite(value)) {
				return fallback;
			}
			const rounded = integer ? Math.round(value) : value;
			return Math.min(max, Math.max(min, rounded));
		};
		const d = DEFAULT_FEM_MESH_OPTIONS;

		return {
			improvePasses: pick(options.improvePasses, d.improvePasses, 0, 100, true),
			subdivideLevels: pick(options.subdivideLevels, d.subdivideLevels, 0, 3, true),
			minSegmentLength: pick(options.minSegmentLength, d.minSegmentLength, 0.01, Number.MAX_SAFE_INTEGER),
			minAngleDeg: pick(options.minAngleDeg, d.minAngleDeg, 0, 35),
			maxSteinerPoints: pick(options.maxSteinerPoints, d.maxSteinerPoints, 0, 5000, true),
			maxIterations: pick(options.maxIterations, d.maxIterations, 1, 20000, true),
		};
	}
}

export const femCrossSectionPropertiesSolver = new FEMCrossSectionPropertiesSolver();
