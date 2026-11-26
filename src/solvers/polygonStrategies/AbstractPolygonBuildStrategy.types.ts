import type { Geometry } from "@/shared/shapes/types/common.types";
import type { Point } from "@/shared/types/geometry";

export interface PolygonBuildStrategy {
	test(geometry: Geometry): boolean;
	execute(geometry: Geometry): Point[];
}
