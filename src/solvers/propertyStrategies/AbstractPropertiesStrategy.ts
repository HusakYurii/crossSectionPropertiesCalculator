import type { Geometry } from "../../interfaces/beams/common.types";
import type { Point } from "../../interfaces/common/types";
import type { CrossSectionProperties } from "../../interfaces/sectionProperties";

export interface PropertiesBuildStrategy {
	test(geometry: Geometry): boolean;
	execute(geometry: Geometry, polygon: Point[]): CrossSectionProperties;
}

export abstract class AbstractPropertiesStrategy<T extends Geometry> implements PropertiesBuildStrategy {
	public abstract test(geometry: Geometry): boolean;
	public abstract execute(geometry: T, polygon: Point[]): CrossSectionProperties;
}
