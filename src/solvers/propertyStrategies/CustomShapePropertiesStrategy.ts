import { SHAPE_TYPES } from "../../interfaces/beams/common.types";
import type { Geometry } from "../../interfaces/beams/common.types";
import type { CustomShapeGeometry } from "../../interfaces/beams/CustomShape.types";
import type { Point } from "../../interfaces/common/types";
import { EMPTY_CROSS_SECTION_PROPERTIES } from "../../interfaces/sectionProperties";
import { femCrossSectionPropertiesSolver } from "../FEMCrossSectionPropertiesSolver";
import { AbstractPropertiesStrategy } from "./AbstractPropertiesStrategy";

// 3 distinct points plus the one that closes the polygon
const MIN_POLYGON_POINTS = 4;

/**
 * The only shape that uses the FEM solver: it meshes the drawn polygon, which is much slower than
 * the closed-form solvers, so callers should only run it on request. Gives zeros while the drawn
 * polygon is not a real shape yet (too few points, or all on one line).
 */
export class CustomShapePropertiesStrategy extends AbstractPropertiesStrategy<CustomShapeGeometry> {
	test(geometry: Geometry) {
		return geometry.type === SHAPE_TYPES.CUSTOM_SHAPE;
	}

	execute(geometry: CustomShapeGeometry, polygon: Point[]) {
		if (polygon.length < MIN_POLYGON_POINTS) {
			return { ...EMPTY_CROSS_SECTION_PROPERTIES };
		}

		const properties = femCrossSectionPropertiesSolver.calculate(polygon, geometry.femOptions);
		return Number.isFinite(properties.A) && properties.A > 0
			? properties
			: { ...EMPTY_CROSS_SECTION_PROPERTIES };
	}
}
