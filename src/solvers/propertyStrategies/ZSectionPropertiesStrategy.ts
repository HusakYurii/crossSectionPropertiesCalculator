import { SHAPE_TYPES } from "../../interfaces/beams/common.types";
import type { Geometry } from "../../interfaces/beams/common.types";
import type { ZSectionGeometry } from "../../interfaces/beams/ZSection.types";
import type { Point } from "../../interfaces/common/types";
import { calculateCrossSectionProperties } from "./greenTheoremCalculator";
import { AbstractPropertiesStrategy } from "./AbstractPropertiesStrategy";

export class ZSectionPropertiesStrategy extends AbstractPropertiesStrategy<ZSectionGeometry> {
	test(geometry: Geometry) {
		return geometry.type === SHAPE_TYPES.Z_SECTION;
	}

	execute(geometry: ZSectionGeometry, polygon: Point[]) {
		return calculateCrossSectionProperties(polygon);
	}
}
