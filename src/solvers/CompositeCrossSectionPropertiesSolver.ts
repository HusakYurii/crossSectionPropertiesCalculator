import { toast } from 'vue3-toastify';
import type { Store } from "../store/store";
import { EMPTY_CROSS_SECTION_PROPERTIES, type CrossSectionProperties } from "../interfaces/sectionProperties";
import { radToDeg } from "../mathUtils/anglesMath";
import { SHAPE_TYPES } from "../interfaces/beams/common.types";
import type { OSectionGeometry } from "../interfaces/beams/OSection.types";
import { principalAxisAngleRad } from "./propertyStrategies/greenTheoremCalculator";
import { RESULT_PRECISION } from "../constants/geometryTolerances";

export type CompositeSolveErrorCode = 'no-shapes' | 'no-area';

export type CompositeSolveResult = { properties: CrossSectionProperties } | { error: string; code: CompositeSolveErrorCode };

export class CompositeCrossSectionPropertiesSolver {

	/**
	 * Properties of the whole built-up section from every shape in the store, or the reason there are none.
	 * It has no side effects (no toast), so it is safe to call inside a computed.
	 * The math is in docs/composite_cross_section_properties_math.md. The shapes are not clipped: the layout is trusted.
	 */
	solve(store: Store): CompositeSolveResult {
		const parts = Object.keys(store.geometry).flatMap((uid) => {
			const properties = store.crossSectionProperties[uid];
			const position = store.geometryExtra[uid]?.position;
			const polygon = store.crossSectionPolygon[uid];
			if (!properties || !position || !polygon) {
				return [];
			}
			const geometry = store.geometry[uid];
			return [{ properties, position, polygon, geometry, sign: geometry.isNegative ? -1 : 1 }];
		});

		let A = 0;
		let Sx = 0;
		let Sy = 0;
		for (const { properties, position, sign } of parts) {
			A += sign * properties.A;
			Sx += sign * properties.A * position.x;
			Sy += sign * properties.A * position.y;
		}

		if (!(A > 0)) {
			return parts.length === 0
				? { error: 'There are no shapes to calculate the results for.', code: 'no-shapes' }
				: { error: 'The negative shapes take away all the area: the total area must be positive.', code: 'no-area' };
		}

		const centroid_x = Sx / A;
		const centroid_y = Sy / A;

		let Ix = 0;
		let Iy = 0;
		let Ixy = 0;
		for (const { properties, position, sign } of parts) {
			const dx = position.x - centroid_x;
			const dy = position.y - centroid_y;
			Ix += sign * (properties.Ix + properties.A * dy * dy);
			Iy += sign * (properties.Iy + properties.A * dx * dx);
			Ixy += sign * (properties.Ixy + properties.A * dx * dy);
		}

		const theta_p_rad = principalAxisAngleRad(Ix, Iy, Ixy);
		const traceOver2 = (Ix + Iy) / 2;
		const radius = Math.sqrt(Math.pow((Ix - Iy) / 2, 2) + Math.pow(Ixy, 2));
		const I_u = traceOver2 + radius;
		const I_v = traceOver2 - radius;

		let x_min = Infinity, x_max = -Infinity, y_min = Infinity, y_max = -Infinity;
		for (const { properties, position, polygon, geometry, sign } of parts) {
			if (sign < 0 || properties.A <= 0) {
				continue;
			}
			if (geometry.type === SHAPE_TYPES.TUBE || geometry.type === SHAPE_TYPES.HOLLOW_TUBE) {
				const R = (geometry as OSectionGeometry).d1 / 2;
				x_min = Math.min(x_min, position.x - R);
				x_max = Math.max(x_max, position.x + R);
				y_min = Math.min(y_min, position.y - R);
				y_max = Math.max(y_max, position.y + R);
				continue;
			}
			for (const p of polygon) {
				const x = p.x - properties.centroid_x + position.x;
				const y = p.y - properties.centroid_y + position.y;
				x_min = Math.min(x_min, x);
				x_max = Math.max(x_max, x);
				y_min = Math.min(y_min, y);
				y_max = Math.max(y_max, y);
			}
		}
		const c_top = y_max - centroid_y;
		const c_bot = centroid_y - y_min;
		const c_rt = x_max - centroid_x;
		const c_lf = centroid_x - x_min;

		// an impossible layout with a negative inertia has no real radius, section modulus or polar moment: NaN, shown as "—"
		const gyrationRadius = (inertia: number) => inertia >= 0 ? Math.sqrt(inertia / A) : NaN;
		const sectionModulus = (inertia: number, c: number) => inertia < 0 ? NaN : c > 0 ? inertia / c : 0;
		const round = (value: number) => parseFloat(value.toFixed(RESULT_PRECISION.SECTION_PROPERTIES)) + 0;

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
			Ip: round(Ix + Iy < 0 ? NaN : Ix + Iy),
			rx: round(gyrationRadius(Ix)),
			ry: round(gyrationRadius(Iy)),
			r_u: round(gyrationRadius(I_u)),
			r_v: round(gyrationRadius(I_v)),
			Wx_top: round(sectionModulus(Ix, c_top)),
			Wx_bot: round(sectionModulus(Ix, c_bot)),
			Wy_rt: round(sectionModulus(Iy, c_rt)),
			Wy_lf: round(sectionModulus(Iy, c_lf)),
		};
		return { properties };
	}

	/** Same as solve, but a failure is shown as an error toast and gives empty properties. */
	calculate(store: Store): CrossSectionProperties {
		const result = this.solve(store);
		if ('error' in result) {
			toast.error(result.error);
			return { ...EMPTY_CROSS_SECTION_PROPERTIES };
		}
		return result.properties;
	}
}

export const compositeCrossSectionPropertiesSolver = new CompositeCrossSectionPropertiesSolver();
