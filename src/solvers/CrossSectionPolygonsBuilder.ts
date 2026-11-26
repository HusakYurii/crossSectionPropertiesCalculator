import type { Geometry } from "@/shared/shapes/types/common.types";
import type { Point } from "@/shared/types/geometry";
import { removeDuplicatePoints } from "./polygon/removeDuplicatePoints";
import { polygonBuildStrategies } from "./polygonStrategies";
import { errorMessage, fail, ok } from "./errors";
import type { Result } from "./errors.types";

export class CrossSectionPolygonsBuilder {
	/** The closed polygon of a shape, or the reason there is none. It has no side effects (no toast). */
	build<T extends Geometry>(geometry: T): Result<Point[]> {
		const strategy = polygonBuildStrategies.find(s => s.test(geometry));

		if (!strategy) {
			return fail('no-strategy', `No polygon build strategy registered for geometry type: ${geometry.type}`);
		}

		try {
			return ok(removeDuplicatePoints(strategy.execute(geometry)));
		} catch (error) {
			return fail(
				'strategy-failed',
				errorMessage(error, `An error while building polygon points for geometry type: ${geometry.type}`),
				error,
			);
		}
	}
}

export const crossSectionPolygonsBuilder = new CrossSectionPolygonsBuilder();
