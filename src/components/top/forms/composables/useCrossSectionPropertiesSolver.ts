import { ref } from "vue";
import type { Geometry } from "../../../../interfaces/beams/common.types";
import type { CrossSectionProperties } from "../../../../interfaces/sectionProperties";
import { crossSectionPolygonsBuilder } from "../../../../solvers/CrossSectionPolygonsBuilder";
import type { Point } from "../../../../interfaces/common/types";
import { crossSectionPropertiesSolver } from "../../../../solvers/CrossSectionPropertiesSolver";

export const useCrossSectionPropertiesSolver = () => {

	const crossSectionProperties = ref<CrossSectionProperties>({
		A: 0,
		centroid_x: 0,
		centroid_y: 0,
		Ix: 0,
		Iy: 0,
		Ixy: 0,
		theta_p_deg: 0,
		I_u: 0,
		I_v: 0,
		Ip: 0,
		rx: 0,
		ry: 0,
		r_u: 0,
		r_v: 0,
		Wx_top: 0,
		Wx_bot: 0,
		Wy_rt: 0,
		Wy_lf: 0
	});

	const crossSectionPolygon = ref<Point[]>([]);

	// @TODO wrap the crossSectionPropertiesSolver into try catch and show popup error
	const calculateProperties = <T extends Geometry>(props: T) => {
		const polygon = crossSectionPolygonsBuilder.calculate(props);
		const csProperties = crossSectionPropertiesSolver.calculate(props, polygon);
		crossSectionPolygon.value = polygon;
		crossSectionProperties.value = csProperties;
	}

	return {
		crossSectionProperties,
		crossSectionPolygon,
		calculateProperties,
	}

}