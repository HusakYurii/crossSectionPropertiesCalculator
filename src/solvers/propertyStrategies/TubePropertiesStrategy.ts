import { SHAPE_TYPES } from "../../interfaces/beams/common.types";
import type { Geometry } from "../../interfaces/beams/common.types";
import type { OSectionGeometry } from "../../interfaces/beams/OSection.types";
import type { CrossSectionProperties } from "../../interfaces/sectionProperties";
import { AbstractPropertiesStrategy } from "./AbstractPropertiesStrategy";

export class TubePropertiesStrategy extends AbstractPropertiesStrategy<OSectionGeometry> {
	test(geometry: Geometry) {
		return geometry.type === SHAPE_TYPES.TUBE;
	}

	execute(geometry: OSectionGeometry): CrossSectionProperties {
		const R = geometry.d1;
		const R2 = R * R;
		const R4 = R2 * R2;

		const A = Math.PI * R2;
		const I = (Math.PI / 4) * R4;
		const Ip = 2 * I;
		const radiusOfGyration = R / 2;
		const elasticModulus = (Math.PI / 4) * (R2 * R);

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
