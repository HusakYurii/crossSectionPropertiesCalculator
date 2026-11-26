import type { Geometry } from "@/shared/shapes/types/common.types";
import type { Point } from "@/shared/types/geometry";
import type { CrossSectionProperties } from "@/shared/types/sectionProperties";
import { propertiesBuildStrategies } from "./propertyStrategies";
import { errorMessage, fail, ok } from "./errors";
import type { Result } from "./errors.types";

export class CrossSectionPropertiesSolver {
	/** The section properties of a shape from its polygon, or the reason there are none. It has no side effects (no toast). */
	solve<T extends Geometry>(geometry: T, polygon: Point[]): Result<CrossSectionProperties> {
		const strategy = propertiesBuildStrategies.find(s => s.test(geometry));

		if (!strategy) {
			return fail('no-strategy', `No properties build strategy registered for geometry type: ${geometry.type}`);
		}

		try {
			return ok(strategy.execute(geometry, polygon));
		} catch (error) {
			return fail(
				'strategy-failed',
				errorMessage(error, `An error while calculating the properties for geometry type: ${geometry.type}`),
				error,
			);
		}
	}
}

export const crossSectionPropertiesSolver = new CrossSectionPropertiesSolver();
