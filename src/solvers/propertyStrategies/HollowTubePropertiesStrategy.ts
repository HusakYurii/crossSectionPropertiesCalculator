import { SHAPE_TYPES } from "../../interfaces/beams/common.types";
import type { Geometry } from "../../interfaces/beams/common.types";
import type { OSectionHollowGeometry } from "../../interfaces/beams/OSection.types";
import type { CrossSectionProperties } from "../../interfaces/sectionProperties";
import { AbstractPropertiesStrategy } from "./AbstractPropertiesStrategy";

export class HollowTubePropertiesStrategy extends AbstractPropertiesStrategy<OSectionHollowGeometry> {
	test(geometry: Geometry) {
		return geometry.type === SHAPE_TYPES.HOLLOW_TUBE;
	}

	execute(geometry: OSectionHollowGeometry): CrossSectionProperties {
		const D = geometry.d1;
		const d = geometry.d2;

		if (D <= 0) {
			throw new Error("Outer diameter must be greater than 0.");
		}
		if (d <= 0) {
			throw new Error("Inner diameter must be greater than 0. Use calculateSolidRodProperties for solid sections.");
		}
		if (d >= D) {
			throw new Error("Inner diameter must be strictly less than the outer diameter.");
		}

		const R = D / 2;
		const r = d / 2;

		const R2 = R * R;
		const r2 = r * r;
		const R4 = R2 * R2;
		const r4 = r2 * r2;

		const A = Math.PI * (R2 - r2);
		const I = (Math.PI / 4) * (R4 - r4);
		const Ip = 2 * I;
		const radiusOfGyration = Math.sqrt((R2 + r2) / 4);
		const elasticModulus = I / R;

		return {
			A: A,
			centroid_x: 0,
			centroid_y: 0,
			Ix: I,
			Iy: I,
			Ixy: 0,
			theta_p_deg: 0,
			I_u: I,
			I_v: I,
			Ip: Ip,
			rx: radiusOfGyration,
			ry: radiusOfGyration,
			r_u: radiusOfGyration,
			r_v: radiusOfGyration,
			Wx_top: elasticModulus,
			Wx_bot: elasticModulus,
			Wy_rt: elasticModulus,
			Wy_lf: elasticModulus
		};
	}
}
