import { SHAPE_TYPES } from "../../interfaces/beams/common.types";
import type { Geometry } from "../../interfaces/beams/common.types";
import type { CSectionGeometry } from "../../interfaces/beams/CSection.types";
import type { Point } from "../../interfaces/common/types";
import { calculateCrossSectionProperties } from "./greenTheoremCalculator";
import { AbstractPropertiesStrategy } from "./AbstractPropertiesStrategy";

export class CSectionPropertiesStrategy extends AbstractPropertiesStrategy<CSectionGeometry> {
	test(geometry: Geometry) {
		return geometry.type === SHAPE_TYPES.C_SECTION;
	}

	execute(_geometry: CSectionGeometry, polygon: Point[]) {
		return calculateCrossSectionProperties(polygon);
	}
}
