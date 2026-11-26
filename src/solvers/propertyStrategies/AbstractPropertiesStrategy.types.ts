import type { Geometry } from "@/shared/shapes/types/common.types";
import type { Point } from "@/shared/types/geometry";
import type { CrossSectionProperties } from "@/shared/types/sectionProperties";

export interface PropertiesBuildStrategy {
	test(geometry: Geometry): boolean;
	execute(geometry: Geometry, polygon: Point[]): CrossSectionProperties;
}
