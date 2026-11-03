import { SHAPE_TYPES } from "../../interfaces/beams/common.types";
import type { Geometry } from "../../interfaces/beams/common.types";
import type { ISectionGeometry } from "../../interfaces/beams/ISection.types";
import type { Point } from "../../interfaces/common/types";
import { calculateCrossSectionProperties } from "./greenTheoremCalculator";
import { AbstractPropertiesStrategy } from "./AbstractPropertiesStrategy";

export class ISectionPropertiesStrategy extends AbstractPropertiesStrategy<ISectionGeometry> {
	test(geometry: Geometry) {
		return geometry.type === SHAPE_TYPES.I_SECTION;
	}

	execute(_geometry: ISectionGeometry, polygon: Point[]) {
		return calculateCrossSectionProperties(polygon);
	}
}
