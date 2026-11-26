import type { Geometry } from "@/shared/shapes/types/common.types";
import type { Point } from "@/shared/types/geometry";
import type { CrossSectionProperties } from "@/shared/types/sectionProperties";
import type { PropertiesBuildStrategy } from "./AbstractPropertiesStrategy.types";

export abstract class AbstractPropertiesStrategy<T extends Geometry> implements PropertiesBuildStrategy {
	public abstract test(geometry: Geometry): boolean;
	public abstract execute(geometry: T, polygon: Point[]): CrossSectionProperties;
}
